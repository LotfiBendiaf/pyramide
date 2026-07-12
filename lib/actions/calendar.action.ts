"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import { CalendarEvent, FollowUp, Task, User } from "@/models";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import {
  syncEventToGoogle,
  hasGoogleCalendarConnected,
} from "@/lib/googleCalendar";

// Types for populated documents from lean queries
interface PopulatedClient {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone?: string;
  referenceCode?: string;
}

interface PopulatedListing {
  _id: Types.ObjectId;
  title: string;
}

interface CalendarEventLean {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  sourceType: "FOLLOWUP" | "TASK" | "VISIT" | "MANUAL";
  client?: PopulatedClient;
  listing?: PopulatedListing;
  syncStatus?: string;
  googleEventId?: string;
}

interface FollowUpLean {
  _id: Types.ObjectId;
  title?: string;
  note?: string;
  startTime?: Date;
  reminderAt?: Date;
  duration?: number;
  channel?: string;
  status?: string;
  client?: PopulatedClient;
  listing?: PopulatedListing;
}

interface TaskLean {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  scheduledTime?: Date;
  dueDate?: Date;
  estimatedDuration?: number;
  status?: string;
  priority?: string;
  client?: PopulatedClient;
  listing?: PopulatedListing;
}

interface UserLean {
  _id: Types.ObjectId;
  timezone?: string;
  calendarSettings?: {
    googleCalendarEnabled?: boolean;
    syncFollowUps?: boolean;
    syncTasks?: boolean;
    defaultReminderMinutes?: number;
    dailyEmailEnabled?: boolean;
  };
}

export interface ScheduleEvent {
  _id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: "followup" | "task" | "event";
  channel?: string;
  status?: string;
  priority?: string;
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    referenceCode?: string;
  };
  listing?: {
    _id: string;
    title: string;
  };
  syncStatus?: string;
  googleEventId?: string;
}

interface GetScheduleParams {
  startDate: Date;
  endDate: Date;
  agentId?: string;
}

