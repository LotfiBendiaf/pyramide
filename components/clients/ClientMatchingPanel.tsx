import Link from "next/link";
import { BedDouble, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ROUTES from "@/constants/routes";
import { matchClientToListings, MatchedListing } from "@/lib/actions/matching.action";
import { formatPriceAlgeria } from "@/lib/utils";

interface Props {
  client: Client;
}

export default async function ClientMatchingPanel({ client }: Props) {
  if (client.type !== "BUYER" && client.type !== "RENTER") return null;

  const result = await matchClientToListings(client._id);
  const listings: MatchedListing[] = result.success ? (result.data ?? []) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Annonces correspondantes
          {listings.length > 0 && (
            <Badge variant="secondary">{listings.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune annonce ne correspond aux critères de ce client pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                href={ROUTES.LISTING_DETAIL_DASHBOARD(listing._id)}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ScoreBadge score={listing.matchScore} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        {listing.referenceCode}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {listing.propertyType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.location.city}
                      </span>
                      {listing.features.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3 h-3" />
                          {listing.features.bedrooms} ch.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-4 gap-0.5">
                  <span className="text-sm font-medium">
                    {formatPriceAlgeria(listing.price)} DA
                  </span>
                  {listing.overBudget && (
                    <span className="text-xs text-amber-600 font-medium">
                      +10% budget
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? "bg-green-100 text-green-800"
      : score >= 6
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${color}`}
    >
      {score}
    </span>
  );
}
