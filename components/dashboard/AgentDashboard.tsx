"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CalendarDays,
  UserPlus,
  Building2,
  ClipboardList,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Handshake,
  CircleDollarSign,
  Trophy,
} from "lucide-react";
import ROUTES from "@/constants/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatPriceAlgeria } from "@/lib/utils";

interface AgentDashboardProps {
  userName: string;
  stats: {
    myClients: number;
    myListings: number;
    myFollowUps: number;
    completedToday: number;
    pendingToday: number;
    activeNegotiations?: number;
    closedDeals?: number;
    closedDealsThisMonth?: number;
    totalGainedAmount?: number;
    monthlyGainedAmount?: number;
  };
  todayEvents: Array<{
    id: string;
    title: string;
    time: string;
    type: "followup" | "task" | "visit";
    clientName?: string;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    target: string;
    createdAt: string;
  }>;
}

const QUICK_ACTIONS = [
  {
    title: "Nouveau client",
    description: "Ajouter un prospect",
    icon: UserPlus,
    href: ROUTES.CLIENT_ADD,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Nouveau bien",
    description: "Ajouter une propriété",
    icon: Building2,
    href: ROUTES.LISTING_ADD,
    color: "bg-green-500/10 text-green-600",
  },
  {
    title: "Nouveau suivi",
    description: "Planifier une action",
    icon: ClipboardList,
    href: ROUTES.NEW_FOLLOWUP,
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    title: "Générer document",
    description: "Créer un document",
    icon: FileText,
    href: ROUTES.DOCUMENTS,
    color: "bg-purple-500/10 text-purple-600",
  },
];

const EVENT_TYPE_STYLES = {
  followup: "bg-blue-100 text-blue-700 border-blue-200",
  task: "bg-amber-100 text-amber-700 border-amber-200",
  visit: "bg-green-100 text-green-700 border-green-200",
};

const EVENT_TYPE_LABELS = {
  followup: "Suivi",
  task: "Tâche",
  visit: "Visite",
};

export function AgentDashboard({
  userName,
  stats,
  todayEvents,
  recentActivities,
}: AgentDashboardProps) {
  const greeting = getGreeting();
  const today = format(new Date(), "EEEE d MMMM", { locale: fr });
  const totalCommission = stats.totalGainedAmount ?? 0;
  const monthlyCommission = stats.monthlyGainedAmount ?? 0;
  const closedDeals = stats.closedDeals ?? 0;
  const closedDealsThisMonth = stats.closedDealsThisMonth ?? 0;
  const activeNegotiations = stats.activeNegotiations ?? 0;

  const performanceCards = [
    {
      label: "Deals conclus",
      value: closedDeals.toString(),
      helper: `${closedDealsThisMonth} ce mois`,
      icon: Trophy,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    {
      label: "Commissions gagnées",
      value: `${formatPriceAlgeria(totalCommission)} DA`,
      helper: `${formatPriceAlgeria(monthlyCommission)} DA ce mois`,
      icon: CircleDollarSign,
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
    },
    {
      label: "Négociations actives",
      value: activeNegotiations.toString(),
      helper: "Dossiers en cours",
      icon: Handshake,
      className:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium capitalize">{today}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting}, {userName}!
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {todayEvents.length > 0
                ? `Vous avez ${todayEvents.length} événement${todayEvents.length > 1 ? "s" : ""} prévu${todayEvents.length > 1 ? "s" : ""} aujourd'hui.`
                : "Votre journée est libre. Profitez-en pour prospecter!"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold">{stats.completedToday}</p>
              <p className="text-xs text-muted-foreground">Terminés</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold">{stats.pendingToday}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="grid gap-4 lg:grid-cols-3">
        {performanceCards.map((metric) => (
          <Card key={metric.label} className={`border ${metric.className}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium opacity-80">
                    {metric.label}
                  </p>
                  <p className="mt-2 break-words text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs opacity-70">{metric.helper}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background/70">
                  <metric.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer border transition-all hover:border-primary/30 hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2.5 ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {action.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Planning du jour
            </CardTitle>
            <Link href={ROUTES.SCHEDULE}>
              <Button variant="ghost" size="sm" className="text-primary">
                Voir tout
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground min-w-[70px]">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{event.time}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      {event.clientName && (
                        <p className="text-xs text-muted-foreground">
                          {event.clientName}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={EVENT_TYPE_STYLES[event.type]}
                    >
                      {EVENT_TYPE_LABELS[event.type]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Aucun événement prévu aujourd&apos;hui
                </p>
                <Link href={ROUTES.NEW_FOLLOWUP}>
                  <Button variant="link" className="mt-2">
                    Planifier un suivi
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mes statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Mes clients</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {stats.myClients}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Mes biens</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats.myListings}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Suivis actifs</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {stats.myFollowUps}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30">
              <div className="flex items-center gap-3">
                <Handshake className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium">Négociations</span>
              </div>
              <span className="text-2xl font-bold text-violet-600">
                {activeNegotiations}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>{" "}
                      <span className="text-muted-foreground">
                        {activity.target}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return format(date, "d MMM", { locale: fr });
}
