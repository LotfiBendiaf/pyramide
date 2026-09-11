"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { fetchResidenceById, updateUnitStatus } from "@/lib/actions/residence.action";
import { UNIT_STATUSES } from "@/constants/values";
import { formatPriceAlgeria } from "@/lib/utils";

interface UnitStatusManagerProps {
  residenceId: string;
  residenceTitle: string;
}

export function UnitStatusManager({
  residenceId,
  residenceTitle,
}: UnitStatusManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<ResidenceUnit[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !units) {
      setLoading(true);
      const result = await fetchResidenceById(residenceId);
      if (result.success && result.data) {
        setUnits(result.data.units ?? []);
      } else {
        toast.error(result.error?.message || "Impossible de charger les unités");
      }
      setLoading(false);
    }
  };

  const handleStatusChange = async (unitId: string, status: UnitStatus) => {
    setUpdatingId(unitId);
    const result = await updateUnitStatus({ residenceId, unitId, status });
    if (result.success) {
      setUnits((prev) =>
        prev
          ? prev.map((u) => (u._id === unitId ? { ...u, status } : u))
          : prev
      );
      toast.success("Statut de l'unité mis à jour");
    } else {
      toast.error(result.error?.message || "Erreur lors de la mise à jour");
    }
    setUpdatingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Gérer les unités
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Unités — {residenceTitle}</DialogTitle>
          <DialogDescription>
            Basculez rapidement le statut d&apos;une unité sans ouvrir le formulaire complet.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !units || units.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune unité renseignée pour cette résidence.
          </p>
        ) : (
          <div className="divide-y">
            {units.map((unit) => (
              <div
                key={unit._id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {unit.unitNumber}
                    {unit.floor !== undefined && (
                      <span className="text-muted-foreground"> · Étage {unit.floor}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {unit.typeCustom || unit.type || "Type non spécifié"}
                    {unit.price ? ` · ${formatPriceAlgeria(unit.price)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {updatingId === unit._id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  <Select
                    value={unit.status}
                    onValueChange={(value) =>
                      handleStatusChange(unit._id!, value as UnitStatus)
                    }
                    disabled={updatingId === unit._id}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <Badge variant={s.color} className="text-xs">
                            {s.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
