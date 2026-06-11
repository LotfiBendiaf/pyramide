"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateClientAssignedAgent } from "@/lib/actions/client.action";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const UNASSIGNED_VALUE = "__none__";

type Props = {
  clientId: string;
  agents: User[];
  value?: string | null;
};

export default function ClientAgentSelect({ clientId, agents, value }: Props) {
  const [currentValue, setCurrentValue] = useState(value || UNASSIGNED_VALUE);

  useEffect(() => {
    setCurrentValue(value || UNASSIGNED_VALUE);
  }, [value]);

  const handleChange = async (newValue: string) => {
    const result = await updateClientAssignedAgent(
      clientId,
      newValue === UNASSIGNED_VALUE ? undefined : newValue
    );

    if (!result.success) {
      toast.error("Erreur", {
        description: result.error?.message as string,
      });
      return;
    }

    setCurrentValue(newValue);
    toast.success("Agent mis à jour");
  };

  const selectedAgent = agents.find((agent) => agent._id === currentValue);
  const selectedAgentName = selectedAgent
    ? `${selectedAgent.firstname} ${selectedAgent.lastname}`
    : null;

  return (
    <div className="mx-auto flex w-[170px] items-center justify-center">
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger
          className={cn(
            "h-8 w-full justify-between rounded-md px-2.5 text-xs font-medium",
            selectedAgent
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />
            <span className="truncate">
              {selectedAgentName || "Non assigné"}
            </span>
          </span>
        </SelectTrigger>
        <SelectContent className="min-w-[180px]">
          <SelectItem
            value={UNASSIGNED_VALUE}
            className={cn(
              currentValue === UNASSIGNED_VALUE &&
                "bg-red-50 text-red-700 focus:bg-red-100 focus:text-red-800"
            )}
          >
            <UserRound className="size-4" aria-hidden="true" />
            Non assigné
          </SelectItem>
          {agents.map((agent) => (
            <SelectItem
              key={agent._id}
              value={agent._id}
              className={cn(
                agent._id === currentValue &&
                  "bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800"
              )}
            >
              <UserRound className="size-4" aria-hidden="true" />
              {agent.firstname} {agent.lastname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
