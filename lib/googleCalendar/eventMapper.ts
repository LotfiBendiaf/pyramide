// import { addMinutes } from "date-fns";
// import { formatInTimeZone } from "date-fns-tz";
// import { GoogleCalendarEvent } from "./calendarService";
// import { IFollowUp } from "@/models/followUp.model";
// import { ITask } from "@/models/task.model";

// // Channel labels in French
// const CHANNEL_LABELS: Record<string, string> = {
//   CALL: "Appel",
//   WHATSAPP: "WhatsApp",
//   EMAIL: "Email",
//   VISIT: "Visite",
// };

// // Default durations by channel (in minutes)
// const DEFAULT_DURATIONS: Record<string, number> = {
//   CALL: 30,
//   WHATSAPP: 15,
//   EMAIL: 15,
//   VISIT: 60,
// };

// // Priority colors for tasks (Google Calendar color IDs)
// const PRIORITY_COLORS: Record<string, string> = {
//   LOW: "8", // Gray
//   MEDIUM: "5", // Yellow
//   HIGH: "6", // Orange
//   URGENT: "11", // Red
// };

// // Follow-up type colors
// const FOLLOWUP_TYPE_COLORS: Record<string, string> = {
//   COLD: "9", // Blue
//   WARM: "5", // Yellow
//   HOT: "11", // Red
//   CUSTOM: "7", // Cyan
// };

// interface ClientInfo {
//   firstName: string;
//   lastName: string;
//   phone?: string;
//   email?: string;
// }

// interface ListingInfo {
//   title?: string;
//   location?: {
//     city?: string;
//     address?: string;
//   };
// }

// /**
//  * Map a FollowUp to a Google Calendar event
//  */
// export function followUpToGoogleEvent(
//   followUp: IFollowUp,
//   client: ClientInfo,
//   listing: ListingInfo,
//   timezone: string = "Africa/Algiers"
// ): GoogleCalendarEvent {
//   const channelLabel = followUp.channel
//     ? CHANNEL_LABELS[followUp.channel]
//     : "Suivi";
//   const clientName = `${client.firstName} ${client.lastName}`;

//   // Use startTime if provided, otherwise use reminderAt
//   const startTime = followUp.startTime || followUp.reminderAt || new Date();
//   const duration =
//     followUp.duration ||
//     (followUp.channel ? DEFAULT_DURATIONS[followUp.channel] : 30);
//   const endTime = addMinutes(startTime, duration);

//   // Build description
//   const descriptionParts = [];
//   if (followUp.note) {
//     descriptionParts.push(followUp.note);
//   }
//   descriptionParts.push("");
//   descriptionParts.push(`Client: ${clientName}`);
//   if (client.phone) {
//     descriptionParts.push(`Téléphone: ${client.phone}`);
//   }
//   if (client.email) {
//     descriptionParts.push(`Email: ${client.email}`);
//   }
//   if (listing.title) {
//     descriptionParts.push(`Bien: ${listing.title}`);
//   }
//   descriptionParts.push("");
//   descriptionParts.push("---");
//   descriptionParts.push("Créé via Pyramide CRM");

//   // Determine location for visits
//   const location =
//     followUp.channel === "VISIT"
//       ? listing.location?.address || listing.location?.city
//       : undefined;

//   return {
//     summary:
//       followUp.title || `${channelLabel} - ${clientName}`,
//     description: descriptionParts.join("\n"),
//     location,
//     start: {
//       dateTime: formatInTimeZone(
//         startTime,
//         timezone,
//         "yyyy-MM-dd'T'HH:mm:ssXXX"
//       ),
//       timeZone: timezone,
//     },
//     end: {
//       dateTime: formatInTimeZone(endTime, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
//       timeZone: timezone,
//     },
//     reminders: {
//       useDefault: false,
//       overrides: [{ method: "popup", minutes: 30 }],
//     },
//     colorId: followUp.type ? FOLLOWUP_TYPE_COLORS[followUp.type] : undefined,
//   };
// }

// /**
//  * Map a Task to a Google Calendar event
//  */
// export function taskToGoogleEvent(
//   task: ITask,
//   client?: ClientInfo,
//   listing?: ListingInfo,
//   timezone: string = "Africa/Algiers"
// ): GoogleCalendarEvent {
//   // Use scheduledTime if provided, otherwise use dueDate
//   const startTime = task.scheduledTime || task.dueDate || new Date();
//   const duration = task.estimatedDuration || 30;
//   const endTime = addMinutes(startTime, duration);

//   // Build description
//   const descriptionParts = [];
//   if (task.description) {
//     descriptionParts.push(task.description);
//   }
//   descriptionParts.push("");
//   descriptionParts.push(`Priorité: ${task.priority}`);
//   if (client) {
//     descriptionParts.push(`Client: ${client.firstName} ${client.lastName}`);
//     if (client.phone) {
//       descriptionParts.push(`Téléphone: ${client.phone}`);
//     }
//   }
//   if (listing?.title) {
//     descriptionParts.push(`Bien: ${listing.title}`);
//   }
//   descriptionParts.push("");
//   descriptionParts.push("---");
//   descriptionParts.push("Créé via Pyramide CRM");

//   return {
//     summary: `[Tâche] ${task.title}`,
//     description: descriptionParts.join("\n"),
//     location: listing?.location?.address || listing?.location?.city,
//     start: {
//       dateTime: formatInTimeZone(
//         startTime,
//         timezone,
//         "yyyy-MM-dd'T'HH:mm:ssXXX"
//       ),
//       timeZone: timezone,
//     },
//     end: {
//       dateTime: formatInTimeZone(endTime, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
//       timeZone: timezone,
//     },
//     reminders: {
//       useDefault: false,
//       overrides: [{ method: "popup", minutes: 15 }],
//     },
//     colorId: PRIORITY_COLORS[task.priority] || undefined,
//   };
// }

// /**
//  * Map a manual calendar event to Google Calendar format
//  */
// export function manualEventToGoogleEvent(
//   event: {
//     title: string;
//     description?: string;
//     location?: string;
//     startTime: Date;
//     endTime: Date;
//     isAllDay?: boolean;
//     reminderMinutes?: number;
//   },
//   timezone: string = "Africa/Algiers"
// ): GoogleCalendarEvent {
//   if (event.isAllDay) {
//     return {
//       summary: event.title,
//       description: event.description,
//       location: event.location,
//       start: {
//         date: formatInTimeZone(event.startTime, timezone, "yyyy-MM-dd"),
//       },
//       end: {
//         date: formatInTimeZone(event.endTime, timezone, "yyyy-MM-dd"),
//       },
//       reminders: {
//         useDefault: true,
//       },
//     };
//   }

//   return {
//     summary: event.title,
//     description: event.description,
//     location: event.location,
//     start: {
//       dateTime: formatInTimeZone(
//         event.startTime,
//         timezone,
//         "yyyy-MM-dd'T'HH:mm:ssXXX"
//       ),
//       timeZone: timezone,
//     },
//     end: {
//       dateTime: formatInTimeZone(
//         event.endTime,
//         timezone,
//         "yyyy-MM-dd'T'HH:mm:ssXXX"
//       ),
//       timeZone: timezone,
//     },
//     reminders: {
//       useDefault: false,
//       overrides: [{ method: "popup", minutes: event.reminderMinutes || 30 }],
//     },
//   };
// }
