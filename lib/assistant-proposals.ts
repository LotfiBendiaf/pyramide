import { pluralize } from "@/lib/pluralize";
import { createHash, randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import { CalendarEvent, Client, FollowUp, Listing } from "@/models";
import { assistantNameCollation, clientIdentityFilter } from "@/lib/assistant-client-lookup";
import { normalizePhoneKey } from "@/lib/phone";
import { canUseAssistantOperations } from "@/constants/values";
import { agencyListingsVisibility, availableAgencyListings, canReadAssistantSource, isAgencyScope, type AssistantScope } from "@/lib/assistant-access";

export const proposalInput = z.object({
  listing: z.string().trim().min(1).max(120).nullish(),
  city: z.string().trim().min(1).max(80).nullish(),
  propertyType: z.string().trim().min(1).max(60).nullish(),
  maxPrice: z.number().positive().max(1e12).nullish(),
  transaction: z.enum(["sale", "rent"]).nullish(),
  slot: z.string().trim().min(1).max(100).nullish(),
});

export const followUpProposalInput = z.object({
  proposalId: z.string().uuid(),
  clientId: z.string().regex(/^[a-f0-9]{24}$/i),
  listingId: z.string().regex(/^[a-f0-9]{24}$/i),
});

export type VisitProposal = {
  proposalId: string;
  listingId: string;
  clientId: string;
  clientName: string;
  clientReference?: string;
  listingReference?: string;
  title: string;
  detail: string;
  photos: string[];
  phone: string | null;
  message: string;
};

const literal = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const availableForMatching = (scope: AssistantScope) => ({
  ...availableAgencyListings,
  ...(scope.role === "AGENT" || isAgencyScope(scope) ? {} : {
    ...agencyListingsVisibility,
  }),
});

export function canPrepareVisitProposals(scope: AssistantScope) {
  return canUseAssistantOperations(scope.role);
}

function safePhoto(url: string) {
  return /^\/(?![\/\\])/.test(url) || /^https:\/\//i.test(url);
}

export async function prepareVisitProposals(
  scope: AssistantScope,
  identity: string | null | undefined,
  options?: z.infer<typeof proposalInput> | null,
  { clientId, matchOnly = false, language = "fr" }: { clientId?: string; matchOnly?: boolean; language?: "fr" | "en" | "ar" | "darija" } = {},
) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (matchOnly ? !canReadAssistantSource(scope, "clients") : !canPrepareVisitProposals(scope)) {
    return { answer: say("Cette action n’est pas accessible avec votre profil.", "This action is unavailable for your profile.", "هذا الإجراء غير متاح لملفك.", "Had l’action machi disponible f profil ta3ek.") };
  }
  if (!identity && !clientId) {
    return { answer: say("Pour quel client ? Indiquez son nom, sa référence CRM ou son numéro.", "Which client? Enter their name, CRM reference or telephone number.", "لأي زبون؟ اكتب اسمه أو مرجعه أو رقم هاتفه.", "Pour quel client ? 3tini esmou, référence CRM wela numéro ta3ou.") };
  }

  const identityFilter = identity ? clientIdentityFilter(identity) : { _id: clientId };
  const clients = await Client.find({
    archived: { $ne: true },
    $and: [
      identityFilter,
      isAgencyScope(scope) ? {} : scope.role === "ASSISTANT"
        ? { $or: [{ assignedAgent: scope.userId }, { createdBy: scope.userId }] }
        : { assignedAgent: scope.userId },
    ],
  }).collation(assistantNameCollation).select("firstName lastName referenceCode phone phone2 city preferredLocation wantedPropertyType budgetMin budgetMax priceCurrency type rooms wantedArea wantedAreaMin floorMin floorMax").limit(2).lean();

  if (!clients.length) return { answer: say("Je n’ai pas trouvé ce client dans vos dossiers actifs.", "I couldn’t find that client in your active records.", "لم أجد هذا الزبون في ملفاتك النشطة.", "Ma l9itch had l’client f dossiers actifs ta3ek.") };
  if (clients.length > 1) return { answer: say("Plusieurs clients correspondent. Précisez le nom complet ou la référence CRM.", "Several clients match. Specify the full name or CRM reference.", "هناك عدة زبائن مطابقين. اكتب الاسم الكامل أو المرجع.", "Kayen plusieurs clients. 3tini l’ism kamel wela la référence CRM.") };
  const client = clients[0];
  const clientContextId = String(client._id);
  const clientLabel = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.referenceCode || "Client";
  const specific = options?.listing;
  const city = options?.city ?? (specific ? undefined : client.city);
  const type = options?.propertyType ?? (specific ? undefined : client.wantedPropertyType);
  const price = options?.maxPrice ?? (specific || (client.priceCurrency && client.priceCurrency !== "DZD") ? undefined : client.budgetMax);
  const transaction = options?.transaction ?? (specific ? undefined : client.type === "RENTER" ? "rent" : client.type === "BUYER" ? "sale" : undefined);
  if (!specific && !city && !type && !price && !transaction) {
    return { answer: "Quel bien souhaitez-vous proposer ? Donnez-moi sa référence, ou précisez le secteur et le budget." };
  }

  const compareSaved = !specific;
  const district = compareSaved && !options?.city ? client.preferredLocation : undefined;
  const minPrice = compareSaved && !options?.maxPrice && (!client.priceCurrency || client.priceCurrency === "DZD") ? client.budgetMin : undefined;
  const rooms = compareSaved ? client.rooms : undefined;
  if (!specific && (client.budgetMin != null || client.budgetMax != null) && client.priceCurrency && client.priceCurrency !== "DZD") {
    return { answer: say("Le budget est dans une autre devise. Indiquez son équivalent en DZD pour comparer les prix.", "Provide the budget in DZD to compare property prices.", "يرجى تحديد الميزانية بالدينار الجزائري لمقارنة الأسعار.", "3tini l’équivalent ta3 budget b DZD bach ncompari les prix."), clientContextId };
  }
  const districts = district?.split(/\s*(?:\/|;|\bou\b|\bor\b|،)\s*/i).map((value: string) => value.trim()).filter(Boolean);
  const floorMin = compareSaved ? client.floorMin : undefined;
  const floorMax = compareSaved ? client.floorMax : undefined;
  const filters = [
    availableForMatching(scope),
    ...(typeof client.wantedAreaMin === "number" && !specific ? [{ "features.area": { $gte: client.wantedAreaMin } }] : []),
    ...(specific ? [{ $or: [{ referenceCode: specific }, { title: new RegExp(literal(specific), "i") }] }] : []),
    ...(city ? [{ $or: [{ "location.city": city }, { "location.district": city }] }] : []),
    ...(districts?.length ? [{ "location.district": { $in: districts } }] : []),
    ...(typeof floorMin === "number" ? [{ "features.etage": { $gte: floorMin } }] : []),
    ...(typeof floorMax === "number" ? [{ "features.etage": { $lte: floorMax } }] : []),
    ...(typeof minPrice === "number" ? [{ price: { $gte: minPrice } }] : []),
    ...(rooms ? [{ $or: [
      { "features.roomCount": rooms },
      { "features.roomCount": null, "features.bedrooms": rooms },
    ] }] : []),
    ...(type ? [{ propertyType: type }] : []),
    ...(typeof price === "number" ? [{ price: { $lte: price } }] : []),
    ...(transaction ? [{ status: transaction === "sale" ? "En Vente" : "En Location" }] : []),
  ];
  const listings = await Listing.find({ $and: filters }).collation(assistantNameCollation)
    .select("title referenceCode price status location.city location.district features.area features.etage features.roomCount images isPublished")
    .sort({ createdAt: -1, _id: 1 }).limit(3).lean();
  if (!listings.length) return {
    answer: say("Aucun bien disponible ne correspond aux critères renseignés.", "No available property matches the recorded criteria.", "لا يوجد عقار متاح يطابق المعايير المسجلة.", "Ma kayen hata bien disponible ymatchi les critères."),
    clientContextId,
  };

  if (matchOnly) {
    const size = typeof client.wantedArea === "number" && client.wantedArea > 0 ? client.wantedArea : undefined;
    // The requested area is a target, not a hard cap. Prefer the closest available options and show actual sizes.
    if (size) listings.sort((a, b) => Math.abs((a.features?.area ?? Infinity) - size) - Math.abs((b.features?.area ?? Infinity) - size));
    return {
      clientContextId,
      visitContext: { clientId: clientContextId, listingId: listings.length === 1 ? String(listings[0]._id) : undefined, pending: false, choices: listings.map((item) => ({ listingId: String(item._id), title: item.title, reference: item.referenceCode })) },
      answer: say(
        `Voici ${listings.length} ${pluralize(listings.length, "bien")} ${pluralize(listings.length, "disponible")} pour ${clientLabel} selon les critères de recherche.`,
        `Here are ${listings.length} available property results for ${clientLabel} based on the search criteria.`,
        `هذه نتائج البحث المتاحة لـ ${clientLabel}: ${listings.length}.`,
        `Hna ${listings.length} ${pluralize(listings.length, "bien")} ${pluralize(listings.length, "disponible")} pour ${clientLabel}, selon les critères ta3 recherche.`,
      ),
      records: listings.map((listing) => ({
        label: listing.title || listing.referenceCode || "Bien immobilier",
        detail: [
          listing.referenceCode,
          listing.location?.district || listing.location?.city,
          typeof listing.price === "number" ? `${new Intl.NumberFormat("fr-DZ").format(listing.price)} DA` : undefined,
          typeof listing.features?.area === "number" ? `${listing.features.area} m²${size ? ` / ${size} m² recherchés` : ""}` : undefined,
        ].filter(Boolean).join(" · "),
        href: `/dashboard/listings/${listing._id}`,
      })),
    };
  }

  const phone = [client.phone, client.phone2].map(normalizePhoneKey).find((value) => value && /^\d{8,15}$/.test(value));
  const proposals: VisitProposal[] = listings.map((listing) => {
    const title = listing.title || listing.referenceCode || "Bien immobilier";
    const location = [listing.location?.district, listing.location?.city].filter(Boolean).filter((value, i, values) => values.indexOf(value) === i).join(", ");
    const amount = typeof listing.price === "number" ? new Intl.NumberFormat("fr-DZ").format(listing.price) + " DA" : "";
    const detail = [location, amount, typeof listing.features?.area === "number" ? `${listing.features.area} m²` : undefined, typeof listing.features?.etage === "number" ? `Étage ${listing.features.etage}` : undefined, listing.status].filter(Boolean).join(" · ");
    const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    const link = listing.isPublished && siteUrl && /^https:\/\//i.test(siteUrl)
      ? `${siteUrl.replace(/\/$/, "")}/listings/${listing._id}` : null;
    const photos = (listing.images ?? []).flatMap((item: string | { url: string; isPublic?: boolean }) => {
      const url = typeof item === "string" ? item : item.isPublic === true ? item.url : null;
      return url && safePhoto(url) ? [url] : [];
    }).slice(0, 6);
    const message = [
      say("Bonjour", "Hello", "مرحبًا", "Salam") + (client.firstName ? " " + client.firstName : "") + ",",
      say("Je vous propose de visiter ce bien", "I suggest a visit to this property", "أقترح عليكم زيارة هذا العقار", "N9tare7 3lik tzour had l’bien") + " · " + title + (detail ? " (" + detail + ")" : "") + ".",
      options?.slot
        ? say("Seriez-vous disponible", "Would you be available", "هل يناسبكم", "T9der") + " " + options.slot + " ?"
        : say("Quelles seraient vos disponibilités pour une visite ?", "When would you be available for a visit?", "متى تكونون متاحين للزيارة؟", "Wa9tach t9der tzour l’bien ?"),
      ...(link ? [`Voici l’annonce et ses photos : ${link}`] : []),
      "À bientôt, Pyramide Immobilier.",
    ].join("\n\n");
    return {
      proposalId: randomUUID(), listingId: String(listing._id), clientId: String(client._id),
      clientName: clientLabel, clientReference: client.referenceCode, listingReference: listing.referenceCode,
      title, detail, photos, phone: phone && /^\d{8,15}$/.test(phone) ? phone : null, message,
    };
  });
  return { answer: say(`Propositions pour ${clientLabel}. Vérifiez le message avant l’envoi.`, `Proposals for ${clientLabel}. Review the message before sending.`, `اقتراحات لـ ${clientLabel}. راجع الرسالة قبل إرسالها.`, `Hna les propositions pour ${clientLabel}. Vérifi le message 9bel ma teb3at.`), proposals, clientContextId, visitContext: { clientId: clientContextId, listingId: proposals.length === 1 ? proposals[0].listingId : undefined, pending: false, choices: listings.map((item) => ({ listingId: String(item._id), title: item.title, reference: item.referenceCode })) } };
}

