"use server";

import { Visit, Listing, Client } from "@/models";
import { IVisit } from "@/models/visit.model";
import { IClient } from "@/models/client.model";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import action from "../handlers/action";
import {
  scheduleVisitSchema,
  completeVisitSchema,
  cancelVisitSchema,
  visitFiltersSchema,
  ScheduleVisitInput,
  CompleteVisitInput,
  CancelVisitInput,
} from "../validators/visit";
import { VisitFilters, PopulatedVisit } from "@/types/visit";
import { isElevatedRole } from "@/constants/values";
import { Types } from "mongoose";
import dbConnect from "../mongoose";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import { notify } from "../notifications/notify";
import {
  createCalendarEventFromVisit,
  deleteEventFromGoogle,
} from "../googleCalendar/syncService";

/* ─────────────────────── Schedule Visit ─────────────────────── */

export async function scheduleVisit(
  params: ScheduleVisitInput
): Promise<ActionResponse<IVisit>> {
  const validationResult = await action({
    params,
    schema: scheduleVisitSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const {
    listingId,
    clientId,
    isExternalListing,
    externalListingRef,
    scheduledAt,
    status,
    notes,
  } = validationResult.params;
  const visitStatus = status ?? "SCHEDULED";

  if (!Types.ObjectId.isValid(clientId)) {
    return {
      success: false,
      error: { message: "ID client invalide" },
      status: 400,
    };
  }

  if (!isExternalListing && listingId && !Types.ObjectId.isValid(listingId)) {
    return {
      success: false,
      error: { message: "ID annonce invalide" },
      status: 400,
    };
  }

  try {
    // Hard block check — only applies to internal listings
    if (!isExternalListing && listingId) {
      const listing = await Listing.findById(listingId)
        .select("pipelineStatus blockedUntil keyAvailable isValidated archived")
        .lean<{
          pipelineStatus: string;
          blockedUntil?: Date;
          keyAvailable: boolean;
          isValidated?: boolean;
          archived?: boolean;
        }>();

      if (!listing) {
        return {
          success: false,
          error: { message: "Annonce introuvable" },
          status: 404,
        };
      }

      const isNeutreListing = !listing.isValidated && !listing.archived;

      if (!isNeutreListing) {
        if (listing.pipelineStatus === "UNDER_NEGOTIATION") {
          return {
            success: false,
            error: {
              message:
                "Ce bien est en cours de négociation et ne peut pas être visité",
            },
            status: 409,
          };
        }

        if (listing.blockedUntil && listing.blockedUntil > new Date()) {
          return {
            success: false,
            error: { message: "Ce bien est temporairement bloqué" },
            status: 409,
          };
        }

        if (
          listing.pipelineStatus !== "ACTIVE" &&
          listing.pipelineStatus !== "PHOTO_VISIT_PENDING"
        ) {
          return {
            success: false,
            error: { message: "Ce bien n'est pas disponible pour les visites" },
            status: 409,
          };
        }
      }
    }

    const visit = await Visit.create({
      listing: !isExternalListing && listingId ? listingId : undefined,
      client: clientId,
      agent: user.data._id,
      isExternalListing: isExternalListing ?? false,
      externalListingRef: isExternalListing ? externalListingRef : undefined,
      scheduledAt,
      notes,
      status: visitStatus,
      completedAt: visitStatus === "COMPLETED" ? new Date() : undefined,
    });

    await Client.findByIdAndUpdate(clientId, { lastContactedAt: new Date() });

    try {
      await createCalendarEventFromVisit(visit._id.toString());
    } catch (err) {
      console.error("Failed to sync visit to Google Calendar:", err);
    }

    revalidatePath(ROUTES.VISITS);
    revalidatePath(ROUTES.SCHEDULE);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));
    revalidatePath(ROUTES.MES_BIENS);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(visit)),
      status: 201,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Complete Visit ─────────────────────── */

export async function completeVisit(
  params: CompleteVisitInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: completeVisitSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { visitId, outcome, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(visitId)) {
    return {
      success: false,
      error: { message: "ID visite invalide" },
      status: 400,
    };
  }

  try {
    const visit = await Visit.findById(visitId).lean<IVisit>();
    if (!visit) {
      return {
        success: false,
        error: { message: "Visite introuvable" },
        status: 404,
      };
    }

    if (visit.status !== "SCHEDULED") {
      return {
        success: false,
        error: {
          message: "Seules les visites planifiées peuvent être complétées",
        },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isVisitAgent = visit.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isVisitAgent) {
      return {
        success: false,
        error: {
          message: "Seul l'agent ayant planifié la visite peut la compléter",
        },
        status: 403,
      };
    }

    const clientId = visit.client.toString();

    // Determine next client pipeline stage based on outcome + temperature
    const client = await Client.findById(clientId)
      .select("clientTemperature pipelineStage")
      .lean<Pick<IClient, "clientTemperature" | "pipelineStage">>();

    const nextClientStage = (() => {
      if (outcome === "INTERESTED") return "IN_NEGOTIATION";
      if (outcome === "NOT_INTERESTED") {
        return client?.clientTemperature === "HOT"
          ? "ACTIVE_SEARCH"
          : "FOLLOW_UP";
      }
      return client?.pipelineStage; // UNDECIDED — no change
    })();

    await Promise.all([
      Visit.findByIdAndUpdate(visitId, {
        status: "COMPLETED",
        outcome,
        notes,
        completedAt: new Date(),
      }),
      Client.findByIdAndUpdate(clientId, {
        lastContactedAt: new Date(),
        ...(nextClientStage ? { pipelineStage: nextClientStage } : {}),
      }),
    ]);

    revalidatePath(ROUTES.VISITS);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));
    revalidatePath(ROUTES.MES_BIENS);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Cancel Visit ─────────────────────── */

export async function cancelVisit(
  params: CancelVisitInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: cancelVisitSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { visitId, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(visitId)) {
    return {
      success: false,
      error: { message: "ID visite invalide" },
      status: 400,
    };
  }

  try {
    const visit = await Visit.findById(visitId).lean<IVisit>();
    if (!visit) {
      return {
        success: false,
        error: { message: "Visite introuvable" },
        status: 404,
      };
    }

    if (visit.status !== "SCHEDULED" && visit.status !== "COMPLETED") {
      return {
        success: false,
        error: {
          message:
            "Seules les visites planifiées ou complétées peuvent être annulées",
        },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isVisitAgent = visit.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isVisitAgent) {
      return {
        success: false,
        error: {
          message: "Seul l'agent ayant planifié la visite peut l'annuler",
        },
        status: 403,
      };
    }

    await Visit.findByIdAndUpdate(visitId, {
      status: "CANCELLED",
      notes,
      cancelledAt: new Date(),
    });

    if (visit.calendarEventId) {
      await deleteEventFromGoogle(visit.calendarEventId.toString());
    }

    revalidatePath(ROUTES.VISITS);
    revalidatePath(ROUTES.CLIENT_DETAIL(visit.client.toString()));
    revalidatePath(ROUTES.MES_BIENS);

    // Notify the visit agent if a manager is doing the cancellation
    if (isManager && visit.agent && !isVisitAgent) {
      await notify({
        recipientId: visit.agent.toString(),
        type: "VISIT_CANCELLED",
        title: "Visite annulée",
        body: "Une de vos visites planifiées a été annulée par le gérant.",
        link: ROUTES.VISITS,
        relatedEntity: { type: "VISIT", id: visitId },
      });
    }

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Mark No-Show ─────────────────────── */

export async function markVisitNoShow(
  visitId: string
): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(visitId)) {
    return {
      success: false,
      error: { message: "ID visite invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const visit = await Visit.findById(visitId).lean<IVisit>();
    if (!visit) {
      return {
        success: false,
        error: { message: "Visite introuvable" },
        status: 404,
      };
    }

    if (visit.status !== "SCHEDULED") {
      return {
        success: false,
        error: {
          message: "Seules les visites planifiées peuvent être marquées absent",
        },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isVisitAgent = visit.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isVisitAgent) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    await Visit.findByIdAndUpdate(visitId, { status: "NO_SHOW" });

    revalidatePath(ROUTES.VISITS);
    revalidatePath(ROUTES.CLIENT_DETAIL(visit.client.toString()));
    revalidatePath(ROUTES.MES_BIENS);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Fetch Visits ─────────────────────── */

export async function fetchVisitsByClient(
  clientId: string,
  page = 1,
  limit = 20
): Promise<ActionResponse<{ visits: PopulatedVisit[]; total: number }>> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(clientId)) {
    return {
      success: false,
      error: { message: "ID client invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const filter = { client: clientId };
    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .populate(
          "listing",
          "referenceCode title location status pipelineStatus"
        )
        .populate("agent", "firstname lastname role")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Visit.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { visits: JSON.parse(JSON.stringify(visits)), total },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchVisitsByListing(
  listingId: string,
  page = 1,
  limit = 20
): Promise<ActionResponse<{ visits: PopulatedVisit[]; total: number }>> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(listingId)) {
    return {
      success: false,
      error: { message: "ID annonce invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const filter = { listing: listingId };
    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .populate(
          "client",
          "referenceCode firstName lastName phone pipelineStage clientTemperature"
        )
        .populate("agent", "firstname lastname role")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Visit.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { visits: JSON.parse(JSON.stringify(visits)), total },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchVisits(
  params: VisitFilters = {}
): Promise<ActionResponse<{ visits: PopulatedVisit[]; total: number }>> {
  const validationResult = await action({
    params,
    schema: visitFiltersSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const {
    clientId,
    listingId,
    agentId,
    status,
    page = 1,
    limit = 20,
  } = validationResult.params as VisitFilters;

  try {
    const filter: Record<string, unknown> = {};

    // Non-managers only see their own visits
    if (!isElevatedRole(user.data.role)) {
      filter.agent = user.data._id;
    } else if (agentId) {
      filter.agent = agentId;
    }

    if (clientId) filter.client = clientId;
    if (listingId) filter.listing = listingId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .populate(
          "listing",
          "referenceCode title location status pipelineStatus"
        )
        .populate("client", "referenceCode firstName lastName phone")
        .populate("agent", "firstname lastname role")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Visit.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { visits: JSON.parse(JSON.stringify(visits)), total },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
