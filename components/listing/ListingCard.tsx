"use client";

import Image from "next/image";
import { Heart, MapPin, Bed, Bath, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

export default function ListingCard({ listing }: { listing: Listing }) {
  const { title, images, price, location, status, features, isFeatured } =
    listing;

  const formattedPrice = formatPrice(price);

  console.log(formattedPrice);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-background shadow-sm transition-all",
        "hover:-translate-y-1 hover:shadow-xl"
      )}
    >
      {/* Image */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={images?.[0] || "/immo-placeholder.jpg"}
          alt={title || "Image du bien"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Status badge */}
        <span
          className={cn(
            "absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur",
            status === "En Vente" ? "bg-emerald-600" : "bg-blue-600"
          )}
        >
          {status}
        </span>

        {/* Featured */}
        {isFeatured && (
          <span className="absolute top-4 right-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white">
            Premium
          </span>
        )}

        {/* Favorite */}
        <button
          className="absolute bottom-4 right-4 rounded-full bg-white/80 p-2 text-gray-700 backdrop-blur transition hover:bg-white hover:text-red-500"
          aria-label="Ajouter aux favoris"
        >
          <Heart size={18} />
        </button>

        {/* Price */}
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-lg font-bold leading-tight">{formattedPrice}</p>
          {status === "En Location" && (
            <span className="text-xs opacity-90">/ mois</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={14} />
          <span>
            {location.city}
            {location.district && `, ${location.district}`}
          </span>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {features?.bedrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bed size={16} /> {features.bedrooms}
            </div>
          )}
          {features?.bathrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bath size={16} /> {features.bathrooms}
            </div>
          )}
          {features?.area !== undefined && (
            <div className="flex items-center gap-1">
              <Home size={16} /> {features.area} m²
            </div>
          )}
        </div>

        {/* CTA */}
        <Button variant="outline" className="w-full rounded-xl">
          Voir les détails
        </Button>
      </div>
    </article>
  );
}
