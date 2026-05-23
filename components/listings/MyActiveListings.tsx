"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  CalendarCheck,
  CalendarPlus,
  User,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingPipelineBadge } from "@/components/pipeline/PipelineBadges";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import ROUTES from "@/constants/routes";
import type { ActiveListingWithVisits } from "@/lib/actions/listings.action";

interface Props {
  listings: ActiveListingWithVisits[];
}

export function MyActiveListings({ listings }: Props) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        Aucun bien actif avec des visites planifiées.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const listingOption = {
          value: listing._id,
          label: listing.title ?? "Sans titre",
          searchableText: `${listing.referenceCode ?? ""} ${
            listing.title ?? ""
          }`,
          metadata: listing.referenceCode,
        };

        return (
          <Card key={listing._id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Listing header */}
              <div className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
                <Link
                  href={ROUTES.LISTING_DETAIL_DASHBOARD(listing._id)}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {listing.referenceCode && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {listing.referenceCode}
                        </Badge>
                      )}
                      <span className="font-semibold text-sm truncate">
                        {listing.title ?? "Sans titre"}
                      </span>
                    </div>
                    {listing.location?.city && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {listing.location.city}
                        {listing.propertyType && ` · ${listing.propertyType}`}
                      </p>
                    )}
                    {listing.blockedUntil &&
                      new Date(listing.blockedUntil) > new Date() && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Bloqué jusqu&apos;au{" "}
                          {format(
                            new Date(listing.blockedUntil),
                            "dd MMM yyyy HH:mm",
                            { locale: fr }
                          )}
                        </p>
                      )}
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {listing.pipelineStatus && (
                    <ListingPipelineBadge status={listing.pipelineStatus} />
                  )}
                  <Link
                    href={ROUTES.LISTING_DETAIL_DASHBOARD(listing._id)}
                    aria-label="Voir le bien"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* Upcoming visits */}
              {listing.visits.length > 0 && (
                <div className="border-t divide-y">
                  {listing.visits.map((visit) => {
                    const clientName = visit.client
                      ? [visit.client.firstName, visit.client.lastName]
                          .filter(Boolean)
                          .join(" ") || visit.client.phone
                      : "Client inconnu";
                    const clientOption = visit.client
                      ? {
                          value: visit.client._id,
                          label: clientName,
                          searchableText: `${visit.client.referenceCode} ${
                            visit.client.firstName ?? ""
                          } ${visit.client.lastName ?? ""} ${
                            visit.client.phone
                          }`,
                          metadata: visit.client.referenceCode,
                          description:
                            clientName !== visit.client.phone
                              ? visit.client.phone
                              : undefined,
                        }
                      : undefined;

                    return (
                      <div
                        key={visit._id}
                        className="flex items-center gap-3 px-4 py-2.5 bg-muted/10"
                      >
                        <CalendarCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground w-32 shrink-0">
                          {format(
                            new Date(visit.scheduledAt),
                            "dd MMM yyyy HH:mm",
                            {
                              locale: fr,
                            }
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {visit.client ? (
                            <Link
                              href={ROUTES.CLIENT_DETAIL(visit.client._id)}
                              className="text-xs hover:underline truncate"
                            >
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] mr-1"
                              >
                                {visit.client.referenceCode}
                              </Badge>
                              {clientName}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
                        {visit.client && (
                          <div className="ml-auto shrink-0">
                            <ScheduleVisitDialog
                              prefilledClientId={visit.client._id}
                              prefilledListingId={listing._id}
                              prefilledClientOption={clientOption}
                              prefilledListingOption={listingOption}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                                  Add visit
                                </Button>
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {listing.visits.length === 0 && (
                <div className="border-t px-4 py-2 flex items-center justify-between">
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    Aucune visite planifiée
                  </div>
                  <ScheduleVisitDialog
                    prefilledListingId={listing._id}
                    prefilledListingOption={listingOption}
                    trigger={
                      <Button variant="outline" size="sm">
                        <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                        Ajouter une visite
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
