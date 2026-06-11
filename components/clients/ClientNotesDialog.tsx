"use client";

import { useEffect, useState } from "react";
import {
  NotebookPen,
  MapPin,
  Wallet,
  Building2,
  LayoutGrid,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateClientNotes } from "@/lib/actions/client.action";
import { cn } from "@/lib/utils";

interface ClientNotesDialogProps {
  clientId: string;
  clientName: string;
  initialNotes?: string;
  preferredLocation?: string;
  budgetMin?: number;
  budgetMax?: number;
  priceCurrency?: string;
  wantedPropertyType?: string;
  rooms?: number;
}

export default function ClientNotesDialog({
  clientId,
  clientName,
  initialNotes = "",
  preferredLocation,
  budgetMin,
  budgetMax,
  priceCurrency,
  wantedPropertyType,
  rooms,
}: ClientNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const hasNotes = savedNotes.trim().length > 0;

  useEffect(() => {
    setNotes(initialNotes);
    setSavedNotes(initialNotes);
  }, [initialNotes]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateClientNotes(clientId, notes);
    setSaving(false);

    if (result.success) {
      setSavedNotes(notes);
      toast.success("Compte rendu enregistré");
      setOpen(false);
    } else {
      toast.error(result.error?.message ?? "Erreur lors de l'enregistrement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "h-8 w-[112px] justify-start gap-1.5 rounded-md px-2.5 text-xs font-medium",
            hasNotes
              ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
              : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
          )}
          title="Compte rendu"
          onClick={(e) => e.stopPropagation()}
        >
          <NotebookPen className="size-3.5" aria-hidden="true" />
          <span className="truncate">{hasNotes ? "Rédigé" : "À remplir"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Compte rendu — {clientName}</DialogTitle>
        </DialogHeader>
        {(preferredLocation ||
          budgetMin ||
          budgetMax ||
          wantedPropertyType ||
          rooms !== undefined) && (
          <div className="rounded-lg border bg-muted/30 p-3 grid grid-cols-2 gap-2 text-sm">
            {preferredLocation && (
              <div className="flex items-start gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    Zone souhaitée
                  </p>
                  <p className="font-medium">{preferredLocation}</p>
                </div>
              </div>
            )}
            {(budgetMin !== undefined || budgetMax !== undefined) && (
              <div className="flex items-start gap-2 col-span-2">
                <Wallet className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    Budget
                  </p>
                  <p className="font-medium flex items-center gap-3">
                    {budgetMin !== undefined ? budgetMin.toLocaleString() : "—"}
                    <ArrowRight size={16} />
                    {budgetMax !== undefined
                      ? budgetMax.toLocaleString()
                      : "—"}{" "}
                    <span className="text-muted-foreground font-normal">
                      {priceCurrency ?? "DZD"}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {wantedPropertyType && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    Type de bien
                  </p>
                  <p className="font-medium">{wantedPropertyType}</p>
                </div>
              </div>
            )}
            {rooms !== undefined && (
              <div className="flex items-start gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    Pièces
                  </p>
                  <p className="font-medium">{rooms}</p>
                </div>
              </div>
            )}
          </div>
        )}
        <Textarea
          placeholder="Saisir le compte rendu..."
          className="min-h-[160px] resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
