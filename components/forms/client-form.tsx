"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { createClient } from "@/lib/actions/client.action";
import { clientSchema } from "@/lib/validators/client";
import { ClientType } from "@/models/client.model";

import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";
import { WILAYAS } from "@/constants/values";

type ClientFormValues = z.infer<typeof clientSchema>;

const COUNTRY_CODES = [
  { id: "DZ", code: "+213", flag: "🇩🇿", label: "Algérie" },
  { id: "FR", code: "+33",  flag: "🇫🇷", label: "France" },
  { id: "GB", code: "+44",  flag: "🇬🇧", label: "Royaume-Uni" },
  { id: "ES", code: "+34",  flag: "🇪🇸", label: "Espagne" },
  { id: "BE", code: "+32",  flag: "🇧🇪", label: "Belgique" },
  { id: "TN", code: "+216", flag: "🇹🇳", label: "Tunisie" },
  { id: "US", code: "+1",   flag: "🇺🇸", label: "États-Unis" },
  { id: "CA", code: "+1",   flag: "🇨🇦", label: "Canada" },
  { id: "SA", code: "+966", flag: "🇸🇦", label: "Arabie Saoudite" },
  { id: "QA", code: "+974", flag: "🇶🇦", label: "Qatar" },
  { id: "AE", code: "+971", flag: "🇦🇪", label: "Émirats Arabes Unis" },
] as const;

type CountryId = (typeof COUNTRY_CODES)[number]["id"];

const WANTED_PROPERTY_TYPES = [
  "Appartement",
  "Maison",
  "Villa",
  "Studio",
  "Terrain",
  "Duplex",
  "Hangar",
  "Penthouse",
  "Local Commercial",
] as const;

export default function ClientCreateForm() {
  const [countryId, setCountryId] = useState<CountryId>("DZ");
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      type: "BUYER",
      city: "",
      budgetMin: undefined,
      budgetMax: undefined,
      priceCurrency: "DZD",
      wantedArea: undefined,
      wantedPropertyType: "",
      rooms: undefined,
      floorMin: undefined,
      floorMax: undefined,
      preferredLocation: "",
      extraNotes: "",
      qualificationNotes: "",
    },
  });

  const router = useRouter();
  const onSubmit = async (values: ClientFormValues) => {
    const result = await createClient(values);

    if (!result.success) {
      toast.error("Erreur", {
        description: result.error?.message,
      });
      return;
    }

    toast.success("Client créé", {
      description: "Le client a été ajouté avec succès",
    });

    form.reset();
    router.push(ROUTES.CLIENTS_DASHBOARD);
  };

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* First name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => {
                const selected = COUNTRY_CODES.find((c) => c.id === countryId)!;
                const localValue = field.value.startsWith(selected.code)
                  ? field.value.slice(selected.code.length)
                  : field.value.replace(/^\+\d+/, "");
                return (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Select
                          value={countryId}
                          onValueChange={(val) => {
                            const next = COUNTRY_CODES.find((c) => c.id === val)!;
                            setCountryId(val as CountryId);
                            const digits = field.value.replace(/^\+\d+/, "");
                            field.onChange(digits ? `${next.code}${digits}` : "");
                          }}
                        >
                          <SelectTrigger className="w-[110px] rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0">
                            <SelectValue>
                              <span className="flex items-center gap-1.5">
                                <span>{selected.flag}</span>
                                <span className="text-xs">{selected.code}</span>
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span>{c.label}</span>
                                  <span className="text-muted-foreground text-xs ml-auto">{c.code}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="rounded-l-none"
                          placeholder="XXXXXXXXX"
                          value={localValue}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            const local = raw.startsWith("0") ? raw.slice(1) : raw;
                            field.onChange(local ? `${selected.code}${local}` : "");
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email (optionnel)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de client</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as ClientType)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Type de client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BUYER">Acheteur</SelectItem>
                      <SelectItem value="RENTER">Loueur</SelectItem>
                      <SelectItem value="INVESTOR">Investisseur</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>
                            {wilaya}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="budgetMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget minimum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget maximum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Devise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DZD">DZD</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="wantedPropertyType"
              render={({ field }) => {
                const selected = field.value
                  ? field.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [];
                const toggle = (type: string) => {
                  if (selected.includes(type)) {
                    field.onChange(
                      selected.filter((s) => s !== type).join(", ")
                    );
                  } else {
                    field.onChange([...selected, type].join(", "));
                  }
                };
                return (
                  <FormItem>
                    <FormLabel>Type de bien souhaité</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {WANTED_PROPERTY_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggle(type)}
                            className={cn(
                              "px-3 py-1 rounded-full border text-sm transition-colors",
                              selected.includes(type)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-input hover:bg-accent"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de pièces</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 3"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wantedArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface souhaitée (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 90"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Floor range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="floorMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage minimum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 3"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floorMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage maximum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 6"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone préférée</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Oran Est, Maraval..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="extraNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes supplémentaires</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Autres besoins, critères, remarques..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Qualification Notes */}
            <FormField
              control={form.control}
              name="qualificationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Qualification</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes sur le besoin, le sérieux, le budget…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                "Ajouter le client"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
