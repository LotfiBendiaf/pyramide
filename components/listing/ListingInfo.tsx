import { MapPin, Bed, Bath, Ruler, Building2, LucideIcon } from "lucide-react";
import AddToWishlistButton from "@/components/AddToWishlistButton";

export default function ListingInfo({ listing }: { listing: Listing }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="inline-block mb-2 px-3 py-1 rounded-full text-xs bg-primary text-white">
          {listing.status}
        </span>

        <h1 className="text-3xl font-bold">{listing.title}</h1>

        <div className="flex items-center gap-2 text-muted-foreground mt-2">
          <MapPin className="w-4 h-4" />
          {listing.location.city}
        </div>
      </div>

      {/* Price */}
      <div className="text-3xl font-bold text-primary">
        {listing.price.toLocaleString()} DZD
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Bed} label="Chambres" value={listing.features.bedrooms} />
        <Stat
          icon={Bath}
          label="Salles de bain"
          value={listing.features.bathrooms}
        />
        <Stat
          icon={Ruler}
          label="Surface"
          value={`${listing.features.area} m²`}
        />
        {listing.features.etage !== undefined && (
          <Stat
            icon={Building2}
            label="Étage"
            value={listing.features.etage}
          />
        )}
      </div>

      {/* Description */}
      <section>
        <h2 className="font-semibold text-lg mb-2">Description</h2>
        <p className="text-muted-foreground leading-relaxed">
          {listing.description}
        </p>
      </section>

      {/* Wishlist */}
      <AddToWishlistButton product={listing} />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
      <Icon className="w-5 h-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
