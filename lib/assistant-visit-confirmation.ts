import { createHash } from "node:crypto";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { CalendarEvent, Client, Listing, Notification, User, Visit } from "@/models";
import { cancelVisit, scheduleVisit } from "@/lib/actions/visit.action";
import { agencyListingsVisibility, availableAgencyListings, isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation, clientIdentityFilter } from "@/lib/assistant-client-lookup";
import { revalidatePath } from "next/cache";
import { assertVisitSlotFree, VisitSlotConflict, VISIT_SLOT_MS, withVisitSlotLock } from "@/lib/visit-slot";
import { createCalendarEventFromVisit, syncEventToGoogle } from "@/lib/googleCalendar/syncService";
import { buildVisitMessage } from "@/lib/assistant-visit-message";
import ROUTES from "@/constants/routes";
import { canManageAgentVisits, canUseAssistantOperations } from "@/constants/values";

export const visitConfirmationInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullish(),
  listing: z.string().trim().min(1).max(120).nullish(),
});

export type VisitContext = {
  clientId?: string;
  listingId?: string;
  pending?: boolean;
  assignVisit?: boolean;
  agentId?: string;
  requestedClient?: string;
  requestedListing?: string;
  visitId?: string;
  cancelPending?: boolean;
  reschedulePending?: boolean;
  reassignPending?: boolean;
  date?: string;
  time?: string;
  choices?: { listingId: string; title: string; reference?: string }[];
};

const tz = "Africa/Algiers";
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function findVisitAgents(agentName?: string, agentId?: string) {
  return User.find({
    role: { $in: ["AGENT", "MANAGER", "ADMIN"] },
    ...(agentName ? { $or: [
      { firstname: agentName }, { lastname: agentName }, { username: agentName },
      { $expr: { $eq: [
        { $trim: { input: { $concat: [{ $ifNull: ["$firstname", ""] }, " ", { $ifNull: ["$lastname", ""] }] } } },
        { $literal: agentName },
      ] } },
    ] } : { _id: agentId }),
  }).collation(assistantNameCollation).select("firstname lastname").limit(2).lean();
}

