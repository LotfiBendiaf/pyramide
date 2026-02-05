import { z } from "zod";

export const FollowUpSchema = z.object({
  title: z.string().optional(),
  listing: z.string().min(1, "Bien immobilier requis"),
  client: z.string().min(1, "Client requis"),
  agent: z.string().min(1).optional(),
  channel: z.enum(["CALL", "EMAIL", "WHATSAPP", "VISIT"]).optional(),
  note: z.string().min(1, "Note requise"),
  reminderAt: z.date().optional(),
  status: z.enum(["PENDING", "DONE", "OVERDUE"]).optional(),
  type: z.enum(["COLD", "WARM", "HOT", "CUSTOM"]),
});

export type FollowUpFormValues = z.infer<typeof FollowUpSchema>;
