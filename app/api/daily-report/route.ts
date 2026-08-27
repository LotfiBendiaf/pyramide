"use server";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { DailyReport, Client, FollowUp, Task } from "@/models";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";

// GET - Fetch daily report for a specific date and agent
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserBySessionEmail();
    if (!user.data?._id) {
      return NextResponse.json(
        { success: false, error: { message: "Non autorisé" } },
        { status: 401 }
      );
    }

    const role = user.data.role;
    const userId = user.data._id;
    const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";

    // Get query params
    const date = request.nextUrl.searchParams.get("date");
    const agentId = request.nextUrl.searchParams.get("agentId");

    // Determine which agent's report to fetch
    const targetAgentId = isAdmin && agentId ? agentId : userId;

    // Set date range for today if no date specified
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Try to find existing report
    let report = await DailyReport.findOne({
      agent: targetAgentId,
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

    // If no report exists, generate one automatically
    if (!report) {
      // Calculate today's activities
      const [
        newClients,
        propertiesVisited,
        followUpsCompleted,
        tasksCompleted,
      ] = await Promise.all([
        Client.find({
          $or: [{ assignedAgent: targetAgentId }, { createdBy: targetAgentId }],
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .select("firstName lastName email phone type")
          .lean(),
        FollowUp.find({
          agent: targetAgentId,
          channel: "VISIT",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .select("title channel type listing client")
          .lean(),
        FollowUp.find({
          agent: targetAgentId,
          status: "DONE",
          updatedAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .select("title type status client listing")
          .lean(),
        Task.find({
          agent: targetAgentId,
          status: "COMPLETED",
          completedAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .select("title description status priority")
          .lean(),
      ]);

      // Create the report
      const newReport = await DailyReport.create({
        agent: targetAgentId,
        date: startOfDay,
        newClientsCount: newClients.length,
        propertiesVisitedCount: propertiesVisited.length,
        followUpsCompletedCount: followUpsCompleted.length,
        tasksCompletedCount: tasksCompleted.length,
        newClients: newClients.map((c) => c._id),
        propertiesVisited: propertiesVisited.map((f) => f._id),
        followUpsCompleted: followUpsCompleted.map((f) => f._id),
        tasksCompleted: tasksCompleted.map((t) => t._id),
        notes: "",
      });

      // Fetch the populated version
      report = await DailyReport.findById(newReport._id)
        .populate("agent", "name email profileImage")
        .populate("newClients", "firstName lastName email phone type")
        .populate("propertiesVisited", "title channel type listing client")
        .populate("followUpsCompleted", "title type status client listing")
        .populate("tasksCompleted", "title description status priority")
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Daily report GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors du chargement du rapport" },
      },
      { status: 500 }
    );
  }
}

// POST - Create or update daily report notes
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserBySessionEmail();
    if (!user.data?._id) {
      return NextResponse.json(
        { success: false, error: { message: "Non autorisé" } },
        { status: 401 }
      );
    }

    const userId = user.data._id;
    const body = await request.json();
    const { date, notes } = body;

    // Set date range
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find or create report
    let report = await DailyReport.findOne({
      agent: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (report) {
      // Update notes
      report.notes = notes;
      await report.save();
    } else {
      // Calculate today's activities first
      const [
        newClients,
        propertiesVisited,
        followUpsCompleted,
        tasksCompleted,
      ] = await Promise.all([
        Client.find({
          $or: [{ assignedAgent: userId }, { createdBy: userId }],
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        FollowUp.find({
          agent: userId,
          channel: "VISIT",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        FollowUp.find({
          agent: userId,
          status: "DONE",
          updatedAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        Task.find({
          agent: userId,
          status: "COMPLETED",
          completedAt: { $gte: startOfDay, $lte: endOfDay },
        }),
      ]);

      // Create new report with notes
      report = await DailyReport.create({
        agent: userId,
        date: startOfDay,
        newClientsCount: newClients.length,
        propertiesVisitedCount: propertiesVisited.length,
        followUpsCompletedCount: followUpsCompleted.length,
        tasksCompletedCount: tasksCompleted.length,
        newClients: newClients.map((c) => c._id),
        propertiesVisited: propertiesVisited.map((f) => f._id),
        followUpsCompleted: followUpsCompleted.map((f) => f._id),
        tasksCompleted: tasksCompleted.map((t) => t._id),
        notes,
      });
    }

    // Return populated report
    const populatedReport = await DailyReport.findById(report._id)
      .populate("agent", "name email profileImage")
      .populate("newClients", "firstName lastName email phone type")
      .populate("propertiesVisited", "title channel type listing client")
      .populate("followUpsCompleted", "title type status client listing")
      .populate("tasksCompleted", "title description status priority")
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedReport,
    });
  } catch (error) {
    console.error("Daily report POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors de la sauvegarde du rapport" },
      },
      { status: 500 }
    );
  }
}
