"use server";

import { Negotiation, Listing, Client } from "@/models";
import { INegotiation } from "@/models/negotiation.model";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import action from "../handlers/action";
import {
  openNegotiationSchema,
  requestBlockSchema,
  reviewBlockSchema,
  reviewNegotiationSchema,
  confirmDepositSchema,
  closeDealSchema,
  cancelNegotiationSchema,
  negotiationFiltersSchema,
  OpenNegotiationInput,
  RequestBlockInput,
  ReviewBlockInput,
  ReviewNegotiationInput,
  ConfirmDepositInput,
  CloseDealInput,
  CancelNegotiationInput,
} from "../validators/negotiation";
import { NegotiationFilters } from "@/types/negotiation";
import { isElevatedRole } from "@/constants/values";
import { Types } from "mongoose";
import dbConnect from "../mongoose";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import { notify, notifyManagers } from "../notifications/notify";

export type NegotiationListingOption = {
  value: string;
  label: string;
  referenceCode?: string;
  price?: number;
  propertyType?: string;
  address?: string;
};

function canReviewNegotiations(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export async function fetchNegotiationListingOptions(options?: {
  includeAllStatuses?: boolean;
}): Promise<ActionResponse<NegotiationListingOption[]>> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    const now = new Date();
    const pipelineStatusFilter = options?.includeAllStatuses
      ? { $nin: ["SOLD", "ARCHIVED"] }
      : { $in: ["ACTIVE", "PHOTO_VISIT_PENDING"] };

    const filter: Record<string, unknown> = {
      pipelineStatus: pipelineStatusFilter,
      archived: { $ne: true },
      $or: [
        { blockedUntil: { $exists: false } },
        { blockedUntil: { $lte: now } },
      ],
    };

    const listings = await Listing.find(filter)
      .select("referenceCode title propertyType price location pipelineStatus")
      .sort({ referenceCode: 1 })
      .lean();

    return {
      success: true,
      data: listings.map((listing) => ({
        value: (listing._id as Types.ObjectId).toString(),
        label:
          [listing.referenceCode, listing.title].filter(Boolean).join(" - ") ||
          (listing._id as Types.ObjectId).toString(),
        referenceCode: listing.referenceCode,
        price: listing.price,
        propertyType: listing.propertyType,
        address:
          listing.location?.address ||
          [listing.location?.district, listing.location?.city]
            .filter(Boolean)
            .join(", "),
      })),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Open Negotiation ─────────────────────── */

export async function openNegotiation(
  params: OpenNegotiationInput
): Promise<ActionResponse<INegotiation>> {
  const validationResult = await action({
    params,
    schema: openNegotiationSchema,
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
    visitId,
    depositAmount,
    blockHours = 24,
    notes,
    document,
  } = validationResult.params;

  if (!Types.ObjectId.isValid(listingId)) {
    return {
      success: false,
      error: { message: "ID annonce invalide" },
      status: 400,
    };
  }
  if (!Types.ObjectId.isValid(clientId)) {
    return {
      success: false,
      error: { message: "ID client invalide" },
      status: 400,
    };
  }
  if (visitId && !Types.ObjectId.isValid(visitId)) {
    return {
      success: false,
      error: { message: "ID visite invalide" },
      status: 400,
    };
  }

  try {
    const listing = await Listing.findById(listingId)
      .select("pipelineStatus")
      .lean<{ pipelineStatus: string }>();

    if (!listing) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    if (listing.pipelineStatus === "UNDER_NEGOTIATION") {
      return {
        success: false,
        error: { message: "Ce bien est déjà en cours de négociation" },
        status: 409,
      };
    }

    if (
      listing.pipelineStatus !== "ACTIVE" &&
      listing.pipelineStatus !== "PHOTO_VISIT_PENDING"
    ) {
      return {
        success: false,
        error: { message: "Ce bien n'est pas disponible pour la négociation" },
        status: 409,
      };
    }

    // Check for existing active or pending negotiation on this listing
    const existing = await Negotiation.findOne({
      listing: listingId,
      status: { $in: ["PENDING_VERIFICATION", "ACTIVE", "CLOSING"] },
    }).lean();

    if (existing) {
      return {
        success: false,
        error: {
          message:
            "Une négociation est déjà en attente ou en cours pour ce bien",
        },
        status: 409,
      };
    }

    const blockedUntil = new Date(Date.now() + blockHours * 60 * 60 * 1000);

    const negotiation = await Negotiation.create({
      listing: listingId,
      client: clientId,
      agent: user.data._id,
      visit: visitId ?? undefined,
      status: "PENDING_VERIFICATION",
      blockingRequests: [
        {
          requestedBy: user.data._id,
          requestedAt: new Date(),
          durationDays: blockHours / 24,
          reason: notes,
          status: "PENDING",
          blockedUntil,
        },
      ],
      documents: document
        ? [
            {
              publicId: document.publicId,
              url: document.url,
              secureUrl: document.secureUrl,
              originalFilename: document.originalFilename,
              format: document.format,
              resourceType: document.resourceType,
              bytes: document.bytes,
              uploadedBy: user.data._id,
              uploadedAt: new Date(),
            },
          ]
        : undefined,
      ...(depositAmount || notes
        ? {
            closingDetails: {
              ...(depositAmount ? { depositAmount, depositAt: new Date() } : {}),
              ...(notes ? { notes } : {}),
            },
          }
        : {}),
    });

    revalidatePath(ROUTES.NEGOTIATIONS);
    revalidatePath(ROUTES.DEMANDES);
    revalidatePath(ROUTES.MES_BIENS);
    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));
    revalidatePath(ROUTES.CLIENTS_DASHBOARD);

    await notifyManagers({
      type: "NEGOTIATION_OPENED",
      title: "Nouvelle négociation à vérifier",
      body: "Une négociation nécessite votre validation avant activation.",
      link: ROUTES.DEMANDES,
      relatedEntity: { type: "NEGOTIATION", id: negotiation._id.toString() },
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(negotiation)),
      status: 201,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Review Negotiation ─────────────────────── */

export async function approveNegotiation(
  params: ReviewNegotiationInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: reviewNegotiationSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!canReviewNegotiations(user.data.role)) {
    return {
      success: false,
      error: { message: "Seul un administrateur ou gérant peut valider" },
      status: 403,
    };
  }

  const { negotiationId, managerNote } = validationResult.params;

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();

    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    if (negotiation.status !== "PENDING_VERIFICATION") {
      return {
        success: false,
        error: { message: "Cette demande a déjà été traitée" },
        status: 409,
      };
    }

    const blockReq = negotiation.blockingRequests?.[0];
    const blockedUntil = blockReq?.blockedUntil
      ? new Date(blockReq.blockedUntil)
      : new Date(
          Date.now() + (blockReq?.durationDays ?? 1) * 24 * 60 * 60 * 1000
        );
    const nextStatus = negotiation.closingDetails?.depositAmount
      ? "CLOSING"
      : "ACTIVE";
    const now = new Date();

    await Promise.all([
      Negotiation.findByIdAndUpdate(negotiationId, {
        $set: {
          status: nextStatus,
          ...(blockReq
            ? {
                "blockingRequests.0.status": "APPROVED",
                "blockingRequests.0.reviewedBy": user.data._id,
                "blockingRequests.0.reviewedAt": now,
                "blockingRequests.0.managerNote": managerNote,
                "blockingRequests.0.blockedUntil": blockedUntil,
              }
            : {}),
        },
      }),
      Listing.findByIdAndUpdate(negotiation.listing, {
        pipelineStatus:
          nextStatus === "CLOSING" ? "CLOSING" : "UNDER_NEGOTIATION",
        blockedForClient: negotiation.client,
        blockedUntil,
        ...(negotiation.closingDetails?.finalPrice
          ? { offeredPrice: negotiation.closingDetails.finalPrice }
          : {}),
      }),
      Client.findByIdAndUpdate(negotiation.client, {
        pipelineStage: "IN_NEGOTIATION",
        lastContactedAt: now,
      }),
    ]);

    revalidatePath(ROUTES.DEMANDES);
    revalidatePath(ROUTES.NEGOTIATIONS);
    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));
    revalidatePath(ROUTES.MES_BIENS);
    revalidatePath(
      ROUTES.LISTING_DETAIL_DASHBOARD(negotiation.listing.toString())
    );
    revalidatePath(ROUTES.CLIENT_DETAIL(negotiation.client.toString()));
    revalidatePath(ROUTES.CLIENTS_DASHBOARD);

    await notify({
      recipientId: negotiation.agent.toString(),
      type: "NEGOTIATION_APPROVED",
      title: "Négociation approuvée",
      body: "Votre négociation a été validée et activée.",
      link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
      relatedEntity: { type: "NEGOTIATION", id: negotiationId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function rejectNegotiation(
  params: ReviewNegotiationInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: reviewNegotiationSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!canReviewNegotiations(user.data.role)) {
    return {
      success: false,
      error: { message: "Seul un administrateur ou gérant peut refuser" },
      status: 403,
    };
  }

  const { negotiationId, managerNote } = validationResult.params;

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();

    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    if (negotiation.status !== "PENDING_VERIFICATION") {
      return {
        success: false,
        error: { message: "Cette demande a déjà été traitée" },
        status: 409,
      };
    }

    const now = new Date();

    await Negotiation.findByIdAndUpdate(negotiationId, {
      $set: {
        status: "REJECTED",
        rejectionReason: managerNote,
        rejectedAt: now,
        "blockingRequests.0.status": "REJECTED",
        "blockingRequests.0.reviewedBy": user.data._id,
        "blockingRequests.0.reviewedAt": now,
        "blockingRequests.0.managerNote": managerNote,
      },
    });

    revalidatePath(ROUTES.DEMANDES);
    revalidatePath(ROUTES.NEGOTIATIONS);
    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));

    await notify({
      recipientId: negotiation.agent.toString(),
      type: "NEGOTIATION_REJECTED",
      title: "Négociation refusée",
      body: managerNote
        ? `Votre négociation a été refusée : ${managerNote}`
        : "Votre négociation a été refusée.",
      link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
      relatedEntity: { type: "NEGOTIATION", id: negotiationId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Request Block ─────────────────────── */

export async function requestBlock(
  params: RequestBlockInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: requestBlockSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { negotiationId, durationDays, reason } = validationResult.params;

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();
    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    if (negotiation.status !== "ACTIVE") {
      return {
        success: false,
        error: {
          message: "Impossible d'ajouter un blocage à cette négociation",
        },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isNegotiationAgent =
      negotiation.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isNegotiationAgent) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    // Prevent duplicate pending block requests
    const hasPending = negotiation.blockingRequests?.some(
      (r) => r.status === "PENDING"
    );
    if (hasPending) {
      return {
        success: false,
        error: { message: "Une demande de blocage est déjà en attente" },
        status: 409,
      };
    }

    await Negotiation.findByIdAndUpdate(negotiationId, {
      $push: {
        blockingRequests: {
          requestedBy: user.data._id,
          requestedAt: new Date(),
          durationDays,
          reason,
          status: "PENDING",
        },
      },
    });

    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));

    await notifyManagers({
      type: "BLOCK_REQUESTED",
      title: "Demande de blocage en attente",
      body: `Une demande de blocage de ${durationDays} jour(s) nécessite votre approbation.`,
      link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
      relatedEntity: { type: "NEGOTIATION", id: negotiationId },
    });

    return { success: true, status: 201 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Approve Block ─────────────────────── */

export async function approveBlock(
  params: ReviewBlockInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: reviewBlockSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!canReviewNegotiations(user.data.role)) {
    return {
      success: false,
      error: { message: "Seul le gérant peut approuver un blocage" },
      status: 403,
    };
  }

  const { negotiationId, blockingRequestId, managerNote } =
    validationResult.params;

  if (
    !Types.ObjectId.isValid(negotiationId) ||
    !Types.ObjectId.isValid(blockingRequestId)
  ) {
    return { success: false, error: { message: "ID invalide" }, status: 400 };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();
    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    const blockReq = negotiation.blockingRequests?.find(
      (r) => r._id.toString() === blockingRequestId
    );

    if (!blockReq) {
      return {
        success: false,
        error: { message: "Demande de blocage introuvable" },
        status: 404,
      };
    }

    if (blockReq.status !== "PENDING") {
      return {
        success: false,
        error: { message: "Cette demande a déjà été traitée" },
        status: 409,
      };
    }

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + blockReq.durationDays);

    await Promise.all([
      Negotiation.findOneAndUpdate(
        { _id: negotiationId, "blockingRequests._id": blockingRequestId },
        {
          $set: {
            "blockingRequests.$.status": "APPROVED",
            "blockingRequests.$.reviewedBy": user.data._id,
            "blockingRequests.$.reviewedAt": new Date(),
            "blockingRequests.$.managerNote": managerNote,
            "blockingRequests.$.blockedUntil": blockedUntil,
          },
        }
      ),
      Listing.findByIdAndUpdate(negotiation.listing, {
        blockedUntil,
        blockedForClient: negotiation.client,
      }),
    ]);

    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));
    revalidatePath(ROUTES.MES_BIENS);
    revalidatePath(
      ROUTES.LISTING_DETAIL_DASHBOARD(negotiation.listing.toString())
    );

    await notify({
      recipientId: negotiation.agent.toString(),
      type: "BLOCK_APPROVED",
      title: "Blocage approuvé",
      body: `Votre demande de blocage de ${blockReq.durationDays} jour(s) a été approuvée.`,
      link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
      relatedEntity: { type: "NEGOTIATION", id: negotiationId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Reject Block ─────────────────────── */

export async function rejectBlock(
  params: ReviewBlockInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: reviewBlockSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!canReviewNegotiations(user.data.role)) {
    return {
      success: false,
      error: { message: "Seul le gérant peut rejeter un blocage" },
      status: 403,
    };
  }

  const { negotiationId, blockingRequestId, managerNote } =
    validationResult.params;

  if (
    !Types.ObjectId.isValid(negotiationId) ||
    !Types.ObjectId.isValid(blockingRequestId)
  ) {
    return { success: false, error: { message: "ID invalide" }, status: 400 };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();
    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    const blockReq = negotiation.blockingRequests?.find(
      (r) => r._id.toString() === blockingRequestId
    );

    if (!blockReq) {
      return {
        success: false,
        error: { message: "Demande de blocage introuvable" },
        status: 404,
      };
    }

    if (blockReq.status !== "PENDING") {
      return {
        success: false,
        error: { message: "Cette demande a déjà été traitée" },
        status: 409,
      };
    }

    await Negotiation.findOneAndUpdate(
      { _id: negotiationId, "blockingRequests._id": blockingRequestId },
      {
        $set: {
          "blockingRequests.$.status": "REJECTED",
          "blockingRequests.$.reviewedBy": user.data._id,
          "blockingRequests.$.reviewedAt": new Date(),
          "blockingRequests.$.managerNote": managerNote,
        },
      }
    );

    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));

    await notify({
      recipientId: negotiation.agent.toString(),
      type: "BLOCK_REJECTED",
      title: "Blocage refusé",
      body: "Votre demande de blocage a été refusée.",
      link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
      relatedEntity: { type: "NEGOTIATION", id: negotiationId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Confirm Deposit ─────────────────────── */

export async function confirmDeposit(
  params: ConfirmDepositInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: confirmDepositSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { negotiationId, depositAmount, finalPrice, notes } =
    validationResult.params;

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();
    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    if (negotiation.status !== "ACTIVE") {
      return {
        success: false,
        error: {
          message: "Seules les négociations actives peuvent passer en closing",
        },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isNegotiationAgent =
      negotiation.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isNegotiationAgent) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    await Promise.all([
      Negotiation.findByIdAndUpdate(negotiationId, {
        status: "CLOSING",
        closingDetails: {
          depositAmount,
          depositAt: new Date(),
          finalPrice,
          notes,
        },
      }),
      Listing.findByIdAndUpdate(negotiation.listing, {
        pipelineStatus: "CLOSING",
        offeredPrice: finalPrice,
      }),
    ]);

    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));
    revalidatePath(
      ROUTES.LISTING_DETAIL_DASHBOARD(negotiation.listing.toString())
    );

    await notifyManagers({
      type: "DEPOSIT_CONFIRMED",
      title: "Versement confirmé",
      body: "Un versement a été enregistré sur la négociation.",
      link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
      relatedEntity: { type: "NEGOTIATION", id: negotiationId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Close Deal ─────────────────────── */

export async function closeDeal(
  params: CloseDealInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: closeDealSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { negotiationId, finalPrice, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();
    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    if (negotiation.status !== "CLOSING") {
      return {
        success: false,
        error: {
          message: "Seules les négociations en closing peuvent être conclues",
        },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isNegotiationAgent =
      negotiation.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isNegotiationAgent) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    const now = new Date();

    await Promise.all([
      Negotiation.findByIdAndUpdate(negotiationId, {
        status: "DEAL_DONE",
        closedAt: now,
        "closingDetails.finalPrice": finalPrice,
        ...(notes ? { "closingDetails.notes": notes } : {}),
      }),
      Listing.findByIdAndUpdate(negotiation.listing, {
        pipelineStatus: "SOLD",
        status: "Vendu",
        offeredPrice: finalPrice,
        isPublished: false,
        archived: true,
        archivedAt: now,
        $unset: { blockedUntil: "", blockedForClient: "" },
      }),
      Client.findByIdAndUpdate(negotiation.client, {
        pipelineStage: "CLOSED",
        lastContactedAt: now,
      }),
    ]);

    revalidatePath(ROUTES.NEGOTIATIONS);
    revalidatePath(ROUTES.MES_BIENS);
    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));
    revalidatePath(
      ROUTES.LISTING_DETAIL_DASHBOARD(negotiation.listing.toString())
    );
    revalidatePath(ROUTES.CLIENT_DETAIL(negotiation.client.toString()));

    const dealPayloads = [
      {
        recipientId: negotiation.agent.toString(),
        type: "DEAL_DONE" as const,
        title: "Affaire conclue !",
        body: "La vente a été finalisée avec succès. Félicitations !",
        link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
        relatedEntity: { type: "NEGOTIATION" as const, id: negotiationId },
      },
    ];
    await Promise.all([
      notify(dealPayloads),
      notifyManagers({
        type: "DEAL_DONE",
        title: "Affaire conclue !",
        body: "Une vente a été finalisée avec succès.",
        link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
        relatedEntity: { type: "NEGOTIATION", id: negotiationId },
      }),
    ]);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Cancel Negotiation ─────────────────────── */

export async function cancelNegotiation(
  params: CancelNegotiationInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: cancelNegotiationSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { negotiationId, cancelReason } = validationResult.params;

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    const negotiation =
      await Negotiation.findById(negotiationId).lean<INegotiation>();
    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    if (!["ACTIVE", "CLOSING"].includes(negotiation.status)) {
      return {
        success: false,
        error: { message: "Cette négociation ne peut pas être annulée" },
        status: 409,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isNegotiationAgent =
      negotiation.agent?.toString() === user.data._id?.toString();

    if (!isManager && !isNegotiationAgent) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    const now = new Date();

    await Promise.all([
      Negotiation.findByIdAndUpdate(negotiationId, {
        status: "CANCELLED",
        cancelReason,
        cancelledAt: now,
      }),
      Listing.findByIdAndUpdate(negotiation.listing, {
        pipelineStatus: "ACTIVE",
        $unset: { blockedUntil: "", blockedForClient: "" },
      }),
      Client.findByIdAndUpdate(negotiation.client, {
        pipelineStage: "ACTIVE_SEARCH",
        lastContactedAt: now,
      }),
    ]);

    revalidatePath(ROUTES.NEGOTIATIONS);
    revalidatePath(ROUTES.MES_BIENS);
    revalidatePath(ROUTES.NEGOTIATION_DETAIL(negotiationId));
    revalidatePath(
      ROUTES.LISTING_DETAIL_DASHBOARD(negotiation.listing.toString())
    );
    revalidatePath(ROUTES.CLIENT_DETAIL(negotiation.client.toString()));

    if (isManager) {
      await notify({
        recipientId: negotiation.agent.toString(),
        type: "NEGOTIATION_CANCELLED",
        title: "Négociation annulée",
        body: "La négociation a été annulée par le gérant.",
        link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
        relatedEntity: { type: "NEGOTIATION", id: negotiationId },
      });
    } else {
      await notifyManagers({
        type: "NEGOTIATION_CANCELLED",
        title: "Négociation annulée",
        body: "Un agent a annulé une négociation en cours.",
        link: ROUTES.NEGOTIATION_DETAIL(negotiationId),
        relatedEntity: { type: "NEGOTIATION", id: negotiationId },
      });
    }

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Fetch Negotiations ─────────────────────── */

export async function fetchNegotiations(
  params: NegotiationFilters = {}
): Promise<ActionResponse<{ negotiations: INegotiation[]; total: number }>> {
  const validationResult = await action({
    params,
    schema: negotiationFiltersSchema,
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
    status,
    agentId,
    listingId,
    clientId,
    page = 1,
    limit = 20,
  } = validationResult.params as NegotiationFilters;

  try {
    const filter: Record<string, unknown> = {};

    if (!isElevatedRole(user.data.role)) {
      filter.agent = user.data._id;
    } else if (agentId) {
      filter.agent = agentId;
    }

    if (status) filter.status = status;
    if (listingId) filter.listing = listingId;
    if (clientId) filter.client = clientId;

    const skip = (page - 1) * limit;

    const [negotiations, total] = await Promise.all([
      Negotiation.find(filter)
        .populate(
          "listing",
          "referenceCode title location pipelineStatus status"
        )
        .populate(
          "client",
          "referenceCode firstName lastName phone pipelineStage"
        )
        .populate("agent", "firstname lastname role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Negotiation.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { negotiations: JSON.parse(JSON.stringify(negotiations)), total },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchNegotiationById(
  negotiationId: string
): Promise<ActionResponse<INegotiation>> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(negotiationId)) {
    return {
      success: false,
      error: { message: "ID négociation invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const negotiation = await Negotiation.findById(negotiationId)
      .populate(
        "listing",
        "referenceCode title location pipelineStatus status offeredPrice price"
      )
      .populate(
        "client",
        "referenceCode firstName lastName phone pipelineStage clientTemperature"
      )
      .populate("agent", "firstname lastname role")
      .populate("visit", "scheduledAt outcome notes")
      .populate("blockingRequests.requestedBy", "firstname lastname role")
      .populate("blockingRequests.reviewedBy", "firstname lastname role")
      .lean<INegotiation>();

    if (!negotiation) {
      return {
        success: false,
        error: { message: "Négociation introuvable" },
        status: 404,
      };
    }

    const isManager = isElevatedRole(user.data.role);
    const isNegotiationAgent =
      (negotiation.agent as unknown as { _id: string })?._id?.toString() ===
      user.data._id?.toString();

    if (!isManager && !isNegotiationAgent) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(negotiation)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchPendingBlockRequests(): Promise<
  ActionResponse<{ negotiations: INegotiation[]; total: number }>
> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!canReviewNegotiations(user.data.role)) {
    return { success: false, error: { message: "Accès refusé" }, status: 403 };
  }

  try {
    await dbConnect();

    const [negotiations, total] = await Promise.all([
      Negotiation.find({ "blockingRequests.status": "PENDING" })
        .populate("listing", "referenceCode title pipelineStatus")
        .populate("client", "referenceCode firstName lastName phone")
        .populate("agent", "firstname lastname role")
        .populate("blockingRequests.requestedBy", "firstname lastname role")
        .lean<INegotiation[]>(),
      Negotiation.countDocuments({ "blockingRequests.status": "PENDING" }),
    ]);

    return {
      success: true,
      data: { negotiations: JSON.parse(JSON.stringify(negotiations)), total },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchPendingNegotiationRequests(): Promise<
  ActionResponse<{ negotiations: INegotiation[]; total: number }>
> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!canReviewNegotiations(user.data.role)) {
    return { success: false, error: { message: "Accès refusé" }, status: 403 };
  }

  try {
    await dbConnect();

    const filter = { status: "PENDING_VERIFICATION" };

    const [negotiations, total] = await Promise.all([
      Negotiation.find(filter)
        .populate("listing", "referenceCode title pipelineStatus status price")
        .populate("client", "referenceCode firstName lastName phone")
        .populate("agent", "firstname lastname role")
        .populate("blockingRequests.requestedBy", "firstname lastname role")
        .sort({ createdAt: -1 })
        .lean<INegotiation[]>(),
      Negotiation.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { negotiations: JSON.parse(JSON.stringify(negotiations)), total },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
