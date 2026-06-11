import { z } from "zod";

export const scheduleVisitSchema = z
  .object({
    listingId: z.string().optional(),
    clientId: z.string().min(1, "Client requis"),
    isExternalListing: z.boolean().default(false),
    externalListingRef: z.string().trim().optional(),
    scheduledAt: z.coerce.date({ required_error: "Date de visite requise" }),
    status: z.literal("COMPLETED").default("COMPLETED"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isExternalListing && !data.listingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'annonce est requise pour une visite interne",
        path: ["listingId"],
      });
    }
    if (data.isExternalListing && !data.externalListingRef?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La référence du bien externe est requise",
        path: ["externalListingRef"],
      });
    }
  });

export const completeVisitSchema = z.object({
  visitId: z.string().min(1),
  outcome: z.enum(["INTERESTED", "NOT_INTERESTED", "UNDECIDED"], {
    required_error: "Le résultat de la visite est requis",
  }),
  notes: z.string().optional(),
});

export const cancelVisitSchema = z.object({
  visitId: z.string().min(1),
  notes: z.string().optional(),
});

export const visitFiltersSchema = z.object({
  clientId: z.string().optional(),
  listingId: z.string().optional(),
  agentId: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type ScheduleVisitInput = z.infer<typeof scheduleVisitSchema>;
export type CompleteVisitInput = z.infer<typeof completeVisitSchema>;
export type CancelVisitInput = z.infer<typeof cancelVisitSchema>;
