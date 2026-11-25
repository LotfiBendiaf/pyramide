"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ResultRow } from "./AssistantContext";

type ClientCriteria = {
  type?: string;
  city?: string;
  preferredLocation?: string;
  wantedPropertyType?: string;
  budgetMin?: number;
  budgetMax?: number;
  priceCurrency?: string;
  wantedArea?: number;
  wantedAreaMin?: number;
  rooms?: number;
  floorMin?: number;
  floorMax?: number;
};

const number = new Intl.NumberFormat("fr-DZ");
const clientTypes: Record<string, string> = {
  BUYER: "Achat", RENTER: "Location", INVESTOR: "Investissement", SELLER: "Vente", INTERMEDIARY: "Intermédiation",
};

function criteriaRows(criteria: ClientCriteria) {
  const currency = criteria.priceCurrency === "DZD" || !criteria.priceCurrency ? "DA" : criteria.priceCurrency;
  const budget = typeof criteria.budgetMin === "number" && typeof criteria.budgetMax === "number"
    ? `${number.format(criteria.budgetMin)} à ${number.format(criteria.budgetMax)} ${currency}`
    : typeof criteria.budgetMax === "number" ? `Jusqu’à ${number.format(criteria.budgetMax)} ${currency}`
      : typeof criteria.budgetMin === "number" ? `À partir de ${number.format(criteria.budgetMin)} ${currency}` : undefined;
  const floor = typeof criteria.floorMin === "number" && typeof criteria.floorMax === "number"
    ? `${criteria.floorMin} à ${criteria.floorMax}`
    : typeof criteria.floorMax === "number" ? `${criteria.floorMax} maximum`
      : typeof criteria.floorMin === "number" ? `${criteria.floorMin} minimum` : undefined;
  return [
    ["Projet", clientTypes[criteria.type ?? ""]],
    ["Type de bien", criteria.wantedPropertyType],
    ["Secteur", [...new Set([criteria.city, criteria.preferredLocation].filter(Boolean))].join(" · ")],
    ["Budget", budget],
    ["Surface", typeof criteria.wantedAreaMin === "number" ? `${number.format(criteria.wantedAreaMin)} m² minimum` : typeof criteria.wantedArea === "number" ? `${number.format(criteria.wantedArea)} m²` : undefined],
    ["Pièces", criteria.rooms],
    ["Étage", floor],
  ].filter(([, value]) => value !== undefined && value !== "");
}

export function AssistantClientResult({ record }: { record: ResultRow }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState<ClientCriteria>();
  const [error, setError] = useState("");

  async function toggle() {
    setOpen(!open);
    if (open || criteria || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/assistant/clients/${record.clientId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCriteria(data.criteria);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les critères.");
    } finally {
      setLoading(false);
    }
  }

  const rows = criteria ? criteriaRows(criteria) : [];

  return (
    <li className="py-1">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => void toggle()}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1 py-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
        <span className="flex min-w-0 flex-1 items-center gap-2 font-medium">
          <ChevronDown className={open ? "size-4 shrink-0 rotate-180" : "size-4 shrink-0"} aria-hidden />
          {record.label}
        </span>
        {record.detail && <span className="text-xs text-muted-foreground">{record.detail}</span>}
      </button>
      <div id={id} hidden={!open} className="mb-2 ml-1 space-y-2 rounded-lg border bg-muted/40 p-3">
        <p className="font-medium">Critères de recherche</p>
        {loading && <p role="status" className="text-muted-foreground">Chargement…</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {criteria && (
          rows.length ? (
            <dl className="divide-y">
              {rows.map(([label, value]) => (
                <div className="grid grid-cols-[minmax(5rem,1fr)_minmax(0,2fr)] gap-3 py-1.5" key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-muted-foreground">Aucun critère de recherche renseigné.</p>
        )}
        {record.href && <Link href={record.href} className="text-xs font-medium underline underline-offset-4">Ouvrir la fiche client</Link>}
      </div>
    </li>
  );
}
