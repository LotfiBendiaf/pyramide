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

type FollowUpsFilterProps = {
  agents?: User[];
  canFilterByAgent?: boolean;
};

const TYPE_OPTIONS = [
  { value: "__all__", label: "Tous les types" },
  { value: "COLD", label: "Cold" },
  { value: "WARM", label: "Warm" },
  { value: "HOT", label: "Hot" },
  { value: "CUSTOM", label: "Custom" },
];

const STATUS_OPTIONS = [
  { value: "__all__", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "DONE", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "OVERDUE", label: "En retard" },
];

const CHANNEL_OPTIONS = [
  { value: "__all__", label: "Tous les canaux" },
  { value: "CALL", label: "Appel" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "VISIT", label: "Visite" },
];

export default function FollowUpsFilter({
  agents = [],
  canFilterByAgent = false,
}: FollowUpsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [agentId, setAgentId] = useState(searchParams.get("agentId") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [channel, setChannel] = useState(searchParams.get("channel") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const hasActiveFilters =
    !!agentId || !!type || !!status || !!channel || !!search;

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    if (agentId) params.set("agentId", agentId);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (channel) params.set("channel", channel);
    if (search) params.set("search", search);

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleClearFilters = () => {
    setAgentId("");
    setType("");
    setStatus("");
    setChannel("");
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
              placeholder="Rechercher dans les notes..."
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
            <SelectValue placeholder="Type de suivi" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Channel filter */}
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
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
