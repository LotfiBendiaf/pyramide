"use server";

import dbConnect from "../mongoose";
import { Client, FollowUp, Listing, Visit } from "@/models";
import action from "../handlers/action";
import {
  FollowUpSchema,
  ListingFollowUpSchema,
  fetchFollowUpsSchema,
} from "../validators/followUp";
import type { ListingFollowUpFormValues } from "../validators/followUp";
import handleError from "../handlers/error";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import { FollowUpInput, FollowUpFilters } from "@/types/followUp";
import { FilterQuery } from "mongoose";
import {
  createCalendarEventFromFollowUp,
  createCalendarEventFromVisit,
} from "@/lib/googleCalendar/syncService";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

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
    const followUpStatus =
      validationResult.params?.status ??
      (validationResult.params?.reminderAt ? "PENDING" : "DONE");

    console.log("Creating follow-up with data:", {
      ...validationResult.params,
      agent: assignedAgent,
    });

    const followUp = await FollowUp.create({
      ...validationResult.params,
      agent: assignedAgent,
      status: followUpStatus,
      completedAt: followUpStatus === "DONE" ? new Date() : undefined,
    });

    console.log("Created follow-up:", {
      _id: followUp._id,
      channel: followUp.channel,
      status: followUp.status,
      agent: followUp.agent,
    });

    if (followUp.channel === "VISIT") {
      const scheduledAt =
        followUp.startTime ||
        followUp.reminderAt ||
        followUp.createdAt ||
        new Date();
      const visitStatus =
        followUp.status === "PENDING" || followUp.status === "OVERDUE"
          ? "SCHEDULED"
          : "COMPLETED";

      const visit = await Visit.create({
        listing: followUp.listing,
        client: followUp.client,
        agent: followUp.agent,
        isExternalListing: !followUp.listing,
        externalListingRef: !followUp.listing
          ? followUp.title || "Autre"
          : undefined,
        scheduledAt,
        notes: followUp.note,
        status: visitStatus,
        completedAt: visitStatus === "COMPLETED" ? new Date() : undefined,
      });

      await Client.findByIdAndUpdate(followUp.client, {
        lastContactedAt: new Date(),
      });

      try {
        await createCalendarEventFromVisit(visit._id.toString());
      } catch (err) {
        console.error("Failed to sync visit follow-up to Google Calendar:", err);
      }

      revalidatePath(ROUTES.VISITS);
      revalidatePath(ROUTES.CLIENT_DETAIL(followUp.client.toString()));
    }

    // Sync to Google Calendar if the follow-up has a scheduled time
    if (
      followUp.channel !== "VISIT" &&
      (followUp.status === "PENDING" || followUp.status === "OVERDUE") &&
      (followUp.reminderAt || followUp.startTime)
    ) {
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

export async function createListingFollowUp(
  params: ListingFollowUpFormValues
): Promise<ActionResponse<FollowUp>> {
  const validationResult = await action({
    params,
    schema: ListingFollowUpSchema,
    authorize: true,
  });

  if (validationResult instanceof Error || !validationResult.params) {
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
    await dbConnect();

    const { listing: listingId, title, note, reminderAt, status } =
      validationResult.params;

    const listing = await Listing.findById(listingId)
      .select("sellerClient")
      .lean<{ sellerClient?: string }>();

    if (!listing?.sellerClient) {
      return {
        success: false,
        error: { message: "Annonce introuvable" },
        status: 404,
      };
    }

    const followUpStatus = status ?? (reminderAt ? "PENDING" : "DONE");

    const followUp = await FollowUp.create({
      listing: listingId,
      client: listing.sellerClient,
      agent: user.data._id,
      type: "CUSTOM",
      context: "LISTING",
      title,
      note,
      reminderAt,
      status: followUpStatus,
      completedAt: followUpStatus === "DONE" ? new Date() : undefined,
    });

    if (
      (followUp.status === "PENDING" || followUp.status === "OVERDUE") &&
      followUp.reminderAt
    ) {
      try {
        await createCalendarEventFromFollowUp(followUp._id.toString());
      } catch (err) {
        console.error(
          "Failed to sync listing follow-up to Google Calendar:",
          err
        );
      }
    }

    revalidatePath(ROUTES.LISTING_DETAIL_DASHBOARD(listingId));
    revalidatePath(ROUTES.SCHEDULE);

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
      completedAt: new Date(),
    },
    { new: true, timestamps: true }
  );

  console.log("markFollowUpDone result:", {
    id,
    status: result?.status,
    updatedAt: result?.updatedAt,
  });
}

export async function cancelFollowUp(id: string) {
  await dbConnect();

  const result = await FollowUp.findByIdAndUpdate(
    id,
    {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
    { new: true, timestamps: true }
  );

  console.log("cancelFollowUp result:", {
    id,
    status: result?.status,
    updatedAt: result?.updatedAt,
  });
}

export async function fetchAllFollowUps(
  params: FollowUpFilters = {}
): Promise<ActionResponse<{ followUps: FollowUp[]; total: number }>> {
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
      context,
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
    // Follow-ups created before this field existed have no context set,
    // and behave like client follow-ups.
    if (context === "LISTING") query.context = "LISTING";
    else if (context === "CLIENT") query.context = { $ne: "LISTING" };

    // Search in title, note, matching client (name, reference code, phone),
    // and matching listing (reference code, title)
    if (search) {
      const regex = { $regex: search, $options: "i" };

      const [matchingClients, matchingListings] = await Promise.all([
        Client.find({
          $or: [
            { referenceCode: regex },
            { firstName: regex },
            { lastName: regex },
            { phone: regex },
            { phone2: regex },
          ],
        })
          .select("_id")
          .lean(),
        Listing.find({
          $or: [{ referenceCode: regex }, { title: regex }],
        })
          .select("_id")
          .lean(),
      ]);

      query.$or = [
        { title: regex },
        { note: regex },
        ...(matchingClients.length
          ? [{ client: { $in: matchingClients.map((c) => c._id) } }]
          : []),
        ...(matchingListings.length
          ? [{ listing: { $in: matchingListings.map((l) => l._id) } }]
          : []),
      ];
    }

    const skip = (page - 1) * limit;

    const [followUps, total] = await Promise.all([
      FollowUp.find(query)
        .populate("agent", "firstname lastname name")
        .populate(
          "client",
          "firstName lastName referenceCode phone extraNotes preferredLocation budgetMin budgetMax priceCurrency wantedPropertyType rooms"
        )
        .populate("listing", "title referenceCode description price images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FollowUp.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        followUps: JSON.parse(JSON.stringify(followUps)),
        total,
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
