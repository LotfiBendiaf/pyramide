"use server";

import { google, calendar_v3 } from "googleapis";
import { getOAuth2Client } from "./tokenManager";

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: "email" | "popup"; minutes: number }>;
  };
  colorId?: string;
}

/**
 * Get the Google Calendar API client for a user
 */
async function getCalendarClient(
  userId: string
): Promise<calendar_v3.Calendar> {
  const auth = await getOAuth2Client(userId);
  return google.calendar({ version: "v3", auth });
}

/**
 * Create an event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  userId: string,
  event: GoogleCalendarEvent,
  calendarId: string = "primary"
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
    };
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>,
  calendarId: string = "primary"
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List events from Google Calendar within a time range
 */
export async function listGoogleCalendarEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
  calendarId: string = "primary"
): Promise<{
  success: boolean;
  events?: calendar_v3.Schema$Event[];
  error?: string;
}> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return {
      success: true,
      events: response.data.items || [],
    };
  } catch (error) {
    console.error("Error listing Google Calendar events:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a single event from Google Calendar
 */
export async function getGoogleCalendarEvent(
  userId: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<{
  success: boolean;
  event?: calendar_v3.Schema$Event;
  error?: string;
}> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.get({
      calendarId,
      eventId,
    });

    return {
      success: true,
      event: response.data,
    };
  } catch (error) {
    console.error("Error getting Google Calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get list of user's calendars
 */
export async function listCalendars(userId: string): Promise<{
  success: boolean;
  calendars?: calendar_v3.Schema$CalendarListEntry[];
  error?: string;
}> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.calendarList.list();

    return {
      success: true,
      calendars: response.data.items || [],
    };
  } catch (error) {
    console.error("Error listing calendars:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
