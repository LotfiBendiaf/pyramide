import { SALE_AGENCY_COMMISSION_PERCENT } from "@/lib/agency-commission";
import { createHash } from "node:crypto";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageAgentVisits } from "@/constants/values";
import ROUTES from "@/constants/routes";
import { CalendarEvent, Client, FollowUp, Listing, Negotiation, Visit } from "@/models";
import { closeDeal } from "@/lib/actions/negotiation.action";
import { completeVisit } from "@/lib/actions/visit.action";
import { isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation, clientIdentityFilter } from "@/lib/assistant-client-lookup";
import type { VisitContext } from "@/lib/assistant-visit-confirmation";

export const pipelineInput = z.object({
  outcome: z.enum(["INTERESTED", "NOT_INTERESTED", "UNDECIDED"]).nullish(),
  note: z.string().trim().min(1).max(2000).nullish(),
  reminderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  reminderTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullish(),
  reminderHours: z.number().positive().max(8760).nullish(),
  finalPrice: z.number().positive().max(1e12).nullish(),
  commissionPercentage: z.number().min(0).max(100).nullish(),
  negotiationId: z.string().regex(/^[a-f0-9]{24}$/i).nullish(),
});
type Action = "visit_feedback" | "close_deal";
type Language = "fr" | "en" | "ar" | "darija";
export type PipelineContext = {
  action: Action; clientId?: string; listingId?: string; visitId?: string; negotiationId?: string;
  outcome?: "INTERESTED" | "NOT_INTERESTED" | "UNDECIDED"; note?: string;
  finalPrice?: number; commissionPercentage?: number; reminderAt?: string;
};
export const pipelineInstructions = [
  "Use visit_feedback for an explicit report of the client's feedback after a visit, or its requested follow-up reminder. Set pipeline.outcome to INTERESTED, NOT_INTERESTED or UNDECIDED based on actual feedback and pipeline.note to a faithful short summary in the user's language. A booking is not a completed visit.",
  "Use close_deal for an explicit request to close an existing negotiation. Set pipeline.finalPrice in DZD and commissionPercentage in percent. Never invent financial values. The server enforces existing CRM closing stages. Financial questions are read-only reports, not close_deal.",
  "For missing details of a pending pipelineContext action, keep its action and set continuePipeline true. Include only newly supplied fields. For a new self-contained action set continuePipeline false. Keep the current client/property only if the user is referring to that same dossier.",
  "For an explicitly requested reminder set pipeline.reminderDate and reminderTime in Algeria local time, or reminderHours for a relative duration. A date without an hour needs clarification. Never schedule a reminder without a request.",
  "Use daily_briefing for today's priorities, work to do, overdue reminders and the day's schedule. Ordinary statistics use existing reporting intents.",
].join("\n");
const tz = "Africa/Algiers";

