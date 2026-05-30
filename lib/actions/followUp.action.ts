"use server";

import dbConnect from "../mongoose";
import { FollowUp } from "@/models";
import action from "../handlers/action";
import { FollowUpSchema, fetchFollowUpsSchema } from "../validators/followUp";
import handleError from "../handlers/error";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import { FollowUpInput, FollowUpFilters } from "@/types/followUp";
import { FilterQuery } from "mongoose";
import { createCalendarEventFromFollowUp } from "@/lib/googleCalendar/syncService";

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

    const isAdmin =
      user.data.role === "ADMIN" ||
      user.data.role === "MANAGER" ||
      user.data.role === "DEVELOPER";
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

    // Sync to Google Calendar if the follow-up has a scheduled time
    if (followUp.reminderAt || followUp.startTime) {
      try {
        await createCalendarEventFromFollowUp(followUp._id.toString());
      } catch (err) {
        console.error("Failed to sync follow-up to Google Calendar:", err);
      }
    }

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

export async function fetchAllFollowUps(
  params: FollowUpFilters = {}
): Promise<ActionResponse<FollowUp[]>> {
  const validationResult = await action({
    params,
    schema: fetchFollowUpsSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
    return handleError(validationResult) as ErrorResponse;
  }

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

    const isAdmin =
      user.data.role === "ADMIN" ||
      user.data.role === "MANAGER" ||
      user.data.role === "DEVELOPER";

    const {
      agentId,
      type,
      status,
      channel,
      search,
      page = 1,
      limit = 50,
    } = validationResult.params;

    // Build query
    const query: FilterQuery<FollowUp> = isAdmin
      ? {}
      : { agent: user.data._id };

    // Agent filter (admin/manager only)
    if (isAdmin && agentId) {
      query.agent = agentId;
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (channel) query.channel = channel;

    // Search in notes, title, client name
    if (search) {
      // Note: For searching in populated fields, we need to do it after populating
      // For now, we'll search in title and note only
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const followUps = await FollowUp.find(query)
      .populate("agent", "firstname lastname name")
      .populate("client", "firstName lastName referenceCode phone")
      .populate("listing", "title description price images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(followUps)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
