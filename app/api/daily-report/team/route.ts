"use server";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { DailyReport, User } from "@/models";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";

// GET - Fetch team daily reports (Manager/Admin only)
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
    const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Accès réservé aux managers et admins" },
        },
        { status: 403 }
      );
    }

    // Get query params
    const date = request.nextUrl.searchParams.get("date");

    // Set date range for today if no date specified
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all agents
    const agents = await User.find({
      role: { $in: ["AGENT", "MANAGER", "ADMIN"] },
    })
      .select("name email profileImage role")
      .lean();

    // Fetch all reports for this date
    const reports = await DailyReport.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("agent", "name email profileImage role")
      .lean();

    // Create a map of agent reports
    const reportMap = new Map(
      reports.map((report) => [report.agent._id.toString(), report])
    );

    // Build team report data
    const teamReports = agents.map((agent) => {
      const report = reportMap.get(agent._id);

      return {
        agent: {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          profileImage: agent.profileImage,
          role: agent.role,
        },
        report: report
          ? {
              newClientsCount: report.newClientsCount,
              propertiesVisitedCount: report.propertiesVisitedCount,
              followUpsCompletedCount: report.followUpsCompletedCount,
              tasksCompletedCount: report.tasksCompletedCount,
              notes: report.notes,
              _id: report._id,
            }
          : {
              newClientsCount: 0,
              propertiesVisitedCount: 0,
              followUpsCompletedCount: 0,
              tasksCompletedCount: 0,
              notes: "",
              _id: null,
            },
      };
    });

    // Calculate team totals
    const teamTotals = {
      totalNewClients: reports.reduce((sum, r) => sum + r.newClientsCount, 0),
      totalPropertiesVisited: reports.reduce(
        (sum, r) => sum + r.propertiesVisitedCount,
        0
      ),
      totalFollowUpsCompleted: reports.reduce(
        (sum, r) => sum + r.followUpsCompletedCount,
        0
      ),
      totalTasksCompleted: reports.reduce(
        (sum, r) => sum + r.tasksCompletedCount,
        0
      ),
      activeAgents: reports.length,
      totalAgents: agents.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        teamReports,
        teamTotals,
      },
    });
  } catch (error) {
    console.error("Team daily report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors du chargement du rapport d'équipe" },
      },
      { status: 500 }
    );
  }
}