export async function runPipelineAction(
  scope: AssistantScope, action: Action, identity: string | null | undefined,
  listingTitle: string | null | undefined, input: z.infer<typeof pipelineInput> | null | undefined,
  visit: VisitContext | undefined, previous: PipelineContext | undefined, language: Language,
) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!canManageAgentVisits(scope.role)) return { answer: say("Cette action est accessible à l’agent responsable et au gérant.", "This action is available to the assigned agent and manager.", "هذا الإجراء متاح للوكيل المسؤول والمدير.", "Had l’action lel agent responsable wela gérant.") };
  const data = input ?? {};
  const context: PipelineContext = { ...previous, action };
  for (const key of ["outcome", "note", "finalPrice", "commissionPercentage", "negotiationId"] as const) {
    if (data[key] != null) Object.assign(context, { [key]: data[key] });
  }
  const scoped = isAgencyScope(scope) ? {} : { agent: scope.userId };
  let clientId = context.clientId ?? (!identity && !listingTitle ? visit?.clientId : undefined);
  if (identity) {
    const clients = await Client.find({
      ...clientIdentityFilter(identity), archived: { $ne: true },
      ...(isAgencyScope(scope) ? {} : { assignedAgent: scope.userId }),
    }).collation(assistantNameCollation).select("_id").limit(2).lean();
    if (clients.length !== 1) return { answer: say("Précisez la référence ou le numéro du client accessible.", "Specify the client's reference or phone.", "حدّد مرجع الزبون أو هاتفه.", "3tini référence wela numéro ta3 l’client."), pipelineContext: context };
    clientId = String(clients[0]._id);
  }
  context.clientId = clientId;
  let listingId = context.listingId ?? (!listingTitle && (!identity || clientId === visit?.clientId) ? visit?.listingId : undefined);
  if (listingTitle) {
    const escaped = listingTitle.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
    const listings = await Listing.find({ $or: [{ title: new RegExp(escaped, "i") }, { referenceCode: listingTitle }] }).select("_id").limit(2).lean();
    if (listings.length !== 1) return { answer: say("Précisez la référence du bien.", "Specify the property reference.", "حدّد مرجع العقار.", "3tini référence ta3 l’bien."), pipelineContext: context };
    listingId = String(listings[0]._id);
  }
  context.listingId = listingId;
  if (data.reminderHours != null || data.reminderDate != null || data.reminderTime != null) {
    const at = data.reminderHours != null ? new Date(Date.now() + data.reminderHours * 3_600_000)
      : data.reminderDate && data.reminderTime ? fromZonedTime(data.reminderDate + "T" + data.reminderTime, tz) : undefined;
    if (!at || !Number.isFinite(at.getTime()) || at <= new Date() ||
      (data.reminderDate && data.reminderTime && formatInTimeZone(at, tz, "yyyy-MM-dd'T'HH:mm") !== data.reminderDate + "T" + data.reminderTime)) {
      return { answer: say("Quelle date et quelle heure à venir pour la relance ?", "Give a future date and time for the follow-up.", "حدّد تاريخًا وساعة قادمين للمتابعة.", "3tini date w sa3a li jayine lel relance."), pipelineContext: context };
    }
    context.reminderAt = at.toISOString();
  }
  if (action === "close_deal") {
    if (!clientId && !listingId && !context.negotiationId) return {
      answer: say("Quelle affaire souhaitez-vous clôturer ? Indiquez le client ou le bien.", "Which deal? Specify the client or property.", "أي صفقة؟ حدّد الزبون أو العقار.", "Anhi affaire ? 3tini client wela bien."), pipelineContext: context,
    };
    const deals = await Negotiation.find({
      ...scoped,
      ...(context.negotiationId ? { _id: context.negotiationId } : { status: { $nin: ["CANCELLED", "REJECTED"] } }),
      ...(clientId ? { client: clientId } : {}), ...(listingId ? { listing: listingId } : {}),
    }).select("client listing status closingDetails").limit(2).lean<{ _id: string; client: string; listing: string; status: string }[]>();
    if (deals.length !== 1) return { answer: say("Précisez l’affaire : plusieurs négociations correspondent ou aucune n’est accessible.", "Specify the deal: there are multiple matches or none you can access.", "حدّد الصفقة: توجد عدة نتائج أو لا توجد صفقة متاحة.", "Précisi l’affaire, kayen plusieurs wela ma kayench accessible."), pipelineContext: context };
    const deal = deals[0];
    Object.assign(context, { negotiationId: String(deal._id), clientId: String(deal.client), listingId: String(deal.listing) });
    const property = await Listing.findById(deal.listing).select("status").lean<{ status?: string }>();
    if (property && property.status !== "En Location" && property.status !== "Loué") context.commissionPercentage = SALE_AGENCY_COMMISSION_PERCENT;
    if (context.finalPrice == null || context.commissionPercentage == null) return {
      answer: [
        say("Pour clôturer, indiquez", "To close this deal, provide", "لإغلاق الصفقة، حدّد", "Bach nclôturi, 3tini"),
        context.finalPrice == null ? say("• Le prix final en DZD", "• Final price in DZD", "• السعر النهائي بالدينار", "• Prix final b DZD") : "",
        context.commissionPercentage == null ? say("• La commission en %", "• Commission percentage", "• نسبة العمولة", "• Commission b %") : "",
      ].filter(Boolean).join("\n"), pipelineContext: context,
    };
    const result = await closeDeal({ negotiationId: String(deal._id), finalPrice: context.finalPrice, commissionPercentage: context.commissionPercentage, notes: context.note });
    if (!result.success) return { answer: result.error?.message || "Clôture impossible.", pipelineContext: context };
    const persisted = await Negotiation.findById(deal._id).select("status closingDetails").lean<{ status: string; closingDetails?: { finalPrice?: number; commissionAmount?: number; buyerCommissionAmount?: number; sellerCommissionAmount?: number } }>();
    if (persisted?.status !== "DEAL_DONE") throw new Error("Closing did not persist");
    return {
      answer: [
        say("Affaire clôturée.", "Deal closed.", "تم إغلاق الصفقة.", "L’affaire clôturée."),
        "• " + say("Prix final", "Final price", "السعر النهائي", "Prix final") + " · " + persisted.closingDetails?.finalPrice + " DZD",
        ...(persisted.closingDetails?.buyerCommissionAmount != null ? ["• " + say("Acheteur · 1 %", "Buyer · 1%", "المشتري · 1 %", "Acheteur · 1 %") + " · " + persisted.closingDetails.buyerCommissionAmount + " DZD"] : []),
        ...(persisted.closingDetails?.sellerCommissionAmount != null ? ["• " + say("Vendeur · 1 %", "Seller · 1%", "البائع · 1 %", "Vendeur · 1 %") + " · " + persisted.closingDetails.sellerCommissionAmount + " DZD"] : []),
        "• " + say("Commission enregistrée", "Recorded commission", "العمولة المسجلة", "Commission enregistrée") + " · " + persisted.closingDetails?.commissionAmount + " DZD",
      ].join("\n"), pipelineContext: null, clientContextId: context.clientId,
      records: [{ label: say("Voir l’affaire", "View deal", "عرض الصفقة", "Chouf l’affaire"), href: ROUTES.NEGOTIATION_DETAIL(String(deal._id)) }],
    };
  }
  const visitId = context.visitId ?? (!identity && !listingTitle ? visit?.visitId : undefined);
  if (!visitId && !clientId && !listingId) return { answer: say("Quelle visite ? Indiquez le client ou le bien.", "Which visit? Specify the client or property.", "أي زيارة؟ حدّد الزبون أو العقار.", "Anhi visite ? 3tini client wela bien."), pipelineContext: context };
  const matches = await Visit.find({
    ...scoped, ...(visitId ? { _id: visitId } : {}), ...(clientId ? { client: clientId } : {}),
    ...(listingId ? { listing: listingId } : {}), status: { $in: ["SCHEDULED", "COMPLETED"] },
  }).select("agent client listing status notes").limit(2).lean<{ _id: string; agent: string; client: string; listing?: string; status: string; notes?: string }[]>();
  if (matches.length !== 1) return { answer: say("Précisez la visite avec le client et le bien.", "Specify the client and property to identify one visit.", "حدّد الزبون والعقار لتحديد زيارة واحدة.", "Précisi client w bien bach n3arf anhi visite."), pipelineContext: context };
  const selected = matches[0];
  Object.assign(context, { visitId: String(selected._id), clientId: String(selected.client), listingId: selected.listing ? String(selected.listing) : undefined });
  if (!context.outcome) return { answer: say("Le client est-il intéressé, non intéressé ou indécis après la visite ?", "Was the client interested, not interested or undecided after the visit?", "بعد الزيارة، هل الزبون مهتم أم غير مهتم أم متردد؟", "L’client intéressé, ma 3ejbou-ch wela mazal hésitant ?"), pipelineContext: context };
  const result = await completeVisit({ visitId: String(selected._id), outcome: context.outcome, notes: context.note });
  if (!result.success) return { answer: result.error?.message || "Impossible d’enregistrer le retour.", pipelineContext: context };
  let reminder = "";
  if (context.reminderAt) {
    const at = new Date(context.reminderAt);
    if (at <= new Date()) return { answer: say("Retour enregistré. Donnez un nouvel horaire pour la relance.", "Feedback saved. Give a future follow-up time.", "تم حفظ الملاحظات. حدّد موعد متابعة قادمًا.", "Retour tsajel. 3tini sa3a jdida lel relance."), pipelineContext: { ...context, reminderAt: undefined } };
    const key = createHash("sha256").update("visit-feedback:" + selected._id + ":" + context.reminderAt).digest("hex").slice(0, 24);
    const followUp = await FollowUp.findOneAndUpdate({ _id: key }, { $setOnInsert: {
      client: selected.client, listing: selected.listing, agent: selected.agent, type: "CUSTOM", context: "CLIENT", channel: "CALL",
      title: "Relance après visite", note: context.note || selected.notes || "Demander la décision du client après la visite.",
      status: "PENDING", reminderAt: at, duration: 0,
    } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: false });
    const event = await CalendarEvent.findOneAndUpdate({ _id: key }, { $setOnInsert: {
      agent: selected.agent, client: selected.client, listing: selected.listing, title: followUp.title, description: followUp.note,
      sourceType: "FOLLOWUP", sourceId: followUp._id, startTime: at, endTime: new Date(at.getTime() + 15 * 60_000), syncStatus: "PENDING",
    } }, { upsert: true, new: true, runValidators: true });
    await FollowUp.updateOne({ _id: key }, { $set: { calendarEventId: event._id } });
    reminder = "• " + say("Relance", "Follow-up", "المتابعة", "Relance") + " · " + formatInTimeZone(at, tz, "dd/MM/yyyy HH:mm") + " (Alger)";
  }
  const client = await Client.findById(selected.client).select("pipelineStage").lean<{ pipelineStage?: string }>();
  const stageLabels: Record<string, string> = {
    ACTIVE_SEARCH: say("Recherche active", "Active search", "بحث نشط", "Recherche active"),
    FOLLOW_UP: say("À relancer", "Follow-up", "للمتابعة", "À relancer"),
    IN_NEGOTIATION: say("En négociation", "In negotiation", "قيد التفاوض", "En négociation"),
    CLOSED: say("Clôturé", "Closed", "مغلق", "Clôturé"),
  };
  revalidatePath(ROUTES.SCHEDULE);
  return {
    answer: [
      say("Retour de visite enregistré.", "Visit feedback saved.", "تم حفظ نتيجة الزيارة.", "Retour ta3 visite tsajel."),
      context.note ? "• " + context.note : "",
      "• " + say("Dossier mis à jour", "Client stage updated", "تم تحديث ملف الزبون", "Dossier tbedel") + " · " + (stageLabels[client?.pipelineStage ?? ""] ?? client?.pipelineStage ?? ""),
      reminder,
      !reminder ? say("Souhaitez-vous programmer une relance ? Indiquez quand.", "When should I schedule a follow-up?", "متى تريد برمجة المتابعة؟", "T7eb relance ? 3tini wa9tach.") : "",
    ].filter(Boolean).join("\n"),
    clientContextId: String(selected.client),
    visitContext: { clientId: String(selected.client), listingId: context.listingId, visitId: String(selected._id), pending: false },
    pipelineContext: reminder ? null : context,
    records: [{ label: say("Voir le dossier", "View client", "عرض الملف", "Chouf dossier"), href: ROUTES.CLIENT_DETAIL(String(selected.client)) }],
  };
}
