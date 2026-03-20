"use client";

import {
  MapPin,
  Bed,
  Bath,
  Ruler,
  Building2,
  LucideIcon,
  Check,
  Sofa,
  Car,
  Zap,
  Trees,
  Waves,
  Hash,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AddToWishlistButton from "@/components/AddToWishlistButton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatPrice, formatPriceAlgeria } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Mail, User, ExternalLink } from "lucide-react";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface ListingInfoProps {
  listing: Listing;
  isStaff?: boolean;
}

export default function ListingInfo({
  listing,
  isStaff = false,
}: ListingInfoProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <Badge>{listing.status}</Badge>
          {/* Wishlist */}
          <AddToWishlistButton product={listing} light />
        </div>
        <p className="text-muted-foreground mb-1">Code reference</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hash className="w-4 h-4 inline-block mr-2 text-primary" />
          <Badge className="text-3xl font-bold" variant={"outline"}>
            {listing.referenceCode}
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-2">{listing.title}</p>
        <div className="flex items-center gap-2 text-muted-foreground mt-2">
          <MapPin className="w-4 h-4" />
          {listing.location.city}
        </div>
      </div>
      {isStaff && (
        <Card>
          <CardHeader className="font-bold flex flex-row items-center justify-between">
            <span>Contact client</span>
            {listing.sellerClient?._id && (
              <Button asChild variant="outline">
                <Link href={`/dashboard/clients/${listing.sellerClient._id}`}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Voir fiche
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {(listing.sellerClient?.firstName ||
              listing.sellerClient?.lastName) && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {[
                    listing.sellerClient.firstName,
                    listing.sellerClient.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </div>
            )}
            {listing.sellerClient?.phone ? (
              <a
                href={`https://wa.me/${listing.sellerClient.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2 text-sm"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                {listing.sellerClient.phone}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                Téléphone non spécifié
              </p>
            )}
            {listing.sellerClient?.email && (
              <a
                href={`mailto:${listing.sellerClient.email}`}
                className="text-primary hover:underline flex items-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {listing.sellerClient.email}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price */}
      <div className="text-3xl font-bold text-primary">
        {formatPriceAlgeria(listing.price)}
        <p className="text-muted-foreground text-sm">
          {formatPrice(listing.price)}
        </p>
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
          <Stat icon={Building2} label="Étage" value={listing.features.etage} />
        )}
        {listing.features.nombreEtages !== undefined && (
          <Stat
            icon={Building2}
            label="Hauteur"
            value={`R+${listing.features.nombreEtages}`}
          />
        )}
      </div>

      {/* Description */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Description</h2>
        <div className="text-sm text-muted-foreground space-y-1 leading-relaxed">
          {listing.description.split("\n").map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;

            // Key : Value lines — bold the key
            const colonIdx = line.indexOf(" : ");
            if (colonIdx !== -1) {
              const key = line.slice(0, colonIdx);
              const value = line.slice(colonIdx + 3);
              return (
                <p key={i}>
                  <span className="font-medium text-foreground">{key}</span>
                  {" : "}
                  {value}
                </p>
              );
            }

            // First line (bold header)
            if (i === 0) {
              return (
                <p key={i} className="font-semibold text-foreground text-base">
                  {line}
                </p>
              );
            }

            return <p key={i}>{line}</p>;
          })}
        </div>
      </section>

      {listing.location.coordinates && (
        <section>
          <h2 className="font-semibold text-lg mb-4">Localisation</h2>
          <LocationMap coordinates={listing.location.coordinates} />
        </section>
      )}

      {/* Amenities */}
      <section>
        <h2 className="font-semibold text-lg mb-4">Équipements & Commodités</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {listing.features.furnished && (
            <AmenityBadge icon={Sofa} label="Équipé" />
          )}
          {listing.features.parking && (
            <AmenityBadge icon={Car} label="Parking" />
          )}
          {listing.features.elevator && (
            <AmenityBadge icon={Zap} label="Ascenseur" />
          )}
          {listing.features.garden && (
            <AmenityBadge icon={Trees} label="Jardin" />
          )}
          {listing.features.pool && (
            <AmenityBadge icon={Waves} label="Piscine" />
          )}
          {listing.features.balcony && (
            <AmenityBadge icon={Check} label="Balcon" />
          )}
        </div>
        {!Object.values(listing.features).some(
          (v) => v === true || (typeof v === "number" && v > 0)
        ) && (
          <p className="text-muted-foreground text-sm">
            Pas d&apos;équipements supplémentaires spécifiés
          </p>
        )}
      </section>

      {/* Evaluation - Only visible to authenticated users */}
      {isStaff && listing.evaluation?.finalScore !== undefined && (
        <section>
          <h2 className="font-semibold text-lg mb-4">Évaluation</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">
                {listing.evaluation.finalScore}/10
              </div>
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{
                      width: `${(listing.evaluation.finalScore / 10) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note de qualité globale basée sur l&apos;état du bien, son
                  prix, et son potentiel de vente/location.
                </p>
              </div>
            </div>

            {listing.evaluation.priceQualityOpinion && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Rapport Qualité/Prix
                </p>
                <p className="text-sm">
                  {listing.evaluation.priceQualityOpinion}
                </p>
              </div>
            )}

            {listing.evaluation.idealBuyerType && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  Profil Idéal
                </p>
                <p className="text-sm">{listing.evaluation.idealBuyerType}</p>
              </div>
            )}

            {listing.evaluation.positives &&
              listing.evaluation.positives.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-xs text-green-700 dark:text-green-300 font-semibold mb-2">
                    Points Positifs
                  </p>
                  <ul className="space-y-1">
                    {listing.evaluation.positives.map((point, i) => (
                      <li
                        key={i}
                        className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2"
                      >
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {listing.evaluation.negatives &&
              listing.evaluation.negatives.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                  <p className="text-xs text-red-700 dark:text-red-300 font-semibold mb-2">
                    Points à Améliorer
                  </p>
                  <ul className="space-y-1">
                    {listing.evaluation.negatives.map((point, i) => (
                      <li
                        key={i}
                        className="text-sm text-red-700 dark:text-red-300"
                      >
                        • {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </section>
      )}
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

function AmenityBadge({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted transition">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
