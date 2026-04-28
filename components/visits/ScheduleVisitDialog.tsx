"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { scheduleVisitSchema } from "@/lib/validators/visit";
import { scheduleVisit } from "@/lib/actions/visit.action";
import { fetchClients } from "@/lib/actions/client.action";
import { fetchListings } from "@/lib/actions/listings.action";
import { useRouter } from "next/navigation";

type FormValues = z.infer<typeof scheduleVisitSchema>;

interface Props {
  prefilledClientId?: string;
  prefilledListingId?: string;
  trigger?: React.ReactNode;
}

export function ScheduleVisitDialog({
  prefilledClientId,
  prefilledListingId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [clientOptions, setClientOptions] = useState<ComboboxOption[]>([]);
  const [listingOptions, setListingOptions] = useState<ComboboxOption[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);

  const clientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchClients = useCallback(async (query: string) => {
    setClientLoading(true);
    try {
      const result = await fetchClients({ search: query || undefined, limit: 20 });
      const clients = result.data?.clients ?? [];
      setClientOptions(
        clients.map((c) => ({
          value: String(c._id),
          label:
            [c.firstName, c.lastName].filter(Boolean).join(" ") || c.phone,
          searchableText: `${c.referenceCode} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.phone}`,
          metadata: c.referenceCode,
        }))
      );
    } finally {
      setClientLoading(false);
    }
  }, []);

  const searchListings = useCallback(async (query: string) => {
    setListingLoading(true);
    try {
      const result = await fetchListings({
        referenceCodeSearch: query || undefined,
        isValidated: true,
        limit: 20,
      });
      const listings = result.data ?? [];
      setListingOptions(
        listings.map((l) => ({
          value: String(l._id),
          label: l.title ?? "Sans titre",
          searchableText: `${l.referenceCode ?? ""} ${l.title ?? ""}`,
          metadata: l.referenceCode,
        }))
      );
    } finally {
      setListingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      searchClients("");
      searchListings("");
    }
  }, [open, searchClients, searchListings]);

  function handleClientSearch(query: string) {
    if (clientTimer.current) clearTimeout(clientTimer.current);
    clientTimer.current = setTimeout(() => searchClients(query), 300);
  }

  function handleListingSearch(query: string) {
    if (listingTimer.current) clearTimeout(listingTimer.current);
    listingTimer.current = setTimeout(() => searchListings(query), 300);
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleVisitSchema),
    defaultValues: {
      clientId: prefilledClientId ?? "",
      listingId: prefilledListingId ?? "",
      isExternalListing: false,
      externalListingRef: "",
      scheduledAt: new Date(),
      notes: "",
    },
  });

  const isExternal = form.watch("isExternalListing");

  async function onSubmit(values: FormValues) {
    const result = await scheduleVisit(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Visite planifiée avec succès");
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Planifier une visite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Planifier une visite</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* External listing toggle */}
            <FormField
              control={form.control}
              name="isExternalListing"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">
                    Bien externe (hors portefeuille)
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Listing selector OR external ref */}
            {isExternal ? (
              <FormField
                control={form.control}
                name="externalListingRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence du bien externe</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Appt Bir el Djir, 3p, 80m²…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="listingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bien immobilier</FormLabel>
                    <FormControl>
                      <Combobox
                        options={listingOptions}
                        value={field.value ?? ""}
                        onSelect={field.onChange}
                        placeholder="Rechercher un bien…"
                        searchPlaceholder="Réf ou titre…"
                        emptyText="Aucun bien trouvé."
                        disabled={!!prefilledListingId}
                        onSearchChange={handleListingSearch}
                        loading={listingLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Client selector */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Combobox
                      options={clientOptions}
                      value={field.value}
                      onSelect={field.onChange}
                      placeholder="Rechercher un client…"
                      searchPlaceholder="Réf, nom ou téléphone…"
                      emptyText="Aucun client trouvé."
                      disabled={!!prefilledClientId}
                      onSearchChange={handleClientSearch}
                      loading={clientLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & time */}
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date et heure</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : String(field.value ?? "").slice(0, 16)
                      }
                      onChange={(e) =>
                        field.onChange(new Date(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instructions, remarques…"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Planifier
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
