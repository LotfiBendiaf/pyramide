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
import { isElevatedRole } from "@/constants/values";

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

  const isManager = isElevatedRole(user.data.role);
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

  const isManager = isElevatedRole(user.data.role);
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

  const isManager = isElevatedRole(user.data.role);
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

    return {
      success: true,
      data: {
        requests: JSON.parse(JSON.stringify(requests)),
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
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: Date;
  managerNote?: string;
  createdAt: Date;
};
