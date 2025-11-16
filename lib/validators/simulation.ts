import { z } from "zod";

export const simulationFormSchema = z.object({
  firstname: z
    .string()
    .min(1, "Le prénom est requis")
    .max(50, "Le prénom est trop long"),

  lastname: z
    .string()
    .min(1, "Le nom est requis")
    .max(50, "Le nom est trop long"),

  age: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Veuillez entrer un age valide",
    }),

  phonenumber: z
    .string()
    .min(10, "Le numéro est trop court")
    .regex(/^(\+?\d{10,15})$/, {
      message: "Veuillez entrer un numéro de téléphone valide",
    }),

  email: z
    .string()
    .email("Veuillez entrer une adresse email valide")
    .optional()
    .or(z.literal("")),

  salary: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Veuillez entrer un salaire valide",
    }),

  fonction: z.string().optional().or(z.literal("")),

  appartmentType: z.enum(["Studio", "F2", "F3", "F4"], {
    required_error: "Veuillez sélectionner un type d'appartement",
    invalid_type_error: "Type d'appartement invalide",
  }),

  domaine: z.enum(["prive", "public"], {
    required_error: "Veuillez sélectionner un domaine",
  }),
});
