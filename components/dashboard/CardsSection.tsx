import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 1. Valeur Totale des Transactions (Total Revenue) */}
      <Card>
        <CardHeader>
          <CardDescription>
            Valeur Totale des Transactions (YTD)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            250,000,000 DZD
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              <TrendingUp className="w-4 h-4" />
              +12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
            Forte croissance ce trimestre <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Montant total des ventes et locations finalisées.
          </div>
        </CardFooter>
      </Card>

      {/* 2. Nouveaux Mandats Signés (New Customers) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Nouveaux Mandats Signés</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-100 text-red-700">
              <TrendingDown className="w-4 h-4" />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-red-600">
            Baisse des acquisitions ce mois <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Nouvelles propriétés entrées en portefeuille.
          </div>
        </CardFooter>
      </Card>

      {/* 3. Annonces Actives (Active Accounts) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Annonces Actives</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            185
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              <TrendingUp className="w-4 h-4" />
              +5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
            Inventaire stable et en légère hausse{" "}
            <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Propriétés actuellement disponibles à la vente ou à la location.
          </div>
        </CardFooter>
      </Card>

      {/* 4. Taux de Conversion (Growth Rate) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Taux de Conversion Client</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            8.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              <TrendingUp className="w-4 h-4" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
            Performance soutenue et efficace <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Pourcentage de leads convertis en transactions.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
