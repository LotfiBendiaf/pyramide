"use server";

import dbConnect from "@/lib/mongoose";
import { CalendarEvent, FollowUp, Task, Client, Listing, User } from "@/models";
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "./calendarService";
import {
  followUpToGoogleEvent,
  taskToGoogleEvent,
  manualEventToGoogleEvent,
} from "./eventMapper";
import { hasGoogleCalendarConnected } from "./tokenManager";

/**
 * Sync a calendar event to Google Calendar
 */
export async function syncEventToGoogle(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  const event = await CalendarEvent.findById(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check if user has Google Calendar connected
  const hasCalendar = await hasGoogleCalendarConnected(event.agent.toString());
  if (!hasCalendar) {
    return { success: false, error: "Google Calendar not connected" };
  }

  // Get user's timezone
  const user = await User.findById(event.agent);
  const timezone = user?.timezone || "Africa/Algiers";

  try {
    let googleEvent;

    // Build Google Calendar event based on source type
    if (event.sourceType === "FOLLOWUP" && event.sourceId) {
      const followUp = await FollowUp.findById(event.sourceId);
      const client = await Client.findById(event.client);
      const listing = await Listing.findById(event.listing);

      if (followUp && client) {
        googleEvent = followUpToGoogleEvent(
          followUp,
          {
            firstName: client.firstName,
            lastName: client.lastName,
            phone: client.phone,
            email: client.email,
          },
          listing
            ? {
                title: listing.title,
                location: listing.location,
              }
            : {},
          timezone
        );
      }
    } else if (event.sourceType === "TASK" && event.sourceId) {
      const task = await Task.findById(event.sourceId);
      const client = event.client ? await Client.findById(event.client) : null;
      const listing = event.listing
        ? await Listing.findById(event.listing)
        : null;

      if (task) {
        googleEvent = taskToGoogleEvent(
          task,
          client
            ? {
                firstName: client.firstName,
                lastName: client.lastName,
                phone: client.phone,
                email: client.email,
              }
            : undefined,
          listing
            ? {
                title: listing.title,
                location: listing.location,
              }
            : undefined,
          timezone
        );
      }
    } else {
      // Manual event
      googleEvent = manualEventToGoogleEvent(
        {
          title: event.title,
          description: event.description,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
          reminderMinutes: event.reminderMinutes,
        },
        timezone
      );
    }

    if (!googleEvent) {
      return { success: false, error: "Could not build Google Calendar event" };
    }

    let result;

    let newEventId: string | undefined;

    if (event.googleEventId) {
      // Update existing event
      result = await updateGoogleCalendarEvent(
        event.agent.toString(),
        event.googleEventId,
        googleEvent
      );
    } else {
      // Create new event
      const createResult = await createGoogleCalendarEvent(
        event.agent.toString(),
        googleEvent
      );
      result = createResult;
      newEventId = createResult.eventId;
    }

    if (result.success) {
      // Update local event with sync status
      await CalendarEvent.updateOne(
        { _id: event._id },
        {
          $set: {
            googleEventId: newEventId || event.googleEventId,
            syncStatus: "SYNCED",
            lastSyncedAt: new Date(),
            syncError: undefined,
          },
        }
      );
      return { success: true };
    } else {
      // Update with error status
      await CalendarEvent.updateOne(
        { _id: event._id },
        {
          $set: {
            syncStatus: "FAILED",
            syncError: result.error,
          },
        }
      );
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await CalendarEvent.updateOne(
      { _id: event._id },
      {
        $set: {
          syncStatus: "FAILED",
          syncError: errorMessage,
        },
      }
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a calendar event from Google Calendar
 */
export async function deleteEventFromGoogle(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  const event = await CalendarEvent.findById(eventId);
  if (!event || !event.googleEventId) {
    return { success: true }; // Nothing to delete
  }

  const hasCalendar = await hasGoogleCalendarConnected(event.agent.toString());
  if (!hasCalendar) {
    return { success: true }; // Can't delete, but not an error
  }

  const result = await deleteGoogleCalendarEvent(
    event.agent.toString(),
    event.googleEventId
  );

  if (result.success) {
    await CalendarEvent.updateOne(
      { _id: event._id },
      {
        $set: {
          syncStatus: "DELETED",
          lastSyncedAt: new Date(),
        },
      }
    );
  }

  return result;
}

/**
 * Create a calendar event from a FollowUp
 */
export async function createCalendarEventFromFollowUp(
  followUpId: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  await dbConnect();

  const followUp = await FollowUp.findById(followUpId);
  if (!followUp) {
    return { success: false, error: "FollowUp not found" };
  }

  // Only create if there's a scheduled time
  if (!followUp.reminderAt && !followUp.startTime) {
    return { success: false, error: "No scheduled time for FollowUp" };
  }

  const user = await User.findById(followUp.agent);
  if (!user?.calendarSettings?.syncFollowUps) {
    return { success: true }; // Sync disabled, not an error
  }

  const startTime = followUp.startTime || followUp.reminderAt;
  const duration = followUp.duration || 60;
  const endTime = new Date(startTime!.getTime() + duration * 60 * 1000);

  // Create local calendar event
  const calendarEvent = await CalendarEvent.create({
    agent: followUp.agent,
    title:
      followUp.title ||
      `${followUp.channel ? followUp.channel : "Suivi"} client`,
    description: followUp.note,
    startTime,
    endTime,
    sourceType: "FOLLOWUP",
    sourceId: followUp._id,
    client: followUp.client,
    listing: followUp.listing,
    syncStatus: "PENDING",
  });

  // Update FollowUp with calendar event reference
  await FollowUp.updateOne(
    { _id: followUp._id },
    { $set: { calendarEventId: calendarEvent._id } }
  );

  // Sync to Google Calendar if connected
  const hasCalendar = await hasGoogleCalendarConnected(
    followUp.agent.toString()
  );
  if (hasCalendar && user?.calendarSettings?.googleCalendarEnabled) {
    await syncEventToGoogle(calendarEvent._id.toString());
  }

  return { success: true, eventId: calendarEvent._id.toString() };
}

/**
 * Create a calendar event from a Task
 */
export async function createCalendarEventFromTask(
  taskId: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  await dbConnect();

  const task = await Task.findById(taskId);
  if (!task) {
    return { success: false, error: "Task not found" };
  }

  // Only create if there's a scheduled time or due date
  if (!task.scheduledTime && !task.dueDate) {
    return { success: false, error: "No scheduled time for Task" };
  }

  const user = await User.findById(task.agent);
  if (!user?.calendarSettings?.syncTasks) {
    return { success: true }; // Sync disabled, not an error
  }

  const startTime = task.scheduledTime || task.dueDate;
  const duration = task.estimatedDuration || 30;
  const endTime = new Date(startTime!.getTime() + duration * 60 * 1000);

  // Create local calendar event
  const calendarEvent = await CalendarEvent.create({
    agent: task.agent,
    title: task.title,
    description: task.description,
    startTime,
    endTime,
    sourceType: "TASK",
    sourceId: task._id,
    client: task.client,
    listing: task.listing,
    syncStatus: "PENDING",
  });

  // Update Task with calendar event reference
  await Task.updateOne(
    { _id: task._id },
    { $set: { calendarEventId: calendarEvent._id } }
  );

  // Sync to Google Calendar if connected
  const hasCalendar = await hasGoogleCalendarConnected(task.agent.toString());
  if (hasCalendar && user?.calendarSettings?.googleCalendarEnabled) {
    await syncEventToGoogle(calendarEvent._id.toString());
  }

  return { success: true, eventId: calendarEvent._id.toString() };
}

/**
 * Sync all pending events to Google Calendar
 */
export async function syncPendingEvents(): Promise<{
  success: boolean;
  synced: number;
  failed: number;
}> {
  await dbConnect();

  const pendingEvents = await CalendarEvent.find({
    syncStatus: "PENDING",
  }).limit(50);

  let synced = 0;
  let failed = 0;

  for (const event of pendingEvents) {
    const result = await syncEventToGoogle(event._id.toString());
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { success: true, synced, failed };
}
