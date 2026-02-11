"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import Icon from "./Icon";

type SearchFilterVariant = "overlay" | "inline";

interface SearchFilterProps {
  variant?: SearchFilterVariant;
  className?: string;
}

export default function SearchFilter({
  variant = "overlay",
  className,
}: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOverlay = variant === "overlay";

  /* ---------------- State hydrated from URL ---------------- */
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") ?? ""
  );

  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice")) || 30000,
    Number(searchParams.get("maxPrice")) || 20000000,
  ]);

  /* ---------------- Submit ---------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (status) params.set("status", status);
    if (propertyType) params.set("propertyType", propertyType);

    params.set("minPrice", String(priceRange[0]));
    params.set("maxPrice", String(priceRange[1]));

    router.push(`?${params.toString()}`, { scroll: false });
  };

  /* ---------------- Clear ---------------- */
  const handleClearFilters = () => {
    setCity("");
    setBedrooms("");
    setStatus("");
    setPropertyType("");
    setPriceRange([30000, 20000000]);

    router.push(window.location.pathname, { scroll: false });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isOverlay
          ? `absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[10%] md:-translate-y-[50%] bg-background rounded-4xl shadow-md px-8 py-5 flex flex-wrap justify-between gap-3 items-center max-w-6xl w-full z-40 ${className ?? ""}`
          : `relative bg-background rounded-4xl shadow-md px-6 md:px-8 py-5 flex flex-wrap justify-between gap-3 items-center w-full ${className ?? ""}`
      }
    >
      <Icon format="mini" />

      {/* <Input
        placeholder="Ville"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      /> */}

      <Select value={propertyType} onValueChange={setPropertyType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type de propriété" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Appartement">Appartement</SelectItem>
          <SelectItem value="Maison">Maison</SelectItem>
          <SelectItem value="Villa">Villa</SelectItem>
          <SelectItem value="Commercial">Local Commercial</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Chambres"
        value={bedrooms}
        onChange={(e) => setBedrooms(e.target.value)}
        className="w-[140px]"
      />

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="En Vente">À vendre</SelectItem>
          <SelectItem value="En Location">À louer</SelectItem>
        </SelectContent>
      </Select>

      {/* Price */}
      <div className="w-[240px] space-y-1">
        <p className="text-xs font-medium">Prix</p>
        <Slider
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          min={10000}
          max={50000000}
          step={5000}
        />
        <div className="flex justify-between text-xs">
          <span>{priceRange[0].toLocaleString()} DZD</span>
          <span>{priceRange[1].toLocaleString()} DZD</span>
        </div>
      </div>

      <Button type="submit" className="bg-blue-600 text-white">
        Rechercher
      </Button>

      <Button variant="outline" onClick={handleClearFilters}>
        Réinitialiser
      </Button>
    </form>
  );
}
