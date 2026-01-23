import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";

export default function ListingSidebar({ listing }: { listing: Listing }) {
  return (
    <aside className="sticky top-24 space-y-6">
      <div className="rounded-2xl border p-6 space-y-4">
        <h3 className="text-xl font-semibold">
          {listing.price.toLocaleString()} DZD
        </h3>

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

      {/* Agent */}
      <div className="rounded-2xl border p-6">
        <p className="text-sm text-muted-foreground mb-1">Agent</p>
        <p className="font-semibold">{listing.agent?.name}</p>
      </div>
    </aside>
  );
}
