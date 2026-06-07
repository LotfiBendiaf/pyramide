import { z } from "zod";

const negotiationDocumentSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  secureUrl: z.string().url().optional(),
  originalFilename: z.string().trim().optional(),
  format: z.string().trim().optional(),
  resourceType: z.string().trim().optional(),
  bytes: z.number().int().positive().optional(),
});

export const openNegotiationSchema = z.object({
  listingId: z.string().min(1, "Annonce requise"),
  clientId: z.string().min(1, "Client requis"),
  visitId: z.string().optional(),
  blockHours: z.number().int().min(24).max(2160).optional(),
  notes: z.string().trim().optional(),
  document: negotiationDocumentSchema.optional(),
});

export const requestBlockSchema = z.object({
  negotiationId: z.string().min(1),
  durationDays: z
    .number({ required_error: "Durée requise" })
    .int()
    .min(1, "Minimum 1 jour")
    .max(90, "Maximum 90 jours"),
  reason: z.string().trim().optional(),
});

export const reviewBlockSchema = z.object({
  negotiationId: z.string().min(1),
  blockingRequestId: z.string().min(1),
  managerNote: z.string().trim().optional(),
});

export const reviewNegotiationSchema = z.object({
  negotiationId: z.string().min(1),
  managerNote: z.string().trim().optional(),
});

export const beginClosingSchema = z.object({
  negotiationId: z.string().min(1),
});

export const confirmDepositSchema = z.object({
  negotiationId: z.string().min(1),
  depositAmount: z
    .number({ required_error: "Montant du dépôt requis" })
    .positive(),
  paymentDate: z.coerce.date({ required_error: "Date de paiement requise" }),
  paymentMethod: z.enum(["Espèces", "Versement", "Chèque"], {
    required_error: "Méthode de paiement requise",
  }),
  proofNotes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  document: negotiationDocumentSchema.optional(),
});

export const closeDealSchema = z.object({
  negotiationId: z.string().min(1),
  finalPrice: z.number({ required_error: "Prix final requis" }).positive(),
  commissionPercentage: z
    .number({ required_error: "Commission requise" })
    .min(0, "Minimum 0%")
    .max(100, "Maximum 100%"),
  notes: z.string().trim().optional(),
  document: negotiationDocumentSchema.optional(),
});

export const cancelNegotiationSchema = z.object({
  negotiationId: z.string().min(1),
  cancelReason: z.string().min(1, "Raison d'annulation requise"),
});

export const negotiationFiltersSchema = z.object({
  status: z
    .enum([
      "PENDING_VERIFICATION",
      "ACTIVE",
      "CLOSING",
      "CLOSING_DEPOSIT",
      "CLOSING_FINALISATION",
      "DEAL_DONE",
      "CANCELLED",
      "REJECTED",
    ])
    .optional(),
  agentId: z.string().optional(),
  listingId: z.string().optional(),
  clientId: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type OpenNegotiationInput = z.infer<typeof openNegotiationSchema>;
export type RequestBlockInput = z.infer<typeof requestBlockSchema>;
export type ReviewBlockInput = z.infer<typeof reviewBlockSchema>;
export type ReviewNegotiationInput = z.infer<typeof reviewNegotiationSchema>;
export type BeginClosingInput = z.infer<typeof beginClosingSchema>;
export type ConfirmDepositInput = z.infer<typeof confirmDepositSchema>;
export type CloseDealInput = z.infer<typeof closeDealSchema>;
export type CancelNegotiationInput = z.infer<typeof cancelNegotiationSchema>;
