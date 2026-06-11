"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateClientAssignedAgent } from "@/lib/actions/client.action";
import { Badge } from "./ui/badge";
import { UserRound } from "lucide-react";

const UNASSIGNED_VALUE = "__none__";

type Props = {
  clientId: string;
  agents: User[];
  value?: string | null;
};

export default function ClientAgentSelect({ clientId, agents, value }: Props) {
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

    toast.success("Agent mis à jour");
  };

  const currentValue = value || UNASSIGNED_VALUE;
  const selectedAgent = agents.find((agent) => agent._id === currentValue);
  const selectedAgentName = selectedAgent
    ? `${selectedAgent.firstname} ${selectedAgent.lastname}`
    : null;

  return (
    <div className="flex items-center justify-center space-x-2 gap-3 w-full">
      <Badge
        className="gap-1.5"
        variant={currentValue === UNASSIGNED_VALUE ? "destructive" : "outline"}
      >
        {selectedAgent && <UserRound className="size-3" aria-hidden="true" />}
        {currentValue === UNASSIGNED_VALUE
          ? "Non assigné"
          : selectedAgentName || "Inconnu"}
      </Badge>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className=" h-8">
          {/* <SelectValue placeholder="Non assigné" /> */}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED_VALUE}>Non assigné</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent._id} value={agent._id}>
              <UserRound className="size-4" aria-hidden="true" />
              {agent.firstname} {agent.lastname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
