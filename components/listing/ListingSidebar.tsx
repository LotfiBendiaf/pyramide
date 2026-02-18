import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPriceAlgeria } from "@/lib/utils";

export default function ListingSidebar({
  listing,
  isStaff,
}: {
  listing: Listing;
  isStaff?: boolean;
}) {
  const agentName = listing.agent
    ? `${listing.agent.firstname} ${listing.agent.lastname}`
    : "Non spécifié";
  /* Price and Actions */
  return (
    <aside className="sticky top-24 space-y-6">
      {!isStaff && (
        <div className="rounded-2xl border p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            {formatPriceAlgeria(listing.price)}
          </h3>
          <p className="text-muted-foreground text-sm">
            {formatPrice(listing.price)}
          </p>

          <Button className="w-full">Demander une visite</Button>

          <Button variant="outline" className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Appeler l’agence
          </Button>

          <Button variant="outline" className="w-full">
            <Mail className="w-4 h-4 mr-2" />
            Envoyer un message
          </Button>
        </div>
      )}
      <div className="rounded-2xl border p-6 space-y-4">
        <h4 className="font-semibold mb-4">Agent</h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nom</p>
            <p className="font-medium">{agentName}</p>
          </div>
          {listing.agent?.phone && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
              <a
                href={`tel:${listing.agent.phone}`}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <Phone className="w-3 h-3" />
                {listing.agent.phone}
              </a>
            </div>
          )}
          {listing.agent?.email && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <a
                href={`mailto:${listing.agent.email}`}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <Mail className="w-3 h-3" />
                {listing.agent.email}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Location & Details */}
      <div className="rounded-2xl border p-6 space-y-4">
        <h4 className="font-semibold mb-4">Détails</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Localisation</p>
              <p className="font-medium">
                {listing.location.address && `${listing.location.address}, `}
                {listing.location.city}
              </p>
            </div>
          </div>
          {listing.referenceCode && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{listing.referenceCode}</Badge>
            </div>
          )}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Statut</p>
            <Badge>{listing.status}</Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
