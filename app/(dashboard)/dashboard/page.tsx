import { Suspense } from "react";
import { DashboardStatsCards } from "@/components/dashboard/StatsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AgentPerformance } from "@/components/dashboard/AgentPerformance";
import { AgentDashboard } from "@/components/dashboard/AgentDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { hasPermission } from "@/lib/roleCheck";
import { Chart } from "@/components/dashboard/ChartAreaInteractive";
import { SectionCards } from "@/components/dashboard/CardsSection";

async function getDashboardData() {
  const user = await getUserBySessionEmail();
  const isAuthorized = hasPermission(user.data?.role || "", "view_dashboard");

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Accès non autorisé
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vous n&apos;avez pas les permissions nécessaires pour accéder au
            tableau de bord
          </p>
        </div>
      </div>
    );
  }

  const role = user.data?.role || "";
  const userId = user.data?._id || "";
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/dashboard/stats?role=${role}&userId=${userId}`,
    {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!res.ok) {
    throw new Error("Échec du chargement des statistiques");
  }

  const data = await res.json();
  return { ...data, role, userName: user.data?.firstname };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const response = await getDashboardData();

  if (!response.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Erreur de chargement
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Impossible de charger les statistiques du tableau de bord
          </p>
        </div>
      </div>
    );
  }

  const {
    stats,
    agentStats,
    todayEvents,
    agentPerformance,
    recentActivities,
    role,
    userName,
  } = response.data
    ? { ...response.data, role: response.role, userName: response.userName }
    : response;

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  // Show personalized dashboard for agents and assistants
  if (!isAdmin) {
    return (
      <AgentDashboard
        userName={userName || ""}
        stats={
          agentStats || {
            myClients: 0,
            myListings: 0,
            myFollowUps: 0,
            completedToday: 0,
            pendingToday: 0,
          }
        }
        todayEvents={todayEvents || []}
        recentActivities={(recentActivities || []).map(
          (activity: {
            type: string;
            title: string;
            description: string;
            timestamp: string;
          }) => ({
            id: activity.type + activity.timestamp,
            action: activity.title,
            target: activity.description,
            createdAt: activity.timestamp,
          })
        )}
      />
    );
  }

  // Admin/Manager dashboard
  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        title="Tableau de Bord"
        subtitle="Vue d'ensemble de votre activité immobilière"
      />

      {/* Global KPI cards — admin/manager only */}
      <SectionCards stats={stats} />

      <hr className="border-muted-foreground" />

      {/* Stats Cards — scoped by role via API */}
      <DashboardStatsCards stats={stats} />

      {/* Interactive chart — global (hardcoded demo data) */}
      <Chart />

      {/* Activity feed + Agent performance */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>
        <div className="lg:col-span-1">
          <AgentPerformance agents={agentPerformance} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
