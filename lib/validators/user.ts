import { ROLES } from "@/constants/values";
import { z } from "zod";

export const CreateUserSchema = z.object({
  firstname: z
    .string()
    .min(1, { message: "Le prénom est requis." })
    .max(50, { message: "Le prénom ne peut pas dépasser 50 caractères." }),

  lastname: z
    .string()
    .min(1, { message: "Le nom de famille est requis." })
    .max(50, { message: "Le nom de famille ne peut pas dépasser 50 caractères." }),

  email: z
    .string()
    .email({ message: "Veuillez fournir une adresse email valide." })
    .min(1, { message: "L'email est requis." }),

  phone: z.string().optional(),

  role: z.enum(ROLES, { message: "Veuillez sélectionner un rôle valide." }),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
