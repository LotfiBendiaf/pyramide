"use client";

import { Fragment, useEffect, useState } from "react";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateListingAgent } from "@/lib/actions/listings.action";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  agents: User[];
  value?: string;
};

const ROLE_GROUPS = [
  {
    role: "AGENT",
    label: "Agents",
    icon: UserRound,
    iconClassName: "text-green-600",
    triggerClassName: "border-green-200 bg-green-50 text-green-700",
    selectedClassName:
      "bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800",
  },
  {
    role: "ADMIN",
    label: "Agence",
    icon: ShieldCheck,
    iconClassName: "text-purple-600",
    triggerClassName: "border-purple-200 bg-purple-50 text-purple-700",
    selectedClassName:
      "bg-purple-50 text-purple-700 focus:bg-purple-100 focus:text-purple-800",
  },
] as const;

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
      toast.success("Bien affecté avec succès");
    }

    setIsPending(false);
  };

  const selectedAgent = agents.find((agent) => agent._id === currentValue);
  const selectedRole = ROLE_GROUPS.find(
    (group) => group.role === selectedAgent?.role
  );
  const SelectedIcon = selectedRole?.icon ?? UserRound;
  const selectedName = selectedAgent
    ? `${selectedAgent.firstname} ${selectedAgent.lastname}`.trim()
    : "Choisir un responsable";
  const visibleRoleGroups = ROLE_GROUPS.map((group) => ({
    ...group,
    members: agents.filter((agent) => agent.role === group.role),
  })).filter((group) => group.members.length > 0);

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={isPending || agents.length === 0}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-[190px] justify-between rounded-md px-2.5 text-xs font-medium hover:bg-muted/70",
          selectedRole?.triggerClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {isPending ? (
            <Loader2
              className="size-3.5 shrink-0 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <SelectedIcon
              className={cn(
                "size-3.5 shrink-0",
                selectedRole?.iconClassName
              )}
              aria-hidden="true"
            />
          )}
          <span className="truncate">{selectedName}</span>
        </span>
      </SelectTrigger>
      <SelectContent className="min-w-[220px]">
        {visibleRoleGroups.map((group, index) => {
          const GroupIcon = group.icon;

          return (
            <Fragment key={group.role}>
              {index > 0 && <div className="my-1 h-px bg-border" />}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {group.label}
              </div>
              {group.members.map((agent) => (
                <SelectItem
                  key={agent._id}
                  value={agent._id}
                  className={cn(
                    agent._id === currentValue && group.selectedClassName
                  )}
                >
                  <span className="flex items-center gap-2">
                    <GroupIcon
                      className={cn("size-3.5", group.iconClassName)}
                      aria-hidden="true"
                    />
                    <span>
                      {agent.firstname} {agent.lastname}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </Fragment>
          );
        })}
      </SelectContent>
    </Select>
  );
}
