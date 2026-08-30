"use client";

import { useRouter } from "next/navigation";
import { Circle, Handshake, Loader2, Trophy } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn, formatPriceAlgeria } from "@/lib/utils";
import { updateClientQualification } from "@/lib/actions/client.action";
import { setClientNegotiationStage } from "@/lib/actions/client.action";
import {
  openNegotiation,
  type NegotiationListingOption,
} from "@/lib/actions/negotiation.action";
import { ClientQualification } from "@/constants/values";

type PipelineStatusOption = ClientQualification | "IN_NEGOTIATION" | "CLOSED";
type BlockHoursChoice = "24" | "48" | "OTHER";

type NegotiationDocument = {
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
};

type Props = {
  clientId: string;
  qualificationStatus: ClientQualification;
  pipelineStage?: string;
  listings: NegotiationListingOption[];
  canUseRestrictedStatuses?: boolean;
};

const OPTIONS: {
  value: PipelineStatusOption;
  label: string;
  icon: typeof Circle;
  className: string;
  triggerClassName: string;
  selectedClassName: string;
  category: "qualification" | "negotiation";
  adminOnly?: boolean;
}[] = [
  {
    value: "NEUTRAL",
    label: "Neutre",
    icon: Circle,
    className: "text-slate-500",
    triggerClassName: "border-slate-200 bg-slate-50 text-slate-700",
    selectedClassName: "bg-slate-50 text-slate-700 focus:bg-slate-100",
    category: "qualification",
  },
  {
    value: "NEW",
    label: "Nouveau",
    icon: Circle,
    className: "text-blue-500",
    triggerClassName: "border-blue-200 bg-blue-50 text-blue-700",
    selectedClassName: "bg-blue-50 text-blue-700 focus:bg-blue-100",
    category: "qualification",
  },
  {
    value: "QUALIFIED",
    label: "Qualifié",
    icon: Circle,
    className: "text-green-500",
    triggerClassName: "border-green-200 bg-green-50 text-green-700",
    selectedClassName: "bg-green-50 text-green-700 focus:bg-green-100",
    category: "qualification",
  },
  {
    value: "HOT",
    label: "Chaud",
    icon: Circle,
    className: "text-orange-500",
    triggerClassName: "border-orange-200 bg-orange-50 text-orange-700",
    selectedClassName: "bg-orange-50 text-orange-700 focus:bg-orange-100",
    category: "qualification",
  },
  {
    value: "COLD",
    label: "Froid",
    icon: Circle,
    className: "text-blue-400",
    triggerClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    selectedClassName: "bg-cyan-50 text-cyan-700 focus:bg-cyan-100",
    category: "qualification",
  },
  {
    value: "NO_RESPONSE",
    label: "N'a pas répondu",
    icon: Circle,
    className: "text-red-500",
    triggerClassName: "border-red-200 bg-red-50 text-red-700",
    selectedClassName: "bg-red-50 text-red-700 focus:bg-red-100",
    category: "qualification",
  },
  {
    value: "NOT_RELEVANT",
    label: "Non pertinent",
    icon: Circle,
    className: "text-yellow-500",
    triggerClassName: "border-yellow-200 bg-yellow-50 text-yellow-700",
    selectedClassName: "bg-yellow-50 text-yellow-700 focus:bg-yellow-100",
    category: "qualification",
    adminOnly: true,
  },
  {
    value: "ARCHIVED",
    label: "Archivé",
    icon: Circle,
    className: "text-gray-300",
    triggerClassName: "border-gray-200 bg-gray-50 text-gray-700",
    selectedClassName: "bg-gray-50 text-gray-700 focus:bg-gray-100",
    category: "qualification",
  },
  {
    value: "IN_NEGOTIATION",
    label: "En négociation",
    icon: Handshake,
    className: "text-purple-600",
    triggerClassName: "border-purple-200 bg-purple-50 text-purple-700",
    selectedClassName: "bg-purple-50 text-purple-700 focus:bg-purple-100",
    category: "negotiation",
  },
  {
    value: "CLOSED",
    label: "Closing",
    icon: Trophy,
    className: "text-green-600",
    triggerClassName: "border-green-200 bg-green-50 text-green-700",
    selectedClassName: "bg-green-50 text-green-700 focus:bg-green-100",
    category: "negotiation",
    adminOnly: true,
  },
];

function getCurrentValue(
  qualificationStatus: ClientQualification,
  pipelineStage?: string
): PipelineStatusOption {
  if (pipelineStage === "IN_NEGOTIATION" || pipelineStage === "CLOSED") {
    return pipelineStage as "IN_NEGOTIATION" | "CLOSED";
  }
  return qualificationStatus ?? "NEUTRAL";
}

