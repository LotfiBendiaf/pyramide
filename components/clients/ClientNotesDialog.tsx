"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
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

interface ClientNotesDialogProps {
  clientId: string;
  clientName: string;
  initialNotes?: string;
}

export default function ClientNotesDialog({
  clientId,
  clientName,
  initialNotes = "",
}: ClientNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateClientNotes(clientId, notes);
    setSaving(false);

    if (result.success) {
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
          size="icon"
          variant={initialNotes ? "secondary" : "ghost"}
          className="h-8 w-8"
          title="Compte rendu"
          onClick={(e) => e.stopPropagation()}
        >
          <NotebookPen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Compte rendu — {clientName}</DialogTitle>
        </DialogHeader>
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
