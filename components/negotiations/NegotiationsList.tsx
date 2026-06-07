"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NegotiationStatusBadge } from "@/components/pipeline/PipelineBadges";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  User,
  ChevronRight,
  Lock,
  CalendarPlus,
} from "lucide-react";

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
    <div className="space-y-3">
      {negotiations.map((neg) => {
        const pendingBlocks =
          neg.blockingRequests?.filter((r) => r.status === "PENDING").length ??
          0;

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
                clientName !== neg.client.phone ? neg.client.phone : undefined,
            }
          : undefined;

        return (
          <Card
            key={neg._id}
            className="hover:shadow-md transition-shadow mb-3"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={ROUTES.NEGOTIATION_DETAIL(neg._id)}
                  className="flex-1 min-w-0 space-y-2"
                >
                  {/* Listing */}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    {neg.listing ? (
                      <span className="font-medium text-sm truncate">
                        {neg.listing.referenceCode && (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] mr-1.5"
                          >
                            {neg.listing.referenceCode}
                          </Badge>
                        )}
                        {neg.listing.title ?? "Sans titre"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    {neg.client ? (
                      <span className="text-sm text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] mr-1.5"
                        >
                          {neg.client.referenceCode}
                        </Badge>
                        {clientName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Ouverte le{" "}
                      {format(new Date(neg.createdAt), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                    {neg.agent && (
                      <span>
                        · {neg.agent.firstname} {neg.agent.lastname}
                      </span>
                    )}
                    {neg.closingDetails?.finalPrice && (
                      <span>
                        ·{" "}
                        {neg.closingDetails.finalPrice.toLocaleString("fr-DZ")}{" "}
                        DZD
                      </span>
                    )}
                    {neg.closingDetails?.commissionAmount !== undefined && (
                      <span>
                        · Gain{" "}
                        {neg.closingDetails.commissionAmount.toLocaleString(
                          "fr-DZ",
                          { maximumFractionDigits: 0 }
                        )}{" "}
                        DZD
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  {neg.client && neg.listing && (
                    <ScheduleVisitDialog
                      prefilledClientId={neg.client._id}
                      prefilledListingId={neg.listing._id}
                      prefilledClientOption={clientOption}
                      prefilledListingOption={listingOption}
                      trigger={
                        <Button variant="outline" size="sm">
                          <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />+
                          visite
                        </Button>
                      }
                    />
                  )}
                  <NegotiationStatusBadge status={neg.status} />
                  {neg.status === "REJECTED" && neg.rejectionReason && (
                    <span className="max-w-48 truncate text-xs text-muted-foreground">
                      {neg.rejectionReason}
                    </span>
                  )}
                  {pendingBlocks > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <Lock className="h-3 w-3" />
                      {pendingBlocks} blocage{pendingBlocks > 1 ? "s" : ""} en
                      attente
                    </div>
                  )}
                  <Link
                    href={ROUTES.NEGOTIATION_DETAIL(neg._id)}
                    aria-label="Voir la négociation"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
