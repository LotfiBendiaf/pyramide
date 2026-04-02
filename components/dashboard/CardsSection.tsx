"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatPriceAlgeria } from "@/lib/utils";

interface SectionCardsProps {
  stats: {
    totalRevenue: number;
    monthlyRevenue: number;
    soldListings: number;
    totalListings: number;
    listingsThisMonth: number;
    listingsLastMonth: number;
    totalClients: number;
    qualifiedClients: number;
    totalBuyerRenterClients: number;
    clientsThisMonth: number;
    clientsLastMonth: number;
  };
}

export function SectionCards({ stats }: SectionCardsProps) {
  // Calculate percentage changes
  const listingsChange =
    stats.listingsLastMonth > 0
      ? Math.round(
          ((stats.listingsThisMonth - stats.listingsLastMonth) /
            stats.listingsLastMonth) *
            100
        )
      : stats.listingsThisMonth > 0
        ? 100
        : 0;

  // Calculate conversion rate (qualified clients / total clients)
  const conversionRate =
    stats.totalBuyerRenterClients > 0
      ? ((stats.qualifiedClients / stats.totalBuyerRenterClients) * 100).toFixed(1)
      : "0.0";

  // Previous conversion rate approximation for comparison
  const previousConversionRate =
    stats.totalClients - stats.clientsThisMonth > 0
      ? (
          ((stats.qualifiedClients - Math.floor(stats.clientsThisMonth * 0.1)) /
            (stats.totalClients - stats.clientsThisMonth)) *
          100
        ).toFixed(1)
      : "0.0";

  const conversionChange = (
    parseFloat(conversionRate) - parseFloat(previousConversionRate)
  ).toFixed(1);

  // Format revenue
  const formattedRevenue = formatPriceAlgeria(stats.totalRevenue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 1. Valeur Totale des Transactions (Total Revenue) */}
      <Card>
        <CardHeader>
          <CardDescription>
            Valeur Totale des Transactions (YTD)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {formattedRevenue} DA
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                stats.monthlyRevenue > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {stats.monthlyRevenue > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
              {stats.soldListings} ventes
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div
            className={`line-clamp-1 flex gap-2 font-medium ${stats.monthlyRevenue > 0 ? "text-green-600" : "text-muted-foreground"}`}
          >
            {stats.monthlyRevenue > 0 ? (
              <>
                {formatPriceAlgeria(stats.monthlyRevenue)} DA ce mois
                <TrendingUp className="size-4" />
              </>
            ) : (
              "Aucune transaction ce mois"
            )}
          </div>
          <div className="text-muted-foreground">
            Montant total des ventes et locations finalisées.
          </div>
        </CardFooter>
      </Card>

      {/* 2. Nouveaux Mandats Signés */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Nouveaux Mandats ce Mois</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.listingsThisMonth}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                listingsChange >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {listingsChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {listingsChange >= 0 ? "+" : ""}
              {listingsChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div
            className={`line-clamp-1 flex gap-2 font-medium ${listingsChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {listingsChange >= 0 ? (
              <>
                Progression des acquisitions <TrendingUp className="size-4" />
              </>
            ) : (
              <>
                Baisse des acquisitions <TrendingDown className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {stats.totalListings} propriétés au total en portefeuille.
          </div>
        </CardFooter>
      </Card>

      {/* 3. Taux de Conversion Client */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Taux de Qualification Client</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {conversionRate}%
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                parseFloat(conversionChange) >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {parseFloat(conversionChange) >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {parseFloat(conversionChange) >= 0 ? "+" : ""}
              {conversionChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div
            className={`line-clamp-1 flex gap-2 font-medium ${parseFloat(conversionChange) >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {parseFloat(conversionChange) >= 0 ? (
              <>
                Performance soutenue <TrendingUp className="size-4" />
              </>
            ) : (
              <>
                Performance en baisse <TrendingDown className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {stats.qualifiedClients} qualifiés sur {stats.totalBuyerRenterClients}{" "}
            acheteurs/locataires évalués.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
