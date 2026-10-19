"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, CalendarClock, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListingPipelineBadge } from "@/components/pipeline/PipelineBadges";
import ROUTES from "@/constants/routes";
import { getGoogleMapsUrl } from "@/lib/utils";
import type { MyApprovedListing } from "@/lib/actions/listings.action";

interface Props {
  listings: MyApprovedListing[];
}

export function MyApprovedListings({ listings }: Props) {
  const router = useRouter();

  if (listings.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
        Aucune annonce approuvée ne vous est affectée.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead>Bien</TableHead>
            <TableHead>Localisation</TableHead>
            <TableHead>État</TableHead>
            <TableHead>Visite photo</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Voir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow
              key={listing._id}
              tabIndex={0}
              role="link"
              aria-label={`Ouvrir ${listing.title ?? "le bien"}`}
              className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              onClick={() =>
                router.push(ROUTES.LISTING_DETAIL_DASHBOARD(listing._id))
              }
              onAuxClick={(event) => {
                if (event.button === 1) {
                  window.open(
                    ROUTES.LISTING_DETAIL_DASHBOARD(listing._id),
                    "_blank"
                  );
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(ROUTES.LISTING_DETAIL_DASHBOARD(listing._id));
                }
              }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="max-w-[260px] truncate text-sm font-medium">
                      {listing.title ?? "Sans titre"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[listing.referenceCode, listing.propertyType]
                        .filter(Boolean)
                        .join(" · ") || "Type non renseigné"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <a
                  href={getGoogleMapsUrl(listing.location ?? {})}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center gap-1.5 text-sm hover:text-primary hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {listing.location?.city ?? "Non renseignée"}
                </a>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="blue">Approuvée</Badge>
                  <ListingPipelineBadge status={listing.pipelineStatus} />
                </div>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  {listing.photoVisitScheduledAt
                    ? format(
                        new Date(listing.photoVisitScheduledAt),
                        "dd MMM yyyy 'à' HH:mm",
                        { locale: fr }
                      )
                    : "À planifier"}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={ROUTES.LISTING_DETAIL_DASHBOARD(listing._id)}
                  aria-label={`Voir ${listing.title ?? "le bien"}`}
                  className="inline-flex rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
