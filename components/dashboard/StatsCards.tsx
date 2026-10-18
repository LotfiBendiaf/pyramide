"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarCheck2, CircleCheck, UserRoundCheck, Users } from "lucide-react";
import ROUTES from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  stats: {
    totalListings: number; activeListings: number; soldListings: number;
    totalClients: number; newClients: number; qualifiedClients: number;
    pendingFollowUps: number; overdueFollowUps: number; todayFollowUps: number;
    completedFollowUpsThisMonth: number;
  };
}

export function DashboardStatsCards({ stats }: DashboardStatsProps) {
  const metrics = [
    { label: "Nouveaux clients", value: stats.newClients, helper: "ce mois", icon: Users },
    { label: "Clients qualifiés", value: stats.qualifiedClients, helper: `sur ${stats.totalClients} clients`, icon: UserRoundCheck },
    { label: "Suivis aujourd’hui", value: stats.todayFollowUps, helper: `${stats.pendingFollowUps} en attente`, icon: CalendarCheck2 },
    { label: "Suivis complétés", value: stats.completedFollowUpsThisMonth, helper: "ce mois", icon: CircleCheck },
    { label: "Biens vendus", value: stats.soldListings, helper: `sur ${stats.totalListings} biens`, icon: Building2 },
    { label: "Biens disponibles", value: stats.activeListings, helper: "actuellement actifs", icon: Building2 },
  ];

  return (
    <Card className="rounded-xl border-border/70 py-0 shadow-[0_1px_2px_rgba(51,34,18,0.04)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
        <div>
          <CardTitle className="text-base font-semibold">Vue opérationnelle</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Les volumes essentiels au quotidien.</p>
        </div>
        <Link href={ROUTES.FOLLOWUPS} className="hidden items-center gap-1 text-xs font-semibold text-primary hover:underline sm:flex">
          Voir <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid sm:grid-cols-2 xl:grid-cols-1">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={cn(
                "flex min-h-24 items-center gap-4 border-border/60 px-5 py-4 sm:px-6",
                index < metrics.length - 1 && "border-b",
                index >= 4 && "sm:border-b-0",
                index === 4 && "xl:border-b",
                index % 2 === 0 && "sm:border-r xl:border-r-0"
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-third text-primary dark:bg-muted dark:text-foreground"><metric.icon className="size-4.5" /></span>
              <div className="min-w-0">
                <p className="text-xl font-semibold tracking-tight tabular-nums">{metric.value.toLocaleString("fr-FR")}</p>
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="text-xs text-muted-foreground">{metric.helper}</p>
              </div>
            </div>
          ))}
        </div>
        {stats.overdueFollowUps > 0 && (
          <div className="border-t border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-900 sm:px-6 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">
            <strong>{stats.overdueFollowUps} suivi{stats.overdueFollowUps > 1 ? "s" : ""}</strong> nécessite{stats.overdueFollowUps > 1 ? "nt" : ""} votre attention.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
