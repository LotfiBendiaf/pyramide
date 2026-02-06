import { ROLES } from "@/constants/values";
import { z } from "zod";

export const CreateUserSchema = z
  .object({
    firstname: z
      .string()
      .min(1, { message: "Le prénom est requis." })
      .max(50, { message: "Le prénom ne peut pas dépasser 50 caractères." }),

    lastname: z
      .string()
      .min(1, { message: "Le nom de famille est requis." })
      .max(50, {
        message: "Le nom de famille ne peut pas dépasser 50 caractères.",
      }),

    email: z
      .string()
      .email({ message: "Veuillez fournir une adresse email valide." })
      .min(1, { message: "L'email est requis." }),

    phone: z.string().optional(),

    role: z.enum(ROLES, { message: "Veuillez sélectionner un rôle valide." }),

    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
      .max(100, { message: "Le mot de passe ne peut pas dépasser 100 caractères." }),

    confirmPassword: z.string().min(1, { message: "Veuillez confirmer le mot de passe." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const UpdateUserSchema = z.object({
  firstname: z
    .string()
    .min(1, { message: "Le prénom est requis." })
    .max(50, { message: "Le prénom ne peut pas dépasser 50 caractères." })
    .optional(),

  lastname: z
    .string()
    .min(1, { message: "Le nom de famille est requis." })
    .max(50, {
      message: "Le nom de famille ne peut pas dépasser 50 caractères.",
    })
    .optional(),

  email: z
    .string()
    .email({ message: "Veuillez fournir une adresse email valide." })
    .optional(),

  phone: z.string().optional(),

  role: z.enum(ROLES, { message: "Veuillez sélectionner un rôle valide." }).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
