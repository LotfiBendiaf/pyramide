"use client";

import { useRouter } from "next/navigation";
import { Circle, Handshake, Loader2, Trophy } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { setClientNegotiationStage } from "@/lib/actions/client.action";
import {
  openNegotiation,
  type NegotiationListingOption,
} from "@/lib/actions/negotiation.action";
import { cn } from "@/lib/utils";

type NegotiationStageChoice = "NEUTRAL" | "IN_NEGOTIATION" | "CLOSED";

type Props = {
  clientId: string;
  pipelineStage?: string;
  listings: NegotiationListingOption[];
};

const OPTIONS: {
  value: NegotiationStageChoice;
  label: string;
  icon: typeof Circle;
  className: string;
}[] = [
  {
    value: "NEUTRAL",
    label: "Neutre",
    icon: Circle,
    className: "text-slate-500",
  },
  {
    value: "IN_NEGOTIATION",
    label: "En négociation",
    icon: Handshake,
    className: "text-purple-600",
  },
  {
    value: "CLOSED",
    label: "Closing",
    icon: Trophy,
    className: "text-green-600",
  },
];

function valueFromPipelineStage(stage?: string): NegotiationStageChoice {
  if (stage === "IN_NEGOTIATION" || stage === "CLOSED") return stage;
  return "NEUTRAL";
}

export default function ClientNegotiationStageSelect({
  clientId,
  pipelineStage,
  listings,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listingId, setListingId] = useState("");
  const [blockHours, setBlockHours] = useState<"24" | "48">("24");
  const [notes, setNotes] = useState("");
  const currentValue = valueFromPipelineStage(pipelineStage);
  const current = OPTIONS.find((option) => option.value === currentValue);
  const CurrentIcon = current?.icon ?? Circle;

  const handleChange = async (newValue: NegotiationStageChoice) => {
    if (newValue === "IN_NEGOTIATION" && currentValue !== "IN_NEGOTIATION") {
      setDialogOpen(true);
      return;
    }

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
  };

  const handleOpenNegotiation = async () => {
    if (!listingId) {
      toast.error("Sélectionnez un bien");
      return;
    }

    setLoading(true);
    const result = await openNegotiation({
      clientId,
      listingId,
      blockHours: Number(blockHours) as 24 | 48,
      notes,
    });
    setLoading(false);

    if (!result.success) {
      toast.error("Erreur", {
        description: result.error?.message,
      });
      return;
    }

    toast.success("Négociation ouverte");
    setDialogOpen(false);
    setListingId("");
    setBlockHours("24");
    setNotes("");
    router.refresh();
  };

  return (
    <>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className="h-8 min-w-[142px]">
          <span className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CurrentIcon className={cn("h-3.5 w-3.5", current?.className)} />
            )}
            {current?.label ?? "Neutre"}
          </span>
        </SelectTrigger>

        <SelectContent>
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", option.className)} />
                  {option.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ouvrir une négociation</DialogTitle>
            <DialogDescription>
              Sélectionnez le bien à bloquer temporairement pour ce client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bien</Label>
              <Select value={listingId} onValueChange={setListingId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un bien" />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing.value} value={listing.value}>
                      <span className="flex flex-col items-start gap-0.5">
                        <span>{listing.label}</span>
                        {(listing.propertyType || listing.address) && (
                          <span className="text-xs text-muted-foreground">
                            {[listing.propertyType, listing.address]
                              .filter(Boolean)
                              .join(" - ")}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {listings.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun bien actif disponible pour une négociation.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Blocage des visites</Label>
              <Select value={blockHours} onValueChange={(value) => setBlockHours(value as "24" | "48")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24h</SelectItem>
                  <SelectItem value="48">48h</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Explication</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ajoutez le contexte de la négociation..."
                className="min-h-28"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleOpenNegotiation}
              disabled={loading || !listingId}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ouvrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
