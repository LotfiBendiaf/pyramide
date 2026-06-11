"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VisitStatusBadge, VisitOutcomeBadge } from "@/components/pipeline/PipelineBadges";
import {
  CompleteVisitDialog,
  CancelVisitDialog,
  NoShowButton,
} from "./VisitActionDialogs";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, User } from "lucide-react";
import type { PopulatedVisit } from "@/types/visit";

interface Props {
  visits: PopulatedVisit[];
  showAgent?: boolean;
  showClient?: boolean;
}

export function VisitsList({ visits, showAgent = false, showClient = true }: Props) {
  if (visits.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        Aucune visite trouvée.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Bien</TableHead>
            {showClient && <TableHead>Client</TableHead>}
            {showAgent && <TableHead>Agent</TableHead>}
            <TableHead>Statut</TableHead>
            <TableHead>Résultat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit._id}>
              <TableCell className="whitespace-nowrap text-sm">
                {format(new Date(visit.scheduledAt), "dd MMM yyyy HH:mm", {
                  locale: fr,
                })}
              </TableCell>
              <TableCell>
                {visit.isExternalListing ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground italic">
                      {visit.externalListingRef ?? "Externe"}
                    </span>
                  </div>
                ) : visit.listing ? (
                  <Link
                    href={ROUTES.LISTING_DETAIL_DASHBOARD(visit.listing._id)}
                    className="flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">
                        {visit.listing.referenceCode && (
                          <Badge variant="outline" className="mr-1 font-mono text-[10px]">
                            {visit.listing.referenceCode}
                          </Badge>
                        )}
                        {visit.listing.title ?? "—"}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              {showClient && (
                <TableCell>
                  {visit.client ? (
                    <Link
                      href={ROUTES.CLIENT_DETAIL(visit.client._id)}
                      className="flex items-center gap-1.5 text-sm hover:underline"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <Badge variant="outline" className="font-mono text-[10px] mr-1">
                          {visit.client.referenceCode}
                        </Badge>
                        {[visit.client.firstName, visit.client.lastName]
                          .filter(Boolean)
                          .join(" ") || visit.client.phone}
                      </div>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              )}
              {showAgent && (
                <TableCell className="text-sm text-muted-foreground">
                  {visit.agent
                    ? `${visit.agent.firstname} ${visit.agent.lastname}`
                    : "—"}
                </TableCell>
              )}
              <TableCell>
                <VisitStatusBadge status={visit.status} />
              </TableCell>
              <TableCell>
                {visit.outcome ? (
                  <VisitOutcomeBadge outcome={visit.outcome} />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                {(visit.status === "SCHEDULED" ||
                  visit.status === "COMPLETED") && (
                  <div className="flex justify-end gap-1">
                    {visit.status === "SCHEDULED" && (
                      <CompleteVisitDialog visitId={visit._id} />
                    )}
                    <CancelVisitDialog visitId={visit._id} />
                    {visit.status === "SCHEDULED" && (
                      <NoShowButton visitId={visit._id} />
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
