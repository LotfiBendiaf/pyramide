"use client";

import { useEffect, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateListingAgent } from "@/lib/actions/listings.action";

type Props = {
  listingId: string;
  agents: User[];
  value?: string;
};

export default function ListingAgentSelect({ listingId, agents, value }: Props) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => setCurrentValue(value), [value]);

  const handleChange = async (agentId: string) => {
    const previousValue = currentValue;
    setCurrentValue(agentId);
    setIsPending(true);

    const result = await updateListingAgent(listingId, agentId);

    if (!result.success) {
      setCurrentValue(previousValue);
      toast.error("Affectation impossible", {
        description: result.error?.message as string,
      });
    } else {
      toast.success("Bien affecté à l’agent");
    }

    setIsPending(false);
  };

  const selectedAgent = agents.find((agent) => agent._id === currentValue);
  const selectedName = selectedAgent
    ? `${selectedAgent.firstname} ${selectedAgent.lastname}`.trim()
    : "Choisir un agent";

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={isPending || agents.length === 0}
    >
      <SelectTrigger className="h-8 w-[180px] text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          {isPending ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
          ) : (
            <UserRound className="size-3.5 shrink-0" />
          )}
          <span className="truncate">{selectedName}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent._id} value={agent._id}>
            {agent.firstname} {agent.lastname}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
