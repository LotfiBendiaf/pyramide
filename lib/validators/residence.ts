import { z } from "zod";
import { UNIT_TYPES } from "@/constants/values";

/* ---------------------------------
   Reusable Enums
----------------------------------*/
export const UnitStatusEnum = z.enum(["AVAILABLE", "RESERVED", "SOLD"]);
export const UnitTypeEnum = z.enum(UNIT_TYPES);
export const CompletionStatusEnum = z.enum([
  "PLANNED",
  "UNDER_CONSTRUCTION",
  "DELIVERED",
]);

/* ---------------------------------
   Unit Schema
----------------------------------*/
export const unitSchema = z.object({
  unitNumber: z.string().min(1, "Numéro d'unité requis"),
  floor: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().optional()
  ),
  type: UnitTypeEnum.optional(),
  typeCustom: z.string().trim().optional().or(z.literal("")),
  bedrooms: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().min(0).max(20).optional()
  ),
  bathrooms: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().min(0).max(20).optional()
  ),
  area: z.coerce.number().positive("Surface invalide"),
  price: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().positive().optional()
  ),
  status: UnitStatusEnum.default("AVAILABLE"),
  label: z.string().trim().optional().or(z.literal("")),
});

/* ---------------------------------
   Residence Schema
----------------------------------*/
export const residenceSchema = z.object({
  title: z.string().min(5, "Titre trop court").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug invalide (minuscules, chiffres, tirets)")
    .optional()
    .or(z.literal("")),
  tagline: z.string().max(160).optional().or(z.literal("")),
  description: z.string().min(10, "Description requise"),
  developerName: z.string().optional().or(z.literal("")),

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

  deliveryDate: z.coerce.date().optional(),
  completionStatus: CompletionStatusEnum.default("PLANNED"),

  amenities: z.array(z.object({ value: z.string() })).default([]),

  images: z
    .array(
      z.object({
        url: z.string().url("URL image invalide"),
        isPublic: z.boolean().default(true),
      })
    )
    .optional(),

  documents: z
    .array(
      z.object({
        publicId: z.string().min(1),
        url: z.string().url("URL document invalide"),
        secureUrl: z.string().url().optional(),
        originalFilename: z.string().optional(),
        format: z.string().optional(),
        resourceType: z.string().optional(),
        bytes: z.number().optional(),
        uploadedAt: z.union([z.string(), z.date()]).optional(),
      })
    )
    .optional(),

  coverImage: z.string().url().optional(),

  units: z.array(unitSchema).default([]),

  agent: z.string().optional().or(z.literal("")),

  isPublished: z.boolean(),
  isFeatured: z.boolean().optional(),
});

export type ResidenceInput = z.infer<typeof residenceSchema>;
export type UnitInput = z.infer<typeof unitSchema>;

/* ---------------------------------
   Unit Status Quick Update
----------------------------------*/
export const unitStatusUpdateSchema = z.object({
  residenceId: z.string().min(1),
  unitId: z.string().min(1),
  status: UnitStatusEnum,
});

export type UnitStatusUpdateInput = z.infer<typeof unitStatusUpdateSchema>;
