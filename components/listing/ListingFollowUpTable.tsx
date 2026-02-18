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
import { Bed, Car, ShowerHead } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";

interface ListingTableProps {
  listings: Listing[];
}

export function ListingFollowUpTable({ listings }: ListingTableProps) {
  const router = useRouter();
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Listing avec Suivis</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Superficie & Spécifications</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {listings.map((listing) => (
                <TableRow
                  key={listing._id}
                  onClick={() =>
                    router.push(ROUTES.FOLLOWUPS_LISTING(listing._id))
                  }
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{listing.title}</TableCell>

                  <TableCell>
                    <Image
                      src={listing.images?.[0]?.url || "/placeholder.png"}
                      alt={listing.title || "Image de l'annonce"}
                      width={64}
                      height={48}
                      className="h-12 w-16 object-cover rounded-md"
                    />
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {listing.propertyTypeCustom || listing.propertyType}
                    </Badge>
                  </TableCell>

                  <TableCell>{formatPrice(listing.price)}</TableCell>

                  <TableCell>
                    <Badge variant="outline">{listing.features.area} m²</Badge>

                    <div className="flex gap-4 items-center mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        {listing.features.bedrooms}
                        <Bed className="h-4 w-4" />
                      </span>

                      <span className="flex items-center gap-1">
                        {listing.features.bathrooms}
                        <ShowerHead className="h-4 w-4" />
                      </span>

                      <span className="flex items-center gap-1">
                        {listing.features.parking ? "Parking" : "Sans parking"}
                        <Car className="h-4 w-4" />
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
