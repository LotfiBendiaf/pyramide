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
  visitsScheduledCount: number;
  visitsCompletedCount: number;
  negotiationsOpenedCount: number;
  dealsClosedCount: number;
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
  totalVisitsScheduled: number;
  totalVisitsCompleted: number;
  totalNegotiationsOpened: number;
  totalDealsClosed: number;
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

const EMPTY_REPORT: AgentReport = {
  _id: null,
  newClientsCount: 0,
  propertiesVisitedCount: 0,
  followUpsCompletedCount: 0,
  tasksCompletedCount: 0,
  visitsScheduledCount: 0,
  visitsCompletedCount: 0,
  negotiationsOpenedCount: 0,
  dealsClosedCount: 0,
  notes: "",
};

export async function getTeamReport(date?: Date): Promise<TeamReportResponse> {
  try {
    await dbConnect();

    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [agents, reports] = await Promise.all([
      User.find({ role: { $in: ["AGENT", "MANAGER", "ADMIN"] } })
        .select("name email profileImage role")
        .lean(),
      DailyReport.find({ date: { $gte: startOfDay, $lte: endOfDay } })
        .populate("agent", "name email profileImage role")
        .lean(),
    ]);

    const reportMap = new Map(
      reports.map((r) => [r.agent._id.toString(), r])
    );

    const teamReports: TeamMemberReport[] = agents.map((agent) => {
      const r = reportMap.get(String(agent._id));

      return {
        agent: {
          _id: String(agent._id),
          name: agent.name,
          email: agent.email,
          profileImage: agent.profileImage,
          role: agent.role,
        },
        report: r
          ? {
              _id: String(r._id),
              newClientsCount: r.newClientsCount ?? 0,
              propertiesVisitedCount: r.propertiesVisitedCount ?? 0,
              followUpsCompletedCount: r.followUpsCompletedCount ?? 0,
              tasksCompletedCount: r.tasksCompletedCount ?? 0,
              visitsScheduledCount: r.visitsScheduledCount ?? 0,
              visitsCompletedCount: r.visitsCompletedCount ?? 0,
              negotiationsOpenedCount: r.negotiationsOpenedCount ?? 0,
              dealsClosedCount: r.dealsClosedCount ?? 0,
              notes: r.notes,
            }
          : { ...EMPTY_REPORT },
      };
    });

    const teamTotals: TeamTotals = {
      totalNewClients: reports.reduce((s, r) => s + (r.newClientsCount ?? 0), 0),
      totalPropertiesVisited: reports.reduce((s, r) => s + (r.propertiesVisitedCount ?? 0), 0),
      totalFollowUpsCompleted: reports.reduce((s, r) => s + (r.followUpsCompletedCount ?? 0), 0),
      totalTasksCompleted: reports.reduce((s, r) => s + (r.tasksCompletedCount ?? 0), 0),
      totalVisitsScheduled: reports.reduce((s, r) => s + (r.visitsScheduledCount ?? 0), 0),
      totalVisitsCompleted: reports.reduce((s, r) => s + (r.visitsCompletedCount ?? 0), 0),
      totalNegotiationsOpened: reports.reduce((s, r) => s + (r.negotiationsOpenedCount ?? 0), 0),
      totalDealsClosed: reports.reduce((s, r) => s + (r.dealsClosedCount ?? 0), 0),
      activeAgents: reports.length,
      totalAgents: agents.length,
    };

    return {
      success: true,
      data: { date: targetDate, teamReports, teamTotals },
    };
  } catch (error) {
    console.error("Team daily report error:", error);
    return {
      success: false,
      error: { message: "Erreur lors du chargement du rapport d'équipe" },
    };
  }
}
