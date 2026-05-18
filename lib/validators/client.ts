import { z } from "zod";

const qualificationStatusSchema = z.enum([
  "NEUTRAL",
  "NEW",
  "QUALIFIED",
  "HOT",
  "COLD",
  "NO_RESPONSE",
  "NOT_RELEVANT",
  "ARCHIVED",
]);

export const clientSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]),

  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+\d{1,3}\d{7,12}$/, "Numéro invalide (ex: +213XXXXXXXXX)"),
  phone2: z
    .union([
      z
        .string()
        .regex(/^\+\d{1,3}\d{7,12}$/, "Numéro invalide (ex: +213XXXXXXXXX)"),
      z.literal(""),
    ])
    .optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),

  city: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  priceCurrency: z.enum(["DZD", "EUR", "USD"]).optional(),
  wantedArea: z.number().min(0).optional(),
  wantedPropertyType: z.string().optional(),
  rooms: z.number().min(0).optional(),
  floorMin: z.number().min(0).optional(),
  floorMax: z.number().min(0).optional(),
  preferredLocation: z.string().optional(),
  extraNotes: z.string().optional(),

  qualificationNotes: z.string().optional(),
  assignedAgent: z.string().optional(),
});

export const fetchClientsSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]).optional(),
  qualificationStatus: qualificationStatusSchema.optional(),
  wantedPropertyType: z.string().optional(),
  agentId: z.string().optional(),
  search: z.string().min(1).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  archived: z.boolean().optional(),
});

export const updateClientSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+\d{1,3}\d{7,12}$/, "Numéro invalide (ex: +213XXXXXXXXX)"),
  phone2: z
    .union([
      z
        .string()
        .regex(/^\+\d{1,3}\d{7,12}$/, "Numéro invalide (ex: +213XXXXXXXXX)"),
      z.literal(""),
    ])
    .optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  city: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  priceCurrency: z.enum(["DZD", "EUR", "USD"]).optional(),
  wantedArea: z.number().min(0).optional(),
  wantedPropertyType: z.string().optional(),
  preferredLocations: z.array(z.string()).optional(),
  rooms: z.number().min(0).optional(),
  floorMin: z.number().min(0).optional(),
  floorMax: z.number().min(0).optional(),
  preferredLocation: z.string().optional(),
  extraNotes: z.string().optional(),
  qualificationStatus: qualificationStatusSchema,
  qualificationNotes: z.string().optional(),
  assignedAgent: z.string().optional(),
});

export const updateClientAgentSchema = z.object({
  clientId: z.string().min(1),
  assignedAgent: z.union([z.string().min(1), z.literal("")]).optional(),
});

export const fetchClientsWithPipelineSchema = fetchClientsSchema.extend({
  pipelineStage: z
    .enum([
      "LEAD",
      "PHASE_1_REVIEW",
      "PHASE_2_REVIEW",
      "ACTIVE_SEARCH",
      "FOLLOW_UP",
      "IN_NEGOTIATION",
      "CLOSED",
      "ARCHIVED",
    ])
    .optional(),
  clientTemperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
});

export const phase1ApprovalSchema = z.object({
  clientId: z.string().min(1),
  phase2AgentId: z.string().min(1, "L'agent Phase 2 est requis"),
  notes: z.string().optional(),
});

export const phase1RejectionSchema = z.object({
  clientId: z.string().min(1),
  notes: z.string().optional(),
});

export const phase2ApprovalSchema = z.object({
  clientId: z.string().min(1),
  temperature: z.enum(["HOT", "WARM", "COLD"], {
    required_error: "La température client est requise",
  }),
  notes: z.string().optional(),
});

export const phase2RejectionSchema = z.object({
  clientId: z.string().min(1),
  notes: z.string().optional(),
});

export const archiveRequestSchema = z.object({
  entityType: z.enum(["CLIENT", "LISTING"]),
  entityId: z.string().min(1),
  reason: z.string().min(5, "La raison doit contenir au moins 5 caractères"),
});

export const archiveReviewSchema = z.object({
  requestId: z.string().min(1),
  managerNote: z.string().optional(),
});
