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
import {
  BadgeQuestionMark,
  BedDouble,
  Building,
  Building2,
  ChevronDown,
  House,
  LandPlot,
  Layers,
  RotateCcw,
  Search,
  SearchIcon,
  SlidersHorizontal,
  Store,
  UserRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { PROPERTY_TYPES } from "@/constants/values";
import { cn, formatPriceAlgeria } from "@/lib/utils";

const RENT_PRICE_RANGE_MIN = 30000;
const RENT_PRICE_RANGE_MAX = 500000;
const RENT_PRICE_RANGE_DEFAULT: [number, number] = [
  RENT_PRICE_RANGE_MIN,
  500000,
];

const SALE_PRICE_RANGE_MIN = 7000000;
const SALE_PRICE_RANGE_MAX = 500000000;
const SALE_PRICE_RANGE_DEFAULT: [number, number] = [
  SALE_PRICE_RANGE_MIN,
  SALE_PRICE_RANGE_MAX,
];

const PROPERTY_TYPE_ICONS: Partial<
  Record<(typeof PROPERTY_TYPES)[number], LucideIcon>
> = {
  Appartement: Building2,
  Maison: House,
  Villa: House,
  Studio: Building,
  Terrain: LandPlot,
  Commercial: Store,
  Duplex: Layers,
  Hangar: Warehouse,
  Penthouse: Building2,
  "Local Commercial": Store,
  Autre: BadgeQuestionMark,
};

const BEDROOM_OPTIONS = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1 ch." },
  { value: "2", label: "2 ch." },
  { value: "3", label: "3 ch." },
  { value: "4", label: "4 ch." },
  { value: "5", label: "5 ch." },
];

function getPriceParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return fallback;
  }

  return Math.min(Math.max(price, min), max);
}

type ListingFilterDashboardProps = {
  agents?: User[];
};

