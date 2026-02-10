"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { CLIENT_QUALIFICATIONS } from "@/constants/values";

type ClientsFilterProps = {
  agents?: User[];
  canFilterByAgent?: boolean;
};

export default function ClientsFilter({
  agents = [],
  canFilterByAgent = false,
}: ClientsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [agentId, setAgentId] = useState(searchParams.get("agentId") ?? "");
  const [qualification, setQualification] = useState(
    searchParams.get("qualification") ?? ""
  );
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const hasActiveFilters = !!agentId || !!qualification || !!type || !!search;

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    if (agentId) params.set("agentId", agentId);
    if (qualification) params.set("qualification", qualification);
    if (type) params.set("type", type);
    if (search) params.set("search", search);

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleClearFilters = () => {
    setAgentId("");
    setQualification("");
    setType("");
    setSearch("");

    startTransition(() => {
      router.push(window.location.pathname, { scroll: false });
    });
  };

  return (
    <div className="bg-background border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="pl-9"
            />
          </div>
        </div>

        {/* Agent filter (admin/manager only) */}
        {canFilterByAgent && agents.length > 0 && (
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="w-[200px]">
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
        )}

        {/* Type filter */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type de client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les types</SelectItem>
            <SelectItem value="BUYER">Acheteur</SelectItem>
            <SelectItem value="SELLER">Vendeur</SelectItem>
            <SelectItem value="RENTER">Loueur</SelectItem>
            <SelectItem value="INVESTOR">Investisseur</SelectItem>
          </SelectContent>
        </Select>

        {/* Qualification filter */}
        <Select value={qualification} onValueChange={setQualification}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Qualification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes</SelectItem>
            {CLIENT_QUALIFICATIONS.map((q) => (
              <SelectItem key={q.value} value={q.value}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Apply button */}
        <Button onClick={handleApplyFilters} disabled={isPending}>
          Filtrer
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