export async function confirmAssistantVisit(
  scope: AssistantScope,
  identity: string | null | undefined,
  selected: z.infer<typeof visitConfirmationInput> | null | undefined,
  context?: VisitContext,
  language: "fr" | "en" | "ar" | "darija" = "fr",
  requestedAgent?: string | null,
  assignVisit = false,
  question = "",
) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language] ?? fr;
  const isAssistant = scope.role === "ASSISTANT";
  if (!canUseAssistantOperations(scope.role)) {
    return { answer: say("La confirmation est disponible dans le profil Agent.", "Use the Agent profile to confirm a visit.", "تأكيد الزيارة متاح في ملف الوكيل.", "Confirmi la visite men profil Agent.") };
  }

  const pending = context?.pending ? context : undefined;
  let clientIdentity = identity ?? pending?.requestedClient;
  const normalizeTitle = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const words = " " + normalizeTitle(question) + " ";
  const explicitChoices = context?.choices?.filter((choice) => [choice.title, choice.reference].some((value) =>
    value && words.includes(" " + normalizeTitle(value) + " "))) ?? [];
  const selectedChoice = selected?.listing ? context?.choices?.filter((choice) => [choice.title, choice.reference].some((value) => value && normalizeTitle(value) === normalizeTitle(selected.listing!))) : [];
  const chosen = explicitChoices.length === 1 ? explicitChoices[0] : selectedChoice?.length === 1 ? selectedChoice[0] : undefined;
  const listingTitle = chosen?.reference || chosen?.title || selected?.listing || pending?.requestedListing;
  const agentName = requestedAgent?.trim().replace(/\s+/g, " ");
  const requiresAgent = isAssistant || (isAgencyScope(scope) && assignVisit) || Boolean(agentName || pending?.agentId || pending?.assignVisit);
  const agents = requiresAgent && (agentName || pending?.agentId) ? await findVisitAgents(agentName, pending?.agentId) : [];
  let agent = agents.length === 1 ? agents[0] : undefined;
  if (requiresAgent && !agent && agents.length === 0 && question) {
    const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const words = ` ${normalize(question)} `;
    const directory = await User.find({ role: "AGENT" }).select("firstname lastname username").lean();
    const mentioned = directory.filter(({ firstname, lastname, username }) => (
      (firstname && lastname && words.includes(` ${normalize(`${firstname} ${lastname}`)} `)) ||
      (username && words.includes(` ${normalize(username)} `))
    ));
    if (mentioned.length === 1) {
      agent = mentioned[0];
      // The model can swap two names. Only recover the client when it gave
      // both names and the directory confirms which one is the agent.
      if (clientIdentity && agentName && normalize(clientIdentity) === normalize(`${agent.firstname} ${agent.lastname}`)
        && words.includes(` ${normalize(agentName)} `)) {
        clientIdentity = agentName;
      }
    }
  }
  if (requiresAgent && !agent) {
    return {
      answer: agentName
        ? say("Indiquez le nom complet d’un agent de l’agence.", "Give the full name of an agency agent.", "اذكري الاسم الكامل لوكيل من الوكالة.", "3tini l’esm kamel ta3 agent f l’agence.")
        : say("À quel agent dois-je attribuer cette visite ?", "Which agent should I assign this visit to?", "لأي وكيل أسند هذه الزيارة؟", "L’men men les agents n3ayen had la visite ?"),
      visitContext: {
        pending: true, assignVisit: true, choices: context?.choices, clientId: context?.clientId, listingId: chosen?.listingId ?? context?.listingId,
        requestedClient: clientIdentity ?? undefined, requestedListing: listingTitle ?? undefined,
        date: selected?.date ?? pending?.date, time: selected?.time ?? pending?.time,
      } satisfies VisitContext,
    };
  }

  const agentId = agent ? String(agent._id) : scope.userId;
  const clientFilter = clientIdentity ? clientIdentityFilter(clientIdentity) : context?.clientId ? { _id: context.clientId } : null;
  const listingPattern = listingTitle ? new RegExp(escapeRegex(listingTitle), "i") : null;
  const listingFilter = chosen ? { _id: chosen.listingId } : listingPattern
    ? { $or: [{ referenceCode: new RegExp(`^${listingPattern.source}$`, "i") }, { title: new RegExp(`^${listingPattern.source}$`, "i") }] }
    : context?.listingId ? { _id: context.listingId } : null;
  const [clients, exactListings] = await Promise.all([
    clientFilter ? Client.find({ archived: { $ne: true }, $and: [
      clientFilter,
      ...(isAgencyScope(scope) ? [] : [{ $or: [
        { assignedAgent: scope.userId }, { createdBy: scope.userId },
        ...(isAssistant ? [{ assignedAgent: agentId }] : []),
      ] }]),
    ] })
      .collation(assistantNameCollation).select("firstName lastName referenceCode phone phone2").limit(2).lean() : [],
    listingFilter ? Listing.find({ $and: [
      availableAgencyListings,
      ...(isAssistant ? [agencyListingsVisibility] : []),
      listingFilter,
    ] }).select("title referenceCode").limit(2).lean() : [],
  ]);
  const listings = exactListings.length || !listingPattern ? exactListings : await Listing.find({ $and: [
    availableAgencyListings, ...(isAssistant ? [agencyListingsVisibility] : []),
    { title: listingPattern },
  ] }).select("title referenceCode").limit(2).lean();
  const client = clients.length === 1 ? clients[0] : undefined;
  const changedClient = Boolean(client && context?.clientId && String(client._id) !== context.clientId);
  const listing = listings.length === 1 && (!changedClient || listingPattern) ? listings[0] : undefined;
  const changedListing = Boolean(listing && context?.listingId && String(listing._id) !== context.listingId);
  const reuseSlot = context?.pending && !changedClient && !changedListing;
  const date = selected?.date ?? (reuseSlot ? context.date : undefined);
  const time = selected?.time ?? (reuseSlot ? context.time : undefined);
  const visitContext: VisitContext = {
    pending: true,
    choices: context?.choices,
    ...(!listing && listingTitle ? { requestedListing: listingTitle } : {}),
    ...(agent ? { agentId } : {}),
    ...(client ? { clientId: String(client._id) } : {}),
    ...(listing ? { listingId: String(listing._id) } : {}),
    ...(date ? { date } : {}),
    ...(time ? { time } : {}),
  };

  const missing = [
    ...(!client ? [say("le nom ou la référence du client", "the client’s name or reference", "اسم الزبون أو مرجعه", "esm l’client wela référence")] : []),
    ...(!listing ? [say("la référence ou le titre du bien", "the property reference or title", "مرجع العقار أو عنوانه", "référence wela titre ta3 l’bien")] : []),
    ...(!date ? [say("la date", "the date", "التاريخ", "la date")] : []),
    ...(!time ? [say("l’heure", "the time", "الساعة", "l’heure")] : []),
  ];
  if (!client || !listing || !date || !time) {
    return { answer: say("Pour ajouter la visite, indiquez : ", "To add the visit, please provide: ", "لإضافة الزيارة، حدد: ", "Bach nzid la visite, 3tini : ") + missing.join(", ") + ".", visitContext };
  }

  const localDateTime = `${date}T${time}`;
  const scheduledAt = fromZonedTime(localDateTime, tz);
  if (!Number.isFinite(scheduledAt.getTime()) || formatInTimeZone(scheduledAt, tz, "yyyy-MM-dd'T'HH:mm") !== localDateTime || scheduledAt <= new Date()) {
    return { answer: say("Ce créneau est invalide ou déjà passé. Donnez-moi une date et une heure à venir.", "That slot is invalid or already past. Give me a future date and time.", "هذا الموعد غير صالح أو مضى. أعطني موعدًا قادمًا.", "Had créneau machi valide wela fat. 3tini date w sa3a li jayine."), visitContext: { ...visitContext, date: undefined, time: undefined } };
  }

  const result = await scheduleVisit({
    clientId: String(client._id), listingId: String(listing._id), scheduledAt,
    isExternalListing: false, status: "SCHEDULED", deduplicate: true,
    ...(agent ? { assignedAgentId: agentId } : {}),
    notes: "Visite confirmée par le client, enregistrée depuis l’Assistant IA.",
  });
  if (!result.success || !result.data) return { answer: result.error?.message || "Impossible d’enregistrer la visite.", visitContext };

  const visitId = String((result.data as { _id?: unknown })._id ?? "");
  const persisted = visitId ? await Visit.findById(visitId).select("calendarEventId") : null;
  const name = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.referenceCode;
  const title = listing.title || listing.referenceCode || "Bien immobilier";
  const when = formatInTimeZone(scheduledAt, tz, "dd/MM/yyyy HH:mm");
  let notice = "";
  const agentLabel = agent ? [agent.firstname, agent.lastname].filter(Boolean).join(" ") : "";
  if (agent && persisted?.calendarEventId) {
    try {
      const notificationId = createHash("sha256").update(`assistant-visit:${visitId}:${agentId}`).digest("hex").slice(0, 24);
      await Notification.updateOne({ _id: notificationId }, { $setOnInsert: {
        recipient: agentId, type: "VISIT_SCHEDULED", title: "Nouvelle visite confirmée",
        body: `${when} (Alger) · ${title} · ${name}`,
        relatedEntity: { type: "VISIT", id: visitId }, read: false, link: ROUTES.SCHEDULE,
      } }, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
      notice = say("Notification envoyée à l’agent.", "Agent notified.", "تم إشعار الوكيل.", "L’agent rah notifié.");
    } catch (error) {
      console.error("Failed to notify assigned visit agent", error);
      notice = say("La notification a échoué. Relancez la confirmation pour réessayer.", "Notification failed. Repeat the confirmation to retry.", "تعذر إرسال الإشعار. أعيدي التأكيد للمحاولة مجدداً.", "La notification ma r7etch. 3awdi la confirmation.");
      return { answer: `${name} · ${title} · ${when} (Alger) · ${agentLabel}\n${notice}`, visitContext };
    }
  }
  if (agent && !persisted?.calendarEventId) {
    return { answer: say("La visite est enregistrée. Relancez la confirmation pour terminer l’ajout au planning et la notification.", "The visit is saved. Repeat the confirmation to finish adding it to the calendar and notifying the agent.", "تم حفظ الزيارة. أعيدي التأكيد لإضافتها إلى الجدول وإشعار الوكيل.", "La visite tsajlet. 3awdi la confirmation bach tzidiha f planning w tnotifi l’agent."), visitContext };
  }
  const confirmation = agent
    ? say(`Visite confirmée · Planning de l’agent ${agentLabel}`, `Visit confirmed · ${agentLabel}’s schedule`, `تم تأكيد الزيارة وإضافتها إلى جدول ${agentLabel}`, `La visite confirmée w tzadet f planning ta3 ${agentLabel}`)
    : persisted?.calendarEventId
    ? say("Visite confirmée et ajoutée à votre planning", "Visit confirmed and added to your schedule", "تم تأكيد الزيارة وإضافتها إلى جدولك", "La visite confirmée w tzadet f planning")
    : say("Visite enregistrée dans le CRM", "Visit saved in the CRM", "تم تسجيل الزيارة في النظام", "La visite tsajlet f CRM");
  return {
    answer: `${confirmation} : ${name} · ${title} · ${when} (Alger).${notice ? `\n${notice}` : ""}`,
    records: [
      ...(visitId && !agent ? [{ label: say("Voir la visite", "View visit", "عرض الزيارة", "Chouf la visite"), href: ROUTES.VISIT_DETAIL(visitId) }] : []),
      ...(!agent ? [{ label: say("Mon planning", "My schedule", "جدولي", "Planning ta3i"), href: ROUTES.SCHEDULE }] : []),
    ],
    ...(isAssistant ? {} : { visitMessage: buildVisitMessage("confirmed", { firstName: client.firstName, phone: client.phone, phone2: client.phone2 }, title, scheduledAt) }),
    clientContextId: String(client._id),
    visitContext: { clientId: String(client._id), listingId: String(listing._id), visitId, pending: false, ...(agent ? { agentId } : {}) },
  };
}

