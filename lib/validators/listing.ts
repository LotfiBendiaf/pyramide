import { z } from "zod";

/* ---------------------------------
   Reusable Enums
----------------------------------*/
export const ListingStatusEnum = z.enum([
  "En Vente",
  "En Location",
  "Vendu",
  "Loué",
  "Retiré",
]);

export const PropertyTypeEnum = z.enum([
  "Appartement",
  "Maison",
  "Villa",
  "Studio",
  "Terrain",
  "Commercial",
]);

/* ---------------------------------
   Listing Schema
----------------------------------*/
export const listingSchema = z.object({
  title: z.string().min(5, "Titre trop court").max(120),

  description: z.string().min(10, "Description trop courte"),

  price: z.number().positive("Le prix doit être positif"),

  priceLabel: z.string().optional(),
  offeredPrice: z
    .number()
    .positive("Le prix offert doit être positif")
    .optional(),

  status: ListingStatusEnum,

  propertyType: PropertyTypeEnum,

  location: z.object({
    city: z.string().min(2, "Ville requise"),
    district: z.string().optional(),
    address: z.string().optional(),

    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
  }),

  features: z.object({
    bedrooms: z.coerce.number().min(0).max(20),
    bathrooms: z.coerce.number().min(0).max(20),
    facade: z.coerce.number().min(1).max(4),
    area: z.coerce.number().positive("Surface invalide"),
    etage: z.coerce.number().optional(),

    furnished: z.boolean().optional(),
    parking: z.boolean().optional(),
    balcony: z.boolean().optional(),
    garden: z.boolean().optional(),
    pool: z.boolean().optional(),
    elevator: z.boolean().optional(),
  }),

  evaluation: z.object({
    positives: z.array(z.object({ value: z.string() })).default([]),
    negatives: z.array(z.object({ value: z.string() })).default([]),
    idealBuyerType: z.string().optional(),
    priceQualityOpinion: z.string().optional(),
    finalScore: z.number().min(0).max(10).optional(),
    evaluatedBy: z.string().optional(),
    evaluatedAt: z.date().optional(),
  }),

  images: z
    .array(
      z.object({
        url: z.string().url("URL image invalide"),
        isPublic: z.boolean().default(true),
      })
    )
    .min(1, "Au moins une image requise"),

  coverImage: z.string().url().optional(),

  isPublished: z.boolean(),
  isFeatured: z.boolean().optional(),
  isPremium: z.boolean().optional(),

  // Seller information
  sellerFirstName: z.string().min(2, "Prénom requis").optional(),
  sellerLastName: z.string().min(2, "Nom requis").optional(),
  sellerPhone: z.string().min(8, "Téléphone requis").optional(),
  sellerEmail: z.string().email("Email invalide").or(z.literal("")).optional(),
});

/* ---------------------------------
   Types
----------------------------------*/
export type ListingInput = z.infer<typeof listingSchema>;
