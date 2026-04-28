"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, XCircle, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  completeVisitSchema,
  cancelVisitSchema,
} from "@/lib/validators/visit";
import {
  completeVisit,
  cancelVisit,
  markVisitNoShow,
} from "@/lib/actions/visit.action";
import { z } from "zod";

type CompleteValues = z.infer<typeof completeVisitSchema>;
type CancelValues = z.infer<typeof cancelVisitSchema>;

/* ─── Complete ─── */
export function CompleteVisitDialog({ visitId }: { visitId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<CompleteValues>({
    resolver: zodResolver(completeVisitSchema),
    defaultValues: { visitId, outcome: "INTERESTED", notes: "" },
  });

  async function onSubmit(values: CompleteValues) {
    const result = await completeVisit(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Visite complétée");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Compléter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compléter la visite</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Résultat</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INTERESTED">Intéressé</SelectItem>
                      <SelectItem value="NOT_INTERESTED">Pas intéressé</SelectItem>
                      <SelectItem value="UNDECIDED">Indécis</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Retour de visite…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Cancel ─── */
export function CancelVisitDialog({ visitId }: { visitId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<CancelValues>({
    resolver: zodResolver(cancelVisitSchema),
    defaultValues: { visitId, notes: "" },
  });

  async function onSubmit(values: CancelValues) {
    const result = await cancelVisit(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Visite annulée");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive border-red-200 hover:bg-red-50">
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Annuler
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Annuler la visite</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Motif d'annulation…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Retour
              </Button>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Annuler la visite
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── No Show ─── */
export function NoShowButton({ visitId }: { visitId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const result = await markVisitNoShow(visitId);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
    } else {
      toast.success("Visite marquée absent");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-amber-600 border-amber-200 hover:bg-amber-50"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <UserX className="mr-1 h-3.5 w-3.5" />
      )}
      Absent
    </Button>
  );
}