async function findAssistantVisits(
  scope: AssistantScope,
  identity: string | null | undefined,
  selected: z.infer<typeof visitConfirmationInput> | null | undefined,
  context: VisitContext | undefined,
  useVisitId: boolean,
  allowCancelled = true,
  agentId?: string,
) {
  const matches = await Visit.find({
    ...(!isAgencyScope(scope) ? { agent: scope.userId } : agentId ? { agent: agentId } : {}),
    ...(useVisitId ? { _id: context?.visitId, status: { $in: allowCancelled ? ["SCHEDULED", "CANCELLED"] : ["SCHEDULED"] } } : { status: "SCHEDULED" }),
    ...(!identity && context?.clientId ? { client: context.clientId } : {}),
    ...(!selected?.listing && context?.listingId ? { listing: context.listingId } : {}),
    ...(selected?.date ? { scheduledAt: {
      $gte: fromZonedTime(selected.date + "T00:00:00", tz),
      $lt: new Date(fromZonedTime(selected.date + "T00:00:00", tz).getTime() + 86_400_000),
    } } : {}),
  }).select("scheduledAt status client listing externalListingRef agent").populate("client", "firstName lastName referenceCode phone phone2").populate("listing", "title referenceCode").sort({ scheduledAt: 1 }).lean<{
    _id: string; agent: string; scheduledAt: Date; status: string; externalListingRef?: string;
    client?: { _id: string; firstName?: string; lastName?: string; referenceCode?: string; phone?: string; phone2?: string };
    listing?: { _id: string; title?: string; referenceCode?: string };
  }[]>();

  const normalize = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
  const identityMatches = identity ? await Client.find({ ...clientIdentityFilter(identity), _id: { $in: matches.flatMap((visit) => visit.client?._id ? [visit.client._id] : []) } }).collation(assistantNameCollation).select("_id").lean() : undefined;
  const allowedClients = new Set(identityMatches?.map((client) => String(client._id)));
  return matches.filter((visit) => {
    if (identity && !allowedClients.has(String(visit.client?._id))) return false;
    if (selected?.listing && ![visit.listing?.title, visit.listing?.referenceCode, visit.externalListingRef].some((item) =>
      item && normalize(item).includes(normalize(selected.listing!)))) return false;
    return !selected?.time || formatInTimeZone(visit.scheduledAt, tz, "HH:mm") === selected.time;
  });
}

