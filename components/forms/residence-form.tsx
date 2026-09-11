"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash, Copy } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { residenceSchema } from "@/lib/validators/residence";
import { createResidence, updateResidence } from "@/lib/actions/residence.action";
import ImageUpload from "@/components/listing/ImageUpload";
import { ListingDocumentUpload } from "@/components/listing/ListingDocumentUpload";
import ROUTES from "@/constants/routes";
import {
  WILAYAS,
  UNIT_TYPES,
  UNIT_STATUSES,
  RESIDENCE_COMPLETION_STATUSES,
} from "@/constants/values";
import { formatPriceAlgeria } from "@/lib/utils";

type ResidenceFormValues = z.infer<typeof residenceSchema>;

interface ResidenceFormProps {
  initialData?: Residence;
  residenceId?: string;
  agents?: User[];
}

const ORAN_CENTER = { lat: 35.6969, lng: -0.6331 };

const LocationPicker = dynamic(() => import("@/components/listing/LocationPicker"), {
  ssr: false,
});

export default function ResidenceForm({
  initialData,
  residenceId,
  agents = [],
}: ResidenceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [folderKey] = useState(() => residenceId ?? `draft-${Date.now()}`);
  const isEditMode = !!residenceId;
  const router = useRouter();

  const form = useForm<ResidenceFormValues>({
    resolver: zodResolver(residenceSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug ?? "",
          tagline: initialData.tagline ?? "",
          description: initialData.description,
          developerName: initialData.developerName ?? "",
          location: {
            city: initialData.location.city,
            district: initialData.location.district ?? "",
            address: initialData.location.address ?? "",
            coordinates: initialData.location.coordinates,
          },
          deliveryDate: initialData.deliveryDate
            ? new Date(initialData.deliveryDate)
            : undefined,
          completionStatus: initialData.completionStatus,
          amenities: (initialData.amenities ?? []).map((value) => ({ value })),
          images: initialData.images ?? [],
          documents: initialData.documents ?? [],
          coverImage: initialData.coverImage || undefined,
          units: (initialData.units ?? []).map((u) => ({
            unitNumber: u.unitNumber,
            floor: u.floor,
            type: u.type as ResidenceFormValues["units"][number]["type"],
            typeCustom: u.typeCustom ?? "",
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            area: u.area,
            price: u.price,
            status: u.status,
            label: u.label ?? "",
          })),
          agent: initialData.agent?._id ?? "",
          isPublished: initialData.isPublished,
          isFeatured: initialData.isFeatured,
        }
      : {
          title: "",
          slug: "",
          tagline: "",
          description: "",
          developerName: "",
          location: {
            city: "Oran",
            district: "",
            address: "",
            coordinates: undefined,
          },
          deliveryDate: undefined,
          completionStatus: "PLANNED",
          amenities: [],
          images: [],
          documents: [],
          units: [],
          agent: "",
          isPublished: false,
          isFeatured: false,
        },
  });

  const amenitiesFieldArray = useFieldArray({
    control: form.control,
    name: "amenities",
  });

  const unitsFieldArray = useFieldArray({
    control: form.control,
    name: "units",
  });

  const units = form.watch("units");
  const isPublished = form.watch("isPublished");

  const totalUnits = units.length;
  const availablePrices = units
    .filter((u) => u.status === "AVAILABLE" && u.price)
    .map((u) => u.price as number);
  const priceFrom = availablePrices.length ? Math.min(...availablePrices) : undefined;

  const onSubmit = (data: ResidenceFormValues) => {
    startTransition(async () => {
      const result = isEditMode
        ? await updateResidence(residenceId!, data)
        : await createResidence(data);

      if (!result.success) {
        form.setError("root", {
          type: "server",
          message: result.error?.message ?? "Erreur inconnue",
        });
        toast.error(result.error?.message ?? "Erreur inconnue");
        return;
      }

      toast.success(
        isEditMode ? "Résidence mise à jour avec succès" : "Résidence créée avec succès"
      );
      router.push(ROUTES.RESIDENCES_DASHBOARD);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informations générales */}
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
                        <Input placeholder="Résidence Les Jardins d'Oran" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="les-jardins-d-oran" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Laissez vide pour générer automatiquement à partir du titre.
                        {isEditMode &&
                          " Modifier le slug changera l'URL publique de la résidence."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accroche</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Un nouvel art de vivre au coeur d'Oran"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="developerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promoteur</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du promoteur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[140px]"
                          placeholder="Décrivez la résidence..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une ville" />
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
                  name="location.district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quartier</FormLabel>
                      <FormControl>
                        <Input placeholder="Quartier..." {...field} />
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

            {/* Équipements */}
            <Card>
              <CardHeader>
                <CardTitle>Équipements</CardTitle>
                <CardDescription>
                  Piscine, salle de sport, espaces verts, sécurité 24/24...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {amenitiesFieldArray.fields.map((item, index) => (
                    <div key={item.id} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`amenities.${index}.value`}
                        render={({ field }) => (
                          <FormControl>
                            <Input placeholder={`Équipement ${index + 1}`} {...field} />
                          </FormControl>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => amenitiesFieldArray.remove(index)}
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
                  onClick={() => amenitiesFieldArray.append({ value: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un équipement
                </Button>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Ajoutez les photos de la résidence</CardDescription>
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
                          folder={`pyramide/residences/${folderKey}`}
                          onRemove={(url) =>
                            field.onChange((field.value ?? []).filter((img) => img.url !== url))
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
                  Brochures, plans de masse ou fichiers liés à cette résidence
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
                          folder={`pyramide/residences/documents/${folderKey}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Unités */}
            <Card>
              <CardHeader>
                <CardTitle>Unités</CardTitle>
                <CardDescription>
                  {totalUnits} unité{totalUnits > 1 ? "s" : ""}
                  {priceFrom !== undefined && (
                    <> · à partir de {formatPriceAlgeria(priceFrom)}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[880px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px]">N° unité</TableHead>
                        <TableHead className="w-[90px]">Étage</TableHead>
                        <TableHead className="w-[140px]">Type</TableHead>
                        <TableHead className="w-[80px]">Ch.</TableHead>
                        <TableHead className="w-[110px]">Surface</TableHead>
                        <TableHead className="w-[140px]">Prix</TableHead>
                        <TableHead className="w-[140px]">Statut</TableHead>
                        <TableHead className="w-[110px]">Libellé</TableHead>
                        <TableHead className="w-[90px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unitsFieldArray.fields.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.unitNumber`}
                              render={({ field }) => (
                                <Input className="h-8" placeholder="A-101" {...field} />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.floor`}
                              render={({ field }) => (
                                <Input
                                  className="h-8"
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === "" ? undefined : Number(e.target.value)
                                    )
                                  }
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.type`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIT_TYPES.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {t}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.bedrooms`}
                              render={({ field }) => (
                                <Input
                                  className="h-8"
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === "" ? undefined : Number(e.target.value)
                                    )
                                  }
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.area`}
                              render={({ field }) => (
                                <Input
                                  className="h-8"
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.price`}
                              render={({ field }) => (
                                <Input
                                  className="h-8"
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === "" ? undefined : Number(e.target.value)
                                    )
                                  }
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.status`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIT_STATUSES.map((s) => (
                                      <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`units.${index}.label`}
                              render={({ field }) => (
                                <Input className="h-8" placeholder="Vue mer" {...field} />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Dupliquer"
                                onClick={() =>
                                  unitsFieldArray.append({
                                    ...form.getValues(`units.${index}`),
                                    unitNumber: "",
                                  })
                                }
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                title="Supprimer"
                                onClick={() => unitsFieldArray.remove(index)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    unitsFieldArray.append({
                      unitNumber: "",
                      area: 0,
                      status: "AVAILABLE",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une unité
                </Button>
                <FormMessage>{form.formState.errors.units?.message as string}</FormMessage>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* Livraison */}
            <Card>
              <CardHeader>
                <CardTitle>Livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="completionStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESIDENCE_COMPLETION_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de livraison</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : undefined
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

            {/* Contact */}
            {agents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="agent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent référent (optionnel)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Aucun" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agents.map((agent) => (
                              <SelectItem key={agent._id} value={agent._id}>
                                {agent.firstname} {agent.lastname}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Publication */}
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
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center border p-3 rounded-lg">
                      <div>
                        <FormLabel>À la une</FormLabel>
                        <FormDescription className="text-xs">
                          Affichée sur la page d&apos;accueil
                        </FormDescription>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isPublished}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="mt-6 rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-600">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="mt-8">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{isEditMode ? "Mise à jour..." : "Création..."}</span>
              </div>
            ) : (
              <span>{isEditMode ? "Mettre à jour" : "Créer la résidence"}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
