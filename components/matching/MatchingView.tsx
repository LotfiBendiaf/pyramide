"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  BedDouble,
  MapPin,
  Wallet,
  Building2,
  Users,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ROUTES from "@/constants/routes";
import {
  matchClientToListings,
  matchListingToClients,
  MatchedListing,
  MatchedClient,
} from "@/lib/actions/matching.action";
import { formatPriceAlgeria } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  BUYER: "Acheteur",
  RENTER: "Loueur",
};

// ─── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 10
      ? "bg-green-200 text-green-800 border border-green-300"
      : score >= 7
        ? "bg-yellow-200 text-yellow-800"
        : "bg-gray-200 text-gray-700";
  return (
    <span
      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${color}`}
    >
      {score}
    </span>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  clients: Client[];
  listings: Listing[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MatchingView({ clients, listings }: Props) {
  // Clients tab state
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [matchedListings, setMatchedListings] = useState<MatchedListing[]>([]);

  // Listings tab state
  const [listingSearch, setListingSearch] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null
  );
  const [matchedClients, setMatchedClients] = useState<MatchedClient[]>([]);

  const [isPending, startTransition] = useTransition();

  // ── Filtered lists ──────────────────────────────────────────────────────────

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.referenceCode.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const filteredListings = useMemo(() => {
    const q = listingSearch.toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.referenceCode?.toLowerCase().includes(q) ||
        l.location.city.toLowerCase().includes(q) ||
        l.propertyType.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q)
    );
  }, [listings, listingSearch]);

  // ── Selection handlers ──────────────────────────────────────────────────────

  function handleSelectClient(clientId: string) {
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
      setMatchedListings([]);
      return;
    }
    setSelectedClientId(clientId);
    setMatchedListings([]);
    startTransition(async () => {
      const result = await matchClientToListings(clientId);
      if (result.success) setMatchedListings(result.data ?? []);
    });
  }

  function handleSelectListing(listingId: string) {
    if (selectedListingId === listingId) {
      setSelectedListingId(null);
      setMatchedClients([]);
      return;
    }
    setSelectedListingId(listingId);
    setMatchedClients([]);
    startTransition(async () => {
      const result = await matchListingToClients(listingId);
      if (result.success) setMatchedClients(result.data ?? []);
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Tabs defaultValue="clients">
      <TabsList className="mb-6">
        <TabsTrigger value="clients" className="gap-2">
          <Users className="w-4 h-4" />
          Clients
          <Badge variant="secondary" className="ml-1">
            {clients.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="listings" className="gap-2">
          <Building2 className="w-4 h-4" />
          Annonces
          <Badge variant="secondary" className="ml-1">
            {listings.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* ── Clients Tab ─────────────────────────────────────────────────── */}
      <TabsContent value="clients">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: client list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Clients acheteurs / loueurs
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client…"
                  className="pl-9"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Aucun client trouvé.
                </p>
              ) : (
                <ul className="divide-y max-h-[560px] overflow-y-auto">
                  {filteredClients.map((client) => {
                    const isSelected = selectedClientId === client._id;
                    return (
                      <li key={client._id}>
                        <button
                          onClick={() => handleSelectClient(client._id)}
                          className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 ${
                            isSelected ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {client.firstName} {client.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {client.referenceCode}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {TYPE_LABELS[client.type] ?? client.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                {client.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {client.city}
                                  </span>
                                )}
                                {client.wantedPropertyType && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {client.wantedPropertyType}
                                  </span>
                                )}
                                {client.budgetMax !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Wallet className="w-3 h-3" />
                                    {formatPriceAlgeria(client.budgetMax)} DA
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Right: matched listings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Annonces correspondantes
                {matchedListings.length > 0 && (
                  <Badge variant="secondary">{matchedListings.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isPending ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Recherche en cours…</span>
                </div>
              ) : !selectedClientId ? (
                <p className="text-sm text-muted-foreground text-center py-16 px-6">
                  Sélectionnez un client pour voir les annonces correspondantes.
                </p>
              ) : matchedListings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16 px-6">
                  Aucune annonce ne correspond aux critères de ce client.
                </p>
              ) : (
                <ul className="divide-y max-h-[560px] overflow-y-auto">
                  {matchedListings.map((listing) => (
                    <li key={listing._id}>
                      <Link
                        href={ROUTES.LISTING_DETAIL_DASHBOARD(listing._id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <ScoreBadge score={listing.matchScore} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground font-mono">
                              {listing.referenceCode}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {listing.propertyType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.location.city}
                            </span>
                            {listing.features.bedrooms > 0 && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3 h-3" />
                                {listing.features.bedrooms} ch.
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium shrink-0">
                            {formatPriceAlgeria(listing.price)} DA
                          </p>
                          {listing.overBudget && (
                            <span className="text-xs text-yellow-600 font-medium">
                              Budget ++
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ── Listings Tab ─────────────────────────────────────────────────── */}
      <TabsContent value="listings">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: listing list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Annonces actives</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une annonce…"
                  className="pl-9"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredListings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Aucune annonce trouvée.
                </p>
              ) : (
                <ul className="divide-y max-h-[560px] overflow-y-auto">
                  {filteredListings.map((listing) => {
                    const isSelected = selectedListingId === listing._id;
                    return (
                      <li key={listing._id}>
                        <button
                          onClick={() => handleSelectListing(listing._id)}
                          className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 ${
                            isSelected ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {listing.referenceCode}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {listing.propertyType}
                                </Badge>
                                <Badge
                                  variant={
                                    listing.status === "En Vente"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {listing.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {listing.location.city}
                                </span>
                                {listing.features.bedrooms > 0 && (
                                  <span className="flex items-center gap-1">
                                    <BedDouble className="w-3 h-3" />
                                    {listing.features.bedrooms} ch.
                                  </span>
                                )}
                                <span className="font-medium text-foreground">
                                  {formatPriceAlgeria(listing.price)} DA
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Right: matched clients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Clients correspondants
                {matchedClients.length > 0 && (
                  <Badge variant="secondary">{matchedClients.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isPending ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Recherche en cours…</span>
                </div>
              ) : !selectedListingId ? (
                <p className="text-sm text-muted-foreground text-center py-16 px-6">
                  Sélectionnez une annonce pour voir les clients correspondants.
                </p>
              ) : matchedClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16 px-6">
                  Aucun client ne correspond aux critères de cette annonce.
                </p>
              ) : (
                <ul className="divide-y max-h-[560px] overflow-y-auto">
                  {matchedClients.map((client) => (
                    <li key={client._id}>
                      <Link
                        href={ROUTES.CLIENT_DETAIL(client._id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <ScoreBadge score={client.matchScore} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {client.firstName} {client.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {client.referenceCode}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {TYPE_LABELS[client.type] ?? client.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            {client.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {client.city}
                              </span>
                            )}
                            {(client.budgetMin !== undefined ||
                              client.budgetMax !== undefined) && (
                              <span className="flex items-center gap-1">
                                <Wallet className="w-3 h-3" />
                                {client.budgetMin !== undefined
                                  ? formatPriceAlgeria(client.budgetMin)
                                  : "—"}{" "}
                                →{" "}
                                {client.budgetMax !== undefined
                                  ? formatPriceAlgeria(client.budgetMax)
                                  : "—"}{" "}
                                DA
                              </span>
                            )}
                            {client.rooms !== undefined && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3 h-3" />
                                {client.rooms} ch.
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
