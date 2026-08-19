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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  FileText,
  Loader2,
  ShowerHead,
  Radio,
  MoreHorizontal,
  MapPin,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import {
  formatDate,
  formatPrice,
  formatPriceAlgeria,
  getGoogleMapsUrl,
} from "@/lib/utils";
import {
  toggleListingPublished,
  toggleListingValidation,
  approveListingWithoutReference,
  setListingNeutre,
} from "@/lib/actions/listings.action";
import { STATUS_COLORS } from "@/constants/values";
import { useState } from "react";
import { toast } from "sonner";
import ROUTES from "@/constants/routes";
import ListingAgentSelect from "./ListingAgentSelect";

interface ListingTableProps {
  listings: Listing[];
  agents?: User[];
  canAssignAgent?: boolean;
}

type ValidationState = "validé" | "approuvé" | "neutre" | "archivé";

function getValidationState(listing: Listing): ValidationState {
  if (listing.archived) return "archivé";
  if (listing.validationStatus === "APPROVED") return "approuvé";
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
  if (state === "approuvé")
    return (
      <Badge variant="blue" className="text-xs">
        Approuvé
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

function hasNegotiationPipeline(listing: Listing) {
  return listing.pipelineStatus === "UNDER_NEGOTIATION";
}

export function ListingTable({
  listings,
  agents = [],
  canAssignAgent = false,
}: ListingTableProps) {
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

  const handleApprove = async (listingId: string) => {
    setValidatingStates((prev) => ({ ...prev, [listingId]: true }));
    const result = await approveListingWithoutReference(listingId);
    if (result.success) {
      toast.success("Annonce approuvée");
    } else {
      toast.error(result.error?.message || "Erreur lors de l'approbation");
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

  const renderValidationMenu = (listing: Listing) => {
    const vState = getValidationState(listing);
    const isLoading = validatingStates[listing._id];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isLoading} aria-label="Actions de validation">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={vState === "validé"} onClick={() => handleValidate(listing._id)}>Valider</DropdownMenuItem>
          <DropdownMenuItem disabled={vState === "validé" || vState === "approuvé"} onClick={() => handleApprove(listing._id)}>Approuver</DropdownMenuItem>
          <DropdownMenuItem disabled={vState === "neutre"} onClick={() => handleSetNeutre(listing._id)}>Mettre en Neutre</DropdownMenuItem>
          <DropdownMenuItem disabled={vState === "archivé"} className="text-destructive focus:text-destructive" onClick={() => setArchiveDialog({ open: true, listingId: listing._id })}>Archiver</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card>
      <CardContent className="p-3 md:hidden">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-muted-foreground" onClick={handleSortByRef}>
            Trier par référence <RefSortIcon className="h-3.5 w-3.5" />
          </Button>
          {listings.map((listing) => {
            const vState = getValidationState(listing);
            const documentsCount = listing.documents?.length ?? 0;
            return (
              <article key={listing._id} className="rounded-xl border bg-card p-3 shadow-sm">
                <div className="flex gap-3">
                  <Image src={listing?.images?.[0]?.url || "/placeholder.png"} alt={listing.title || "Image du bien"} width={80} height={72} className="h-[72px] w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {listing.referenceCode && <Badge variant="outline" className="font-mono text-[11px]">{listing.referenceCode}</Badge>}
                          <Badge variant="default" className="text-[11px]">{listing.propertyTypeCustom || listing.propertyType}</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold">{listing.title || "Bien immobilier"}</p>
                      </div>
                      {renderValidationMenu(listing)}
                    </div>
                    <a
                      href={getGoogleMapsUrl(listing.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3 shrink-0" />{listing.location.city || "Localisation non renseignée"}
                    </a>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-sm">
                  <div><p className="text-[11px] text-muted-foreground">Prix</p><p className="font-semibold">{listing.price ? formatPriceAlgeria(listing.price) : "À estimer"}</p></div>
                  <div><p className="text-[11px] text-muted-foreground">Surface</p><p className="font-semibold">{listing.features.area || "—"} m²</p></div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <ValidationBadge state={vState} />
                  <Badge variant="outline" className={STATUS_COLORS[listing.status]}>{listing.status}</Badge>
                  {hasNegotiationPipeline(listing) && <Badge variant="purple" className="text-xs"><Radio className="h-3 w-3" />Négociation</Badge>}
                  {documentsCount > 0 && <Badge variant="outline" className="gap-1 text-xs"><FileText className="h-3 w-3" />{documentsCount}</Badge>}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t pt-3">
                  <Button className="flex-1" size="sm" onClick={() => window.open(ROUTES.LISTING_DETAIL_DASHBOARD(listing._id), "_blank")}>Ouvrir le bien</Button>
                  <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                    <Switch checked={listing.isPublished} onCheckedChange={() => openConfirmDialog(listing._id, listing.isPublished)} disabled={publishingStates[listing._id]} aria-label={listing.isPublished ? "Dépublier" : "Publier"} />
                    <span className="text-xs text-muted-foreground">{listing.isPublished ? "Publié" : "Privé"}</span>
                  </div>
                </div>
                {canAssignAgent && <div className="mt-2" onClick={(e) => e.stopPropagation()}><ListingAgentSelect listingId={listing._id} agents={agents} value={listing.agent?._id} /></div>}
              </article>
            );
          })}
        </div>
      </CardContent>
      <CardContent className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">
                <button
                  onClick={handleSortByRef}
                  className="flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  Référence
                  <RefSortIcon className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Bien</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Specs</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="w-[170px]">État</TableHead>
              <TableHead className="w-[140px]">Validation / ajout</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {listings.map((listing) => {
              const vState = getValidationState(listing);
              const isLoading = validatingStates[listing._id];
              const documentsCount = listing.documents?.length ?? 0;

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
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell
                    className="font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-start gap-2">
                      {listing.referenceCode && (
                        <Badge variant="outline" className="font-mono">
                          {listing.referenceCode}
                        </Badge>
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
                            disabled={
                              vState === "validé" || vState === "approuvé"
                            }
                            onClick={() => handleApprove(listing._id)}
                          >
                            <Badge variant="blue" className="text-xs mr-2">
                              Approuvé
                            </Badge>
                            Approuver
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
                      {hasNegotiationPipeline(listing) && (
                        <Badge variant="purple" className="text-xs">
                          <Radio className="h-3 w-3" />
                          En Négociation
                        </Badge>
                      )}
                      {documentsCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="gap-1 border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                              <FileText className="h-3 w-3" />
                              {documentsCount}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {documentsCount > 1
                              ? `${documentsCount} documents uploadés`
                              : "1 document uploadé"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={listing?.images?.[0]?.url || "/placeholder.png"}
                        alt={listing.title || "Image de l'annonce"}
                        width={64}
                        height={48}
                        className="h-12 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0 space-y-1">
                        <Badge variant="default">
                          {listing.propertyTypeCustom || listing.propertyType}
                        </Badge>

                        {listing.propertyType === "Appartement" && (
                          <div className="flex items-center gap-1">
                            <Badge variant="success">
                              F
                              {listing.features.bedrooms
                                ? listing.features.bedrooms
                                : "?"}
                            </Badge>
                            {listing.features.etage && (
                              <p className="text-xs text-muted-foreground">
                                {listing.features.etage}ème étage
                              </p>
                            )}
                          </div>
                        )}
                        {listing.title && (
                          <p className="max-w-[210px] truncate text-xs text-muted-foreground">
                            {listing.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <a
                      href={getGoogleMapsUrl(listing.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block space-y-1 hover:text-primary hover:underline"
                    >
                      <p className="text-sm font-medium">
                        {listing.location.city || "-"}
                      </p>
                      {listing.location.address && (
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {listing.location.address}
                        </p>
                      )}
                    </a>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium">
                      {listing.price ? (
                        <>
                          {formatPriceAlgeria(listing.price)}
                          <p className="text-xs font-normal text-muted-foreground">
                            {formatPrice(listing.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-yellow-600">À estimer</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant="outline">
                        {listing.features.area} m²
                      </Badge>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {listing.features.bedrooms || 0}
                          <Bed className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex items-center gap-1">
                          {listing.features.bathrooms || 0}
                          <ShowerHead className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex items-center gap-1">
                          {listing.features.parking ? (
                            "Parking"
                          ) : (
                            <span className="text-muted-foreground/70">
                              Sans parking
                            </span>
                          )}
                          <Car className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canAssignAgent ? (
                      <ListingAgentSelect
                        listingId={listing._id}
                        agents={agents}
                        value={listing.agent?._id}
                      />
                    ) : listing.agent ? (
                      <Badge variant="outline">
                        {`${listing.agent.firstname ?? ""} ${
                          listing.agent.lastname ?? ""
                        }`.trim()}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
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
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[listing.status]}
                      >
                        {listing.status}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {listing.validatedAt
                          ? formatDate(listing.validatedAt)
                          : listing.createdAt
                            ? formatDate(listing.createdAt)
                          : "-"}
                      </p>
                      {listing.validatedAt && listing.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Ajouté {formatDate(listing.createdAt)}
                        </p>
                      )}
                    </div>
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
