"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NegotiationStatusBadge } from "@/components/pipeline/PipelineBadges";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Lock, CalendarPlus } from "lucide-react";

export interface Negotiation {
  _id: string;
  status: string;
  createdAt: string | Date;
  closedAt?: string | Date;
  cancelledAt?: string | Date;
  rejectionReason?: string;
  listing?: {
    _id: string;
    referenceCode?: string;
    title?: string;
  };
  client?: {
    _id: string;
    referenceCode: string;
    firstName?: string;
    lastName?: string;
    phone: string;
  };
  agent?: {
    _id: string;
    firstname: string;
    lastname: string;
  };
  blockingRequests?: { status: string }[];
  closingDetails?: {
    depositAmount?: number;
    finalPrice?: number;
    commissionPercentage?: number;
    commissionAmount?: number;
  };
}

export function NegotiationsList({
  negotiations,
}: {
  negotiations: Negotiation[];
}) {
  if (negotiations.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        Aucune négociation trouvée.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[28%] px-4">Bien</TableHead>
            <TableHead className="w-[20%]">Client</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Ouverte</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Prix final</TableHead>
            <TableHead className="text-right">Gain</TableHead>
            <TableHead className="w-[92px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {negotiations.map((neg) => {
            const pendingBlocks =
              neg.blockingRequests?.filter((r) => r.status === "PENDING")
                .length ?? 0;

            const clientName = neg.client
              ? [neg.client.firstName, neg.client.lastName]
                  .filter(Boolean)
                  .join(" ") || neg.client.phone
              : "—";
            const listingOption = neg.listing
              ? {
                  value: neg.listing._id,
                  label: neg.listing.title ?? "Sans titre",
                  searchableText: `${neg.listing.referenceCode ?? ""} ${
                    neg.listing.title ?? ""
                  }`,
                  metadata: neg.listing.referenceCode,
                }
              : undefined;
            const clientOption = neg.client
              ? {
                  value: neg.client._id,
                  label: clientName,
                  searchableText: `${neg.client.referenceCode} ${
                    neg.client.firstName ?? ""
                  } ${neg.client.lastName ?? ""} ${neg.client.phone}`,
                  metadata: neg.client.referenceCode,
                  description:
                    clientName !== neg.client.phone
                      ? neg.client.phone
                      : undefined,
                }
              : undefined;

            return (
              <TableRow key={neg._id}>
                <TableCell className="max-w-[320px] px-4">
                  <Link
                    href={ROUTES.NEGOTIATION_DETAIL(neg._id)}
                    className="block min-w-0 hover:text-primary"
                  >
                    {neg.listing ? (
                      <>
                        {neg.listing.referenceCode && (
                          <Badge
                            variant="outline"
                            className="mb-1 max-w-full font-mono text-[10px]"
                          >
                            {neg.listing.referenceCode}
                          </Badge>
                        )}
                        <span className="block truncate font-medium">
                          {neg.listing.title ?? "Sans titre"}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Link>
                </TableCell>

                <TableCell className="max-w-[220px]">
                  <div className="min-w-0">
                    {neg.client ? (
                      <>
                        <Badge
                          variant="outline"
                          className="mb-1 max-w-full font-mono text-[10px]"
                        >
                          {neg.client.referenceCode}
                        </Badge>
                        <span className="block truncate text-muted-foreground">
                          {clientName}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <NegotiationStatusBadge status={neg.status} />
                    {pendingBlocks > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"
                        title={`${pendingBlocks} blocage${
                          pendingBlocks > 1 ? "s" : ""
                        } en attente`}
                      >
                        <Lock className="h-3 w-3" />
                        {pendingBlocks}
                      </span>
                    )}
                  </div>
                  {neg.status === "REJECTED" && neg.rejectionReason && (
                    <span className="mt-1 block max-w-36 truncate text-xs text-muted-foreground">
                      {neg.rejectionReason}
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {format(new Date(neg.createdAt), "dd MMM yyyy", {
                    locale: fr,
                  })}
                </TableCell>

                <TableCell className="max-w-[180px] text-muted-foreground">
                  <span className="block truncate">
                    {neg.agent
                      ? `${neg.agent.firstname} ${neg.agent.lastname}`
                      : "—"}
                  </span>
                </TableCell>

                <TableCell className="text-right font-medium">
                  {neg.closingDetails?.finalPrice
                    ? `${neg.closingDetails.finalPrice.toLocaleString(
                        "fr-DZ"
                      )} DZD`
                    : "—"}
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  {neg.closingDetails?.commissionAmount !== undefined
                    ? `${neg.closingDetails.commissionAmount.toLocaleString(
                        "fr-DZ",
                        { maximumFractionDigits: 0 }
                      )} DZD`
                    : "—"}
                </TableCell>

                <TableCell>
                  <div className="flex justify-end gap-1">
                    {neg.client && neg.listing && (
                      <ScheduleVisitDialog
                        prefilledClientId={neg.client._id}
                        prefilledListingId={neg.listing._id}
                        prefilledClientOption={clientOption}
                        prefilledListingOption={listingOption}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Planifier une visite"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                        }
                      />
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        href={ROUTES.NEGOTIATION_DETAIL(neg._id)}
                        aria-label="Voir la négociation"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
