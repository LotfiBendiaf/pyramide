"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange, Search, X } from "lucide-react";

type AgentOption = {
  _id: string;
  firstname: string;
  lastname: string;
};

type VisitsFilterProps = {
  agents?: AgentOption[];
  canFilterByAgent?: boolean;
};

export function VisitsFilter({
  agents = [],
  canFilterByAgent = false,
}: VisitsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [agentId, setAgentId] = useState(searchParams.get("agentId") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");

  const hasActiveFilters =
    !!search ||
    (!!agentId && agentId !== "__all__") ||
    !!dateFrom ||
    !!dateTo;

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (search) params.set("search", search);
    else params.delete("search");

    if (agentId && agentId !== "__all__") {
      params.set("agentId", agentId);
    } else {
      params.delete("agentId");
    }

    if (dateFrom) params.set("dateFrom", dateFrom);
    else params.delete("dateFrom");

    if (dateTo) params.set("dateTo", dateTo);
    else params.delete("dateTo");

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setAgentId("");
    setDateFrom("");
    setDateTo("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("agentId");
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `?${query}` : window.location.pathname, {
        scroll: false,
      });
    });
  };

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, bien, référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="pl-9"
            />
          </div>
        </div>

        {canFilterByAgent && agents.length > 0 && (
          <div className="w-full min-w-[180px] sm:w-[220px]">
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.firstname} {agent.lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="relative w-[150px]">
          <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="pl-9"
            aria-label="Date début"
          />
        </div>

        <div className="relative w-[150px]">
          <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="pl-9"
            aria-label="Date fin"
          />
        </div>

        <Button onClick={applyFilters} disabled={isPending}>
          Filtrer
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