export async function cancelAssistantVisit(
  scope: AssistantScope,
  identity: string | null | undefined,
  selected: z.infer<typeof visitConfirmationInput> | null | undefined,
  context?: VisitContext,
  language: "fr" | "en" | "ar" | "darija" = "fr",
  requestedAgent?: string | null,
) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!canManageAgentVisits(scope.role)) return { answer: say("Votre profil ne permet pas d’annuler une visite.", "Use the Agent profile to cancel in chat.", "الإلغاء من المحادثة متاح للوكيل فقط.", "L’annulation f chat réservée lel profil Agent.") };

  const agentId = await resolveVisitAgentFilter(scope, requestedAgent, context?.cancelPending ? context.agentId : undefined);
  if (agentId === null) return { answer: say("Précisez le nom complet de l’agent.", "Specify the agent’s full name.", "حدّد الاسم الكامل للوكيل.", "3tini l’esm kamel ta3 l’agent.") };
  const hasExplicitTarget = Boolean(identity || selected?.listing || selected?.date || selected?.time || requestedAgent);
  if (context?.pending && !context.visitId && !hasExplicitTarget) {
    return { answer: say("La demande de visite a été abandonnée.", "The draft visit was discarded.", "تم إلغاء طلب الزيارة غير المسجل.", "La demande de visite t’annulat."), visitContext: {} };
  }
  const useVisitId = Boolean(context?.visitId && !hasExplicitTarget);
  const matching = await findAssistantVisits(scope, identity, selected, hasExplicitTarget ? undefined : context, useVisitId, true, agentId);
  if ((!hasExplicitTarget && !context?.visitId && !context?.listingId) || matching.length !== 1) {
    return {
      answer: matching.length > 1 || (!hasExplicitTarget && !context?.listingId)
        ? say("Quelle visite souhaitez-vous annuler ? Indiquez le client, la date ou l’heure.", "Which visit should I cancel? Give the client, date or time.", "أي زيارة تريد إلغاءها؟ حدد الزبون أو التاريخ أو الساعة.", "Anhi visite n’annuli ? 3tini client, date wela sa3a.")
        : say("Je n’ai trouvé aucune visite planifiée qui corresponde.", "I found no matching scheduled visit.", "لم أجد زيارة مجدولة مطابقة.", "Ma l9itch visite planifiée tatabe9."),
      visitContext: { ...context, agentId, pending: false, cancelPending: true },
    };
  }

  const visit = matching[0];
  const id = String(visit._id);
  const result = visit.status === "CANCELLED" ? { success: true } : await cancelVisit({ visitId: id, expectedScheduledAt: visit.scheduledAt.toISOString() });
  if (!result.success) return { answer: ("error" in result && result.error?.message) || "Impossible d’annuler la visite.", visitContext: { ...context, cancelPending: true } };
  const client = [visit.client?.firstName, visit.client?.lastName].filter(Boolean).join(" ");
  const when = formatInTimeZone(visit.scheduledAt, tz, "dd/MM/yyyy HH:mm");
  return {
    visitMessage: buildVisitMessage("cancelled", visit.client, visit.listing?.title || visit.listing?.referenceCode || visit.externalListingRef || "Bien immobilier", visit.scheduledAt),
    answer: [say("Visite annulée", "Visit cancelled", "تم إلغاء الزيارة", "La visite t’annulat"), client, visit.listing?.title, when].filter(Boolean).join(" · "),
    records: String(visit.agent) === scope.userId ? [{ label: say("Mon planning", "My schedule", "جدولي", "Planning ta3i"), href: ROUTES.SCHEDULE }] : [],
    visitContext: { clientId: visit.client?._id ? String(visit.client._id) : undefined, listingId: visit.listing?._id ? String(visit.listing._id) : undefined, visitId: id },
  };
}

