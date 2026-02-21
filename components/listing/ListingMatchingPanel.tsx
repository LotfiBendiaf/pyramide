import Link from "next/link";
import { Wallet, MapPin, BedDouble } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ROUTES from "@/constants/routes";
import { matchListingToClients, MatchedClient } from "@/lib/actions/matching.action";
import { formatPriceAlgeria } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  BUYER: "Acheteur",
  RENTER: "Loueur",
};

interface Props {
  listing: Listing;
}

export default async function ListingMatchingPanel({ listing }: Props) {
  if (listing.status !== "En Vente" && listing.status !== "En Location") {
    return null;
  }

  const result = await matchListingToClients(listing._id);
  const clients: MatchedClient[] = result.success ? (result.data ?? []) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Clients correspondants
          {clients.length > 0 && (
            <Badge variant="secondary">{clients.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun client ne correspond aux critères de cette annonce pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client._id}
                href={ROUTES.CLIENT_DETAIL(client._id)}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ScoreBadge score={client.matchScore} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {client.referenceCode}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[client.type] ?? client.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {client.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                        </span>
                      )}
                      {(client.budgetMin !== undefined ||
                        client.budgetMax !== undefined) && (
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {client.budgetMin !== undefined
                            ? formatPriceAlgeria(client.budgetMin)
                            : "—"}{" "}
                          →{" "}
                          {client.budgetMax !== undefined
                            ? formatPriceAlgeria(client.budgetMax)
                            : "—"}{" "}
                          DA
                        </span>
                      )}
                      {client.rooms !== undefined && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3 h-3" />
                          {client.rooms} ch.
                        </span>
                      )}
                    </div>
                  </div>
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
