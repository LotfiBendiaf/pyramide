import { z } from "zod";

/* ---------------------------------
   Reusable Enums
----------------------------------*/
export const ListingStatusEnum = z.enum(["À Vendre", "À Louer"]);

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
    area: z.coerce.number().positive("Surface invalide"),

    furnished: z.boolean().optional(),
    parking: z.boolean().optional(),
    balcony: z.boolean().optional(),
    garden: z.boolean().optional(),
    pool: z.boolean().optional(),
    elevator: z.boolean().optional(),
  }),

  images: z
    .array(z.string().url("URL image invalide"))
    .min(1, "Au moins une image requise"),

  coverImage: z.string().url().optional(),

  published: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

/* ---------------------------------
   Types
----------------------------------*/
export type ListingInput = z.infer<typeof listingSchema>;
