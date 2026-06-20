"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BadgeDollarSign,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import ROUTES from "@/constants/routes";
import { cn, formatPriceAlgeria } from "@/lib/utils";

interface SectionCardsProps {
  stats: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalGainedAmount: number;
    monthlyGainedAmount: number;
    soldListings: number;
    totalListings: number;
    listingsThisMonth: number;
    listingsLastMonth: number;
    totalClients: number;
    qualifiedClients: number;
    totalBuyerRenterClients: number;
    qualifiedBuyerRenterThisMonth: number;
    buyerRenterClientsThisMonth: number;
    clientsThisMonth: number;
    clientsLastMonth: number;
  };
}

type KpiVariant = "blue" | "green" | "amber" | "violet";

function ExecutiveKpiCard({
  title,
  value,
  badge,
  badgePositive = true,
  badgeIcon: BadgeIcon,
  icon: Icon,
  variant,
  footerLead,
  footerMuted,
  href,
}: {
  title: string;
  value: string;
  badge: string;
  badgePositive?: boolean;
  badgeIcon: LucideIcon;
  icon: LucideIcon;
  variant: KpiVariant;
  footerLead: ReactNode;
  footerMuted: string;
  href?: string;
}) {
  const styles: Record<
    KpiVariant,
    { card: string; icon: string; rail: string }
  > = {
    blue: {
      card:
        "border-sky-200/80 bg-sky-50/35 dark:border-sky-500/25 dark:bg-sky-950/20",
      icon: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
      rail: "bg-sky-500 dark:bg-sky-400",
    },
    green: {
      card:
        "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-950/20",
      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      rail: "bg-emerald-500 dark:bg-emerald-400",
    },
    amber: {
      card:
        "border-amber-200/80 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-950/20",
      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      rail: "bg-amber-500 dark:bg-amber-400",
    },
    violet: {
      card:
        "border-violet-200/80 bg-violet-50/30 dark:border-violet-500/25 dark:bg-violet-950/20",
      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
      rail: "bg-violet-500 dark:bg-violet-400",
    },
  };

  const card = (
    <Card className={cn("relative overflow-hidden py-5", styles[variant].card)}>
      <div className={cn("absolute inset-y-0 left-0 w-1", styles[variant].rail)} />
      <CardHeader className="gap-3 pl-7">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-2.5", styles[variant].icon)}>
            <Icon className="size-5" />
          </div>
          <CardDescription className="font-medium">{title}</CardDescription>
        </div>
        <CardTitle className="text-2xl font-semibold leading-tight tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-background bg-background/80 shadow-sm dark:border-white/10 dark:bg-white/5",
              badgePositive
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-muted-foreground"
            )}
          >
            <BadgeIcon className="size-3.5" />
            {badge}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 pl-7 text-sm">
        <div
          className={cn(
            "line-clamp-1 flex items-center gap-2 font-medium",
            badgePositive
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-muted-foreground"
          )}
        >
          {footerLead}
        </div>
        <div className="text-muted-foreground">{footerMuted}</div>
      </CardFooter>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      className="block rounded-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-y-0.5"
    >
      {card}
    </Link>
  );
}

export function SectionCards({ stats }: SectionCardsProps) {
  // Calculate conversion rate (qualified clients / total clients)
  const conversionRate =
    stats.totalBuyerRenterClients > 0
      ? ((stats.qualifiedClients / stats.totalBuyerRenterClients) * 100).toFixed(1)
      : "0.0";

  // Previous conversion rate: subtract this month's additions to approximate last month's rate
  const prevQualified = stats.qualifiedClients - stats.qualifiedBuyerRenterThisMonth;
  const prevTotal = stats.totalBuyerRenterClients - stats.buyerRenterClientsThisMonth;
  const previousConversionRate =
    prevTotal > 0 ? ((prevQualified / prevTotal) * 100).toFixed(1) : "0.0";

  const conversionChange = (
    parseFloat(conversionRate) - parseFloat(previousConversionRate)
  ).toFixed(1);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <ExecutiveKpiCard
        title="Valeur des transactions"
        value={`${formatPriceAlgeria(stats.totalRevenue)} DA`}
        href={ROUTES.SOLD_LISTINGS_DASHBOARD}
        badge={`${stats.soldListings} ventes`}
        badgeIcon={stats.monthlyRevenue > 0 ? TrendingUp : Minus}
        icon={BadgeDollarSign}
        variant="blue"
        badgePositive={stats.monthlyRevenue > 0}
        footerLead={
          stats.monthlyRevenue > 0 ? (
            <>
              {formatPriceAlgeria(stats.monthlyRevenue)} DA ce mois
              <TrendingUp className="size-4" />
            </>
          ) : (
            "Aucune transaction ce mois"
          )
        }
        footerMuted="Montant des ventes et locations finalisées."
      />

      <ExecutiveKpiCard
        title="Gain agence"
        value={`${formatPriceAlgeria(stats.totalGainedAmount)} DA`}
        href={ROUTES.DEAL_DONE_NEGOTIATIONS}
        badge={`${formatPriceAlgeria(stats.monthlyGainedAmount)} DA`}
        badgeIcon={stats.monthlyGainedAmount > 0 ? TrendingUp : Minus}
        icon={Wallet}
        variant="green"
        badgePositive={stats.monthlyGainedAmount > 0}
        footerLead={
          stats.monthlyGainedAmount > 0 ? (
            <>
              Commissions encaissées ce mois
              <TrendingUp className="size-4" />
            </>
          ) : (
            "Aucune commission ce mois"
          )
        }
        footerMuted="Calculé depuis les commissions des négociations conclues."
      />

      <ExecutiveKpiCard
        title="Qualification client"
        value={`${conversionRate}%`}
        badge={`${parseFloat(conversionChange) >= 0 ? "+" : ""}${conversionChange}%`}
        badgeIcon={parseFloat(conversionChange) >= 0 ? TrendingUp : TrendingDown}
        icon={Target}
        variant="violet"
        badgePositive={parseFloat(conversionChange) >= 0}
        footerLead={
          parseFloat(conversionChange) >= 0 ? (
            <>
              Performance soutenue <TrendingUp className="size-4" />
            </>
          ) : (
            <>
              Performance en baisse <TrendingDown className="size-4" />
            </>
          )
        }
        footerMuted={`${stats.qualifiedClients} qualifiés sur ${stats.totalBuyerRenterClients} acheteurs/locataires évalués.`}
      />
    </div>
  );
}
