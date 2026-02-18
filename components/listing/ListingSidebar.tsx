import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPriceAlgeria } from "@/lib/utils";

const WHATSAPP_NUMBER = "213770823300";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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

  const ref = listing.referenceCode || "";
  const city = listing.location?.city || "";

  const visitMsg = encodeURIComponent(
    `Bonjour, je souhaite demander une visite pour le bien ${ref} situé à ${city}.`
  );
  const infoMsg = encodeURIComponent(
    `Bonjour, j'aimerais avoir plus d'informations sur le bien ${ref} situé à ${city}.`
  );

  const waVisit = `https://wa.me/${WHATSAPP_NUMBER}?text=${visitMsg}`;
  const waCall = `https://wa.me/${WHATSAPP_NUMBER}`;
  const waMessage = `https://wa.me/${WHATSAPP_NUMBER}?text=${infoMsg}`;

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

          <a href={waVisit} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full">
              <CalendarDays className="w-4 h-4 mr-2" />
              Demander une visite
            </Button>
          </a>

          <a href={waCall} target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full">
              <WhatsAppIcon className="w-4 h-4 mr-2" />
              Appeler l&apos;agence
            </Button>
          </a>

          <a href={waMessage} target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Envoyer un message
            </Button>
          </a>
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
