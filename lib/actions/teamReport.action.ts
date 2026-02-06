"use server";

import dbConnect from "@/lib/mongoose";
import { DailyReport, User } from "@/models";

interface AgentInfo {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
}

interface AgentReport {
  _id: string | null;
  newClientsCount: number;
  propertiesVisitedCount: number;
  followUpsCompletedCount: number;
  tasksCompletedCount: number;
  notes?: string;
}

interface TeamMemberReport {
  agent: AgentInfo;
  report: AgentReport;
}

interface TeamTotals {
  totalNewClients: number;
  totalPropertiesVisited: number;
  totalFollowUpsCompleted: number;
  totalTasksCompleted: number;
  activeAgents: number;
  totalAgents: number;
}

interface TeamReportData {
  date: Date;
  teamReports: TeamMemberReport[];
  teamTotals: TeamTotals;
}

interface TeamReportResponse {
  success: boolean;
  data?: TeamReportData;
  error?: { message: string };
}

export async function getTeamReport(date?: Date): Promise<TeamReportResponse> {
  try {
    await dbConnect();

    // Set date range for today if no date specified
    const targetDate = date || new Date();
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
      const agentIdStr = String(agent._id);
      const report = reportMap.get(agentIdStr);

      return {
        agent: {
          _id: agentIdStr,
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
              _id: String(report._id),
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

    return {
      success: true,
      data: {
        date: targetDate,
        teamReports,
        teamTotals,
      },
    };
  } catch (error) {
    console.error("Team daily report error:", error);
    return {
      success: false,
      error: { message: "Erreur lors du chargement du rapport d'équipe" },
    };
  }
}