export default function ListingFilterDashboard({
  agents = [],
}: ListingFilterDashboardProps) {
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
  const [agentId, setAgentId] = useState(searchParams.get("agentId") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(() =>
    [
      "bedrooms",
      "status",
      "propertyType",
      "rentMinPrice",
      "rentMaxPrice",
      "saleMinPrice",
      "saleMaxPrice",
      "minPrice",
      "maxPrice",
      "agentId",
    ].some((param) => searchParams.has(param))
  );

  const [rentPriceRange, setRentPriceRange] = useState<[number, number]>([
    getPriceParam(
      searchParams.get("rentMinPrice") ?? searchParams.get("minPrice"),
      RENT_PRICE_RANGE_DEFAULT[0],
      RENT_PRICE_RANGE_MIN,
      RENT_PRICE_RANGE_MAX
    ),
    getPriceParam(
      searchParams.get("rentMaxPrice") ?? searchParams.get("maxPrice"),
      RENT_PRICE_RANGE_DEFAULT[1],
      RENT_PRICE_RANGE_MIN,
      RENT_PRICE_RANGE_MAX
    ),
  ]);

  const [salePriceRange, setSalePriceRange] = useState<[number, number]>([
    getPriceParam(
      searchParams.get("saleMinPrice") ?? searchParams.get("minPrice"),
      SALE_PRICE_RANGE_DEFAULT[0],
      SALE_PRICE_RANGE_MIN,
      SALE_PRICE_RANGE_MAX
    ),
    getPriceParam(
      searchParams.get("saleMaxPrice") ?? searchParams.get("maxPrice"),
      SALE_PRICE_RANGE_DEFAULT[1],
      SALE_PRICE_RANGE_MIN,
      SALE_PRICE_RANGE_MAX
    ),
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
    const view = searchParams.get("view");

    if (view) params.set("view", view);

    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (status) params.set("status", status);
    if (propertyType) params.set("propertyType", propertyType);
    if (agentId) params.set("agentId", agentId);

    params.set("rentMinPrice", String(rentPriceRange[0]));
    params.set("rentMaxPrice", String(rentPriceRange[1]));
    params.set("saleMinPrice", String(salePriceRange[0]));
    params.set("saleMaxPrice", String(salePriceRange[1]));

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
    setAgentId("");
    setMinScore("");
    setIdealBuyer("");
    setEvaluatedOnly(false);
    setIsPremium(false);
    setValidatedOnly(false);
    setRentPriceRange(RENT_PRICE_RANGE_DEFAULT);
    setSalePriceRange(SALE_PRICE_RANGE_DEFAULT);

    const params = new URLSearchParams();
    const view = searchParams.get("view");

    if (view) params.set("view", view);

    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  };

  const activeFilterCount =
    [bedrooms, status, propertyType, agentId].filter(Boolean).length +
    (rentPriceRange[0] !== RENT_PRICE_RANGE_DEFAULT[0] ||
    rentPriceRange[1] !== RENT_PRICE_RANGE_DEFAULT[1]
      ? 1
      : 0) +
    (salePriceRange[0] !== SALE_PRICE_RANGE_DEFAULT[0] ||
    salePriceRange[1] !== SALE_PRICE_RANGE_DEFAULT[1]
      ? 1
      : 0);

  return (
    <div className="w-full min-w-0">
      <form
        onSubmit={handleSubmit}
        className="w-full min-w-0 space-y-3 rounded-2xl border bg-background px-4 py-4 shadow-md sm:px-6 lg:px-8 lg:py-5"
      >
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher par référence, ville, adresse, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 h-10 rounded-full border-border/60 bg-muted/40 shadow-sm focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="group h-10 w-full shrink-0 justify-between gap-2 rounded-full border-blue-200 bg-blue-50/70 px-4 text-blue-700 shadow-sm hover:border-blue-300 hover:bg-blue-100 sm:w-auto"
          >
            <span className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="size-4 shrink-0" />
              <span className="font-medium">Filtres</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                filtersOpen && "rotate-180"
              )}
            />
          </Button>
          {agents.length > 0 && (
            <Select
              value={agentId || "all"}
              onValueChange={(value) =>
                setAgentId(value === "all" ? "" : value)
              }
            >
              <SelectTrigger
                aria-label="Filtrer par agent"
                className={cn(
                  "group h-10 w-full gap-2 rounded-full px-4 shadow-sm transition-all sm:w-[230px]",
                  agentId
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/10 hover:bg-blue-100"
                    : "border-border/70 bg-background hover:border-blue-300 hover:bg-blue-50/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                    agentId
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-600",
                  )}
                >
                  <UserRound className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <SelectValue placeholder="Tous les agents" />
                </span>
              </SelectTrigger>
              <SelectContent className="min-w-[230px] rounded-xl p-1">
                <SelectItem value="all" className="rounded-lg">
                  Tous les agents
                </SelectItem>
                {agents.map((agent) => {
                  const name = [agent.firstname, agent.lastname]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <SelectItem
                      key={agent._id}
                      value={agent._id}
                      className="rounded-lg"
                    >
                      {name || agent.email}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <Button
            type="submit"
            className="h-10 w-full rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 sm:w-auto"
          >
            <SearchIcon className="h-4 w-4 sm:mr-2" />
            Rechercher
          </Button>
        </div>
        {/* <Input
        placeholder="Ville"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      /> */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            filtersOpen
              ? "max-h-[900px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="space-y-3 border-t pt-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => {
                const Icon = PROPERTY_TYPE_ICONS[type] ?? BadgeQuestionMark;
                const isSelected = propertyType === type;

                return (
                  <Button
                    key={type}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    aria-pressed={isSelected}
                    onClick={() => setPropertyType(isSelected ? "" : type)}
                    className={cn(
                      "h-9 min-w-0 border-border/70 px-3 text-xs",
                      isSelected &&
                        "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{type}</span>
                  </Button>
                );
              })}
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En Vente">À vendre</SelectItem>
                  <SelectItem value="En Location">À louer</SelectItem>
                  <SelectItem value="Vendu">Vendu</SelectItem>
                  <SelectItem value="Loué">Loué</SelectItem>
                  <SelectItem value="Retiré">Retiré</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((option) => {
                  const isSelected = bedrooms === option.value;

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setBedrooms(isSelected ? "" : option.value)
                      }
                      className={cn(
                        "h-9 border-border/70 px-3 text-xs",
                        isSelected &&
                          "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      <BedDouble className="size-4 shrink-0" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
              {/* <Input
                type="number"
                min={0}
                max={10}
                step={1}
                placeholder="Note min /10"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              /> */}
            </div>
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
            {/* <Button
              type="button"
              variant={validatedOnly ? "default" : "outline"}
              onClick={() => setValidatedOnly(!validatedOnly)}
            >
              Validés
            </Button> */}
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              {/* Sale price */}
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium">Prix vente / achat</p>
                <Slider
                  value={salePriceRange}
                  onValueChange={(v) =>
                    setSalePriceRange(v as [number, number])
                  }
                  min={SALE_PRICE_RANGE_MIN}
                  max={SALE_PRICE_RANGE_MAX}
                  step={1000000}
                />
                <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground min-[420px]:flex-row min-[420px]:justify-between">
                  <span className="whitespace-nowrap">
                    {formatPriceAlgeria(salePriceRange[0])}
                  </span>
                  <span className="whitespace-nowrap">
                    {formatPriceAlgeria(salePriceRange[1])}
                  </span>
                </div>
              </div>
              {/* Rent price */}
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium">Prix location</p>
                <Slider
                  value={rentPriceRange}
                  onValueChange={(v) =>
                    setRentPriceRange(v as [number, number])
                  }
                  min={RENT_PRICE_RANGE_MIN}
                  max={RENT_PRICE_RANGE_MAX}
                  step={5000}
                />
                <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground min-[420px]:flex-row min-[420px]:justify-between">
                  <span className="whitespace-nowrap">
                    {rentPriceRange[0].toLocaleString()} DZD
                  </span>
                  <span className="whitespace-nowrap">
                    {rentPriceRange[1].toLocaleString()} DZD
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
