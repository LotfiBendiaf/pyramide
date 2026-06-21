"use client";

import { useTransition, useState } from "react";
import dynamic from "next/dynamic";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

// UI
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Schema
import {
  listingCreateSchema,
  listingSchema,
} from "@/lib/validators/listing";
import ImageUpload from "../listing/ImageUpload";
import { ListingDocumentUpload } from "../listing/ListingDocumentUpload";
import { createListing, updateListing } from "@/lib/actions/listings.action";
import { useRouter } from "next/navigation";
import { PROPERTY_TYPES, WILAYAS } from "@/constants/values";
import ROUTES from "@/constants/routes";
import { COUNTRY_CODES, type CountryId } from "@/lib/country-codes";
import { formatPriceAlgeria } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

// --- Types ---
type ListingFormValues = z.infer<typeof listingSchema>;

interface ListingFormProps {
  initialData?: Listing;
  listingId?: string;
  client?: Client;
}

const ORAN_CENTER = { lat: 35.6969, lng: -0.6331 };

const LocationPicker = dynamic(() => import("../listing/LocationPicker"), {
  ssr: false,
});

export default function ListingForm({
  initialData,
  listingId,
  client,
}: ListingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [countryId, setCountryId] = useState<CountryId>("DZ");
  const [countryId2, setCountryId2] = useState<CountryId>("DZ");
  const [documentFolderKey] = useState(() => listingId ?? `draft-${Date.now()}`);
  const isEditMode = !!listingId;
  const documentUploadFolder = `pyramide/listings/documents/${documentFolderKey}`;

  const router = useRouter();

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(isEditMode ? listingSchema : listingCreateSchema),
    defaultValues: initialData
      ? {
          title: initialData.title ?? "",
          description: initialData.description || undefined,
          price: initialData.price,
          offeredPrice: initialData.offeredPrice,
          priceLabel: initialData.priceLabel ?? "",
          status: initialData.status,
          propertyType:
            initialData.propertyType as ListingFormValues["propertyType"],
          propertyTypeCustom: initialData.propertyTypeCustom ?? "",
          location: {
            city: initialData.location.city,
            district: initialData.location.district ?? "",
            address: initialData.location.address ?? "",
            coordinates: initialData.location.coordinates,
          },
          features: {
            bedrooms: initialData.features.bedrooms,
            bathrooms: initialData.features.bathrooms,
            area: initialData.features.area,
            facade: initialData.features.facade,
            etage: initialData.features.etage,
            nombreEtages: initialData.features.nombreEtages,
            furnished: initialData.features.furnished ?? false,
            parking: initialData.features.parking ?? false,
            balcony: initialData.features.balcony ?? false,
            garden: initialData.features.garden ?? false,
            pool: initialData.features.pool ?? false,
            elevator: initialData.features.elevator ?? false,
          },
          evaluation: {
            finalScore: initialData.evaluation?.finalScore ?? 0,
            positives: (initialData.evaluation?.positives ?? []).map((v) => ({
              value: v,
            })),
            negatives: (initialData.evaluation?.negatives ?? []).map((v) => ({
              value: v,
            })),
            idealBuyerType: initialData.evaluation?.idealBuyerType ?? "",
            priceQualityOpinion:
              initialData.evaluation?.priceQualityOpinion ?? "",
            evaluatedBy: "",
            evaluatedAt: new Date(),
          },
          images: initialData.images ?? [],
          documents: initialData.documents ?? [],
          coverImage: initialData.coverImage || undefined,
          isFeatured: initialData.isFeatured,
          isPremium: initialData.isPremium,
          isPublished: initialData.isPublished,
          sellerFirstName: client?.firstName ?? "",
          sellerLastName: client?.lastName ?? "",
          sellerPhone: client?.phone ?? "",
          sellerPhone2: "",
          sellerEmail: client?.email ?? "",
        }
      : {
          title: "",
          price: 0,
          offeredPrice: undefined,
          status: "En Vente",
          propertyType: "Appartement",
          propertyTypeCustom: "",
          location: {
            city: "Oran",
            district: "",
            address: "",
            coordinates: undefined,
          },
          features: {
            bedrooms: 0,
            bathrooms: 0,
            area: 0,
            etage: undefined,
            nombreEtages: undefined,
            furnished: false,
            parking: false,
            facade: undefined,
          },
          evaluation: {
            finalScore: 0,
            positives: [],
            negatives: [],
            idealBuyerType: "",
            priceQualityOpinion: "",
            evaluatedBy: "",
            evaluatedAt: new Date(),
          },
          images: [],
          documents: [],
          isFeatured: false,
          isPublished: false,
          sellerFirstName: "",
          sellerLastName: "",
          sellerPhone: "",
          sellerPhone2: "",
          sellerEmail: "",
        },
  });

  const selectedPropertyType = form.watch("propertyType");

  const onSubmit = (data: ListingFormValues) => {
    startTransition(async () => {
      try {
        const result = isEditMode
          ? await updateListing(listingId!, data)
          : await createListing(data);

        if (!result.success) {
          form.setError("title", {
            type: "server",
            message: result.error?.message ?? "Erreur inconnue",
          });
          return;
        }

        toast.success(
          isEditMode
            ? "Annonce mise à jour avec succès"
            : "Annonce créée avec succès"
        );
        router.push(
          isEditMode
            ? ROUTES.LISTINGS_DASHBOARD
            : `${ROUTES.LISTINGS_DASHBOARD}?view=neutre`
        );
      } catch (error) {
        form.setError("root", {
          type: "server",
          message: (error as string) || "Erreur serveur, veuillez réessayer",
        });
      }
    });
  };

  const positivesFieldArray = useFieldArray({
    control: form.control,
    name: "evaluation.positives",
  });

  const negativesFieldArray = useFieldArray({
    control: form.control,
    name: "evaluation.negatives",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Infos */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Appartement F3 à Oran" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder="Choisir une ville"
                                defaultValue={"Oran"}
                              />
                            </SelectTrigger>
                          </FormControl>
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

                <FormField
                  control={form.control}
                  name="location.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Adresse..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.coordinates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation exacte</FormLabel>
                      <FormDescription>
                        Choisissez l&apos;emplacement sur la carte (optionnel).
                      </FormDescription>
                      <FormControl>
                        <LocationPicker
                          value={field.value}
                          onChange={field.onChange}
                          defaultCenter={ORAN_CENTER}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du Vendeur</CardTitle>
                <CardDescription>
                  Ces informations créeront automatiquement un client vendeur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sellerFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom du vendeur</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellerLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du vendeur</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sellerPhone"
                  render={({ field }) => {
                    const selected = COUNTRY_CODES.find((c) => c.id === countryId)!;
                    const localValue = field.value.startsWith(selected.code)
                      ? field.value.slice(selected.code.length)
                      : field.value.replace(/^\+\d+/, "");
                    return (
                      <FormItem>
                        <FormLabel>
                          Téléphone du vendeur{!isEditMode && " *"}
                        </FormLabel>
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
                                      <span className="text-muted-foreground text-xs ml-auto">
                                        {c.code}
                                      </span>
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
                <FormField
                  control={form.control}
                  name="sellerPhone2"
                  render={({ field }) => {
                    const selected2 = COUNTRY_CODES.find((c) => c.id === countryId2)!;
                    const localValue2 = (field.value ?? "").startsWith(selected2.code)
                      ? field.value!.slice(selected2.code.length)
                      : (field.value ?? "").replace(/^\+\d+/, "");
                    return (
                      <FormItem>
                        <FormLabel>Téléphone 2 <span className="text-muted-foreground text-xs font-normal">(optionnel)</span></FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Select
                              value={countryId2}
                              onValueChange={(val) => {
                                const next = COUNTRY_CODES.find((c) => c.id === val)!;
                                setCountryId2(val as CountryId);
                                const digits = (field.value ?? "").replace(/^\+\d+/, "");
                                field.onChange(digits ? `${next.code}${digits}` : "");
                              }}
                            >
                              <SelectTrigger className="w-[110px] rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0">
                                <SelectValue>
                                  <span className="flex items-center gap-1.5">
                                    <span>{selected2.flag}</span>
                                    <span className="text-xs">{selected2.code}</span>
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRY_CODES.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center gap-2">
                                      <span>{c.flag}</span>
                                      <span>{c.label}</span>
                                      <span className="text-muted-foreground text-xs ml-auto">
                                        {c.code}
                                      </span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              className="rounded-l-none"
                              placeholder="XXXXXXXXX"
                              value={localValue2}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                const local = raw.startsWith("0") ? raw.slice(1) : raw;
                                field.onChange(local ? `${selected2.code}${local}` : "");
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="sellerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email du vendeur</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Email (optionnel)"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Caractéristiques */}
            <Card>
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="features.bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chambres</FormLabel>
                      <Input type="number" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salles de bain</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
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
                  name="features.area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface (m²)</FormLabel>
                      <Input type="number" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.etage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Étage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 2"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(selectedPropertyType === "Villa" ||
                  selectedPropertyType === "Terrain") && (
                  <FormField
                    control={form.control}
                    name="features.nombreEtages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          R+{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            (Nombre d&apos;étages)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 2 → R+2"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="features.furnished"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>Equipé</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.garden"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>Jardin / Cour</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.parking"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>Parking</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.pool"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>Piscine</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.elevator"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>Ascenseur</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features.facade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Façades (optionnel)</FormLabel>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Ajoutez les images</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          onRemove={(url) =>
                            field.onChange(
                              (field.value ?? []).filter(
                                (img) => img.url !== url
                              )
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Ajoutez les contrats, pièces justificatives ou fichiers liés
                  à cette annonce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="documents"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ListingDocumentUpload
                          value={field.value}
                          onChange={field.onChange}
                          folder={documentUploadFolder}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évaluation</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="evaluation.finalScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Score final</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une note" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(
                            (score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score} / 10
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evaluation.positives"
                  render={() => (
                    <FormItem>
                      <FormLabel>Points positifs</FormLabel>

                      <div className="space-y-2">
                        {positivesFieldArray.fields.map((item, index) => (
                          <div key={item.id} className="flex gap-2">
                            <FormField
                              control={form.control}
                              // Note the .value at the end of the name
                              name={`evaluation.positives.${index}.value`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    placeholder={`Point positif ${index + 1}`}
                                    {...field}
                                  />
                                </FormControl>
                              )}
                            />
                            <Button
                              type="button"
                              variant={"destructive"}
                              onClick={() => positivesFieldArray.remove(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          positivesFieldArray.append({ value: "" })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un point
                      </Button>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evaluation.negatives"
                  render={() => (
                    <FormItem>
                      <FormLabel>Points négatifs</FormLabel>

                      <div className="space-y-2">
                        {negativesFieldArray.fields.map((item, index) => (
                          <div key={item.id} className="flex gap-2">
                            <FormField
                              control={form.control}
                              // Note the .value at the end of the name
                              name={`evaluation.negatives.${index}.value`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    placeholder={`Point négatif ${index + 1}`}
                                    {...field}
                                  />
                                </FormControl>
                              )}
                            />
                            <Button
                              type="button"
                              variant={"destructive"}
                              onClick={() => negativesFieldArray.remove(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          negativesFieldArray.append({ value: "" })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un point
                      </Button>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evaluation.idealBuyerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acheteur idéal</FormLabel>
                      <Input placeholder="Acheteur idéal..." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evaluation.priceQualityOpinion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opinion qualité/prix</FormLabel>
                      <Textarea
                        className="min-h-[80px]"
                        placeholder="Opinion qualité/prix..."
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* Property Type */}
            <Card>
              <CardHeader>
                <CardTitle>Type de bien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {selectedPropertyType === "Autre" && (
                  <FormField
                    control={form.control}
                    name="propertyTypeCustom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de bien personnalisé</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Appartement F4 Duplex"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="isPremium"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>Bien Pyramide Premium</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Prix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="En Vente">À Vendre</SelectItem>
                          <SelectItem value="En Location">À Louer</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (DZD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Aperçu: {formatPriceAlgeria(Number(field.value) || 0)} DA
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offeredPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix offert (DZD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Prix offert / Accord final"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <div>
                        <FormLabel>Publié</FormLabel>
                        <FormDescription className="text-xs">
                          Visible sur le site
                        </FormDescription>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <FormLabel>À la une</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-600">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="mt-8">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{isEditMode ? "Mise à jour..." : "Publication..."}</span>
              </div>
            ) : (
              <span>{isEditMode ? "Mettre à jour" : "Publier l'annonce"}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
