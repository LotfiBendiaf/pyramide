"use server";

import { Client } from "@/models";
import { QualificationStatus } from "@/models/client.model";

import {
  clientSchema,
  fetchClientsSchema,
  updateClientAgentSchema,
  updateClientSchema,
} from "../validators/client";
import action from "../handlers/action";
import { clientPrefix } from "../utils";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import { ClientFilters, ClientInput, ClientUpdateInput } from "@/types/client";
import { FilterQuery, Types } from "mongoose";
import { ClientQualification } from "@/constants/values";
import dbConnect from "../mongoose";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

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

    // 3️⃣ Generate reference code (BUY-032…)
    const count = await Client.countDocuments({ type });
    const referenceCode = `${clientPrefix(type)}-${String(count + 1).padStart(
      3,
      "0"
    )}`;

    // 4️⃣ Determine assigned agent
    const isAdmin = user.data.role === "ADMIN" || user.data.role === "MANAGER";
    const assignedAgent =
      isAdmin && providedAgent ? providedAgent : user.data._id;

    // 5️⃣ Create client
    const client = await Client.create({
      ...validationResult.params,
      referenceCode,
      qualificationStatus: "NEW",
      archived: false,
      createdBy: user.data._id,
      assignedAgent,
    });

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
    schema: fetchClientsSchema,
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
      agentId,
      search,
      page = 1,
      limit = 20,
    } = validationResult.params;

    // 3. Build MongoDB filter
    const filter: FilterQuery<Client> = {};

    // Role-based filtering: AGENT only sees their own clients
    const isAdmin = user.data.role === "ADMIN" || user.data.role === "MANAGER";
    if (!isAdmin) {
      filter.$or = [
        { assignedAgent: user.data._id },
        { createdBy: user.data._id },
      ];
    }

    if (type) filter.type = type;
    if (qualificationStatus) filter.qualificationStatus = qualificationStatus;

    // Agent filter (admin/manager only)
    if (isAdmin && agentId) {
      filter.assignedAgent = agentId;
    }

    // Search (name, phone, email, reference)
    if (search) {
      const searchConditions = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { referenceCode: { $regex: search, $options: "i" } },
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

  const isAdmin = user.data.role === "ADMIN" || user.data.role === "MANAGER";
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
