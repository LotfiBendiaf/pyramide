"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
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
    default: "border-border",
    success: "border-green-200",
    warning: "border-orange-200 bg-orange-50/50",
    danger: "border-red-200 bg-red-50/50",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-orange-500/10 text-orange-600",
    danger: "bg-red-500/10 text-red-600",
  };

  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
              {change !== undefined && (
                <span
                  className={cn(
                    "text-sm font-medium flex items-center gap-1",
                    trend === "up" && "text-green-600",
                    trend === "down" && "text-red-600",
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
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("rounded-full p-3", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          variant === "default" &&
            "bg-gradient-to-r from-primary/50 to-primary",
          variant === "success" &&
            "bg-gradient-to-r from-green-500/50 to-green-500",
          variant === "warning" &&
            "bg-gradient-to-r from-orange-500/50 to-orange-500",
          variant === "danger" && "bg-gradient-to-r from-red-500/50 to-red-500"
        )}
      />
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
    completedFollowUpsThisMonth: number;
    listingsChange?: number;
    clientsChange?: number;
  };
}

export function DashboardStatsCards({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        value={formatPrice(stats.monthlyRevenue, "fr-DZ", "DZD").replace(
          /\s?DZD/,
          " DA"
        )}
        icon={DollarSign}
        trend="up"
        description={`${stats.soldListings} ventes réalisées`}
        variant="success"
      />

      {/* Qualified Clients */}
      <StatCard
        title="Clients Qualifiés"
        value={stats.qualifiedClients}
        icon={CheckCircle2}
        description="Prêts à acheter"
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
        title="Revenu Total"
        value={formatPrice(stats.totalRevenue, "fr-DZ", "DZD").replace(
          /\s?DZD/,
          " DA"
        )}
        icon={DollarSign}
        description="Tous les temps"
        variant="default"
      />
    </div>
  );
}