async function resolveVisitAgentFilter(scope: AssistantScope, name?: string | null, fallbackId?: string) {
  if (!name) return isAgencyScope(scope) ? fallbackId : undefined;
  const agents = await findVisitAgents(name.trim().replace(/\s+/g, " "));
  if (agents.length !== 1) return null;
  const agentId = String(agents[0]._id);
  return isAgencyScope(scope) || agentId === scope.userId ? agentId : null;
}

export const rescheduleVisitInput = visitConfirmationInput.extend({
  sameDay: z.boolean().nullish(),
  originalDate: visitConfirmationInput.shape.date,
  originalTime: visitConfirmationInput.shape.time,
});

export async function rescheduleAssistantVisit(
  scope: AssistantScope,
  identity: string | null | undefined,
  selected: z.infer<typeof rescheduleVisitInput> | null | undefined,
  context: VisitContext | undefined,
  language: "fr" | "en" | "ar" | "darija",
  requestedAgent?: string | null,
) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  const missingDate = say("À quelle date ?", "Which date?", "ما التاريخ؟", "Anhi date ?");
  const missingTime = say("À quelle heure ?", "What time?", "ما الساعة؟", "Anhi sa3a ?");
  if (!canManageAgentVisits(scope.role)) return { answer: say("Votre profil ne permet pas de déplacer une visite.", "Use the Agent profile to reschedule.", "تغيير الموعد متاح للوكيل فقط.", "Beddel la visite men profil Agent.") };

  const targetAgentId = await resolveVisitAgentFilter(scope, requestedAgent, context?.reschedulePending ? context.agentId : undefined);
  if (targetAgentId === null) return { answer: say("Précisez le nom complet de l’agent.", "Specify the agent’s full name.", "حدّد الاسم الكامل للوكيل.", "3tini l’esm kamel ta3 l’agent.") };
  const targeted = Boolean(identity || selected?.listing || selected?.originalDate || selected?.originalTime || requestedAgent);
  const matches = await findAssistantVisits(scope, identity, {
    listing: selected?.listing, date: selected?.originalDate, time: selected?.originalTime,
  }, targeted ? undefined : context, !targeted && Boolean(context?.visitId), false, targetAgentId);
  const date = selected?.date ?? (selected?.sameDay && matches.length === 1
    ? formatInTimeZone(matches[0].scheduledAt, tz, "yyyy-MM-dd")
    : context?.reschedulePending ? context.date : undefined);
  const time = selected?.time ?? (context?.reschedulePending ? context.time : undefined);
  if (matches.length !== 1 || (!targeted && !context?.visitId && !context?.listingId)) {
    return {
      answer: matches.length > 1 || !targeted
        ? say("Quelle visite souhaitez-vous déplacer ? Précisez le client ou le créneau actuel.", "Which visit should I move? Give the client or current slot.", "أي زيارة تريد تغييرها؟ حدد الزبون أو الموعد الحالي.", "Anhi visite nbedel ? 3tini client wela créneau actuel.")
        : say("Je n’ai trouvé aucune visite planifiée qui corresponde.", "No matching scheduled visit.", "لم أجد زيارة مجدولة مطابقة.", "Ma l9itch visite planifiée tatabe9."),
      visitContext: { agentId: targetAgentId, reschedulePending: true, date, time },
    };
  }

  const visit = matches[0];
  const id = String(visit._id);
  const nextContext: VisitContext = {
    visitId: id, agentId: String(visit.agent), clientId: visit.client?._id ? String(visit.client._id) : undefined,
    listingId: visit.listing?._id ? String(visit.listing._id) : undefined, reschedulePending: true, date, time,
  };
  if (!date || !time) return {
    answer: [!date && missingDate, !time && missingTime].filter(Boolean).join(" "),
    visitContext: nextContext,
  };

  const localDateTime = `${date}T${time}`;
  const scheduledAt = fromZonedTime(localDateTime, tz);
  if (!Number.isFinite(scheduledAt.getTime()) || formatInTimeZone(scheduledAt, tz, "yyyy-MM-dd'T'HH:mm") !== localDateTime || scheduledAt <= new Date()) {
    return { answer: say("Donnez-moi une date et une heure à venir.", "Give me a future date and time.", "أعطني موعدًا قادمًا.", "3tini date w sa3a li jayine."), visitContext: { ...nextContext, date: undefined, time: undefined } };
  }

  const agentId = String(visit.agent);
  try {
    const events = await withVisitSlotLock(agentId, async () => {
      await assertVisitSlotFree(agentId, scheduledAt, id);
      const filter = { _id: id, agent: agentId, status: "SCHEDULED", scheduledAt: visit.scheduledAt };
      const events = await CalendarEvent.find({ sourceType: "VISIT", sourceId: id, agent: agentId, syncStatus: { $ne: "DELETED" } }).select("googleEventId");
      const updated = await Visit.updateOne(filter, { $set: { scheduledAt } });
      if (!updated.matchedCount) throw new VisitSlotConflict("La visite a changé. Vérifiez son créneau actuel.");
      try {
        await CalendarEvent.updateMany({ _id: { $in: events.map((event) => event._id) } }, {
          $set: { startTime: scheduledAt, endTime: new Date(scheduledAt.getTime() + VISIT_SLOT_MS) },
        });
      } catch (error) {
        await Visit.updateOne({ ...filter, scheduledAt }, { $set: { scheduledAt: visit.scheduledAt } });
        throw error;
      }
      return events;
    });
    if (!events.length) await createCalendarEventFromVisit(id);
    else await Promise.all(events.filter((event) => event.googleEventId).map((event) => syncEventToGoogle(String(event._id))));
  } catch (error) {
    if (error instanceof VisitSlotConflict) return { answer: error.message, visitContext: { ...nextContext, time: undefined } };
    throw error;
  }

  revalidatePath(ROUTES.SCHEDULE);
  revalidatePath(ROUTES.VISITS);
  revalidatePath(ROUTES.VISIT_DETAIL(id));
  const title = visit.listing?.title || visit.listing?.referenceCode || visit.externalListingRef || "Bien immobilier";
  const when = formatInTimeZone(scheduledAt, tz, "dd/MM/yyyy HH:mm");
  return {
    answer: `${say("Visite déplacée", "Visit rescheduled", "تم تغيير موعد الزيارة", "La visite tbeddlet")} · ${title} · ${when} (Alger).`,
    records: String(visit.agent) === scope.userId ? [{ label: say("Mon planning", "My schedule", "جدولي", "Planning ta3i"), href: ROUTES.SCHEDULE }] : [],
    visitMessage: buildVisitMessage("rescheduled", visit.client, title, scheduledAt),
    clientContextId: nextContext.clientId,
    visitContext: { ...nextContext, reschedulePending: false, date: undefined, time: undefined },
  };
}


