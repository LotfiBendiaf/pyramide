"use client";

import { MapPin, Building2, CalendarDays, Ruler, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getGoogleMapsUrl, formatDate, formatPriceAlgeria } from "@/lib/utils";
import { RESIDENCE_COMPLETION_STATUSES } from "@/constants/values";
import UnitAvailabilityTable from "./UnitAvailabilityTable";

interface ResidenceInfoProps {
  residence: Residence;
}

export default function ResidenceInfo({ residence }: ResidenceInfoProps) {
  const completionConfig = RESIDENCE_COMPLETION_STATUSES.find(
    (s) => s.value === residence.completionStatus
  );

  const areas = residence.units.map((u) => u.area).filter(Boolean);
  const minArea = areas.length ? Math.min(...areas) : undefined;
  const maxArea = areas.length ? Math.max(...areas) : undefined;
  const areaLabel =
    minArea !== undefined
      ? minArea === maxArea
        ? `${minArea} m²`
        : `${minArea}–${maxArea} m²`
      : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {completionConfig && <Badge>{completionConfig.label}</Badge>}
        </div>
        {residence.referenceCode && (
          <p className="text-muted-foreground mb-1 flex items-center gap-1 text-sm">
            <Hash className="w-3.5 h-3.5" />
            {residence.referenceCode}
          </p>
        )}
        <h1 className="text-3xl font-bold">{residence.title}</h1>
        {residence.developerName && (
          <p className="text-muted-foreground mt-1">Par {residence.developerName}</p>
        )}
        <a
          href={getGoogleMapsUrl(residence.location)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground mt-2 w-fit hover:text-primary hover:underline"
        >
          <MapPin className="w-4 h-4" />
          {residence.location.city}
        </a>
      </div>

      {residence.tagline && (
        <p className="text-lg text-muted-foreground italic">{residence.tagline}</p>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Building2} label="Unités" value={residence.totalUnits ?? residence.units.length} />
        <Stat
          icon={CalendarDays}
          label="Livraison"
          value={residence.deliveryDate ? formatDate(residence.deliveryDate) : completionConfig?.label ?? "—"}
        />
        <Stat
          icon={Hash}
          label="À partir de"
          value={residence.priceFrom ? formatPriceAlgeria(residence.priceFrom) : "Sur demande"}
        />
        <Stat icon={Ruler} label="Surfaces" value={areaLabel} />
      </div>

      {/* Description */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Description</h2>
        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed whitespace-pre-line">
          {residence.description}
        </div>
      </section>

      {/* Amenities */}
      {residence.amenities && residence.amenities.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-4">Équipements & Commodités</h2>
          <div className="flex flex-wrap gap-2">
            {residence.amenities.map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-sm">
                {amenity}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Unit availability */}
      <section>
        <h2 className="font-semibold text-lg mb-4">Disponibilité des unités</h2>
        <UnitAvailabilityTable units={residence.units} />
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
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
