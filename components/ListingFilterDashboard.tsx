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
import { Search } from "lucide-react";
import { PROPERTY_TYPES } from "@/constants/values";

export default function ListingFilterDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---------------- State hydrated from URL ---------------- */
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") ?? ""
  );

  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice")) || 30000,
    Number(searchParams.get("maxPrice")) || 500000000,
  ]);

  const [minScore, setMinScore] = useState(searchParams.get("minScore") ?? "");

  const [idealBuyer, setIdealBuyer] = useState(
    searchParams.get("idealBuyer") ?? ""
  );

  const [evaluatedOnly, setEvaluatedOnly] = useState(
    searchParams.get("evaluated") === "true"
  );

  const [isPremium, setIsPremium] = useState(
    searchParams.get("isPremium") === "true"
  );

  const [validatedOnly, setValidatedOnly] = useState(
    searchParams.get("validated") === "true"
  );

  /* ---------------- Submit ---------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (status) params.set("status", status);
    if (propertyType) params.set("propertyType", propertyType);

    params.set("minPrice", String(priceRange[0]));
    params.set("maxPrice", String(priceRange[1]));

    if (minScore) params.set("minScore", minScore);
    if (idealBuyer) params.set("idealBuyer", idealBuyer);
    if (evaluatedOnly) params.set("evaluated", "true");
    if (isPremium) params.set("isPremium", "true");
    if (validatedOnly) params.set("validated", "true");

    router.push(`?${params.toString()}`, { scroll: false });
  };

  /* ---------------- Clear ---------------- */
  const handleClearFilters = () => {
    setSearch("");
    setCity("");
    setBedrooms("");
    setStatus("");
    setPropertyType("");
    setMinScore("");
    setIdealBuyer("");
    setEvaluatedOnly(false);
    setIsPremium(false);
    setValidatedOnly(false);
    setPriceRange([30000, 500000000]);

    router.push(window.location.pathname, { scroll: false });
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className=" bg-background rounded-2xl border shadow-md px-8 py-5 flex flex-wrap justify-between gap-3 items-center w-full z-40"
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher par référence, ville, adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 h-10 rounded-full border-border/60 bg-muted/40 shadow-sm focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all placeholder:text-muted-foreground/60"
          />
        </div>
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
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
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
        <Input
          type="number"
          min={0}
          max={10}
          step={1}
          placeholder="Note min /10"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="w-[150px]"
        />
        {/* <Select value={idealBuyer} onValueChange={setIdealBuyer}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Acheteur idéal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Famille">Famille</SelectItem>
            <SelectItem value="Investisseur">Investisseur</SelectItem>
            <SelectItem value="Jeune couple">Jeune couple</SelectItem>
            <SelectItem value="Commercial">Usage commercial</SelectItem>
          </SelectContent>
        </Select> */}
        {/* <Button
          type="button"
          variant={evaluatedOnly ? "default" : "outline"}
          onClick={() => setEvaluatedOnly(!evaluatedOnly)}
        >
          Biens évalués
        </Button> */}
        <Button
          type="button"
          variant={validatedOnly ? "default" : "outline"}
          onClick={() => setValidatedOnly(!validatedOnly)}
        >
          Validés
        </Button>
        {/* Price */}
        <div className="w-[240px] space-y-1">
          <p className="text-xs font-medium">Prix</p>
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            min={100000}
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
    </div>
  );
}
