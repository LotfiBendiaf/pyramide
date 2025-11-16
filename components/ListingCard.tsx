"use client";

import Image from "next/image";
import { Heart, MapPin, Bed, Bath, Home } from "lucide-react";

interface ListingCardProps {
  title: string;
  location: string;
  price: string;
  status: string;
  image: string;
  beds: number;
  baths: number;
  area: number;
}

export default function ListingCard({
  title,
  location,
  price,
  status,
  image,
  beds,
  baths,
  area,
}: ListingCardProps) {
  return (
    <div className="group rounded-2xl overflow-hidden shadow-md bg-white border hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative w-full h-52">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 bg-primary text-white text-xs px-2 py-1 rounded-full">
          {status}
        </span>
        <Heart className="absolute top-3 right-3 w-6 h-6 text-white bg-white/30 p-1 rounded-full hover:bg-white hover:text-primary transition" />
        <span className="absolute bottom-3 right-3 bg-white text-gray-800 text-xs px-2 py-1 rounded-lg shadow">
          {price}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title + Location */}
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {location}
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {beds} Chambres
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {baths} Salles de bain
          </div>
          <div className="flex items-center gap-1">
            <Home className="w-4 h-4" /> {area} m²
          </div>
        </div>

        {/* CTA */}
        <button className="w-full py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition">
          Voir les détails
        </button>
      </div>
    </div>
  );
}
