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
import { Button } from "@/components/ui/button";
import { Bed, Car, Eye, ShowerHead } from "lucide-react";
import Image from "next/image";
import { formatDate, formatPrice } from "@/lib/utils";

interface ListingTableProps {
  listings: Listing[];
}

export function ListingTable({ listings }: ListingTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des annonces</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Superficie & Specifications</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date d&apos;ajout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing._id}>
                <TableCell className="font-medium">{listing.title}</TableCell>
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
                <TableCell>{listing.location.city}</TableCell>

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
                      <ShowerHead className="inline h-4 w-4" />
                      {listing.features.bathrooms}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Car className="inline h-4 w-4" />
                      {listing.features.parking ? "Parking" : "Pas de Parking"}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{listing.status}</Badge>
                </TableCell>
                <TableCell>{formatDate(listing.createdAt || "-")}</TableCell>

                <TableCell className="text-right">
                  <Button size="icon" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
