"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { Building2, Users, Calendar, TrendingUp, ArrowUpRight, AlertTriangle } from "lucide-react";

interface AgentPerformance {
  agent: {
    _id: string;
    name: string;
    profileImage?: string;
    role: string;
  };
  listingsCount: number;
  activeListingsCount: number;
  clientsCount: number;
  qualifiedClientsCount: number;
  followUpsCount: number;
  overdueFollowUpsCount: number;
  salesCount: number;
}

interface AgentPerformanceProps {
  agents: AgentPerformance[];
}

function AgentCard({ data }: { data: AgentPerformance }) {
  const qualificationRate = data.clientsCount
    ? Math.round((data.qualifiedClientsCount / data.clientsCount) * 100)
    : 0;
  const conversionRate = data.listingsCount
    ? Math.round((data.salesCount / data.listingsCount) * 100)
    : 0;

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
    AGENT: "bg-green-100 text-green-700 border-green-200",
    ASSISTANT: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
            <AvatarImage src={data.agent.profileImage} />
            <AvatarFallback className="text-sm font-semibold bg-primary/10">
              {data.agent.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name & Role */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h4 className="font-semibold truncate text-base">
                  {data.agent.name}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${
                    roleColors[data.agent.role] || "bg-gray-100"
                  }`}
                >
                  {data.agent.role}
                </Badge>
              </div>
              {data.salesCount > 0 && (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">
                    {data.salesCount} vente{data.salesCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Agent portfolio */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {data.listingsCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase text-center">
                  Biens
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-lg font-bold">{data.clientsCount}</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase text-center">
                  Clients
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {data.followUpsCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase text-center">
                  Suivis
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
              <div>
                <p className="text-muted-foreground">Biens actifs</p>
                <p className="mt-0.5 font-semibold">{data.activeListingsCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Clients qualifiés</p>
                <p className="mt-0.5 font-semibold">{data.qualifiedClientsCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversion biens</p>
                <p className="mt-0.5 font-semibold">{conversionRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Suivis en retard</p>
                <p className={data.overdueFollowUpsCount ? "mt-0.5 flex items-center gap-1 font-semibold text-red-600" : "mt-0.5 font-semibold"}>
                  {data.overdueFollowUpsCount > 0 && <AlertTriangle className="h-3 w-3" />}
                  {data.overdueFollowUpsCount}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Qualification clients</span>
                <span className="font-medium">
                  {qualificationRate}%
                </span>
              </div>
              <Progress value={qualificationRate} className="h-2" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`${ROUTES.LISTINGS_DASHBOARD}?agentId=${data.agent._id}`}>
                  Voir ses biens <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`${ROUTES.CLIENTS_DASHBOARD}?agentId=${data.agent._id}`}>
                  Voir ses clients <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentPerformance({ agents }: AgentPerformanceProps) {
  // Sort by sales first, then total activity
  const sortedAgents = [...agents].sort((a, b) => {
    if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
    const totalA = a.listingsCount + a.clientsCount + a.followUpsCount;
    const totalB = b.listingsCount + b.clientsCount + b.followUpsCount;
    return totalB - totalA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance des Agents</CardTitle>
        <p className="text-sm text-muted-foreground">
          Statistiques d&apos;activité de l&apos;équipe
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAgents.length > 0 ? (
            sortedAgents.map((agent) => (
              <AgentCard key={agent.agent._id} data={agent} />
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune donnée disponible
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
