"use server";

import { Client } from "@/models";
import { IClient, QualificationStatus } from "@/models/client.model";

import {
  clientSchema,
  fetchClientsWithPipelineSchema,
  updateClientAgentSchema,
  updateClientSchema,
  phase1ApprovalSchema,
  phase1RejectionSchema,
  phase2ApprovalSchema,
  phase2RejectionSchema,
} from "../validators/client";
import action from "../handlers/action";
import { clientPrefix } from "../utils";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import {
  ClientFilters,
  ClientInput,
  ClientUpdateInput,
  Phase1ApprovalInput,
  Phase1RejectionInput,
  Phase2ApprovalInput,
  Phase2RejectionInput,
} from "@/types/client";
import { FilterQuery, Types } from "mongoose";
import { ClientQualification, isElevatedRole } from "@/constants/values";
import dbConnect from "../mongoose";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import { notify, notifyManagers } from "../notifications/notify";

export async function createClient(
  params: ClientInput
): Promise<ActionResponse<Client>> {
  // 1️⃣ Validation + Authorization
  const validationResult = await action({
    params,
    schema: clientSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  // 2️⃣ Get current user (agent / assistant / admin)
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  try {
    const { type, assignedAgent: providedAgent } = validationResult.params;

    // 4️⃣ Determine assigned agent
    const isAdmin = isElevatedRole(user.data.role);
    const assignedAgent = isAdmin && providedAgent ? providedAgent : undefined;

    // 3️⃣ Generate reference code with retry on duplicate key (race condition)
    const prefix = clientPrefix(type);
    const MAX_RETRIES = 5;
    let client = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const [agg] = await Client.aggregate([
        { $match: { type } },
        {
          $addFields: {
            codeNum: {
              $toInt: { $arrayElemAt: [{ $split: ["$referenceCode", "-"] }, 1] },
            },
          },
        },
        { $sort: { codeNum: -1 } },
        { $limit: 1 },
        { $project: { codeNum: 1 } },
      ]);
      const lastNum = agg?.codeNum ?? 0;
      const referenceCode = `${prefix}-${String(lastNum + 1).padStart(3, "0")}`;

      try {
        client = await Client.create({
          ...validationResult.params,
          referenceCode,
          qualificationStatus: "NEW",
          archived: false,
          createdBy: user.data._id,
          ...(assignedAgent ? { assignedAgent } : { assignedAgent: null }),
        });
        break; // success — exit retry loop
      } catch (err: unknown) {
        // E11000: duplicate referenceCode — retry with fresh aggregate
        const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
        if (mongoErr?.code === 11000 && mongoErr?.keyPattern?.referenceCode && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    if (!client) {
      throw new Error("Échec de la création du client");
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(client)),
      status: 201,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchClients(
  params: ClientFilters = {}
): Promise<ActionResponse<{ clients: Client[]; total: number }>> {
  // 1. Validate + authorize
  const validationResult = await action({
    params,
    schema: fetchClientsWithPipelineSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  // 2. Get current user
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    const {
      type,
      qualificationStatus,
      pipelineStage,
      clientTemperature,
      wantedPropertyType,
      agentId,
      search,
      page = 1,
      limit = 10,
      archived,
    } = validationResult.params as ClientFilters;

    // 3. Build MongoDB filter
    const filter: FilterQuery<Client> = { type: { $ne: "SELLER" } };

    // Archive filtering: by default exclude archived clients
    if (archived === true) {
      filter.archived = true;
    } else {
      filter.archived = { $ne: true };
    }

    // Role-based filtering: AGENT only sees their own clients
    const isAdmin = isElevatedRole(user.data.role);
    if (!isAdmin) {
      filter.$or = [
        { assignedAgent: user.data._id },
        { createdBy: user.data._id },
      ];
    }

    if (type) filter.type = type;
    if (qualificationStatus) filter.qualificationStatus = qualificationStatus;
    if (pipelineStage) filter.pipelineStage = pipelineStage;
    if (clientTemperature) filter.clientTemperature = clientTemperature;
    if (wantedPropertyType) filter.wantedPropertyType = wantedPropertyType;

    // Agent filter (admin/manager only)
    if (isAdmin && agentId) {
      filter.assignedAgent = agentId;
    }

    // Search (name, phone, email, reference, rooms via "f3" pattern)
    if (search) {
      const roomMatch = search.match(/^f(\d+)$/i);
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchConditions = roomMatch
        ? [{ rooms: parseInt(roomMatch[1], 10) }]
        : [
            { firstName: { $regex: escapedSearch, $options: "i" } },
            { lastName: { $regex: escapedSearch, $options: "i" } },
            { phone: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
            { referenceCode: { $regex: escapedSearch, $options: "i" } },
          ];
      // Combine role filter with search filter
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // 4. Query
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .populate("createdBy", "firstname lastname role")
        .populate("assignedAgent", "firstname lastname role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(filter),
    ]);

    return {
      success: true,
      data: {
        clients: JSON.parse(JSON.stringify(clients)),
        total,
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function qualifyClient(
  clientId: string,
  status: QualificationStatus,
  notes?: string
) {
  await Client.findByIdAndUpdate(clientId, {
    qualificationStatus: status,
    qualificationNotes: notes,
    archived: status === "ARCHIVED" || status === "NOT_RELEVANT",
  });
}

export async function updateClientQualification(
  clientId: string,
  qualificationStatus: ClientQualification
) {
  try {
    await dbConnect();

    await Client.findByIdAndUpdate(clientId, {
      qualificationStatus,
      archived:
        qualificationStatus === "ARCHIVED" ||
        qualificationStatus === "NOT_RELEVANT",
    });

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: { message: error || "Échec de mise à jour du statut" },
    };
  }
}

export async function updateClientAssignedAgent(
  clientId: string,
  assignedAgent?: string
): Promise<ActionResponse> {
  const validationResult = await action({
    params: { clientId, assignedAgent: assignedAgent ?? "" },
    schema: updateClientAgentSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorise" },
      status: 401,
    };
  }

  const isAdmin =
    user.data.role === "ADMIN" ||
    user.data.role === "MANAGER" ||
    user.data.role === "DEVELOPER";
  if (!isAdmin) {
    return {
      success: false,
      error: { message: "Acces refuse" },
      status: 403,
    };
  }

  try {
    const { clientId: validatedClientId, assignedAgent: agentId } =
      validationResult.params;

    if (!Types.ObjectId.isValid(validatedClientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    await dbConnect();

    const normalizedAgentId = agentId?.trim();
    const update = {
      assignedAgent: normalizedAgentId ? normalizedAgentId : null,
    };

    const client = await Client.findByIdAndUpdate(validatedClientId, update, {
      new: true,
    });

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(validatedClientId));

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* -------------------------------- Fetch by ID -------------------------------- */

export async function fetchClientById(
  clientId: string
): Promise<ActionResponse<Client>> {
  try {
    if (!Types.ObjectId.isValid(clientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    await dbConnect();

    const client = await Client.findById(clientId)
      .populate("createdBy", "firstname lastname email role")
      .populate("assignedAgent", "firstname lastname email role")
      .lean();

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(client)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* -------------------------------- Update -------------------------------- */

export async function updateClient(
  clientId: string,
  params: ClientUpdateInput
): Promise<ActionResponse<Client>> {
  const validationResult = await action({
    params,
    schema: updateClientSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    if (!Types.ObjectId.isValid(clientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        ...validationResult.params,
        archived:
          validationResult.params?.qualificationStatus === "ARCHIVED" ||
          validationResult.params?.qualificationStatus === "NOT_RELEVANT",
      },
      { new: true }
    )
      .populate("createdBy", "firstname lastname email role")
      .populate("assignedAgent", "firstname lastname email role")
      .lean();

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(client)),
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* -------------------------------- Update Notes -------------------------------- */

export async function updateClientNotes(
  clientId: string,
  extraNotes: string
): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    if (!Types.ObjectId.isValid(clientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    await dbConnect();

    const client = await Client.findByIdAndUpdate(clientId, { extraNotes });

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* -------------------------------- Archive / Restore -------------------------------- */

export async function archiveClient(clientId: string): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    if (!Types.ObjectId.isValid(clientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    await dbConnect();

    const client = await Client.findByIdAndUpdate(clientId, {
      archived: true,
      qualificationStatus: "ARCHIVED",
    });

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function restoreClient(clientId: string): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    if (!Types.ObjectId.isValid(clientId)) {
      return {
        success: false,
        error: { message: "ID client invalide" },
        status: 400,
      };
    }

    await dbConnect();

    const client = await Client.findByIdAndUpdate(clientId, {
      archived: false,
      qualificationStatus: "NEW",
      pipelineStage: "LEAD",
    });

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Pipeline: Phase 1 ─────────────────────── */

export async function approvePhase1(
  params: Phase1ApprovalInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: phase1ApprovalSchema,
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
      error: { message: "Seul le gérant peut valider la Phase 1" },
      status: 403,
    };
  }

  const { clientId, phase2AgentId, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(phase2AgentId)) {
    return { success: false, error: { message: "ID invalide" }, status: 400 };
  }

  try {
    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        pipelineStage: "PHASE_2_REVIEW",
        qualificationStatus: "QUALIFIED",
        phase1ApprovedBy: user.data._id,
        phase1ApprovedAt: new Date(),
        phase1Notes: notes,
        phase2Agent: phase2AgentId,
        assignedAgent: phase2AgentId,
      },
      { new: true }
    );

    if (!client) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    await notifyManagers({
      type: "CLIENT_PHASE1_APPROVED",
      title: "Client qualifié — Phase 2 en attente",
      body: "Un client a été approuvé en Phase 1 et attend la validation Phase 2.",
      link: ROUTES.CLIENT_DETAIL(clientId),
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    await notify({
      recipientId: phase2AgentId,
      type: "CLIENT_PHASE1_APPROVED",
      title: "Client assigné — Phase 2 à valider",
      body: "Un client vous a été assigné pour la validation Phase 2.",
      link: ROUTES.CLIENT_DETAIL(clientId),
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function rejectPhase1(
  params: Phase1RejectionInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: phase1RejectionSchema,
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
      error: { message: "Seul le gérant peut rejeter la Phase 1" },
      status: 403,
    };
  }

  const { clientId, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(clientId)) {
    return { success: false, error: { message: "ID client invalide" }, status: 400 };
  }

  try {
    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        pipelineStage: "ARCHIVED",
        qualificationStatus: "NOT_RELEVANT",
        archived: true,
        phase1Notes: notes,
        phase1ApprovedBy: user.data._id,
        phase1ApprovedAt: new Date(),
      },
      { new: true }
    );

    if (!client) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    await notify({
      recipientId: client.createdBy.toString(),
      type: "CLIENT_PHASE1_REJECTED",
      title: "Client rejeté — Phase 1",
      body: "Le client a été rejeté lors de la validation Phase 1.",
      link: ROUTES.CLIENT_DETAIL(clientId),
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Pipeline: Phase 2 ─────────────────────── */

export async function approvePhase2(
  params: Phase2ApprovalInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: phase2ApprovalSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { clientId, temperature, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(clientId)) {
    return { success: false, error: { message: "ID client invalide" }, status: 400 };
  }

  try {
    // Verify the caller is the assigned Phase 2 agent (or a manager)
    const existing = await Client.findById(clientId).lean<IClient>();
    if (!existing) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    const isManager =
      user.data.role === "MANAGER" ||
      user.data.role === "ADMIN" ||
      user.data.role === "DEVELOPER";
    const isAssignedAgent =
      existing.phase2Agent?.toString() === user.data._id?.toString();

    if (!isManager && !isAssignedAgent) {
      return {
        success: false,
        error: { message: "Vous n'êtes pas l'agent assigné à cette Phase 2" },
        status: 403,
      };
    }

    // HOT → ACTIVE_SEARCH, WARM/COLD → FOLLOW_UP
    const nextStage = temperature === "HOT" ? "ACTIVE_SEARCH" : "FOLLOW_UP";

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        pipelineStage: nextStage,
        clientTemperature: temperature,
        qualificationStatus: "QUALIFIED",
        phase2ApprovedBy: user.data._id,
        phase2ApprovedAt: new Date(),
        phase2Notes: notes,
        lastContactedAt: new Date(),
      },
      { new: true }
    );

    if (!client) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    await notifyManagers({
      type: "CLIENT_PHASE2_APPROVED",
      title: "Client qualifié — Phase 2 validée",
      body: "Un client a été qualifié avec succès et rejoint le pipeline actif.",
      link: ROUTES.CLIENT_DETAIL(clientId),
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function rejectPhase2(
  params: Phase2RejectionInput
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: phase2RejectionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  const { clientId, notes } = validationResult.params;

  if (!Types.ObjectId.isValid(clientId)) {
    return { success: false, error: { message: "ID client invalide" }, status: 400 };
  }

  try {
    const existing = await Client.findById(clientId).lean<IClient>();
    if (!existing) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    const isManager =
      user.data.role === "MANAGER" ||
      user.data.role === "ADMIN" ||
      user.data.role === "DEVELOPER";
    const isAssignedAgent =
      existing.phase2Agent?.toString() === user.data._id?.toString();

    if (!isManager && !isAssignedAgent) {
      return {
        success: false,
        error: { message: "Vous n'êtes pas l'agent assigné à cette Phase 2" },
        status: 403,
      };
    }

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        pipelineStage: "ARCHIVED",
        qualificationStatus: "NOT_RELEVANT",
        archived: true,
        phase2Notes: notes,
        phase2ApprovedBy: user.data._id,
        phase2ApprovedAt: new Date(),
      },
      { new: true }
    );

    if (!client) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    await notifyManagers({
      type: "CLIENT_PHASE2_REJECTED",
      title: "Client rejeté — Phase 2",
      body: "Un client a été rejeté lors de la validation Phase 2.",
      link: ROUTES.CLIENT_DETAIL(clientId),
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ──────────── Pipeline: Submit to Phase 1 Review ──────────── */

export async function submitToPhase1(clientId: string): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(clientId)) {
    return { success: false, error: { message: "ID client invalide" }, status: 400 };
  }

  try {
    await dbConnect();

    const client = await Client.findByIdAndUpdate(
      clientId,
      { pipelineStage: "PHASE_1_REVIEW" },
      { new: true }
    );

    if (!client) {
      return { success: false, error: { message: "Client introuvable" }, status: 404 };
    }

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    await notifyManagers({
      type: "CLIENT_PHASE1_SUBMITTED",
      title: "Client en attente de validation",
      body: "Un nouveau client a été soumis pour validation Phase 1.",
      link: ROUTES.CLIENT_DETAIL(clientId),
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
