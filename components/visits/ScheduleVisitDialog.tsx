"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, CalendarPlus, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type FormValues = z.infer<typeof scheduleVisitSchema>;

const generateTimeOptions = () => {
  const times: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      times.push(
        `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
      );
    }
  }

  return times;
};

const TIME_OPTIONS = generateTimeOptions();

interface Props {
  prefilledClientId?: string;
  prefilledListingId?: string;
  prefilledClientOption?: ComboboxOption;
  prefilledListingOption?: ComboboxOption;
  trigger?: React.ReactNode;
}

function mergeOption(
  options: ComboboxOption[],
  option?: ComboboxOption
): ComboboxOption[] {
  if (!option || options.some((item) => item.value === option.value)) {
    return options;
  }

  return [option, ...options];
}

function applyDatePart(current: Date | string | undefined, selected: Date) {
  const next = current ? new Date(current) : new Date();
  next.setFullYear(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate()
  );
  return next;
}

function applyTimePart(current: Date | string | undefined, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = current ? new Date(current) : new Date();
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function ScheduleVisitDialog({
  prefilledClientId,
  prefilledListingId,
  prefilledClientOption,
  prefilledListingOption,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [clientOptions, setClientOptions] = useState<ComboboxOption[]>(
    prefilledClientOption ? [prefilledClientOption] : []
  );
  const [listingOptions, setListingOptions] = useState<ComboboxOption[]>(
    prefilledListingOption ? [prefilledListingOption] : []
  );
  const [clientLoading, setClientLoading] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);

  const clientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchClients = useCallback(
    async (query: string) => {
      setClientLoading(true);
      try {
        const result = await fetchClients({
          search: query || undefined,
          limit: 50,
        });
        const clients = result.data?.clients ?? [];
        const options = clients.map((c) => ({
          value: String(c._id),
          label: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.phone,
          searchableText: `${c.referenceCode} ${c.firstName ?? ""} ${
            c.lastName ?? ""
          } ${c.phone}`,
          metadata: c.referenceCode,
          description:
            [c.firstName, c.lastName].filter(Boolean).join(" ") && c.phone
              ? c.phone
              : undefined,
        }));
        setClientOptions(mergeOption(options, prefilledClientOption));
      } finally {
        setClientLoading(false);
      }
    },
    [prefilledClientOption]
  );

  const searchListings = useCallback(
    async (query: string) => {
      setListingLoading(true);
      try {
        const result = await fetchListings({
          referenceCodeSearch: query || undefined,
          isValidated: true,
          limit: 20,
        });
        const listings = result.data ?? [];
        const options = listings.map((l) => ({
          value: String(l._id),
          label: l.title ?? "Sans titre",
          searchableText: `${l.referenceCode ?? ""} ${l.title ?? ""}`,
          metadata: l.referenceCode,
        }));
        setListingOptions(mergeOption(options, prefilledListingOption));
      } finally {
        setListingLoading(false);
      }
    },
    [prefilledListingOption]
  );

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
      scheduledAt: applyTimePart(new Date(), "09:00"),
      status: "SCHEDULED",
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
    toast.success("Visite planifiée");
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
                      listMaxHeight="min(420px, calc(100vh - 360px))"
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
                  <div className="grid gap-2 sm:grid-cols-[1fr_132px]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {field.value
                              ? format(
                                  new Date(field.value),
                                  "EEEE dd MMM yyyy",
                                  {
                                    locale: fr,
                                  }
                                )
                              : "Choisir une date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            if (!date) return;
                            field.onChange(applyDatePart(field.value, date));
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Select
                      value={
                        field.value
                          ? format(new Date(field.value), "HH:mm")
                          : "09:00"
                      }
                      onValueChange={(time) =>
                        field.onChange(applyTimePart(field.value, time))
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Heure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[220px]">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["09:00", "11:00", "14:00", "16:00"].map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          field.onChange(applyTimePart(field.value, time))
                        }
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
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
                Fermer
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Planifier la visite
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
