import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message trop court"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
