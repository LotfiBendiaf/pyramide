export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import dbConnect from "@/lib/mongoose";
import { User, CalendarEvent, FollowUp, Task } from "@/models";
import { ScheduleItem } from "@/lib/email/emailService";
import { emailQueue } from "@/lib/email/emailQueue";

const TIMEZONE = "Africa/Algiers";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    // Get all agents
    const agents = await User.find({
      role: { $in: ["AGENT", "MANAGER", "ADMIN"] },
    });

    const now = toZonedTime(new Date(), TIMEZONE);
    const zonedStartOfDay = new Date(now);
    zonedStartOfDay.setHours(0, 0, 0, 0);
    const zonedEndOfDay = new Date(now);
    zonedEndOfDay.setHours(23, 59, 59, 999);
    const startOfDay = fromZonedTime(zonedStartOfDay, TIMEZONE);
    const endOfDay = fromZonedTime(zonedEndOfDay, TIMEZONE);

    const dateStr = format(now, "EEEE d MMMM yyyy", { locale: fr });

    // Build queue items for all agents
    const queueItems = [];

    for (const agent of agents) {
      if (!agent.calendarSettings?.dailyEmailEnabled) continue;

      try {
        // Get calendar events
        const calendarEvents = await CalendarEvent.find({
          agent: agent._id,
          startTime: { $gte: startOfDay, $lte: endOfDay },
          syncStatus: { $ne: "DELETED" },
        })
          .populate("client", "firstName lastName")
          .populate("listing", "title codeReference")
          .sort({ startTime: 1 });

        // Get follow-ups without calendar events
        const followUps = await FollowUp.find({
          agent: agent._id,
          calendarEventId: { $exists: false },
          $or: [
            { reminderAt: { $gte: startOfDay, $lte: endOfDay } },
            { startTime: { $gte: startOfDay, $lte: endOfDay } },
          ],
          status: "PENDING",
        })
          .populate("client", "firstName lastName")
          .populate("listing", "title codeReference");

        // Get tasks without calendar events
        const tasks = await Task.find({
          agent: agent._id,
          calendarEventId: { $exists: false },
          $or: [
            { dueDate: { $gte: startOfDay, $lte: endOfDay } },
            { scheduledTime: { $gte: startOfDay, $lte: endOfDay } },
          ],
          status: { $in: ["PENDING", "IN_PROGRESS"] },
        })
          .populate("client", "firstName lastName")
          .populate("listing", "title codeReference");

        // Build schedule items
        const items: ScheduleItem[] = [];

        // Add calendar events
        for (const event of calendarEvents) {
          const client = event.client as {
            firstName: string;
            lastName: string;
          } | null;
          const listing = event.listing as { title: string } | null;

          items.push({
            id: event._id.toString(),
            title: event.title,
            time: format(toZonedTime(event.startTime, TIMEZONE), "HH:mm"),
            type:
              event.sourceType === "FOLLOWUP"
                ? "followup"
                : event.sourceType === "TASK"
                  ? "task"
                  : "event",
            channel: event.sourceType === "VISIT" ? "VISIT" : undefined,
            clientName: client
              ? `${client.firstName} ${client.lastName}`
              : undefined,
            listingTitle: listing?.title,
            location: event.location,
          });
        }

        // Add follow-ups without calendar events
        for (const followUp of followUps) {
          const time = followUp.startTime || followUp.reminderAt;
          const client = followUp.client as {
            firstName: string;
            lastName: string;
          } | null;
          const listing = followUp.listing as { title: string } | null;

          if (time) {
            items.push({
              id: followUp._id.toString(),
              title: followUp.title || "Suivi client",
              time: format(toZonedTime(time, TIMEZONE), "HH:mm"),
              type: "followup",
              channel: followUp.channel,
              clientName: client
                ? `${client.firstName} ${client.lastName}`
                : undefined,
              listingTitle: listing?.title,
            });
          }
        }

        // Add tasks without calendar events
        for (const task of tasks) {
          const time = task.scheduledTime || task.dueDate;
          const client = task.client as {
            firstName: string;
            lastName: string;
          } | null;
          const listing = task.listing as { title: string } | null;

          if (time) {
            items.push({
              id: task._id.toString(),
              title: task.title,
              time: format(toZonedTime(time, TIMEZONE), "HH:mm"),
              type: "task",
              priority: task.priority,
              clientName: client
                ? `${client.firstName} ${client.lastName}`
                : undefined,
              listingTitle: listing?.title,
            });
          }
        }

        // Sort by time
        items.sort((a, b) => a.time.localeCompare(b.time));

        // Calculate stats
        const stats = {
          totalItems: items.length,
          visits: items.filter((i) => i.channel === "VISIT").length,
          calls: items.filter(
            (i) => i.channel === "CALL" || i.channel === "WHATSAPP"
          ).length,
          tasks: items.filter((i) => i.type === "task").length,
        };

        // Add to queue script
        queueItems.push({
          type: "daily-schedule" as const,
          to: agent.email,
          data: {
            agentName: agent.firstname || agent.name,
            date: dateStr,
            items,
            stats,
          },
        });
      } catch (error) {
        console.error(`Error processing agent ${agent.email}:`, error);
      }
    }

    console.log(
      `Starting to send ${queueItems.length} daily schedule emails at 1 per minute...`
    );

    // Add items to queue and process
    emailQueue.addToQueue(queueItems);
    const stats = await emailQueue.processQueue();

    return NextResponse.json({
      success: true,
      sent: stats.sent,
      failed: stats.failed,
      total: stats.total,
      failedEmails: stats.failedEmails,
      message: `Emails sent sequentially at 1 per minute. Sent: ${stats.sent}, Failed: ${stats.failed}`,
    });
  } catch (error) {
    console.error("Daily email cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
