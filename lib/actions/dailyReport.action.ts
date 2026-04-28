"use server";

import dbConnect from "@/lib/mongoose";
import { DailyReport, Client, FollowUp, Task, Visit, Negotiation } from "@/models";

interface GetDailyReportParams {
  agentId: string;
  date?: Date;
}

export async function getDailyReport({ agentId, date }: GetDailyReportParams) {
  try {
    await dbConnect();

    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReport = await DailyReport.findOne({
      agent: agentId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const [
      newClients,
      propertiesVisited,
      followUpsCompleted,
      tasksCompleted,
      visitsScheduled,
      visitsCompleted,
      negotiationsOpened,
      dealsClosed,
    ] = await Promise.all([
      Client.find({
        $or: [{ assignedAgent: agentId }, { createdBy: agentId }],
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("firstName lastName email phone type")
        .lean(),

      FollowUp.find({
        agent: agentId,
        channel: "VISIT",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("title channel type listing client")
        .lean(),

      FollowUp.find({
        agent: agentId,
        status: "DONE",
        updatedAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("title type status client listing")
        .lean(),

      Task.find({
        agent: agentId,
        status: "COMPLETED",
        $or: [
          { completedAt: { $gte: startOfDay, $lte: endOfDay } },
          { updatedAt: { $gte: startOfDay, $lte: endOfDay } },
        ],
      })
        .select("title description status priority")
        .lean(),

      // Visits scheduled today by this agent
      Visit.find({
        agent: agentId,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("_id scheduledAt status listing client")
        .lean(),

      // Visits completed today by this agent
      Visit.find({
        agent: agentId,
        status: "COMPLETED",
        completedAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("_id completedAt outcome listing client")
        .lean(),

      // Negotiations opened today by this agent
      Negotiation.find({
        agent: agentId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("_id status listing client")
        .lean(),

      // Deals closed today by this agent
      Negotiation.find({
        agent: agentId,
        status: "DEAL_DONE",
        closedAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("_id closedAt listing client closingDetails")
        .lean(),
    ]);

    const reportData = {
      agent: agentId,
      date: startOfDay,
      newClientsCount: newClients.length,
      propertiesVisitedCount: propertiesVisited.length,
      followUpsCompletedCount: followUpsCompleted.length,
      tasksCompletedCount: tasksCompleted.length,
      visitsScheduledCount: visitsScheduled.length,
      visitsCompletedCount: visitsCompleted.length,
      negotiationsOpenedCount: negotiationsOpened.length,
      dealsClosedCount: dealsClosed.length,
      newClients: newClients.map((c) => c._id),
      propertiesVisited: propertiesVisited.map((f) => f._id),
      followUpsCompleted: followUpsCompleted.map((f) => f._id),
      tasksCompleted: tasksCompleted.map((t) => t._id),
      visits: visitsScheduled.map((v) => v._id),
      negotiations: negotiationsOpened.map((n) => n._id),
      notes: existingReport
        ? String((existingReport as Record<string, unknown>).notes || "")
        : "",
    };

    const savedReport = existingReport
      ? await DailyReport.findByIdAndUpdate(
          (existingReport as Record<string, unknown>)._id,
          reportData,
          { new: true }
        )
      : await DailyReport.create(reportData);

    const report = await DailyReport.findById(savedReport?._id)
      .populate("agent", "name email profileImage")
      .populate("newClients", "firstName lastName email phone type")
      .populate("propertiesVisited", "title channel type listing client")
      .populate("followUpsCompleted", "title type status client listing")
      .populate("tasksCompleted", "title description status priority")
      .populate("visits", "scheduledAt status outcome listing client")
      .populate("negotiations", "status listing client createdAt")
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(report)),
    };
  } catch (error) {
    console.error("Daily report fetch error:", error);
    return {
      success: false,
      error: { message: "Erreur lors du chargement du rapport" },
    };
  }
}
