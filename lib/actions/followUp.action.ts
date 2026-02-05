"use server";

import dbConnect from "../mongoose";
import { FollowUp } from "@/models";
import action from "../handlers/action";
import { FollowUpSchema } from "../validators/followUp";
import handleError from "../handlers/error";
import { getUserBySessionEmail } from "../getUserBySessionEmail";

export async function createFollowUp(
  params: FollowUpInput
): Promise<ActionResponse<FollowUp>> {
  const validationResult = await action({
    params,
    schema: FollowUpSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  // 2. Get current user (agent / admin)
  const user = await getUserBySessionEmail();

  if (!user?.data) {
    return {
      success: false,
      error: { message: "Utilisateur non autorisé" },
      status: 401,
    };
  }

  try {
    await dbConnect();

    const isAdmin = user.data.role === "ADMIN" || user.data.role === "MANAGER";
    const assignedAgent =
      isAdmin && validationResult.params && validationResult.params.agent
        ? validationResult.params.agent
        : user.data._id;

    console.log("Creating follow-up with data:", {
      ...validationResult.params,
      agent: assignedAgent,
    });

    const followUp = await FollowUp.create({
      ...validationResult.params,
      agent: assignedAgent,
    });

    console.log("Created follow-up:", {
      _id: followUp._id,
      channel: followUp.channel,
      status: followUp.status,
      agent: followUp.agent,
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(followUp)),
      status: 201,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchFollowUpsByListing(
  listingId: string
): Promise<ActionResponse<FollowUp[]>> {
  await dbConnect();

  const followUps = await FollowUp.find({ listing: listingId })
    .populate("agent")
    .populate("client")
    .populate("listing")
    .sort({
      createdAt: -1,
    });

  return {
    success: true,
    data: JSON.parse(JSON.stringify(followUps)),
  };
}

export async function fetchFollowUpsByClient(
  clientId: string
): Promise<ActionResponse<FollowUp[]>> {
  try {
    await dbConnect();

    const followUps = await FollowUp.find({ client: clientId })
      .populate("agent", "firstname lastname")
      .populate("listing", "title description price status")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(followUps)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function markFollowUpDone(id: string) {
  await dbConnect();

  // Use timestamps: true to ensure updatedAt is updated
  const result = await FollowUp.findByIdAndUpdate(
    id,
    {
      status: "DONE",
    },
    { new: true, timestamps: true }
  );

  console.log("markFollowUpDone result:", {
    id,
    status: result?.status,
    updatedAt: result?.updatedAt,
  });
}

export async function fetchAllFollowUps(): Promise<ActionResponse<FollowUp[]>> {
  try {
    const user = await getUserBySessionEmail();

    if (!user?.data) {
      return {
        success: false,
        error: { message: "Utilisateur non autorisé" },
        status: 401,
      };
    }

    await dbConnect();

    const isAdmin = user.data.role === "ADMIN" || user.data.role === "MANAGER";

    const query = isAdmin ? {} : { agent: user.data._id };

    const followUps = await FollowUp.find(query)
      .populate("agent", "firstname lastname name")
      .populate("client", "firstName lastName referenceCode phone")
      .populate("listing", "title description price images")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(followUps)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
