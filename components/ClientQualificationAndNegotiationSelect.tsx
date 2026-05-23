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
};

const OPTIONS: {
  value: PipelineStatusOption;
  label: string;
  icon: typeof Circle;
  className: string;
  category: "qualification" | "negotiation";
}[] = [
  {
    value: "NEUTRAL",
    label: "Neutre",
    icon: Circle,
    className: "text-slate-500",
    category: "qualification",
  },
  {
    value: "NEW",
    label: "Nouveau",
    icon: Circle,
    className: "text-blue-500",
    category: "qualification",
  },
  {
    value: "QUALIFIED",
    label: "Qualifié",
    icon: Circle,
    className: "text-green-500",
    category: "qualification",
  },
  {
    value: "HOT",
    label: "Chaud",
    icon: Circle,
    className: "text-orange-500",
    category: "qualification",
  },
  {
    value: "COLD",
    label: "Froid",
    icon: Circle,
    className: "text-blue-400",
    category: "qualification",
  },
  {
    value: "NO_RESPONSE",
    label: "N'a pas répondu",
    icon: Circle,
    className: "text-red-500",
    category: "qualification",
  },
  {
    value: "NOT_RELEVANT",
    label: "Non pertinent",
    icon: Circle,
    className: "text-yellow-500",
    category: "qualification",
  },
  {
    value: "ARCHIVED",
    label: "Archivé",
    icon: Circle,
    className: "text-gray-300",
    category: "qualification",
  },
  {
    value: "IN_NEGOTIATION",
    label: "En négociation",
    icon: Handshake,
    className: "text-purple-600",
    category: "negotiation",
  },
  {
    value: "CLOSED",
    label: "Closing",
    icon: Trophy,
    className: "text-green-600",
    category: "negotiation",
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
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [listingId, setListingId] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [blockHours, setBlockHours] = useState<BlockHoursChoice>("24");
  const [customBlockHours, setCustomBlockHours] = useState("72");
  const [notes, setNotes] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadedDocument, setUploadedDocument] =
    useState<NegotiationDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentValue = getCurrentValue(qualificationStatus, pipelineStage);
  const archiveReasonId = `archiveReason-${clientId}`;

  const filteredListings = listings.filter((listing) => {
    const query = listingSearch.trim().toLowerCase();
    if (!query) return true;
    return [listing.referenceCode, listing.label]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(query));
  });

  const handleChange = async (newValue: PipelineStatusOption) => {
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

    toast.success("Client archivé");
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

    const parsedDepositAmount = depositAmount.trim()
      ? Number(depositAmount)
      : undefined;

    if (
      parsedDepositAmount !== undefined &&
      (!Number.isFinite(parsedDepositAmount) || parsedDepositAmount <= 0)
    ) {
      toast.error("Montant invalide", {
        description: "Le versement doit être un montant positif.",
      });
      return;
    }

    setLoading(true);
    const result = await openNegotiation({
      clientId,
      listingId,
      depositAmount: parsedDepositAmount,
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
    setDepositAmount("");
    setBlockHours("24");
    setCustomBlockHours("72");
    setNotes("");
    setUploadedDocument(null);
    router.refresh();
  };

  const handleDocumentUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedDocument(data.document);
      toast.success("Document uploadé");
    } catch {
      toast.error("Erreur lors de l'upload");
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
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* Qualification section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Qualification
          </div>
          {OPTIONS.filter((opt) => opt.category === "qualification").map(
            (option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <option.icon className={cn("h-3 w-3", option.className)} />
                  {option.label}
                </span>
              </SelectItem>
            )
          )}

          {/* Divider */}
          <div className="my-1 h-px bg-border" />

          {/* Negotiation section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Négociation
          </div>
          {OPTIONS.filter((opt) => opt.category === "negotiation").map(
            (option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <option.icon className={cn("h-3 w-3", option.className)} />
                  {option.label}
                </span>
              </SelectItem>
            )
          )}
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
              <Label htmlFor="depositAmount">Versement (DZD)</Label>
              <Input
                id="depositAmount"
                type="number"
                min={0}
                step={1}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Montant du dépôt si le client a versé"
              />
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
              Indiquez la raison de l&apos;archivage. Le client ne sera plus
              visible dans la liste active.
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
                  Archivage...
                </>
              ) : (
                "Archiver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
