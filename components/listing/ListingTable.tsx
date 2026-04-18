"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Bed,
  Car,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  ShowerHead,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { formatDate, formatPrice, formatPriceAlgeria } from "@/lib/utils";
import { StatusAction } from "./StatusButton";
import {
  updateListingStatus,
  toggleListingPublished,
  toggleListingValidation,
  setListingNeutre,
} from "@/lib/actions/listings.action";
import { STATUS_COLORS } from "@/constants/values";
import { useState } from "react";
import { toast } from "sonner";
import ROUTES from "@/constants/routes";

interface ListingTableProps {
  listings: Listing[];
}

type ValidationState = "validé" | "neutre" | "archivé";

function getValidationState(listing: Listing): ValidationState {
  if (listing.archived) return "archivé";
  if (listing.isValidated) return "validé";
  return "neutre";
}

function ValidationBadge({ state }: { state: ValidationState }) {
  if (state === "validé")
    return (
      <Badge variant="success" className="text-xs">
        Validé
      </Badge>
    );
  if (state === "archivé")
    return (
      <Badge variant="destructive" className="text-xs">
        Archivé
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs">
      Neutre
    </Badge>
  );
}

export function ListingTable({ listings }: ListingTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy");
  const currentSortOrder = searchParams.get("sortOrder") as
    | "asc"
    | "desc"
    | null;

  const handleSortByRef = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === "referenceCode") {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", "referenceCode");
      params.set("sortOrder", "desc");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const RefSortIcon =
    currentSortBy === "referenceCode"
      ? currentSortOrder === "asc"
        ? ArrowUp
        : ArrowDown
      : ArrowDownUp;

  const [publishingStates, setPublishingStates] = useState<
    Record<string, boolean>
  >({});
  const [validatingStates, setValidatingStates] = useState<
    Record<string, boolean>
  >({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    listingId: string;
    currentStatus: boolean;
  } | null>(null);
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    listingId: string;
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

  const handleValidate = async (listingId: string) => {
    setValidatingStates((prev) => ({ ...prev, [listingId]: true }));
    const result = await toggleListingValidation(listingId, false);
    if (result.success) {
      toast.success(`Annonce validée — Réf : ${result.data?.referenceCode}`);
    } else {
      toast.error(result.error?.message || "Erreur lors de la validation");
    }
    setValidatingStates((prev) => ({ ...prev, [listingId]: false }));
  };

  const handleSetNeutre = async (listingId: string) => {
    setValidatingStates((prev) => ({ ...prev, [listingId]: true }));
    const result = await setListingNeutre(listingId);
    if (result.success) {
      toast.success("Annonce remise en Neutre");
    } else {
      toast.error(result.error?.message || "Erreur");
    }
    setValidatingStates((prev) => ({ ...prev, [listingId]: false }));
  };

  const handleConfirmArchive = async () => {
    if (!archiveDialog) return;
    const { listingId } = archiveDialog;
    setArchiveDialog(null);
    setValidatingStates((prev) => ({ ...prev, [listingId]: true }));
    const result = await toggleListingValidation(listingId, true);
    if (result.success) {
      toast.success("Annonce archivée");
    } else {
      toast.error(result.error?.message || "Erreur lors de l'archivage");
    }
    setValidatingStates((prev) => ({ ...prev, [listingId]: false }));
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
              <TableHead>
                <button
                  onClick={handleSortByRef}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Référence
                  <RefSortIcon className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville & Quartier</TableHead>
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
            {listings.map((listing) => {
              const vState = getValidationState(listing);
              const isLoading = validatingStates[listing._id];

              return (
                <TableRow
                  key={listing._id}
                  onClick={() =>
                    window.open(
                      ROUTES.LISTING_DETAIL_DASHBOARD(listing._id),
                      "_blank"
                    )
                  }
                  onAuxClick={(e) =>
                    e.button === 1 &&
                    window.open(
                      ROUTES.LISTING_DETAIL_DASHBOARD(listing._id),
                      "_blank"
                    )
                  }
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell
                    className="font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-2">
                      {listing.referenceCode && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {listing.referenceCode}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                            disabled={isLoading}
                          >
                            <span className="flex items-center gap-1">
                              {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <ValidationBadge state={vState} />
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </>
                              )}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            disabled={vState === "validé"}
                            onClick={() => handleValidate(listing._id)}
                          >
                            <Badge variant="success" className="text-xs mr-2">
                              Validé
                            </Badge>
                            Valider
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={vState === "neutre"}
                            onClick={() => handleSetNeutre(listing._id)}
                          >
                            <Badge variant="secondary" className="text-xs mr-2">
                              Neutre
                            </Badge>
                            Mettre en Neutre
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={vState === "archivé"}
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setArchiveDialog({
                                open: true,
                                listingId: listing._id,
                              })
                            }
                          >
                            <Badge
                              variant="destructive"
                              className="text-xs mr-2"
                            >
                              Archivé
                            </Badge>
                            Archiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Image
                      src={listing?.images?.[0]?.url || "/placeholder.png"}
                      alt={listing.title || "Image de l'annonce"}
                      width={64}
                      height={48}
                      className="h-12 w-16 object-cover rounded-md"
                    />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="default">
                        {listing.propertyTypeCustom || listing.propertyType}
                      </Badge>

                      {listing.propertyType === "Appartement" &&
                        listing.features.etage && (
                          <div className="flex gap-1 items-center">
                            <Badge variant="success">
                              F{listing.features.bedrooms}
                            </Badge>
                            <p className="text-muted-foreground text-xs">
                              {listing.features.etage}ème étage
                            </p>
                          </div>
                        )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {listing.location.city}
                      </p>
                      {listing.location.address && (
                        <p className="text-xs text-muted-foreground">
                          {listing.location.address}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      {listing.price ? (
                        <>
                          {formatPriceAlgeria(listing.price)}
                          <p className="text-muted-foreground text-xs">
                            {formatPrice(listing.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-yellow-600">À estimer</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{listing.features.area} m²</Badge>
                    <div className="flex gap-2 items-center mt-2">
                      <div className="flex gap-2 items-center">
                        {listing.features.bedrooms}{" "}
                        <Bed className="inline h-4 w-4" />
                      </div>
                      <div className="flex gap-2 items-center">
                        {listing.features.bathrooms}
                        <ShowerHead className="inline h-4 w-4" />
                      </div>
                      <div className="flex gap-2 items-center">
                        {listing.features.parking
                          ? "Parking"
                          : "Pas de Parking"}
                        <Car className="inline h-4 w-4" />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {listing.agent
                        ? `${listing.agent.firstname ?? ""} ${listing.agent.lastname ?? ""}`.trim()
                        : "-"}
                    </Badge>
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

                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusAction
                      status={listing.status}
                      onChange={(newStatus) => {
                        updateListingStatus(listing._id, newStatus);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      {/* Publish confirm dialog */}
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

      {/* Archive confirm dialog */}
      <AlertDialog
        open={archiveDialog?.open || false}
        onOpenChange={(open) => !open && setArchiveDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver l&apos;annonce</AlertDialogTitle>
            <AlertDialogDescription>
              Cette annonce sera archivée et disparaîtra de la liste principale.
              Vous pourrez la retrouver dans les archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
