"use client";

import { Cog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { PropertyStatus } from "@/constants/values";

interface StatusActionProps {
  status: PropertyStatus;
  onChange: (status: PropertyStatus) => Promise<void> | void;
}

const STATUSES: PropertyStatus[] = [
  "En Vente",
  "En Location",
  "Vendu",
  "Loué",
  "Retiré",
];

export function StatusAction({ status, onChange }: StatusActionProps) {
  const handleChange = async (newStatus: PropertyStatus) => {
    if (newStatus === status) return;

    try {
      await onChange(newStatus);

      toast.success("Statut mis à jour", {
        description: `Le bien est maintenant "${newStatus}"`,
      });
    } catch (error) {
      toast.error("Erreur", {
        description: (error as string) || "Impossible de modifier le statut",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Modifier le statut">
          <Cog className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleChange(s)}
            className={s === status ? "font-semibold text-primary" : ""}
          >
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
