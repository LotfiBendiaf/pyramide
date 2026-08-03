"use client";

import dynamic from "next/dynamic";
import { SectionHeader } from "../SectionHeader";
import { MapPin } from "lucide-react";
import Link from "next/link";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Pyramide+immobilier/@35.7161213,-0.5737586,17z";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse bg-muted" />
  ),
});

export default function MapSection() {
  return (
    <section
      id="map"
      className="relative border-t border-primary/[0.08] py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Retrouvez-nous"
          subtitle="Passez nous voir à Oran pour échanger directement avec notre équipe autour de votre projet."
          watermark="ADRESSE"
          buttonLabel="Ouvrir dans Google Maps"
          buttonHref={GOOGLE_MAPS_URL}
          buttonTarget="_blank"
          className="mb-12 md:mb-16"
        />

        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
          <div className="relative overflow-hidden">
            <LeafletMap />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5"
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-primary/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-third/70 text-primary">
                <MapPin className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Pyramide Immobilier
                </p>
                <p className="text-xs text-muted-foreground">Oran, Algérie</p>
              </div>
            </div>

            <Link
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline md:hidden"
            >
              Obtenir l&apos;itinéraire →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
