"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UNIT_STATUSES } from "@/constants/values";
import { formatPrice, formatPriceAlgeria } from "@/lib/utils";

type StatusFilter = "ALL" | UnitStatus;

function statusBadge(status: UnitStatus) {
  const config = UNIT_STATUSES.find((s) => s.value === status);
  if (!config) return null;
  return (
    <Badge variant={config.color} className="text-xs">
      {config.label}
    </Badge>
  );
}

export default function UnitAvailabilityTable({ units }: { units: ResidenceUnit[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const sortedUnits = useMemo(
    () =>
      [...units].sort((a, b) => {
        const floorDiff = (a.floor ?? 0) - (b.floor ?? 0);
        if (floorDiff !== 0) return floorDiff;
        return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
      }),
    [units]
  );

  const filteredUnits =
    statusFilter === "ALL"
      ? sortedUnits
      : sortedUnits.filter((u) => u.status === statusFilter);

  if (units.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Le plan des unités sera bientôt disponible.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        variant="outline"
        value={statusFilter}
        onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}
        className="flex-wrap justify-start"
      >
        <ToggleGroupItem value="ALL" className="px-4">
          Tous
        </ToggleGroupItem>
        {UNIT_STATUSES.map((s) => (
          <ToggleGroupItem key={s.value} value={s.value} className="px-4">
            {s.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unité</TableHead>
              <TableHead>Étage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Surface</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.map((unit) => (
              <TableRow
                key={unit._id ?? unit.unitNumber}
                className={unit.status !== "AVAILABLE" ? "opacity-60" : undefined}
              >
                <TableCell>
                  <p className="font-medium">{unit.unitNumber}</p>
                  {unit.label && (
                    <p className="text-xs text-muted-foreground">{unit.label}</p>
                  )}
                </TableCell>
                <TableCell>{unit.floor ?? "—"}</TableCell>
                <TableCell>
                  {unit.typeCustom || unit.type || "—"}
                  {unit.bedrooms !== undefined && unit.bedrooms > 0 && ` · F${unit.bedrooms}`}
                </TableCell>
                <TableCell>{unit.area} m²</TableCell>
                <TableCell>
                  {unit.price ? (
                    <>
                      <p className="font-medium">{formatPriceAlgeria(unit.price)}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(unit.price)}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Sur demande</span>
                  )}
                </TableCell>
                <TableCell>{statusBadge(unit.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredUnits.map((unit) => (
          <div
            key={unit._id ?? unit.unitNumber}
            className={`rounded-xl border p-3 ${unit.status !== "AVAILABLE" ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{unit.unitNumber}</p>
                {unit.label && (
                  <p className="text-xs text-muted-foreground">{unit.label}</p>
                )}
              </div>
              {statusBadge(unit.status)}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>Étage : {unit.floor ?? "—"}</span>
              <span>
                Type :{" "}
                {unit.typeCustom || unit.type || "—"}
                {unit.bedrooms !== undefined && unit.bedrooms > 0 && ` (F${unit.bedrooms})`}
              </span>
              <span>Surface : {unit.area} m²</span>
              <span>
                Prix : {unit.price ? formatPriceAlgeria(unit.price) : "Sur demande"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune unité ne correspond à ce filtre.
        </p>
      )}
    </div>
  );
}
