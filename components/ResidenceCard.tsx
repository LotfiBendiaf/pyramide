"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Building2, CalendarDays } from "lucide-react";
import { Badge } from "./ui/badge";
import ROUTES from "@/constants/routes";
import { RESIDENCE_COMPLETION_STATUSES } from "@/constants/values";
import { formatDate, formatPriceAlgeria } from "@/lib/utils";

export default function ResidenceCard({ residence }: { residence: Residence }) {
  const { title, images, coverImage, location, priceFrom, totalUnits, completionStatus, deliveryDate } =
    residence;

  const displayImage = coverImage || images?.find((img) => img.isPublic)?.url || images?.[0]?.url;
  const completionConfig = RESIDENCE_COMPLETION_STATUSES.find(
    (s) => s.value === completionStatus
  );

  return (
    <Link
      href={ROUTES.RESIDENCE_DETAIL(residence.slug)}
      className="relative group rounded-xl overflow-hidden shadow-md bg-background border hover:shadow-xl transition-all duration-300 block"
    >
      <div className="inset-0 absolute z-10 bg-gradient-to-b from-transparent via-transparent to-black" />
      <div className="w-full aspect-6/9">
        <Image
          src={displayImage || "/placeholder.png"}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {completionConfig && (
          <Badge variant={completionConfig.color} className="absolute top-3 left-3">
            {completionConfig.label}
          </Badge>
        )}
      </div>

      <div className="absolute bottom-3 left-5 right-5 space-y-2 z-20 text-white">
        <Badge variant="default">
          {priceFrom ? `À partir de ${formatPriceAlgeria(priceFrom)}` : "Prix sur demande"}
        </Badge>
        <h3 className="font-serif text-lg text-white mb-1">{title}</h3>
        <div className="flex items-center text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {location.city}
        </div>

        <div className="flex items-center gap-4 text-sm mb-3">
          {totalUnits !== undefined && (
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" /> {totalUnits} unité{totalUnits > 1 ? "s" : ""}
            </div>
          )}
          {deliveryDate && (
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" /> {formatDate(deliveryDate)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
