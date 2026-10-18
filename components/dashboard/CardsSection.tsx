"use client";

import Link from "next/link";
import { Building2, CircleDollarSign, Clock3, Wallet, type LucideIcon } from "lucide-react";
import ROUTES from "@/constants/routes";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPriceAlgeria } from "@/lib/utils";

interface SectionCardsProps {
  stats: {
    totalRevenue: number; monthlyRevenue: number; totalGainedAmount: number;
    monthlyGainedAmount: number; activeListings: number; totalListings: number;
    overdueFollowUps: number; pendingFollowUps: number;
  };
}

type MetricCardProps = {
  label: string; value: string; detail: string; icon: LucideIcon; href?: string;
  tone?: "brand" | "success" | "warning" | "neutral";
};

const tones = {
  brand: "bg-primary text-primary-foreground",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  neutral: "bg-third text-primary dark:bg-muted dark:text-foreground",
};

function MetricCard({ label, value, detail, icon: Icon, href, tone = "neutral" }: MetricCardProps) {
  const content = (
    <Card className="h-full rounded-xl border-border/70 bg-card py-0 shadow-[0_1px_2px_rgba(51,34,18,0.04)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-[0_10px_30px_rgba(51,34,18,0.08)]">
      <CardContent className="flex h-full min-h-40 flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="size-5" />
          </span>
        </div>
        <div className="mt-7">
          <p className="break-words text-2xl font-semibold tracking-[-0.035em] tabular-nums xl:text-[1.7rem]">{value}</p>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : <div className="group h-full">{content}</div>;
}

export function SectionCards({ stats }: SectionCardsProps) {
  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Valeur des transactions" value={`${formatPriceAlgeria(stats.totalRevenue)} DA`} detail={`${formatPriceAlgeria(stats.monthlyRevenue)} DA réalisés ce mois`} icon={CircleDollarSign} href={ROUTES.SOLD_LISTINGS_DASHBOARD} tone="brand" />
      <MetricCard label="Commissions agence" value={`${formatPriceAlgeria(stats.totalGainedAmount)} DA`} detail={`${formatPriceAlgeria(stats.monthlyGainedAmount)} DA encaissés ce mois`} icon={Wallet} href={ROUTES.DEAL_DONE_NEGOTIATIONS} tone="success" />
      <MetricCard label="Biens actifs" value={stats.activeListings.toLocaleString("fr-FR")} detail={`${stats.totalListings.toLocaleString("fr-FR")} biens dans le portefeuille`} icon={Building2} href={ROUTES.LISTINGS_DASHBOARD} />
      <MetricCard label="Suivis en retard" value={stats.overdueFollowUps.toLocaleString("fr-FR")} detail={`${stats.pendingFollowUps.toLocaleString("fr-FR")} suivis restent à traiter`} icon={Clock3} href={ROUTES.FOLLOWUPS} tone={stats.overdueFollowUps > 0 ? "warning" : "neutral"} />
    </div>
  );
}
