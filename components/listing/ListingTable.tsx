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
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bed, Car, Eye, EyeOff, ShowerHead } from "lucide-react";
import Image from "next/image";
import { formatDate, formatPrice, formatPriceAlgeria } from "@/lib/utils";
import { StatusAction } from "./StatusButton";
import {
  updateListingStatus,
  toggleListingPublished,
} from "@/lib/actions/listings.action";
import { STATUS_COLORS } from "@/constants/values";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";

interface ListingTableProps {
  listings: Listing[];
}

export function ListingTable({ listings }: ListingTableProps) {
  const router = useRouter();
  const [publishingStates, setPublishingStates] = useState<
    Record<string, boolean>
  >({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    listingId: string;
    currentStatus: boolean;
  } | null>(null);

  const handleTogglePublish = async (
    listingId: string,
    currentStatus: boolean
  ) => {
    setPublishingStates((prev) => ({ ...prev, [listingId]: true }));

    const result = await toggleListingPublished(listingId, currentStatus);

    if (result.success) {
      toast.success(
        result.data?.isPublished
          ? "Annonce publiée avec succès"
          : "Annonce dépubliée avec succès"
      );
    } else {
      toast.error("Erreur lors de la modification du statut");
    }

    setPublishingStates((prev) => ({ ...prev, [listingId]: false }));
    setConfirmDialog(null);
  };

  const openConfirmDialog = (listingId: string, currentStatus: boolean) => {
    setConfirmDialog({ open: true, listingId, currentStatus });
  };

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
              <TableHead>Publication</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date d&apos;ajout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {listings.map((listing) => (
              <TableRow
                key={listing._id}
                onClick={() =>
                  router.push(ROUTES.LISTING_DETAIL_DASHBOARD(listing._id))
                }
              >
                <TableCell className="font-medium">
                  {listing.referenceCode}
                </TableCell>
                <TableCell>
                  <Image
                    src={listing.images[0]?.url || "/placeholder.png"}
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
                {/* <TableCell>{listing.location.city}</TableCell> */}

                <TableCell>
                  <div>
                    {formatPriceAlgeria(listing.price)}
                    <p className="text-muted-foreground text-xs">
                      {formatPrice(listing.price)}
                    </p>
                  </div>
                </TableCell>
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
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={listing.isPublished}
                      onCheckedChange={() => {
                        openConfirmDialog(listing._id, listing.isPublished);
                      }}
                      disabled={publishingStates[listing._id]}
                    />
                    <span className="text-sm text-muted-foreground">
                      {listing.isPublished ? (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Publié
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Non publié
                        </span>
                      )}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  {listing.isPublished ? (
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[listing.status]}
                    >
                      {listing.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">-</Badge>
                  )}
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
      <AlertDialog
        open={confirmDialog?.open || false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.currentStatus
                ? "Dépublier l'annonce"
                : "Publier l'annonce"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.currentStatus
                ? "Êtes-vous sûr de vouloir dépublier cette annonce ? Elle ne sera plus visible sur le site."
                : "Êtes-vous sûr de vouloir publier cette annonce ? Elle sera visible par tous les visiteurs du site."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleTogglePublish(
                    confirmDialog.listingId,
                    confirmDialog.currentStatus
                  );
                }
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
