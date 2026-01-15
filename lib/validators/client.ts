import { z } from "zod";

export const clientSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]),

  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional(),

  city: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),

  qualificationNotes: z.string().optional(),
});

export const fetchClientsSchema = z.object({
  type: z.enum(["BUYER", "SELLER", "RENTER", "INVESTOR"]).optional(),
  status: z.enum(["PENDING", "QUALIFIED", "ARCHIVED"]).optional(),
  agentId: z.string().optional(),
  search: z.string().min(1).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});
