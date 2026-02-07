"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bed,
  Car,
  CheckCircle2,
  Home,
  MapPin,
  Maximize2,
  ShowerHead,
  Star,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { formatDate, formatPrice } from "@/lib/utils";
import { StatusAction } from "./StatusButton";
import { updateListingStatus } from "@/lib/actions/listings.action";
import { STATUS_COLORS } from "@/constants/values";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

interface ListingTableProps {
  listings: Listing[];
}

export function ListingTable({ listings }: ListingTableProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des annonces</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Superficie & Specifications</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date d&apos;ajout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {listings.map((listing) => (
              <TableRow
                key={listing._id}
                onClick={() => setSelectedListing(listing)}
              >
                <TableCell className="font-medium">
                  {listing.referenceCode}
                </TableCell>
                <TableCell>
                  <Image
                    src={listing.images[0]}
                    alt={listing.title || "Image de l'annonce"}
                    width={64}
                    height={48}
                    className="h-12 w-16 object-cover rounded-md"
                  />
                </TableCell>

                <TableCell>
                  {" "}
                  <Badge variant="secondary">{listing.propertyType}</Badge>
                </TableCell>
                {/* <TableCell>{listing.location.city}</TableCell> */}

                <TableCell>{formatPrice(listing.price)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{listing.features.area} m²</Badge>
                  <div className="flex gap-2 items-center mt-2">
                    <div className="flex gap-2 items-center">
                      {" "}
                      {listing.features.bedrooms}{" "}
                      <Bed className="inline h-4 w-4" />
                    </div>
                    <div className="flex gap-2 items-center">
                      {listing.features.bathrooms}
                      <ShowerHead className="inline h-4 w-4" />
                    </div>
                    <div className="flex gap-2 items-center">
                      {listing.features.parking ? "Parking" : "Pas de Parking"}
                      <Car className="inline h-4 w-4" />
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{listing.agent?.name}</Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[listing.status]}
                  >
                    {listing.status}
                  </Badge>
                </TableCell>

                <TableCell>{formatDate(listing.createdAt || "-")}</TableCell>

                <TableCell className="text-right">
                  <StatusAction
                    status={listing.status}
                    onChange={(newStatus) => {
                      updateListingStatus(listing._id, newStatus);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog
        open={!!selectedListing}
        onOpenChange={() => setSelectedListing(null)}
      >
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none bg-slate-50">
          {selectedListing && (
            <ScrollArea className="max-h-[90vh]">
              <div className="relative h-64 w-full">
                <Image
                  src={selectedListing.images[0]}
                  alt={selectedListing.title || "Image de l'annonce"}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-primary hover:bg-primary shadow-lg capitalize">
                    {selectedListing.status}
                  </Badge>
                  {selectedListing.isPremium && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-400 text-amber-950 shadow-lg"
                    >
                      ✨ Premium
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <DialogHeader>
                      <DialogTitle>{selectedListing.title}</DialogTitle>
                    </DialogHeader>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary">
                      {formatPrice(selectedListing.price)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Prix de l&apos;offre
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-muted-foreground my-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {selectedListing.location.address},{" "}
                    {selectedListing.location.city}
                  </span>
                </div>

                <div className="flex text-xs gap-2 items-center mt-2">
                  <div className="flex gap-2 items-center">
                    {" "}
                    {selectedListing.features.bedrooms}{" "}
                    <Bed className="inline h-4 w-4" />
                  </div>
                  <div className="flex gap-2 items-center">
                    {selectedListing.features.bathrooms}
                    <ShowerHead className="inline h-4 w-4" />
                  </div>
                  <div className="flex gap-2 items-center">
                    {selectedListing.features.parking
                      ? "Parking"
                      : "Pas de Parking"}
                    <Car className="inline h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {[
                    {
                      icon: Home,
                      label: "Type",
                      value: selectedListing.propertyType,
                    },
                    {
                      icon: Maximize2,
                      label: "Surface",
                      value: `${selectedListing.features.area} m²`,
                    },
                    {
                      icon: Star,
                      label: "Score",
                      value: `${selectedListing.evaluation?.finalScore}/10`,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                    >
                      <item.icon className="h-5 w-5 text-primary mb-1" />
                      <span className="text-[10px] uppercase text-slate-400 font-bold">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        Description
                      </h4>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        {selectedListing.description}
                      </p>
                    </div>

                    {/* Now displaying those Positives/Negatives we fixed! */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase text-emerald-600 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Points Forts
                        </h5>
                        <ul className="text-sm space-y-1">
                          {selectedListing.evaluation?.positives?.map(
                            (p, i) => (
                              <li key={i} className="text-slate-600">
                                • {p}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase text-rose-600 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" /> Points Faibles
                        </h5>
                        <ul className="text-sm space-y-1">
                          {selectedListing.evaluation?.negatives?.map(
                            (n, i) => (
                              <li key={i} className="text-slate-600">
                                • {n}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-sm mb-3">
                        L&apos;avis de l&apos;expert
                      </h4>
                      <p className="text-xs italic text-slate-500 mb-4">
                        {selectedListing.evaluation?.priceQualityOpinion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
