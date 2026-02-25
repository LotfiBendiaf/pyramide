import { z } from "zod";

export const clientSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]),

  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(8),
  email: z.union([z.string().email(), z.literal("")]).optional(),

  city: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  wantedPropertyType: z.string().optional(),
  rooms: z.number().min(0).optional(),
  preferredLocation: z.string().optional(),
  extraNotes: z.string().optional(),

  qualificationNotes: z.string().optional(),
  assignedAgent: z.string().optional(),
});

export const fetchClientsSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]).optional(),
  qualificationStatus: z
    .enum(["NEW", "QUALIFIED", "NOT_RELEVANT", "ARCHIVED"])
    .optional(),
  agentId: z.string().optional(),
  search: z.string().min(1).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const updateClientSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(8),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  city: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  wantedPropertyType: z.string().optional(),
  rooms: z.number().min(0).optional(),
  preferredLocation: z.string().optional(),
  extraNotes: z.string().optional(),
  qualificationStatus: z.enum(["NEW", "QUALIFIED", "NOT_RELEVANT", "ARCHIVED"]),
  qualificationNotes: z.string().optional(),
  assignedAgent: z.string().optional(),
});

export const updateClientAgentSchema = z.object({
  clientId: z.string().min(1),
  assignedAgent: z.union([z.string().min(1), z.literal("")]).optional(),
});