/** Transfer an existing appointment; never creates a second Visit. */
export async function reassignAssistantVisit(
  scope: AssistantScope,
  identity: string | null | undefined,
  selected: z.infer<typeof rescheduleVisitInput> | null | undefined,
  context: VisitContext | undefined,
  language: "fr" | "en" | "ar" | "darija",
  requestedAgent?: string | null,
) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!isAgencyScope(scope)) return { answer: say("Seul le gérant peut réattribuer une visite.", "Only a manager can reassign a visit.", "المدير فقط يمكنه تغيير الوكيل.", "Ghir le gérant y9der ybeddel l’agent.") };
  const targeted = Boolean(identity || selected?.listing || selected?.date || selected?.time);
  const matches = await findAssistantVisits(scope, identity, selected, targeted ? undefined : context, !targeted && Boolean(context?.visitId), false);
  if (matches.length !== 1) return { answer: say("Quelle visite souhaitez-vous réattribuer ? Précisez le client et le créneau si nécessaire.", "Which scheduled visit should I reassign? Specify the client and slot.", "أي زيارة تريد إسنادها؟ حدد الزبون والموعد.", "Anhi visite ? 3tini client w créneau."), visitContext: { ...context, reassignPending: true } };
  const visit = matches[0];
  const id = String(visit._id);
  const nextContext: VisitContext = { visitId: id, clientId: visit.client?._id ? String(visit.client._id) : undefined, listingId: visit.listing?._id ? String(visit.listing._id) : undefined, agentId: String(visit.agent), reassignPending: true };
  const agents = requestedAgent ? await findVisitAgents(requestedAgent.trim()) : [];
  if (agents.length !== 1) return { answer: say("À quel agent ? Indiquez son nom complet si nécessaire.", "Which agent? Give the full name if necessary.", "إلى أي وكيل؟ حدد اسمه.", "L’anhi agent ? 3tini l’esm."), visitContext: nextContext };
  const target = String(agents[0]._id);
  const source = String(visit.agent);
  const name = [agents[0].firstname, agents[0].lastname].filter(Boolean).join(" ");
  try {
    await withVisitSlotLock(`transfer:${id}`, async () => {
      const keys = [...new Set([source, target])].sort();
      const update = async () => {
        const current = await Visit.findOne({ _id: id, agent: source, scheduledAt: visit.scheduledAt, status: "SCHEDULED" });
        if (!current) throw new VisitSlotConflict("La visite a changé. Consultez son état actuel.");
        await assertVisitSlotFree(target, visit.scheduledAt, id);
        const events = await CalendarEvent.find({ sourceType: "VISIT", sourceId: id, syncStatus: { $ne: "DELETED" } });
        // A remote event must be migrated explicitly, rather than orphaned in the old account.
        if (source !== target && events.some(event => event.googleEventId)) throw new VisitSlotConflict("Cette visite est synchronisée avec Google Calendar. Le transfert entre calendriers n’est pas encore disponible ; la visite reste inchangée.");
        const filter = { _id: id, agent: source, scheduledAt: visit.scheduledAt, status: "SCHEDULED" };
        const result = await Visit.updateOne(filter, { $set: { agent: target } });
        if (!result.matchedCount) throw new VisitSlotConflict("La visite a changé. Réessayez.");
        try {
          await CalendarEvent.updateMany({ _id: { $in: events.map(event => event._id) } }, { $set: { agent: target, syncStatus: "PENDING" } });
        } catch (error) {
          await Visit.updateOne({ ...filter, agent: target }, { $set: { agent: source } });
          throw error;
        }
      };
      const lock = (index: number): Promise<void> => index === keys.length ? update() : withVisitSlotLock(keys[index], () => lock(index + 1));
      await lock(0);
    });
  } catch (error) {
    if (error instanceof VisitSlotConflict) return { answer: error.message.replace("Vous avez déjà", "L’agent a déjà"), visitContext: nextContext };
    throw error;
  }
  const calendar = await createCalendarEventFromVisit(id);
  const when = formatInTimeZone(visit.scheduledAt, tz, "dd/MM/yyyy HH:mm");
  const title = visit.listing?.title || visit.externalListingRef || "Bien immobilier";
  let notice = calendar.success ? "" : "\nLe planning doit être resynchronisé : " + (calendar.error || "échec calendrier");
  if (source !== target) {
    try {
      for (const recipient of [source, target]) {
        const notificationId = createHash("sha256").update(`transfer:${id}:${source}:${target}:${visit.scheduledAt.toISOString()}:${recipient}`).digest("hex").slice(0, 24);
        await Notification.updateOne({ _id: notificationId }, { $setOnInsert: { recipient, type: "VISIT_SCHEDULED", title: "Visite réattribuée", body: `${title} · ${when} · Agent : ${name}`, relatedEntity: { type: "VISIT", id }, read: false, link: ROUTES.SCHEDULE } }, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
      }
    } catch { notice = "\nNotification non envoyée : consultez le planning."; }
  }
  revalidatePath(ROUTES.SCHEDULE);
  revalidatePath(ROUTES.VISITS);
  revalidatePath(ROUTES.VISIT_DETAIL(id));
  return { answer: `${say("Visite attribuée à", "Visit assigned to", "تم إسناد الزيارة إلى", "La visite rahi 3and")} ${name}\n- ${title}\n- ${when} (Alger)${notice}`, clientContextId: nextContext.clientId, visitContext: { ...nextContext, agentId: target, reassignPending: false } };
}
