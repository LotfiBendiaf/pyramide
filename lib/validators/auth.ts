import { ROLES } from "@/constants/values";
import { z } from "zod";

export const SignInSchema = z.object({
  email: z
    .string()
    .email({ message: "Veuillez donner une adresse mail valide." })
    .min(1, { message: "Email : Ce champ est requis" })
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long. " })
    .max(100, { message: "Password cannot exceed 100 characters." }),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Veuillez donner une adresse mail valide." })
    .min(1, { message: "Email : Ce champ est requis" })
    .transform((val) => val.toLowerCase()),
});

const PasswordSchema = z
  .string()
  .min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères.",
  })
  .max(100, {
    message: "Le mot de passe ne peut pas dépasser 100 caractères.",
  })
  .regex(/[A-Z]/, {
    message: "Le mot de passe doit contenir au moins une lettre majuscule.",
  })
  .regex(/[a-z]/, {
    message: "Le mot de passe doit contenir au moins une lettre minuscule.",
  })
  .regex(/[0-9]/, {
    message: "Le mot de passe doit contenir au moins un chiffre.",
  })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Le mot de passe doit contenir au moins un caractère spécial.",
  });

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(32, { message: "Lien de réinitialisation invalide." }),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Le mot de passe actuel est requis." }),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  })
  .refine((data) => data.currentPassword !== data.password, {
    path: ["password"],
    message: "Le nouveau mot de passe doit être différent de l'ancien.",
  });

export const SignUpSchema = z
  .object({
    username: z
      .string()
      .min(3, {
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
      })
      .max(30, {
        message: "Le nom d'utilisateur ne peut pas dépasser 30 caractères.",
      })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message:
          "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores (_).",
      })
      .optional(),

    firstname: z
      .string()
      .min(1, { message: "Le prénom est requis." })
      .max(50, { message: "Le prénom ne peut pas dépasser 50 caractères." })
      .regex(/^[a-zA-Z\s]+$/, {
        message: "Le prénom ne peut contenir que des lettres et des espaces.",
      }),

    lastname: z
      .string()
      .min(1, { message: "Le nom de famille est requis." })
      .max(50, {
        message: "Le nom de famille ne peut pas dépasser 50 caractères.",
      })
      .regex(/^[a-zA-Z\s]+$/, {
        message:
          "Le nom de famille ne peut contenir que des lettres et des espaces.",
      }),

    phone: z.string().min(1, { message: "Le numéro de téléphone est requis." }),

    email: z
      .string()
      .email({ message: "Veuillez fournir une adresse email valide." })
      .min(1, { message: "L'email est requis." })
      .transform((val) => val.toLowerCase()),

    password: PasswordSchema,

    confirmPassword: z.string(),
    role: z.enum(ROLES),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const UserSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character.",
    }),
  email: z.string().email({ message: "Please provide a valid email address." }),

  role: z.enum(["admin", "employee", "committee", "customer"]),
});

export const AccountSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }),
  name: z.string().min(1, { message: "Name is required." }),
  image: z.string().url({ message: "Please provide a valid URL." }).optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character.",
    })
    .optional(),
  provider: z.string().min(1, { message: "Provider is required." }),
  providerAccountId: z
    .string()
    .min(1, { message: "Provider Account ID is required." }),
});

export const SignInWithOAuthSchema = z.object({
  provider: z.enum(["google", "github"]),
  providerAccountId: z
    .string()
    .min(1, { message: "Provider Account ID is required." }),
  user: z.object({
    name: z.string().min(1, { message: "Name is required." }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long." }),
    email: z
      .string()
      .email({ message: "Please provide a valid email address." }),
    image: z.string().url("Invalid image URL").optional(),
  }),
});
