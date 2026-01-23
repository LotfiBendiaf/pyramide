"use server";

import { Client } from "@/models";
import { QualificationStatus } from "@/models/client.model";

import { clientSchema, fetchClientsSchema } from "../validators/client";
import action from "../handlers/action";
import { clientPrefix } from "../utils";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import { ClientFilters, ClientInput } from "@/types/client";
import { FilterQuery } from "mongoose";
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
    const { type } = validationResult.params;

    // 3️⃣ Generate reference code (BUY-032…)
    const count = await Client.countDocuments({ type });
    const referenceCode = `${clientPrefix(type)}-${String(count + 1).padStart(
      3,
      "0"
    )}`;

    // 4️⃣ Create client
    const client = await Client.create({
      ...validationResult.params,
      referenceCode,
      qualificationStatus: "NEW",
      archived: false,
      createdBy: user.data._id,
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
  console.log("test");

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
      status,
      agentId,
      search,
      page = 1,
      limit = 20,
    } = validationResult.params;

    // 3. Build MongoDB filter
    const filter: FilterQuery<Client> = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    // Agents can see only their clients
    if (user.data.role === "AGENT") {
      filter.createdBy = user.data._id;
    } else if (agentId) {
      filter.createdBy = agentId;
    }

    // Search (name, phone, email, reference)
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { referenceCode: { $regex: search, $options: "i" } },
      ];
    }

    // 4. Query
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .populate("createdBy", "name role")
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
