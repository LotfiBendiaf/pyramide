import { z } from "zod";

export const FollowUpSchema = z.object({
  title: z.string().min(1).optional(),
  listing: z.string().min(1, "Listing ID is required"),
  client: z.string().min(1, "Client ID is required"),
  agent: z.string().min(1, "Agent ID is required"),
  channel: z.enum(["CALL", "EMAIL", "WHATSAPP", "VISIT"]).optional(),
  note: z.string().min(1, "Message is required"),
  reminderAt: z.date().optional(),
  status: z.enum(["PENDING", "DONE", "OVERDUE"]).optional(),
  type: z.enum(["COLD", "WARM", "HOT", "CUSTOM"]),
  nextContactDate: z.date().optional(),
});

export type FollowUpFormValues = z.infer<typeof FollowUpSchema>;
