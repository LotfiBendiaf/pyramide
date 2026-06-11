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
import { CalendarRange, SlidersHorizontal, X } from "lucide-react";

type AgentOption = {
  _id: string;
  firstname: string;
  lastname: string;
};

type NegotiationsFilterProps = {
  agents?: AgentOption[];
  canFilterByAgent?: boolean;
};

export function NegotiationsFilter({
  agents = [],
  canFilterByAgent = false,
}: NegotiationsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [agentId, setAgentId] = useState(searchParams.get("agentId") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const hasActiveFilters =
    (!!agentId && agentId !== "__all__") ||
    !!dateFrom ||
    !!dateTo ||
    !!minPrice ||
    !!maxPrice;

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("page");

    if (agentId && agentId !== "__all__") {
      params.set("agentId", agentId);
    } else {
      params.delete("agentId");
    }

    if (dateFrom) params.set("dateFrom", dateFrom);
    else params.delete("dateFrom");

    if (dateTo) params.set("dateTo", dateTo);
    else params.delete("dateTo");

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleClearFilters = () => {
    setAgentId("");
    setDateFrom("");
    setDateTo("");
    setMinPrice("");
    setMaxPrice("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("agentId");
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("minPrice");
    params.delete("maxPrice");
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

        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Prix min"
          className="w-[140px]"
        />

        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Prix max"
          className="w-[140px]"
        />

        <Button onClick={handleApplyFilters} disabled={isPending}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
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
