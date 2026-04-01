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
  "Duplex",
  "Hangar",
  "Penthouse",
  "Local Commercial",
  "Autre",
]);

/* ---------------------------------
   Listing Schema
----------------------------------*/
export const listingSchema = z
  .object({
    title: z.string().min(5, "Titre trop court").max(120),

    description: z.string().optional(),

    price: z.number().optional(),

    priceLabel: z.string().optional(),
    offeredPrice: z
      .number()
      .positive("Le prix offert doit être positif")
      .optional(),

    status: ListingStatusEnum,

    propertyType: PropertyTypeEnum,
    propertyTypeCustom: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .optional()
      .or(z.literal("")),

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
      facade: z.coerce.number().min(1).max(4).optional(),
      area: z.coerce.number().positive("Surface invalide"),
      etage: z.coerce.number().optional(),
      nombreEtages: z.coerce.number().min(1).optional(),

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
      .optional(),

    coverImage: z.string().url().optional(),

    isPublished: z.boolean(),
    isFeatured: z.boolean().optional(),
    isPremium: z.boolean().optional(),

    // Seller information
    sellerFirstName: z.string().optional(),
    sellerLastName: z.string().optional(),
    sellerPhone: z.string().regex(/^\+\d{1,3}\d{7,12}$/, "Numéro invalide (ex: +213XXXXXXXXX)").or(z.literal("")),
    sellerEmail: z
      .string()
      .email("Email invalide")
      .or(z.literal(""))
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.propertyType === "Autre" && !data.propertyTypeCustom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Type de bien personnalisé requis",
        path: ["propertyTypeCustom"],
      });
    }
  });

/* ---------------------------------
   Types
----------------------------------*/
export type ListingInput = z.infer<typeof listingSchema>;