export async function getSchedule(
  params: GetScheduleParams
): Promise<ActionResponse<ScheduleEvent[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { message: "Non autorisé" } };
    }

    await dbConnect();

    const agentId = params.agentId || session.user.id;

    // Get calendar events
    const calendarEvents = (await CalendarEvent.find({
      agent: agentId,
      startTime: { $gte: params.startDate, $lte: params.endDate },
      syncStatus: { $ne: "DELETED" },
    })
      .populate("client", "firstName lastName phone referenceCode")
      .populate("listing", "title")
      .sort({ startTime: 1 })
      .lean()) as unknown as CalendarEventLean[];

    // Get follow-ups without calendar events
    const followUps = (await FollowUp.find({
      agent: agentId,
      calendarEventId: { $exists: false },
      $or: [
        { reminderAt: { $gte: params.startDate, $lte: params.endDate } },
        { startTime: { $gte: params.startDate, $lte: params.endDate } },
      ],
      status: { $in: ["PENDING", "OVERDUE"] },
    })
      .populate("client", "firstName lastName phone referenceCode")
      .populate("listing", "title")
      .lean()) as unknown as FollowUpLean[];

    // Get tasks without calendar events
    const tasks = (await Task.find({
      agent: agentId,
      calendarEventId: { $exists: false },
      $or: [
        { dueDate: { $gte: params.startDate, $lte: params.endDate } },
        { scheduledTime: { $gte: params.startDate, $lte: params.endDate } },
      ],
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    })
      .populate("client", "firstName lastName phone referenceCode")
      .populate("listing", "title")
      .lean()) as unknown as TaskLean[];

    // Combine all events
    const events: ScheduleEvent[] = [];

    // Add calendar events
    for (const event of calendarEvents) {
      events.push({
        _id: event._id.toString(),
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        type:
          event.sourceType === "FOLLOWUP"
            ? "followup"
            : event.sourceType === "TASK"
            ? "task"
            : "event",
        channel: event.sourceType === "VISIT" ? "VISIT" : undefined,
        client: event.client
          ? {
              _id: event.client._id.toString(),
              firstName: event.client.firstName,
              lastName: event.client.lastName,
              phone: event.client.phone,
              referenceCode: event.client.referenceCode,
            }
          : undefined,
        listing: event.listing
          ? {
              _id: event.listing._id.toString(),
              title: event.listing.title,
            }
          : undefined,
        syncStatus: event.syncStatus,
        googleEventId: event.googleEventId,
      });
    }

    // Add follow-ups
    for (const followUp of followUps) {
      const startTime = followUp.startTime || followUp.reminderAt;
      if (!startTime) continue;

      const duration = followUp.duration || 60;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      events.push({
        _id: followUp._id.toString(),
        title: followUp.title || `Suivi ${followUp.channel || "client"}`,
        description: followUp.note,
        startTime,
        endTime,
        type: "followup",
        channel: followUp.channel,
        status: followUp.status,
        client: followUp.client
          ? {
              _id: followUp.client._id.toString(),
              firstName: followUp.client.firstName,
              lastName: followUp.client.lastName,
              phone: followUp.client.phone,
              referenceCode: followUp.client.referenceCode,
            }
          : undefined,
        listing: followUp.listing
          ? {
              _id: followUp.listing._id.toString(),
              title: followUp.listing.title,
            }
          : undefined,
      });
    }

    // Add tasks
    for (const task of tasks) {
      const startTime = task.scheduledTime || task.dueDate;
      if (!startTime) continue;

      const duration = task.estimatedDuration || 30;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      events.push({
        _id: task._id.toString(),
        title: task.title,
        description: task.description,
        startTime,
        endTime,
        type: "task",
        status: task.status,
        priority: task.priority,
        client: task.client
          ? {
              _id: task.client._id.toString(),
              firstName: task.client.firstName,
              lastName: task.client.lastName,
              phone: task.client.phone,
              referenceCode: task.client.referenceCode,
            }
          : undefined,
        listing: task.listing
          ? {
              _id: task.listing._id.toString(),
              title: task.listing.title,
            }
          : undefined,
      });
    }

    // Sort by start time
    events.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return { success: false, error: { message: "Erreur lors du chargement" } };
  }
}

export async function getTodaySchedule(): Promise<
  ActionResponse<ScheduleEvent[]>
> {
  const today = new Date();
  return getSchedule({
    startDate: startOfDay(today),
    endDate: endOfDay(today),
  });
}

export async function getWeekSchedule(): Promise<
  ActionResponse<ScheduleEvent[]>
> {
  const today = new Date();
  return getSchedule({
    startDate: startOfWeek(today, { weekStartsOn: 1 }),
    endDate: endOfWeek(today, { weekStartsOn: 1 }),
  });
}

export async function getCalendarSettings(): Promise<
  ActionResponse<{
    timezone: string;
    googleCalendarEnabled: boolean;
    syncFollowUps: boolean;
    syncTasks: boolean;
    defaultReminderMinutes: number;
    dailyEmailEnabled: boolean;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { message: "Non autorisé" } };
    }

    await dbConnect();

    const user = (await User.findById(
      session.user.id
    ).lean()) as unknown as UserLean | null;
    if (!user) {
      return { success: false, error: { message: "Utilisateur non trouvé" } };
    }

    return {
      success: true,
      data: {
        timezone: user.timezone || "Africa/Algiers",
        googleCalendarEnabled:
          user.calendarSettings?.googleCalendarEnabled || false,
        syncFollowUps: user.calendarSettings?.syncFollowUps ?? true,
        syncTasks: user.calendarSettings?.syncTasks ?? true,
        defaultReminderMinutes:
          user.calendarSettings?.defaultReminderMinutes || 30,
        dailyEmailEnabled: user.calendarSettings?.dailyEmailEnabled ?? true,
      },
    };
  } catch (error) {
    console.error("Error fetching calendar settings:", error);
    return { success: false, error: { message: "Erreur lors du chargement" } };
  }
}

