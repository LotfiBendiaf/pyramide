"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPriceAlgeria } from "@/lib/utils";
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "danger";
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  trend = "neutral",
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "border-border bg-card",
    success:
      "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-950/20",
    warning:
      "border-amber-200 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-950/20",
    danger:
      "border-red-200 bg-red-50/40 dark:border-red-500/25 dark:bg-red-950/20",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    danger:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  };

  const accentStyles = {
    default: "bg-primary/70",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-red-500 dark:bg-red-400",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-lg py-0 shadow-sm transition-colors hover:border-primary/30 dark:shadow-none",
        variantStyles[variant]
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", accentStyles[variant])} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-2xl font-semibold leading-tight tracking-tight tabular-nums">
                {value}
              </h3>
              {change !== undefined && (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium dark:bg-white/5",
                    trend === "up" && "text-emerald-700 dark:text-emerald-300",
                    trend === "down" && "text-red-600 dark:text-red-300",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trend === "up" && <TrendingUp className="h-3 w-3" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3" />}
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className={cn("ml-3 rounded-lg p-2.5", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: {
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalClients: number;
    newClients: number;
    qualifiedClients: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
    todayFollowUps: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalGainedAmount: number;
    monthlyGainedAmount: number;
    completedFollowUpsThisMonth: number;
    listingsChange?: number;
    clientsChange?: number;
  };
}

export function DashboardStatsCards({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* Active Listings */}
      <StatCard
        title="Annonces Actives"
        value={stats.activeListings}
        icon={Building2}
        trend={
          stats.listingsChange
            ? stats.listingsChange > 0
              ? "up"
              : stats.listingsChange < 0
                ? "down"
                : "neutral"
            : "neutral"
        }
        change={stats.listingsChange}
        description={`${stats.totalListings} au total`}
        variant="default"
      />

      {/* Total Clients */}
      <StatCard
        title="Clients"
        value={stats.totalClients}
        icon={Users}
        trend={
          stats.clientsChange
            ? stats.clientsChange > 0
              ? "up"
              : stats.clientsChange < 0
                ? "down"
                : "neutral"
            : "neutral"
        }
        change={stats.clientsChange}
        description={`${stats.newClients} nouveaux ce mois`}
        variant="default"
      />

      {/* Today's Follow-ups */}
      <StatCard
        title="Suivis Aujourd'hui"
        value={stats.todayFollowUps}
        icon={Calendar}
        description={`${stats.pendingFollowUps} en attente`}
        variant="default"
      />

      {/* Monthly Revenue */}
      <StatCard
        title="Revenu du Mois"
        value={`${formatPriceAlgeria(stats.monthlyRevenue)} DA`}
        icon={DollarSign}
        trend="up"
        description={`${stats.soldListings} ventes réalisées`}
        variant="success"
      />

      {/* Monthly Gain */}
      <StatCard
        title="Gain Agence du Mois"
        value={`${formatPriceAlgeria(stats.monthlyGainedAmount)} DA`}
        icon={Wallet}
        description="Commissions des négociations conclues"
        variant="success"
      />

      {/* Qualified Clients */}
      <StatCard
        title="Clients Qualifiés"
        value={stats.qualifiedClients}
        icon={CheckCircle2}
        description="Acheteurs & locataires qualifiés"
        variant="success"
      />

      {/* Overdue Follow-ups */}
      <StatCard
        title="Suivis en Retard"
        value={stats.overdueFollowUps}
        icon={AlertCircle}
        description="Action requise"
        variant={stats.overdueFollowUps > 0 ? "danger" : "default"}
      />

      {/* Completed Follow-ups */}
      <StatCard
        title="Suivis Complétés"
        value={stats.completedFollowUpsThisMonth}
        icon={CheckCircle2}
        description="Ce mois"
        variant="success"
      />

      {/* Total Revenue */}
      <StatCard
        title="Gain Agence Total"
        value={`${formatPriceAlgeria(stats.totalGainedAmount)} DA`}
        icon={Wallet}
        description="Commissions conclues tous les temps"
        variant="default"
      />

      {/* Total Revenue */}
      <StatCard
        title="Transactions Totales"
        value={`${formatPriceAlgeria(stats.totalRevenue)} DA`}
        icon={DollarSign}
        description="Valeur des biens vendus/loués"
        variant="default"
      />
    </div>
  );
}
