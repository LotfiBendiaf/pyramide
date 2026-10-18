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
import { SectionCards } from "@/components/dashboard/CardsSection";
import { DashboardCharts } from "@/components/dashboard/Charts";
import { headers } from "next/headers";

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
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
  });

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
    charts,
    role,
    userName,
  } = response.data
    ? { ...response.data, role: response.role, userName: response.userName }
    : response;

  const isAdmin =
    role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";

  // Show personalized dashboard for agents and assistants
  if (!isAdmin) {
    return (
      <AgentDashboard
        userName={userName || ""}
        role={role}
        stats={
          agentStats || {
            myClients: 0,
            myListings: 0,
            myFollowUps: 0,
            completedToday: 0,
            pendingToday: 0,
            activeNegotiations: 0,
            closedDeals: 0,
            closedDealsThisMonth: 0,
            totalGainedAmount: 0,
            monthlyGainedAmount: 0,
          }
        }
        todayEvents={todayEvents || []}
        recentActivities={(recentActivities || []).map(
          (activity: {
            type: string;
            title: string;
            description: string;
            timestamp: string;
            entityId?: string;
          }) => ({
            id: activity.type + activity.timestamp,
            action: activity.title,
            target: activity.description,
            createdAt: activity.timestamp,
            href: activity.entityId
              ? activity.type === "listing" || activity.type === "sale"
                ? `/dashboard/listings/${activity.entityId}`
                : `/dashboard/clients/${activity.entityId}`
              : undefined,
          })
        )}
      />
    );
  }

  // Admin/Manager dashboard
  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title="Vue d’ensemble"
          subtitle="Les chiffres qui comptent, les actions qui demandent votre attention."
        />
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Activité de l’agence
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">En un coup d’œil</h2>
          <p className="mt-1 text-sm text-muted-foreground">Performance commerciale et priorités actuelles.</p>
        </div>
        <SectionCards stats={stats} />
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardCharts data={charts} />
        </div>
        <div className="xl:col-span-4">
          <DashboardStatsCards stats={stats} />
        </div>
      </section>

      {/* Activity feed + Agent performance */}
      <section className="grid items-start gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RecentActivity activities={recentActivities} />
        </div>
        <div className="xl:col-span-5">
          <AgentPerformance agents={agentPerformance} />
        </div>
      </section>
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
