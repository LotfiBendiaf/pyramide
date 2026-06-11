"use server";

import { ArchiveRequest, Client, User } from "@/models";
import {
  IClient,
  PipelineStage,
  QualificationStatus,
} from "@/models/client.model";

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

const AUTO_PIPELINE_STAGES = [
  "PHASE_1_REVIEW",
  "PHASE_2_REVIEW",
  "IN_NEGOTIATION",
  "CLOSED",
  "ARCHIVED",
] as const;

function stageFilterForQualificationStage(stage: PipelineStage) {
  if (stage === "LEAD") {
    return {
      $and: [
        {
          $or: [
            { pipelineStage: "LEAD" },
            { pipelineStage: { $exists: false } },
            { pipelineStage: null },
          ],
        },
        { qualificationStatus: { $nin: ["QUALIFIED", "HOT", "COLD"] } },
        { clientTemperature: { $nin: ["HOT", "COLD"] } },
      ],
    };
  }

  if (stage === "ACTIVE_SEARCH") {
    return {
      $and: [
        { pipelineStage: { $nin: AUTO_PIPELINE_STAGES } },
        {
          $or: [
            { qualificationStatus: "HOT" },
            {
              $and: [
                { clientTemperature: "HOT" },
                { qualificationStatus: { $ne: "COLD" } },
              ],
            },
            {
              $and: [
                { pipelineStage: "ACTIVE_SEARCH" },
                { qualificationStatus: { $ne: "COLD" } },
                { clientTemperature: { $ne: "COLD" } },
              ],
            },
          ],
        },
      ],
    };
  }

  if (stage === "FOLLOW_UP") {
    return {
      $and: [
        { pipelineStage: { $nin: AUTO_PIPELINE_STAGES } },
        {
          $or: [
            { qualificationStatus: "COLD" },
            {
              $and: [
                { clientTemperature: "COLD" },
                { qualificationStatus: { $ne: "HOT" } },
              ],
            },
            {
              $and: [
                { pipelineStage: "FOLLOW_UP" },
                { qualificationStatus: { $ne: "HOT" } },
                { clientTemperature: { $ne: "HOT" } },
              ],
            },
          ],
        },
      ],
    };
  }

  return { pipelineStage: stage };
}

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
              $toInt: {
                $arrayElemAt: [{ $split: ["$referenceCode", "-"] }, 1],
              },
            },
          },
        },
        { $sort: { codeNum: -1 } },
        { $limit: 1 },
        { $project: { codeNum: 1 } },
      ]);
      const lastNum = agg?.codeNum ?? 0;
      const referenceCode = `${prefix}-${String(lastNum + 1).padStart(5, "0")}`;

      try {
        client = await Client.create({
          ...validationResult.params,
          referenceCode,
          qualificationStatus: "NEUTRAL",
          archived: false,
          createdBy: user.data._id,
          ...(assignedAgent ? { assignedAgent } : { assignedAgent: null }),
        });
        break; // success — exit retry loop
      } catch (err: unknown) {
        // E11000: duplicate referenceCode — retry with fresh aggregate
        const mongoErr = err as {
          code?: number;
          keyPattern?: Record<string, unknown>;
        };
        if (
          mongoErr?.code === 11000 &&
          mongoErr?.keyPattern?.referenceCode &&
          attempt < MAX_RETRIES - 1
        ) {
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
    if (qualificationStatus) {
      if (qualificationStatus === "HOT" || qualificationStatus === "COLD") {
        filter.$and = [
          ...(filter.$and ?? []),
          {
            $or: [
              { qualificationStatus },
              { clientTemperature: qualificationStatus },
            ],
          },
        ];
      } else if (qualificationStatus === "QUALIFIED") {
        filter.qualificationStatus = qualificationStatus;
        filter.clientTemperature = { $nin: ["HOT", "COLD"] };
        filter.pipelineStage = { $nin: AUTO_PIPELINE_STAGES };
      } else {
        filter.qualificationStatus = qualificationStatus;
      }
    }
    if (pipelineStage) {
      filter.$and = [
        ...(filter.$and ?? []),
        stageFilterForQualificationStage(pipelineStage),
      ];
    }
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
      // Combine role/stage filters with search filter
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else if (filter.$and) {
        filter.$and = [...filter.$and, { $or: searchConditions }];
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
  qualificationStatus: ClientQualification,
  archiveReason?: string
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

  if (
    ![
      "NEW",
      "QUALIFIED",
      "HOT",
      "COLD",
      "NO_RESPONSE",
      "NOT_RELEVANT",
      "ARCHIVED",
      "NEUTRAL",
    ].includes(qualificationStatus)
  ) {
    return {
      success: false,
      error: { message: "Statut invalide" },
      status: 400,
    };
  }

  const trimmedArchiveReason = archiveReason?.trim();
  if (
    qualificationStatus === "ARCHIVED" &&
    (!trimmedArchiveReason || trimmedArchiveReason.length < 5)
  ) {
    return {
      success: false,
      error: { message: "La raison doit contenir au moins 5 caractères" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const isAdmin = isElevatedRole(user.data.role);
    const filter: FilterQuery<IClient> = { _id: clientId };
    if (!isAdmin) {
      filter.$or = [
        { assignedAgent: user.data._id },
        { createdBy: user.data._id },
      ];
    }

    if (qualificationStatus === "ARCHIVED") {
      const client = await Client.findOne(filter).select("_id").lean();

      if (!client) {
        return {
          success: false,
          error: { message: "Client introuvable ou accès refusé" },
          status: 404,
        };
      }

      const existing = await ArchiveRequest.findOne({
        entityType: "CLIENT",
        entityId: clientId,
        status: "PENDING",
      }).lean();

      if (existing) {
        return {
          success: false,
          error: {
            message:
              "Une demande d'archivage est déjà en attente pour ce client",
          },
          status: 409,
        };
      }

      await ArchiveRequest.create({
        entityType: "CLIENT",
        entityId: clientId,
        requestedBy: user.data._id,
        reason: trimmedArchiveReason,
        status: "PENDING",
      });

      revalidatePath(ROUTES.CLIENTS_DASHBOARD);
      revalidatePath(ROUTES.CLIENT_DETAIL(clientId));
      revalidatePath(ROUTES.DEMANDES);

      await notifyManagers({
        type: "ARCHIVE_REQUESTED",
        title: "Demande d'archivage client",
        body: "Une demande d'archivage client nécessite votre validation.",
        link: ROUTES.DEMANDES,
        relatedEntity: { type: "CLIENT", id: clientId },
      });

      return { success: true, status: 201 };
    }

    const update =
      qualificationStatus === "HOT"
        ? {
            $set: {
              qualificationStatus,
              clientTemperature: "HOT",
              pipelineStage: "ACTIVE_SEARCH",
              archived: false,
            },
            $unset: { archiveReason: "", archivedAt: "" },
          }
        : qualificationStatus === "COLD"
          ? {
              $set: {
                qualificationStatus,
                clientTemperature: "COLD",
                pipelineStage: "FOLLOW_UP",
                archived: false,
              },
              $unset: { archiveReason: "", archivedAt: "" },
            }
          : qualificationStatus === "NEW" ||
              qualificationStatus === "NEUTRAL" ||
              qualificationStatus === "NO_RESPONSE"
            ? {
                $set: {
                  qualificationStatus,
                  pipelineStage: "LEAD",
                  archived: false,
                },
                $unset: {
                  clientTemperature: "",
                  archiveReason: "",
                  archivedAt: "",
                },
              }
            : qualificationStatus === "NOT_RELEVANT"
              ? {
                  $set: {
                    qualificationStatus,
                    pipelineStage: "ARCHIVED",
                    archived: true,
                  },
                  $unset: { archiveReason: "", archivedAt: "" },
                }
              : {
                  $set: {
                    qualificationStatus,
                    archived: false,
                  },
                  $unset: {
                    clientTemperature: "",
                    archiveReason: "",
                    archivedAt: "",
                  },
                };

    const client = await Client.findOneAndUpdate(filter, update, { new: true });

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable ou accès refusé" },
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

    if (normalizedAgentId) {
      if (!Types.ObjectId.isValid(normalizedAgentId)) {
        return {
          success: false,
          error: { message: "ID agent invalide" },
          status: 400,
        };
      }

      const agent = await User.findOne({
        _id: normalizedAgentId,
        role: "AGENT",
      }).select("_id");

      if (!agent) {
        return {
          success: false,
          error: { message: "Veuillez sélectionner un agent valide" },
          status: 400,
        };
      }
    }

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

    const qualificationStatus = validationResult.params?.qualificationStatus;
    const pipelineUpdate =
      qualificationStatus === "HOT"
        ? { pipelineStage: "ACTIVE_SEARCH", clientTemperature: "HOT" }
        : qualificationStatus === "COLD"
          ? { pipelineStage: "FOLLOW_UP", clientTemperature: "COLD" }
          : qualificationStatus === "NEW"
            ? { pipelineStage: "LEAD" }
            : qualificationStatus === "ARCHIVED" ||
                qualificationStatus === "NOT_RELEVANT"
              ? { pipelineStage: "ARCHIVED" }
              : {};
    const shouldUnsetTemperature =
      qualificationStatus === "NEW" || qualificationStatus === "QUALIFIED";

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        $set: {
          ...validationResult.params,
          ...pipelineUpdate,
          archived:
            qualificationStatus === "ARCHIVED" ||
            qualificationStatus === "NOT_RELEVANT",
        },
        ...(shouldUnsetTemperature
          ? { $unset: { clientTemperature: "" } }
          : {}),
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

export async function archiveClient(
  clientId: string,
  archiveReason: string
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

    const trimmedArchiveReason = archiveReason.trim();
    if (trimmedArchiveReason.length < 5) {
      return {
        success: false,
        error: { message: "La raison doit contenir au moins 5 caractères" },
        status: 400,
      };
    }

    await dbConnect();

    const client = await Client.findById(clientId).select("_id").lean();

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
    }

    const existing = await ArchiveRequest.findOne({
      entityType: "CLIENT",
      entityId: clientId,
      status: "PENDING",
    }).lean();

    if (existing) {
      return {
        success: false,
        error: {
          message: "Une demande d'archivage est déjà en attente pour ce client",
        },
        status: 409,
      };
    }

    await ArchiveRequest.create({
      entityType: "CLIENT",
      entityId: clientId,
      requestedBy: user.data._id,
      reason: trimmedArchiveReason,
      status: "PENDING",
    });

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));
    revalidatePath(ROUTES.DEMANDES);

    await notifyManagers({
      type: "ARCHIVE_REQUESTED",
      title: "Demande d'archivage client",
      body: "Une demande d'archivage client nécessite votre validation.",
      link: ROUTES.DEMANDES,
      relatedEntity: { type: "CLIENT", id: clientId },
    });

    return { success: true, status: 201 };
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
      $set: {
        archived: false,
        qualificationStatus: "NEW",
        pipelineStage: "LEAD",
      },
      $unset: { archiveReason: 1, archivedAt: 1 },
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

  if (
    !Types.ObjectId.isValid(clientId) ||
    !Types.ObjectId.isValid(phase2AgentId)
  ) {
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
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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
    return {
      success: false,
      error: { message: "ID client invalide" },
      status: 400,
    };
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
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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
    return {
      success: false,
      error: { message: "ID client invalide" },
      status: 400,
    };
  }

  try {
    // Verify the caller is the assigned Phase 2 agent (or a manager)
    const existing = await Client.findById(clientId).lean<IClient>();
    if (!existing) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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
    const nextQualification =
      temperature === "HOT"
        ? "HOT"
        : temperature === "COLD"
          ? "COLD"
          : "QUALIFIED";

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        pipelineStage: nextStage,
        clientTemperature: temperature,
        qualificationStatus: nextQualification,
        phase2ApprovedBy: user.data._id,
        phase2ApprovedAt: new Date(),
        phase2Notes: notes,
        lastContactedAt: new Date(),
      },
      { new: true }
    );

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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
    return {
      success: false,
      error: { message: "ID client invalide" },
      status: 400,
    };
  }

  try {
    const existing = await Client.findById(clientId).lean<IClient>();
    if (!existing) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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

export async function submitToPhase1(
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

    const client = await Client.findByIdAndUpdate(
      clientId,
      { pipelineStage: "PHASE_1_REVIEW" },
      { new: true }
    );

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable" },
        status: 404,
      };
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

export async function setClientPipelineStage(
  clientId: string,
  stage: Extract<PipelineStage, "LEAD" | "FOLLOW_UP" | "ACTIVE_SEARCH">
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

  if (!["LEAD", "FOLLOW_UP", "ACTIVE_SEARCH"].includes(stage)) {
    return {
      success: false,
      error: { message: "Phase invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const isAdmin = isElevatedRole(user.data.role);
    const filter: FilterQuery<IClient> = { _id: clientId };
    if (!isAdmin) {
      filter.$or = [
        { assignedAgent: user.data._id },
        { createdBy: user.data._id },
      ];
    }

    const client = await Client.findOneAndUpdate(
      filter,
      { pipelineStage: stage },
      { new: true }
    );

    if (!client) {
      return {
        success: false,
        error: { message: "Client introuvable ou accès refusé" },
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

export async function setClientNegotiationStage(
  clientId: string,
  stage: "NEUTRAL" | "IN_NEGOTIATION" | "CLOSED"
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

  if (!["NEUTRAL", "IN_NEGOTIATION", "CLOSED"].includes(stage)) {
    return {
      success: false,
      error: { message: "Phase invalide" },
      status: 400,
    };
  }

  try {
    await dbConnect();

    const isAdmin = isElevatedRole(user.data.role);
    const filter: FilterQuery<IClient> = { _id: clientId };
    if (!isAdmin) {
      filter.$or = [
        { assignedAgent: user.data._id },
        { createdBy: user.data._id },
      ];
    }

    const existing = await Client.findOne(filter).lean<IClient>();
    if (!existing) {
      return {
        success: false,
        error: { message: "Client introuvable ou accès refusé" },
        status: 404,
      };
    }

    const neutralStage =
      existing.qualificationStatus === "HOT" ||
      existing.clientTemperature === "HOT"
        ? "ACTIVE_SEARCH"
        : existing.qualificationStatus === "COLD" ||
            existing.clientTemperature === "COLD"
          ? "FOLLOW_UP"
          : "LEAD";

    const nextStage = stage === "NEUTRAL" ? neutralStage : stage;

    await Client.findByIdAndUpdate(clientId, {
      pipelineStage: nextStage,
      ...(stage !== "NEUTRAL" ? { lastContactedAt: new Date() } : {}),
    });

    revalidatePath(ROUTES.CLIENTS_DASHBOARD);
    revalidatePath(ROUTES.CLIENT_DETAIL(clientId));

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchClientPipelineCounts(): Promise<
  ActionResponse<{ stage: string; count: number }[]>
> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    const baseFilter: FilterQuery<IClient> = {
      archived: { $ne: true },
      type: { $ne: "SELLER" },
    };

    if (!isElevatedRole(user.data.role)) {
      baseFilter.$or = [
        { assignedAgent: user.data._id },
        { createdBy: user.data._id },
      ];
    }

    const [
      total,
      lead,
      followUp,
      activeSearch,
      inNegotiation,
      closed,
      qualified,
      archived,
    ] = await Promise.all([
      Client.countDocuments(baseFilter),
      Client.countDocuments({
        ...baseFilter,
        ...stageFilterForQualificationStage("LEAD"),
      }),
      Client.countDocuments({
        ...baseFilter,
        ...stageFilterForQualificationStage("FOLLOW_UP"),
      }),
      Client.countDocuments({
        ...baseFilter,
        ...stageFilterForQualificationStage("ACTIVE_SEARCH"),
      }),
      Client.countDocuments({
        ...baseFilter,
        ...stageFilterForQualificationStage("IN_NEGOTIATION"),
      }),
      Client.countDocuments({
        ...baseFilter,
        ...stageFilterForQualificationStage("CLOSED"),
      }),
      Client.countDocuments({
        ...baseFilter,
        qualificationStatus: "QUALIFIED",
        clientTemperature: { $nin: ["HOT", "COLD"] },
        pipelineStage: { $nin: AUTO_PIPELINE_STAGES },
      }),
      Client.countDocuments({
        ...baseFilter,
        ...stageFilterForQualificationStage("ARCHIVED"),
      }),
    ]);

    return {
      success: true,
      data: [
        { stage: "TOTAL", count: total },
        { stage: "LEAD", count: lead },
        { stage: "FOLLOW_UP", count: followUp },
        { stage: "ACTIVE_SEARCH", count: activeSearch },
        { stage: "IN_NEGOTIATION", count: inNegotiation },
        { stage: "CLOSED", count: closed },
        { stage: "QUALIFIED", count: qualified },
        { stage: "ARCHIVED", count: archived },
      ],
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
