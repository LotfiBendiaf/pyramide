import { z } from "zod";

export const FollowUpSchema = z.object({
  title: z.string().optional(),
  listing: z.string().optional(),
  client: z.string().min(1, "Client requis"),
  agent: z.string().min(1).optional(),
  channel: z.enum(["CALL", "EMAIL", "WHATSAPP", "VISIT"]).optional(),
  note: z.string().min(1, "Note requise"),
  reminderAt: z.date().optional(),
  status: z.enum(["PENDING", "DONE", "OVERDUE"]).optional(),
  type: z.enum(["COLD", "WARM", "HOT", "CUSTOM"]),
});

export type FollowUpFormValues = z.infer<typeof FollowUpSchema>;

export const ListingFollowUpSchema = z.object({
  listing: z.string().min(1, "Annonce requise"),
  title: z.string().optional(),
  note: z.string().min(1, "Note requise"),
  reminderAt: z.date().optional(),
  status: z.enum(["PENDING", "DONE"]).optional(),
});

export type ListingFollowUpFormValues = z.infer<typeof ListingFollowUpSchema>;

export const fetchFollowUpsSchema = z.object({
  agentId: z.string().optional(),
  type: z.enum(["COLD", "WARM", "HOT", "CUSTOM"]).optional(),
  status: z.enum(["PENDING", "DONE", "OVERDUE", "CANCELLED"]).optional(),
  channel: z.enum(["CALL", "EMAIL", "WHATSAPP", "VISIT"]).optional(),
  context: z.enum(["CLIENT", "LISTING"]).optional(),
  search: z.string().min(1).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});
