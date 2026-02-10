"use client";

import { useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { listingSchema } from "@/lib/validators/listing";
import ImageUpload from "../listing/ImageUpload";
import { createListing } from "@/lib/actions/listings.action";
import { useRouter } from "next/navigation";

// --- Types ---
type ListingFormValues = z.infer<typeof listingSchema>;

const PROPERTY_TYPES = [
  "Appartement",
  "Maison",
  "Villa",
  "Studio",
  "Terrain",
  "Commercial",
] as const;

export default function ListingForm() {
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      status: "En Vente",
      propertyType: "Appartement",
      location: {
        city: "",
        district: "",
        address: "",
      },
      features: {
        bedrooms: 0,
        bathrooms: 0,
        area: 0,
        etage: undefined,
        furnished: false,
        parking: false,
        facade: 1,
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
      isFeatured: false,
      published: true,
    },
  });

  const onSubmit = (data: ListingFormValues) => {
    startTransition(async () => {
      try {
        const result = await createListing(data);

        if (!result.success) {
          // Attach error to a specific field
          form.setError("title", {
            type: "server",
            message: "Erreur inconnue",
          });
          return;
        }

        toast.success("Annonce publiée avec succès");
        router.push("/listings");
      } catch (error) {
        // Global form error
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
                        <Input
                          placeholder="Appartement F3 à Hydra"
                          {...field}
                        />
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
                        <Input placeholder="Ville..." {...field} />
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[120px]"
                          placeholder="Décrivez le bien..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Ajoutez jusqu’à 6 images</CardDescription>
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
                              field.value.filter((img) => img.url !== url)
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
                      <FormLabel>Façades</FormLabel>
                      <Input type="number" {...field} />
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
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="published"
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
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                <span>Publication</span>{" "}
              </div>
            ) : (
              <span>Publier l’annonce</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
