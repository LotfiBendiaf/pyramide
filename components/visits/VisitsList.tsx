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
import { format, isToday, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PopulatedVisit } from "@/types/visit";

interface Props {
  visits: PopulatedVisit[];
  showAgent?: boolean;
  showClient?: boolean;
}

function isOverdue(visit: PopulatedVisit) {
  const date = new Date(visit.scheduledAt);
  return visit.status === "SCHEDULED" && isPast(date) && !isToday(date);
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
      <div className="space-y-3 p-3 md:hidden">
        {visits.map((visit) => {
          const scheduledDate = new Date(visit.scheduledAt);
          const overdue = isOverdue(visit);
          return (
          <article key={visit._id} className={cn("rounded-xl border bg-card p-3 shadow-sm", overdue && "border-destructive/40 bg-destructive/5")}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold capitalize">{format(scheduledDate, "EEE dd MMM", { locale: fr })}</p>
                  {isToday(scheduledDate) && <Badge className="text-[10px]">Aujourd&apos;hui</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{format(scheduledDate, "HH:mm", { locale: fr })}</p>
                {overdue && <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" />En retard</p>}
              </div>
              <div className="flex flex-wrap justify-end gap-1"><VisitStatusBadge status={visit.status} />{visit.outcome && <VisitOutcomeBadge outcome={visit.outcome} />}</div>
            </div>
            <div className="mt-3 space-y-2 border-y py-3 text-sm">
              {visit.isExternalListing ? <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="italic text-muted-foreground">{visit.externalListingRef ?? "Bien externe"}</span></div> : visit.listing ? <Link href={ROUTES.LISTING_DETAIL_DASHBOARD(visit.listing._id)} className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="truncate">{visit.listing.referenceCode ? `${visit.listing.referenceCode} · ` : ""}{visit.listing.title ?? "Bien"}</span></Link> : null}
              {showClient && visit.client && <Link href={ROUTES.CLIENT_DETAIL(visit.client._id)} className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="truncate">{[visit.client.firstName, visit.client.lastName].filter(Boolean).join(" ") || visit.client.phone}</span></Link>}
              {showAgent && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" />{visit.agent ? `${visit.agent.firstname} ${visit.agent.lastname}` : "Agent non assigné"}</div>}
            </div>
            {(visit.status === "SCHEDULED" || visit.status === "COMPLETED") && <div className="mt-3 flex flex-wrap justify-end gap-1">{visit.status === "SCHEDULED" && <CompleteVisitDialog visitId={visit._id} />}<CancelVisitDialog visitId={visit._id} />{visit.status === "SCHEDULED" && <NoShowButton visitId={visit._id} />}</div>}
          </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
          {visits.map((visit) => {
            const scheduledDate = new Date(visit.scheduledAt);
            const overdue = isOverdue(visit);
            return (
            <TableRow key={visit._id} className={cn(overdue && "bg-destructive/5")}>
              <TableCell className="whitespace-nowrap text-sm">
                <div className="flex items-center gap-1.5">
                  {format(scheduledDate, "dd MMM yyyy HH:mm", {
                    locale: fr,
                  })}
                  {isToday(scheduledDate) && <Badge className="text-[10px]">Aujourd&apos;hui</Badge>}
                </div>
                {overdue && <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" />En retard</p>}
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
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