export default function ClientQualificationAndNegotiationSelect({
  clientId,
  qualificationStatus,
  pipelineStage,
  listings,
  canUseRestrictedStatuses = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [listingId, setListingId] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [blockHours, setBlockHours] = useState<BlockHoursChoice>("24");
  const [customBlockHours, setCustomBlockHours] = useState("72");
  const [notes, setNotes] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadedDocument, setUploadedDocument] =
    useState<NegotiationDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentValue = getCurrentValue(qualificationStatus, pipelineStage);
  const currentOption =
    OPTIONS.find((option) => option.value === currentValue) ?? OPTIONS[0];
  const CurrentIcon = currentOption.icon;
  const archiveReasonId = `archiveReason-${clientId}`;
  const visibleOptions = OPTIONS.filter(
    (option) => canUseRestrictedStatuses || !option.adminOnly
  );

  const filteredListings = listings.filter((listing) => {
    const query = listingSearch.trim().toLowerCase();
    if (!query) return true;
    return [listing.referenceCode, listing.label]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(query));
  });

  const handleChange = async (newValue: PipelineStatusOption) => {
    const selectedOption = OPTIONS.find((option) => option.value === newValue);
    if (selectedOption?.adminOnly && !canUseRestrictedStatuses) {
      toast.error("Action réservée aux administrateurs");
      return;
    }

    // If selecting IN_NEGOTIATION, show dialog
    if (newValue === "IN_NEGOTIATION" && currentValue !== "IN_NEGOTIATION") {
      setDialogOpen(true);
      return;
    }

    if (newValue === "ARCHIVED" && currentValue !== "ARCHIVED") {
      setArchiveDialogOpen(true);
      return;
    }

    // If it's a negotiation status
    if (newValue === "IN_NEGOTIATION" || newValue === "CLOSED") {
      setLoading(true);
      const result = await setClientNegotiationStage(clientId, newValue);
      setLoading(false);

      if (!result.success) {
        toast.error("Erreur", {
          description: result.error?.message,
        });
        return;
      }

      toast.success("Phase négociation mise à jour");
      router.refresh();
    } else {
      // It's a qualification status
      setLoading(true);
      const result = await updateClientQualification(
        clientId,
        newValue as ClientQualification
      );
      setLoading(false);

      if (!result.success) {
        toast.error("Erreur", {
          description: result.error?.message as string,
        });
        return;
      }

      toast.success("Statut mis à jour");
      router.refresh();
    }
  };

  const handleArchiveClient = async () => {
    const trimmedReason = archiveReason.trim();
    if (trimmedReason.length < 5) {
      toast.error("Raison requise", {
        description: "La raison doit contenir au moins 5 caractères.",
      });
      return;
    }

    setLoading(true);
    const result = await updateClientQualification(
      clientId,
      "ARCHIVED",
      trimmedReason
    );
    setLoading(false);

    if (!result.success) {
      toast.error("Erreur", {
        description: result.error?.message as string,
      });
      return;
    }

    toast.success("Demande d'archivage envoyée");
    setArchiveDialogOpen(false);
    setArchiveReason("");
    router.refresh();
  };

  const handleOpenNegotiation = async () => {
    if (!listingId) {
      toast.error("Erreur", {
        description: "Sélectionnez un bien pour ouvrir la négociation",
      });
      return;
    }

    const selectedBlockHours =
      blockHours === "OTHER" ? Number(customBlockHours) : Number(blockHours);

    if (
      !Number.isInteger(selectedBlockHours) ||
      selectedBlockHours < 24 ||
      selectedBlockHours > 2160
    ) {
      toast.error("Durée invalide", {
        description: "Choisissez une durée entre 24h et 2160h.",
      });
      return;
    }

    setLoading(true);
    const result = await openNegotiation({
      clientId,
      listingId,
      blockHours: selectedBlockHours,
      notes,
      document: uploadedDocument ?? undefined,
    });
    setLoading(false);

    if (!result.success) {
      toast.error("Erreur", {
        description: result.error?.message,
      });
      return;
    }

    toast.success("Négociation ouverte", {
      description: `Bien sélectionné: ${
        listings.find((l) => l.value === listingId)?.label || listingId
      }`,
    });
    setDialogOpen(false);
    setListingId("");
    setBlockHours("24");
    setCustomBlockHours("72");
    setNotes("");
    setUploadedDocument(null);
    router.refresh();
  };

  const handleDocumentUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Configuration Cloudinary manquante");
      return;
    }

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      toast.error("Configuration Cloudinary manquante");
      return;
    }

    setUploadingDocument(true);
    setUploadedDocument(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );
      formData.append("folder", "pyramide/negotiations");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message ||
            "Erreur lors du téléchargement du document"
        );
      }

      const result = await response.json();
      setUploadedDocument({
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        originalFilename: result.original_filename ?? file.name,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
      });
      toast.success("Document téléchargé");
    } catch (error) {
      toast.error("Échec du téléchargement", {
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'upload",
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  return (
    <>
      <Select
        value={currentValue}
        onValueChange={handleChange}
        disabled={loading}
      >
        <SelectTrigger
          className={cn(
            "h-8 w-[155px] justify-between rounded-md px-2.5 text-xs font-medium hover:bg-muted/70",
            currentOption.triggerClassName
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CurrentIcon
                className={cn("size-3.5", currentOption.className)}
                aria-hidden="true"
              />
            )}
            <span className="truncate">{currentOption.label}</span>
          </span>
        </SelectTrigger>
        <SelectContent className="min-w-[190px]">
          {/* Qualification section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Qualification
          </div>
          {visibleOptions
            .filter((opt) => opt.category === "qualification")
            .map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={cn(
                  option.value === currentValue && option.selectedClassName
                )}
              >
                <span className="flex items-center gap-2">
                  <option.icon className={cn("h-3 w-3", option.className)} />
                  {option.label}
                </span>
              </SelectItem>
            ))}

          {/* Divider */}
          <div className="my-1 h-px bg-border" />

          {/* Negotiation section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Négociation
          </div>
          {visibleOptions
            .filter((opt) => opt.category === "negotiation")
            .map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={cn(
                  option.value === currentValue && option.selectedClassName
                )}
              >
                <span className="flex items-center gap-2">
                  <option.icon className={cn("h-3 w-3", option.className)} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Dialog for opening negotiation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ouvrir une négociation</DialogTitle>
            <DialogDescription>
              Sélectionnez un bien et configurez les paramètres de la
              négociation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listing">Bien immobilier</Label>
              <Select value={listingId} onValueChange={setListingId}>
                <SelectTrigger id="listing">
                  <SelectValue placeholder="Sélectionner un bien" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-3">
                    <Input
                      id="listingSearch"
                      placeholder="Référence ou titre du bien"
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredListings.length > 0 ? (
                    filteredListings.map((listing) => (
                      <SelectItem key={listing.value} value={listing.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{listing.label}</span>
                          {listing.price && (
                            <span className="text-xs text-muted-foreground">
                              {formatPriceAlgeria(listing.price)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Aucun bien correspondant
                    </div>
                  )}
                </SelectContent>
              </Select>
              {(!listings || listings.length === 0) && (
                <p className="text-xs text-amber-600">
                  ⚠️ Aucun bien disponible pour cette négociation. Vérifiez que
                  vous avez des biens qui ne sont pas archivés ou vendus.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="blockHours">Blocage (heures)</Label>
              <Select
                value={blockHours}
                onValueChange={(v) => setBlockHours(v as BlockHoursChoice)}
              >
                <SelectTrigger id="blockHours">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 heures</SelectItem>
                  <SelectItem value="48">48 heures</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
              {blockHours === "OTHER" && (
                <Input
                  type="number"
                  min={24}
                  max={2160}
                  step={1}
                  value={customBlockHours}
                  onChange={(e) => setCustomBlockHours(e.target.value)}
                  placeholder="Durée en heures"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Ajouter des notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Document (optionnel)</Label>
              <input
                ref={fileInputRef}
                id="document"
                type="file"
                className="hidden"
                onChange={handleDocumentUpload}
                disabled={uploadingDocument}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDocument}
              >
                {uploadingDocument ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upload...
                  </>
                ) : (
                  "Importer un document"
                )}
              </Button>
              {uploadedDocument && (
                <p className="text-sm text-green-600">
                  ✓ {uploadedDocument.originalFilename}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleOpenNegotiation}
              disabled={
                loading || !listingId || !listings || listings.length === 0
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ouverture...
                </>
              ) : (
                "Ouvrir la négociation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open);
          if (!open) setArchiveReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archiver le client</DialogTitle>
            <DialogDescription>
              Indiquez la raison de l&apos;archivage. Le client restera actif
              jusqu&apos;à validation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={archiveReasonId}>Raison d&apos;archivage</Label>
            <Textarea
              id={archiveReasonId}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Ex: demande non pertinente, client injoignable, dossier abandonné..."
              className="min-h-28"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveClient}
              disabled={loading || archiveReason.trim().length < 5}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer la demande"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
