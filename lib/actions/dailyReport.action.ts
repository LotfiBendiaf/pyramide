"use server";

import dbConnect from "@/lib/mongoose";
import { DailyReport, Client, FollowUp, Task } from "@/models";

interface GetDailyReportParams {
  agentId: string;
  date?: Date;
}

export async function getDailyReport({ agentId, date }: GetDailyReportParams) {
  try {
    await dbConnect();

    // Set date range for today if no date specified
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("Fetching daily report for:", {
      agentId,
      date: targetDate,
      startOfDay,
      endOfDay,
    });

    // Try to find existing report
    let report = await DailyReport.findOne({
      agent: agentId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("agent", "name email profileImage")
      .populate("newClients", "firstName lastName email phone type")
      .populate("propertiesVisited", "title channel type listing client")
      .populate("followUpsCompleted", "title type status client listing")
      .populate("tasksCompleted", "title description status priority")
      .lean();

    console.log("Existing report found:", !!report);

    // ALWAYS recalculate to get fresh data (for now)
    // In production, you might want to cache this for performance
    const shouldRecalculate = true; // Set to false to use cached reports

    // If no report exists OR we want to recalculate, generate fresh data
    if (!report || shouldRecalculate) {
      // Calculate today's activities
      const [
        newClients,
        propertiesVisited,
        followUpsCompleted,
        tasksCompleted,
      ] = await Promise.all([
        // New clients added today
        Client.find({
          $or: [{ assignedAgent: agentId }, { createdBy: agentId }],
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .select("firstName lastName email phone type")
          .lean(),
        // Properties visited today (follow-ups with VISIT channel OR type CUSTOM with "visit" in title)
        FollowUp.find({
          agent: agentId,
          $or: [
            { channel: "VISIT" },
            {
              $and: [
                { title: { $regex: /visite?/i } }, // Match "visite" or "visit" case-insensitive
                { createdAt: { $gte: startOfDay, $lte: endOfDay } },
              ],
            },
          ],
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .select("title channel type listing client")
          .lean(),
        // Follow-ups completed today (marked as DONE)
        FollowUp.find({
          agent: agentId,
          status: "DONE",
          $or: [
            { updatedAt: { $gte: startOfDay, $lte: endOfDay } }, // Updated today
            { createdAt: { $gte: startOfDay, $lte: endOfDay } }, // Or created today as DONE
          ],
        })
          .select("title type status client listing")
          .lean(),
        // Tasks completed today
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
      ]);

      console.log("Daily Report Debug - Today's data:", {
        agentId,
        date: targetDate,
        newClientsCount: newClients.length,
        propertiesVisitedCount: propertiesVisited.length,
        followUpsCompletedCount: followUpsCompleted.length,
        tasksCompletedCount: tasksCompleted.length,
        startOfDay,
        endOfDay,
      });

      // Log sample data for debugging
      if (newClients.length > 0) {
        console.log("Sample new client:", newClients[0]);
      }
      if (propertiesVisited.length > 0) {
        console.log("Sample property visited:", propertiesVisited[0]);
      }
      if (followUpsCompleted.length > 0) {
        console.log("Sample follow-up completed:", followUpsCompleted[0]);
      }

      // DEBUG: Check all DONE follow-ups for this agent (regardless of date)
      const allDoneFollowUps = await FollowUp.find({
        agent: agentId,
        status: "DONE",
      })
        .select("title status createdAt updatedAt channel")
        .lean();
      console.log("DEBUG - All DONE follow-ups for agent:", allDoneFollowUps);

      // DEBUG: Check all VISIT channel follow-ups for this agent
      const allVisitFollowUps = await FollowUp.find({
        agent: agentId,
        channel: "VISIT",
      })
        .select("title status createdAt updatedAt channel")
        .lean();
      console.log("DEBUG - All VISIT channel follow-ups for agent:", allVisitFollowUps);

      // DEBUG: Check recent follow-ups in the ENTIRE database (to see if they exist but with different agent)
      const recentFollowUps = await FollowUp.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .select("title status channel agent createdAt")
        .populate("agent", "name email")
        .limit(10)
        .lean();
      console.log("DEBUG - Recent follow-ups in DB (all agents):", recentFollowUps);

      // Create or update the report
      const existingReportId = report
        ? String((report as Record<string, unknown>)._id)
        : null;
      const existingNotes = report
        ? String((report as Record<string, unknown>).notes || "")
        : "";

      const reportData = {
        agent: agentId,
        date: startOfDay,
        newClientsCount: newClients.length,
        propertiesVisitedCount: propertiesVisited.length,
        followUpsCompletedCount: followUpsCompleted.length,
        tasksCompletedCount: tasksCompleted.length,
        newClients: newClients.map((c) => c._id),
        propertiesVisited: propertiesVisited.map((f) => f._id),
        followUpsCompleted: followUpsCompleted.map((f) => f._id),
        tasksCompleted: tasksCompleted.map((t) => t._id),
        notes: existingNotes, // Preserve existing notes
      };

      // If report exists, update it; otherwise create new
      const updatedReport = existingReportId
        ? await DailyReport.findByIdAndUpdate(existingReportId, reportData, {
            new: true,
          })
        : await DailyReport.create(reportData);

      // Fetch the populated version
      report = await DailyReport.findById(updatedReport?._id)
        .populate("agent", "name email profileImage")
        .populate("newClients", "firstName lastName email phone type")
        .populate("propertiesVisited", "title channel type listing client")
        .populate("followUpsCompleted", "title type status client listing")
        .populate("tasksCompleted", "title description status priority")
        .lean();
    }

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
