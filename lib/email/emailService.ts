// "use server";

// import { Resend } from "resend";
// import DailyScheduleEmail from "./templates/DailyScheduleEmail";
// import ReminderEmail from "./templates/ReminderEmail";

// const resend = new Resend(process.env.RESEND_API_KEY);
// const FROM_EMAIL = process.env.EMAIL_FROM || "notifications@pyramide.dz";

// export interface ScheduleItem {
//   id: string;
//   title: string;
//   time: string;
//   type: "followup" | "task" | "event";
//   channel?: string;
//   clientName?: string;
//   listingTitle?: string;
//   location?: string;
//   priority?: string;
// }

// export interface DailyScheduleData {
//   agentName: string;
//   date: string;
//   items: ScheduleItem[];
//   stats: {
//     totalItems: number;
//     visits: number;
//     calls: number;
//     tasks: number;
//   };
// }

// export interface ReminderData {
//   agentName: string;
//   eventTitle: string;
//   eventTime: string;
//   eventType: "followup" | "task" | "event";
//   clientName?: string;
//   clientPhone?: string;
//   listingTitle?: string;
//   location?: string;
//   minutesUntil: number;
// }

// /**
//  * Send daily schedule email to an agent
//  */
// export async function sendDailyScheduleEmail(
//   to: string,
//   data: DailyScheduleData
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const { error } = await resend.emails.send({
//       from: FROM_EMAIL,
//       to,
//       subject: `Votre planning du ${data.date} - Pyramide`,
//       react: DailyScheduleEmail(data),
//     });

//     if (error) {
//       console.error("Error sending daily schedule email:", error);
//       return { success: false, error: error.message };
//     }

//     return { success: true };
//   } catch (error) {
//     console.error("Error sending daily schedule email:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }

// /**
//  * Send reminder email to an agent
//  */
// export async function sendReminderEmail(
//   to: string,
//   data: ReminderData
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const { error } = await resend.emails.send({
//       from: FROM_EMAIL,
//       to,
//       subject: `Rappel: ${data.eventTitle} dans ${data.minutesUntil} minutes`,
//       react: ReminderEmail(data),
//     });

//     if (error) {
//       console.error("Error sending reminder email:", error);
//       return { success: false, error: error.message };
//     }

//     return { success: true };
//   } catch (error) {
//     console.error("Error sending reminder email:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }
