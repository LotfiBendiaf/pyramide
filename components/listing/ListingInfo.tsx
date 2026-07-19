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
  CalendarDays,
  ExternalLink,
  Mail,
  User,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AddToWishlistButton from "@/components/AddToWishlistButton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatDate, formatPrice, formatPriceAlgeria } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import PhoneActionLink from "@/components/PhoneActionLink";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

interface ListingInfoProps {
  listing: Listing;
  isStaff?: boolean;
}

export default function ListingInfo({
  listing,
  isStaff = false,
}: ListingInfoProps) {
  const agentName = listing.agent
    ? [listing.agent.firstname, listing.agent.lastname].filter(Boolean).join(" ")
    : "";
  const agentInitials =
    agentName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AG";

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
              <div className="text-sm">
                <PhoneActionLink phone={listing.sellerClient.phone} />
              </div>
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

      {isStaff && (
        <Card>
          <CardHeader className="font-bold">Annonce ajoutée par</CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-10">
                <AvatarFallback>{agentInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {agentName || "Agent non spécifié"}
                </p>
                {listing.createdAt && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    Ajoutée le {formatDate(listing.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {(listing.agent?.phone || listing.agent?.email) && (
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {listing.agent.phone && (
                  <PhoneActionLink phone={listing.agent.phone} />
                )}
                {listing.agent.email && (
                  <a
                    href={`mailto:${listing.agent.email}`}
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    {listing.agent.email}
                  </a>
                )}
              </div>
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