export async function updateCalendarSettings(settings: {
  timezone?: string;
  googleCalendarEnabled?: boolean;
  syncFollowUps?: boolean;
  syncTasks?: boolean;
  defaultReminderMinutes?: number;
  dailyEmailEnabled?: boolean;
}): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { message: "Non autorisé" } };
    }

    await dbConnect();

    const updateData: Record<string, unknown> = {};

    if (settings.timezone !== undefined) {
      updateData.timezone = settings.timezone;
    }

    if (settings.googleCalendarEnabled !== undefined) {
      updateData["calendarSettings.googleCalendarEnabled"] =
        settings.googleCalendarEnabled;
    }
    if (settings.syncFollowUps !== undefined) {
      updateData["calendarSettings.syncFollowUps"] = settings.syncFollowUps;
    }
    if (settings.syncTasks !== undefined) {
      updateData["calendarSettings.syncTasks"] = settings.syncTasks;
    }
    if (settings.defaultReminderMinutes !== undefined) {
      updateData["calendarSettings.defaultReminderMinutes"] =
        settings.defaultReminderMinutes;
    }
    if (settings.dailyEmailEnabled !== undefined) {
      updateData["calendarSettings.dailyEmailEnabled"] =
        settings.dailyEmailEnabled;
    }

    await User.updateOne({ _id: session.user.id }, { $set: updateData });

    revalidatePath("/dashboard/schedule");
    return { success: true, data: null };
  } catch (error) {
    console.error("Error updating calendar settings:", error);
    return {
      success: false,
      error: { message: "Erreur lors de la mise à jour" },
    };
  }
}

export async function createManualEvent(data: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay?: boolean;
  reminderMinutes?: number;
}): Promise<ActionResponse<{ eventId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("createManualEvent: No session or user ID");
      return { success: false, error: { message: "Non autorisé" } };
    }

    await dbConnect();

    // Check if user has Google Calendar connected
    const hasGoogleConnected = await hasGoogleCalendarConnected(
      session.user.id
    );

    console.log("Creating event for user:", session.user.id);
    console.log("Google Calendar connected:", hasGoogleConnected);

    // Create the event first (always create locally)
    const event = await CalendarEvent.create({
      agent: session.user.id,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      isAllDay: data.isAllDay || false,
      reminderMinutes: data.reminderMinutes || 30,
      sourceType: "MANUAL",
      syncStatus: hasGoogleConnected ? "PENDING" : "SYNCED",
    });

    console.log("Event created locally:", event._id.toString());

    // Immediately sync to Google Calendar if connected
    // Always sync when Google is connected (user explicitly connected it)
    if (hasGoogleConnected) {
      try {
        console.log("Attempting to sync event to Google Calendar...");
        const syncResult = await syncEventToGoogle(event._id.toString());
        console.log("Sync result:", syncResult);
      } catch (syncError) {
        // Don't fail the whole operation if sync fails
        console.error("Failed to sync to Google Calendar:", syncError);
      }
    } else {
      console.log("Google Calendar not connected, skipping sync");
    }

    revalidatePath("/dashboard/schedule");
    return { success: true, data: { eventId: event._id.toString() } };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: { message: "Erreur lors de la création" } };
  }
}

export async function deleteCalendarEvent(
  eventId: string
): Promise<ActionResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { message: "Non autorisé" } };
    }

    await dbConnect();

    const event = await CalendarEvent.findOne({
      _id: eventId,
      agent: session.user.id,
    });

    if (!event) {
      return { success: false, error: { message: "Événement non trouvé" } };
    }

    // Mark as deleted instead of removing
    await CalendarEvent.updateOne(
      { _id: eventId },
      { $set: { syncStatus: "DELETED" } }
    );

    revalidatePath("/dashboard/schedule");
    return { success: true, data: null };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: { message: "Erreur lors de la suppression" },
    };
  }
}
