"use client";

import { useEffect, useMemo, useState } from "react";
import { Locate } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ListingCoordinates = {
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  value?: ListingCoordinates;
  onChange: (value?: ListingCoordinates) => void;
  defaultCenter: ListingCoordinates;
};

const DEFAULT_ZOOM = 13;
const SELECTED_ZOOM = 16;

const markerIconUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerIconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const markerShadowUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Ensure Leaflet's default marker icons resolve correctly in Next.js builds.
// This is required because Leaflet expects static image URLs at runtime.
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

function MapClickHandler({
  onPick,
}: {
  onPick: (value: ListingCoordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export default function LocationPicker({
  value,
  onChange,
  defaultCenter,
}: LocationPickerProps) {
  const center = useMemo(() => value ?? defaultCenter, [value, defaultCenter]);
  const zoom = value ? SELECTED_ZOOM : DEFAULT_ZOOM;
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      () => {
        setLocationError("Impossible d'obtenir votre position.");
        setLocating(false);
      }
    );
  };

  const updateCoordinate = (next: Partial<ListingCoordinates> | null) => {
    if (!next) {
      onChange(undefined);
      return;
    }

    onChange({
      lat: next.lat ?? value?.lat ?? defaultCenter.lat,
      lng: next.lng ?? value?.lng ?? defaultCenter.lng,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="number"
          step="0.000001"
          placeholder="Latitude"
          value={value?.lat ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onChange(undefined);
              return;
            }
            updateCoordinate({ lat: Number(raw) });
          }}
        />
        <Input
          type="number"
          step="0.000001"
          placeholder="Longitude"
          value={value?.lng ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onChange(undefined);
              return;
            }
            updateCoordinate({ lng: Number(raw) });
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCurrentLocation}
          disabled={locating}
        >
          <Locate className="mr-2 h-4 w-4" />
          {locating ? "Localisation..." : "Ma position"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange(undefined)}
        >
          Effacer
        </Button>
      </div>
      {locationError && (
        <p className="text-xs text-destructive">{locationError}</p>
      )}

      <div className="relative z-0 overflow-hidden rounded-lg border">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: "320px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={onChange} />
          <RecenterMap center={center} zoom={zoom} />
          {value && <Marker position={value} />}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Cliquez sur la carte pour choisir l&apos;emplacement exact.
      </p>
    </div>
  );
}
