"use client";

import Image from "next/image";
import { MapPin, Bed, Bath, Home, Building2 } from "lucide-react";
import { formatPrice, formatPriceAlgeria } from "@/lib/utils";
import { Badge } from "./ui/badge";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import AddToWishlistButton from "./AddToWishlistButton";

export default function ListingCard({ listing }: { listing: Listing }) {
  const { title, images, price, location, status, features } = listing;

  // Get the first public image, or first image if all are private
  const displayImage = images?.find((img) => img.isPublic) || images?.[0];

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-md bg-background border hover:shadow-xl transition-all duration-300">
      <div className="absolute right-1 top-1 z-50">
        <AddToWishlistButton product={listing} />
      </div>
      <Link href={ROUTES.LISTING_DETAIL(listing._id)}>
        <div className="inset-0 absolute z-10 bg-gradient-to-b from-transparent to-black"></div>
        {/* Image */}
        <div className=" w-full aspect-6/9">
          <Image
            src={displayImage?.url || "/placeholder.png"}
            alt={title || "Property image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge variant={"secondary"} className="absolute top-3 left-3">
            {status}
          </Badge>
        </div>

        {/* Content */}
        <div className=" absolute bottom-3 left-5 space-y-2 z-20 text-white">
          {/* Title + Location */}
          <Badge variant={"default"}>{formatPriceAlgeria(price)}</Badge>
          <p className="text-muted text-xs">{formatPrice(price)}</p>
          <h3 className="font-serif text-lg text-white mb-1">{title}</h3>
          <div className="flex items-center text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            {location.city}
          </div>

          {/* Features */}
          <div className="flex justify-between items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" /> {features.bedrooms}
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" /> {features.bathrooms}
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" /> {features.facade}
            </div>
            <div className="flex items-center gap-1">
              <Home className="w-4 h-4" /> {features.area} m²
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
