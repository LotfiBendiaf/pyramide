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

  return (
    <div className="flex items-center justify-center space-x-2 gap-3 w-full">
      <Badge
        variant={currentValue === UNASSIGNED_VALUE ? "destructive" : "outline"}
      >
        {currentValue === UNASSIGNED_VALUE
          ? "Non assigné"
          : agents.find((a) => a._id === currentValue)
            ? `${agents.find((a) => a._id === currentValue)?.firstname} ${
                agents.find((a) => a._id === currentValue)?.lastname
              }`
            : "Inconnu"}
      </Badge>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className=" h-8">
          {/* <SelectValue placeholder="Non assigné" /> */}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED_VALUE}>Non assigné</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent._id} value={agent._id}>
              {agent.firstname} {agent.lastname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