export async function createProposalFollowUp(scope: AssistantScope, input: z.infer<typeof followUpProposalInput>) {
  if (!canPrepareVisitProposals(scope)) return null;
  const [client, listing] = await Promise.all([
    Client.findOne({ _id: input.clientId, ...(isAgencyScope(scope) ? {} : scope.role === "ASSISTANT" ? { $or: [{ assignedAgent: scope.userId }, { createdBy: scope.userId }] } : { assignedAgent: scope.userId }), archived: { $ne: true } }).select("assignedAgent").lean<{ assignedAgent?: string }>(),
    Listing.findOne({ _id: input.listingId, ...availableForMatching(scope) }).select("title referenceCode").lean<{ title?: string; referenceCode?: string }>(),
  ]);
  if (!client || !listing) return null;
  const key = createHash("sha256").update(`${scope.userId}:${input.clientId}:${input.listingId}:${input.proposalId}`).digest("hex").slice(0, 24);
  const now = new Date();
  const followUp = await FollowUp.findOneAndUpdate({ _id: new Types.ObjectId(key) }, {
    $setOnInsert: {
      client: input.clientId, listing: input.listingId, agent: client.assignedAgent ?? scope.userId,
      title: "Relancer la proposition de visite",
      note: `Vérifier la réponse du client à la proposition de visite pour ${listing.title || listing.referenceCode || "ce bien"}.`,
      context: "CLIENT", channel: "WHATSAPP", type: "CUSTOM", status: "PENDING", duration: 0,
      reminderAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  }, { upsert: true, new: true, setDefaultsOnInsert: false });
  if (followUp.status === "PENDING" || followUp.status === "OVERDUE") {
    const reminderAt = followUp.reminderAt;
    if (!reminderAt) throw new Error("Missing proposal reminder date");
    if (!followUp.calendarEventId) {
      // A deterministic ID makes the calendar entry safe to retry independently of the follow-up.
      const event = await CalendarEvent.findOneAndUpdate({ _id: followUp._id }, {
        $setOnInsert: {
          agent: followUp.agent,
          client: followUp.client,
          listing: followUp.listing,
          title: followUp.title,
          description: followUp.note,
          sourceType: "FOLLOWUP",
          sourceId: followUp._id,
          startTime: reminderAt,
          endTime: new Date(reminderAt.getTime() + 15 * 60 * 1000),
        },
      }, { upsert: true, new: true });
      await FollowUp.updateOne({ _id: followUp._id }, { $set: { calendarEventId: event._id } });
    }
  }
  return { reminderAt: followUp.reminderAt };
}
