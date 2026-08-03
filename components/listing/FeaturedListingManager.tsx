"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { setListingFeatured } from "@/lib/actions/listings.action";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatPriceAlgeria } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function FeaturedListingRow({ listing }: { listing: Listing }) {
  const [featured, setFeatured] = useState(listing.isFeatured);
  const [pending, startTransition] = useTransition();
  const image = listing.images?.find((item) => item.isPublic)?.url ?? listing.coverImage;

  function handleChange(checked: boolean) {
    const previous = featured;
    setFeatured(checked);
    startTransition(async () => {
      const result = await setListingFeatured(listing._id, checked);
      if (!result.success) {
        setFeatured(previous);
        toast.error(result.error?.message ?? "La modification a échoué.");
        return;
      }
      toast.success(checked ? "Bien ajouté à la une." : "Bien retiré de la une.");
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {listing.referenceCode || "—"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={image || "/placeholder.png"}
              alt={listing.title || "Bien immobilier"}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium">
              {listing.title || listing.referenceCode || "Sans titre"}
            </p>
            <p className="text-xs text-muted-foreground">
              {listing.propertyTypeCustom || listing.propertyType}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <p className="font-medium">{listing.location.city}</p>
        {listing.location.district && (
          <p className="text-xs text-muted-foreground">{listing.location.district}</p>
        )}
      </TableCell>
      <TableCell className="font-medium">{formatPriceAlgeria(listing.price)}</TableCell>
      <TableCell>
        {featured ? (
          <Badge className="gap-1"><Star className="h-3 w-3 fill-current" />À la une</Badge>
        ) : (
          <Badge variant="secondary">Standard</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="inline-flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {featured ? "Sélectionné" : "Non sélectionné"}
          </span>
          <Switch
            checked={featured}
            disabled={pending}
            onCheckedChange={handleChange}
            aria-label={`Mettre ${listing.title || listing.referenceCode} à la une`}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function FeaturedListingManager({ listings }: { listings: Listing[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-[850px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Référence</TableHead>
              <TableHead>Bien</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Affichage</TableHead>
              <TableHead className="w-52 text-right">À la une</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => <FeaturedListingRow key={listing._id} listing={listing} />)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
