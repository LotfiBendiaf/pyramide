"use server";

import { ArchiveRequest, Client, Listing } from "@/models";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import action from "../handlers/action";
import {
  archiveRequestSchema,
  archiveReviewSchema,
} from "../validators/client";
import { ArchiveRequestInput, ArchiveReviewInput } from "@/types/client";
import { Types } from "mongoose";
import dbConnect from "../mongoose";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import { notify, notifyManagers } from "../notifications/notify";

function canReviewArchiveRequests(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";
}

/* ─────────────────────── Cancel Archive Request ─────────────────────── */

export async function cancelClientArchiveRequest(
  clientId: string
): Promise<ActionResponse> {
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

    const filter = {
      entityType: "CLIENT" as const,
      entityId: clientId,
      status: "PENDING" as const,
      ...(canReviewArchiveRequests(user.data.role)
        ? {}
        : { requestedBy: user.data._id }),
    };

    const request = await ArchiveRequest.findOneAndUpdate(
      filter,
      { $set: { status: "CANCELLED" } },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: {
          message:
            "Demande introuvable, déjà traitée, ou vous ne pouvez pas l'annuler",
        },
        status: 404,
      };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));
    revalidatePath(ROUTES.DEMANDES);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Request Archive ─────────────────────── */

export async function requestArchive(
  params: ArchiveRequestInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: archiveRequestSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { entityType, entityId, reason } = validationResult.params;

  if (!Types.ObjectId.isValid(entityId)) {
    return { success: false, error: { message: "ID invalide" }, status: 400 };
  }

  try {
    // Prevent duplicate pending requests for the same entity
    const existing = await ArchiveRequest.findOne({
      entityId,
      status: "PENDING",
    });

    if (existing) {
      return {
        success: false,
        error: { message: "Une demande d'archivage est déjà en attente pour cet élément" },
        status: 409,
      };
    }

    await ArchiveRequest.create({
      entityType,
      entityId,
      requestedBy: user.data._id,
      reason,
      status: "PENDING",
    });

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.DEMANDES);

    await notifyManagers({
      type: "ARCHIVE_REQUESTED",
      title: "Demande d'archivage en attente",
      body: "Une demande d'archivage nécessite votre validation.",
      link: ROUTES.DEMANDES,
      relatedEntity: {
        type: entityType === "CLIENT" ? "CLIENT" : "LISTING",
        id: entityId,
      },
    });

    return { success: true, status: 201 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Approve Archive ─────────────────────── */

export async function approveArchiveRequest(
  params: ArchiveReviewInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: archiveReviewSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const isManager = canReviewArchiveRequests(user.data.role);
  if (!isManager) {
    return {
      success: false,
      error: { message: "Seul le gérant peut approuver une demande d'archivage" },
      status: 403,
    };
  }

  const { requestId, managerNote } = validationResult.params;

  if (!Types.ObjectId.isValid(requestId)) {
    return { success: false, error: { message: "ID de demande invalide" }, status: 400 };
  }

  try {
    const archiveRequest = await ArchiveRequest.findById(requestId);
    if (!archiveRequest) {
      return { success: false, error: { message: "Demande introuvable" }, status: 404 };
    }

    if (archiveRequest.status !== "PENDING") {
      return {
        success: false,
        error: { message: "Cette demande a déjà été traitée" },
        status: 409,
      };
    }

    const reviewFields = {
      status: "APPROVED" as const,
      reviewedBy: user.data._id,
      reviewedAt: new Date(),
      managerNote,
    };

    const entityUpdate =
      archiveRequest.entityType === "CLIENT"
        ? Client.findByIdAndUpdate(archiveRequest.entityId, {
            archived: true,
            archivedAt: new Date(),
            archiveReason: archiveRequest.reason,
            qualificationStatus: "ARCHIVED",
            pipelineStage: "ARCHIVED",
          })
        : Listing.findByIdAndUpdate(archiveRequest.entityId, {
            archived: true,
            archivedAt: new Date(),
            pipelineStatus: "ARCHIVED",
          });

    await Promise.all([
      ArchiveRequest.findByIdAndUpdate(requestId, reviewFields),
      entityUpdate,
    ]);

    if (archiveRequest.entityType === "CLIENT") {
      revalidatePath(ROUTES.CLIENTS_DASHBOARD);
      revalidatePath(ROUTES.CLIENT_DETAIL(archiveRequest.entityId.toString()));
    } else {
      revalidatePath(ROUTES.LISTINGS_DASHBOARD);
    }
    revalidatePath(ROUTES.DEMANDES);

    await notify({
      recipientId: archiveRequest.requestedBy.toString(),
      type: "ARCHIVE_APPROVED",
      title: "Demande d'archivage approuvée",
      body: "Votre demande d'archivage a été approuvée.",
      link:
        archiveRequest.entityType === "CLIENT"
          ? ROUTES.CLIENT_DETAIL(archiveRequest.entityId.toString())
          : ROUTES.LISTINGS_DASHBOARD,
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Reject Archive ─────────────────────── */

export async function rejectArchiveRequest(
  params: ArchiveReviewInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: archiveReviewSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const isManager = canReviewArchiveRequests(user.data.role);
  if (!isManager) {
    return {
      success: false,
      error: { message: "Seul le gérant peut rejeter une demande d'archivage" },
      status: 403,
    };
  }

  const { requestId, managerNote } = validationResult.params;

  if (!Types.ObjectId.isValid(requestId)) {
    return { success: false, error: { message: "ID de demande invalide" }, status: 400 };
  }

  try {
    const archiveRequest = await ArchiveRequest.findById(requestId);
    if (!archiveRequest) {
      return { success: false, error: { message: "Demande introuvable" }, status: 404 };
    }

    if (archiveRequest.status !== "PENDING") {
      return {
        success: false,
        error: { message: "Cette demande a déjà été traitée" },
        status: 409,
      };
    }

    archiveRequest.status = "REJECTED";
    archiveRequest.reviewedBy = user.data._id;
    archiveRequest.reviewedAt = new Date();
    archiveRequest.managerNote = managerNote;
    await archiveRequest.save();

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.DEMANDES);

    await notify({
      recipientId: archiveRequest.requestedBy.toString(),
      type: "ARCHIVE_REJECTED",
      title: "Demande d'archivage refusée",
      body: managerNote
        ? `Votre demande d'archivage a été refusée : ${managerNote}`
        : "Votre demande d'archivage a été refusée.",
      link:
        archiveRequest.entityType === "CLIENT"
          ? ROUTES.CLIENT_DETAIL(archiveRequest.entityId.toString())
          : ROUTES.LISTINGS_DASHBOARD,
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Fetch Pending Requests ─────────────────────── */

export async function fetchPendingArchiveRequests(): Promise<
  ActionResponse<{ requests: IArchiveRequest[]; total: number }>
> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const isManager = canReviewArchiveRequests(user.data.role);
  if (!isManager) {
    return {
      success: false,
      error: { message: "Accès refusé" },
      status: 403,
    };
  }

  try {
    await dbConnect();

    const [requests, total] = await Promise.all([
      ArchiveRequest.find({ status: "PENDING" })
        .populate("requestedBy", "firstname lastname role")
        .sort({ createdAt: -1 })
        .lean(),
      ArchiveRequest.countDocuments({ status: "PENDING" }),
    ]);

    const clientIds = requests
      .filter((request) => request.entityType === "CLIENT")
      .map((request) => request.entityId);
    const listingIds = requests
      .filter((request) => request.entityType === "LISTING")
      .map((request) => request.entityId);

    const [clients, listings] = await Promise.all([
      Client.find({ _id: { $in: clientIds } })
        .select("referenceCode firstName lastName phone")
        .lean<
          {
            _id: Types.ObjectId;
            referenceCode?: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
          }[]
        >(),
      Listing.find({ _id: { $in: listingIds } })
        .select("referenceCode title")
        .lean<
          { _id: Types.ObjectId; referenceCode?: string; title?: string }[]
        >(),
    ]);

    const clientMap = new Map(
      clients.map((client) => [client._id.toString(), client])
    );
    const listingMap = new Map(
      listings.map((listing) => [listing._id.toString(), listing])
    );
    const hydratedRequests = requests.map((request) => ({
      ...request,
      relatedClient:
        request.entityType === "CLIENT"
          ? clientMap.get(request.entityId.toString())
          : undefined,
      relatedListing:
        request.entityType === "LISTING"
          ? listingMap.get(request.entityId.toString())
          : undefined,
    }));

    return {
      success: true,
      data: {
        requests: JSON.parse(JSON.stringify(hydratedRequests)),
        total,
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

// Type alias for response typing
type IArchiveRequest = {
  _id: string;
  entityType: "CLIENT" | "LISTING";
  entityId: string;
  requestedBy: { firstname: string; lastname: string; role: string };
  relatedClient?: {
    _id: string;
    referenceCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  relatedListing?: {
    _id: string;
    referenceCode?: string;
    title?: string;
  };
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewedBy?: string;
  reviewedAt?: Date;
  managerNote?: string;
  createdAt: Date;
};
