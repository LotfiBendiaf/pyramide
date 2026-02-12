"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type ListingCoordinates = {
  lat: number;
  lng: number;
};

type LocationMapProps = {
  coordinates: ListingCoordinates;
  zoom?: number;
};

const DEFAULT_ZOOM = 15;

const markerIconUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerIconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const markerShadowUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Ensure Leaflet's default marker icons resolve correctly in Next.js builds.
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIconRetinaUrl,
    iconUrl: markerIconUrl,
    shadowUrl: markerShadowUrl,
  });
}

function RecenterMap({
  center,
  zoom,
}: {
  center: ListingCoordinates;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);

  return null;
}

export default function LocationMap({
  coordinates,
  zoom = DEFAULT_ZOOM,
}: LocationMapProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={coordinates}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "320px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={coordinates} zoom={zoom} />
        <Marker position={coordinates} />
      </MapContainer>
    </div>
  );
}
