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

    const followUp = await FollowUp.create({
      ...validationResult.params,
      agent: user.data._id,
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

export async function markFollowUpDone(id: string) {
  await dbConnect();

  await FollowUp.findByIdAndUpdate(id, {
    status: "DONE",
  });
}
