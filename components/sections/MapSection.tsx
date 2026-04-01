"use client";

import dynamic from "next/dynamic";
import { SectionHeader } from "../SectionHeader";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-2xl bg-muted animate-pulse" />
  ),
});

export default function MapSection() {
  return (
    <section id="map" className="py-20">
      <div className="container mx-auto px-5">
        <div className="text-center mb-14">
          <SectionHeader
            title="Retrouvez-nous"
            subtitle="Venez nous rendre visite dans nos bureaux à Oran."
            buttonLabel="Ouvrir dans Google Maps"
            buttonHref="https://www.google.com/maps/place/Pyramide+immobilier/@35.7161213,-0.5737586,17z"
            buttonTarget="_blank"
          />
        </div>
        <LeafletMap />
      </div>
    </section>
  );
}
