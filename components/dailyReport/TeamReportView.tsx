"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  CheckCircle2,
  MapPin,
  User,
  LucideIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface TeamReportData {
  date: Date | string;
  teamReports: Array<{
    agent: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
      role: string;
    };
    report: {
      _id: string | null;
      newClientsCount: number;
      propertiesVisitedCount: number;
      followUpsCompletedCount: number;
      tasksCompletedCount: number;
      notes?: string;
    };
  }>;
  teamTotals: {
    totalNewClients: number;
    totalPropertiesVisited: number;
    totalFollowUpsCompleted: number;
    totalTasksCompleted: number;
    activeAgents: number;
    totalAgents: number;
  };
}

interface TeamReportViewProps {
  data: TeamReportData;
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "info" | "warning";
  subtitle?: string;
}) {
  const variantStyles = {
    default: "border-border bg-card",
    success: "border-green-200 bg-green-50/50",
    info: "border-blue-200 bg-blue-50/50",
    warning: "border-orange-200 bg-orange-50/50",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    info: "bg-blue-500/10 text-blue-600",
    warning: "bg-orange-500/10 text-orange-600",
  };

  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-4xl font-bold tracking-tight">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-full p-3", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentReportCard({
  agentReport,
}: {
  agentReport: TeamReportData["teamReports"][0];
}) {
  const { agent, report } = agentReport;
  const totalActivity =
    report.newClientsCount +
    report.propertiesVisitedCount +
    report.followUpsCompletedCount +
    report.tasksCompletedCount;

  const hasActivity = totalActivity > 0;
  const maxActivity = 20; // Adjust based on your needs
  const activityPercentage = Math.min((totalActivity / maxActivity) * 100, 100);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
    AGENT: "bg-green-100 text-green-700 border-green-200",
    ASSISTANT: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all",
        !hasActivity && "opacity-60"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
            <AvatarImage src={agent.profileImage} />
            <AvatarFallback className="text-sm font-semibold bg-primary/10">
              {agent.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name & Role */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h4 className="font-semibold truncate text-base">
                  {agent.name}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${
                    roleColors[agent.role] || "bg-gray-100"
                  }`}
                >
                  {agent.role}
                </Badge>
              </div>
              {!hasActivity && (
                <Badge variant="secondary" className="text-xs">
                  Pas d&apos;activité
                </Badge>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {report.newClientsCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase">
                  Clients
                </p>
              </div>

              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {report.propertiesVisitedCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase">
                  Visites
                </p>
              </div>

              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {report.followUpsCompletedCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase">
                  Suivis
                </p>
              </div>

              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {report.tasksCompletedCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase">
                  Tâches
                </p>
              </div>
            </div>

            {/* Activity Progress */}
            {hasActivity && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Activité du jour
                  </span>
                  <span className="font-medium">
                    {Math.round(activityPercentage)}%
                  </span>
                </div>
                <Progress value={activityPercentage} className="h-2" />
              </div>
            )}

            {/* Notes Preview */}
            {report.notes && (
              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                <p className="text-muted-foreground line-clamp-2">
                  {report.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamReportView({ data }: TeamReportViewProps) {
  const { date, teamReports, teamTotals } = data;

  // Sort agents by total activity
  const sortedReports = [...teamReports].sort((a, b) => {
    const totalA =
      a.report.newClientsCount +
      a.report.propertiesVisitedCount +
      a.report.followUpsCompletedCount +
      a.report.tasksCompletedCount;
    const totalB =
      b.report.newClientsCount +
      b.report.propertiesVisitedCount +
      b.report.followUpsCompletedCount +
      b.report.tasksCompletedCount;
    return totalB - totalA;
  });

  return (
    <div className="space-y-6">
      {/* Date Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{formatDate(date)}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Activité globale de l&apos;équipe
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Agents actifs</p>
              <p className="text-2xl font-bold">
                {teamTotals.activeAgents} / {teamTotals.totalAgents}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Totals Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Nouveaux Clients"
          value={teamTotals.totalNewClients}
          icon={Users}
          variant="success"
          subtitle="Ajoutés aujourd'hui"
        />
        <StatCard
          title="Total Propriétés Visitées"
          value={teamTotals.totalPropertiesVisited}
          icon={MapPin}
          variant="info"
          subtitle="Visites effectuées"
        />
        <StatCard
          title="Total Suivis Complétés"
          value={teamTotals.totalFollowUpsCompleted}
          icon={Calendar}
          variant="warning"
          subtitle="Suivi client"
        />
        <StatCard
          title="Total Tâches Complétées"
          value={teamTotals.totalTasksCompleted}
          icon={CheckCircle2}
          variant="default"
          subtitle="Tâches terminées"
        />
      </div>

      {/* Individual Agent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports Individuels</CardTitle>
          <p className="text-sm text-muted-foreground">
            Activité détaillée de chaque membre de l&apos;équipe
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedReports.length > 0 ? (
              sortedReports.map((agentReport) => (
                <AgentReportCard
                  key={agentReport.agent._id}
                  agentReport={agentReport}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Aucun rapport disponible
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
