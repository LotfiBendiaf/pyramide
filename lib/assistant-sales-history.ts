import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { Listing, Negotiation, User } from "@/models";
import { isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation } from "@/lib/assistant-client-lookup";
import { pluralize } from "@/lib/pluralize";

export async function answerSalesHistory(scope: AssistantScope, input: {
  agent?: string | null; listingQuery?: string | null; closedSince?: string | null; closedUntil?: string | null;
  own?: boolean; range?: { $gte: Date; $lt: Date }; language: "fr" | "en" | "ar" | "darija";
}) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[input.language];
  if (!isAgencyScope(scope) && scope.role !== "AGENT") return { answer: say("L’historique financier est réservé au gérant et à l’agent pour ses propres affaires.", "Financial history is available to management and agents for their own deals.", "السجل المالي متاح للمدير وللوكيل لصفقاته فقط.", "Historique financier lel gérant w lel agent ghir les affaires ta3ou.") };
  const filter: Record<string, unknown> = { status: "DEAL_DONE" };
  const constraints: Record<string, unknown>[] = [];
  if (!isAgencyScope(scope) || input.own) constraints.push({ agent: scope.userId });
  if (input.agent) {
    const agents = await User.find({ $or: [{ firstname: input.agent }, { lastname: input.agent }, { name: input.agent }, { username: input.agent }] }).collation(assistantNameCollation).select("_id").limit(2).lean();
    if (agents.length !== 1) return { answer: say("Précisez le nom complet de l’agent.", "Specify the agent’s full name.", "حدد الاسم الكامل للوكيل.", "3tini esm kamel ta3 l’agent.") };
    constraints.push({ agent: agents[0]._id });
  }
  let range = input.range;
  if (input.closedSince || input.closedUntil) {
    const day = (value: string) => {
      const date = fromZonedTime(value + "T00:00:00", "Africa/Algiers");
      if (!Number.isFinite(date.getTime()) || formatInTimeZone(date, "Africa/Algiers", "yyyy-MM-dd") !== value) throw new Error("Invalid date");
      return date;
    };
    try {
      const start = input.closedSince ? day(input.closedSince) : new Date(0);
      const end = input.closedUntil ? new Date(day(input.closedUntil).getTime() + 86_400_000) : new Date();
      if (start >= end) throw new Error("Invalid range");
      range = { $gte: start, $lt: end };
    } catch { return { answer: say("Précisez une période valide avec le mois et l’année.", "Specify a valid month and year.", "حدد شهرًا وسنة صالحين.", "Précisi chhar w l’année.") }; }
  }
  if (range) filter.closedAt = range;
  if (input.listingQuery) {
    const listings = await Listing.find({ referenceCode: input.listingQuery }).collation(assistantNameCollation).select("_id").lean();
    constraints.push({ $or: [{ listing: { $in: listings.map(l => l._id) } }, { "closingSnapshot.listingReference": input.listingQuery }] });
  }
  if (constraints.length) filter.$and = constraints;
  const rows = await Negotiation.find(filter).sort({ closedAt: -1, _id: 1 })
    .populate("agent", "firstname lastname name").populate("listing", "referenceCode title")
    .populate("client", "referenceCode firstName lastName").lean();
  const money = (n: number) => new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(n) + " DA";
  const total = rows.reduce((n, r) => n + (r.closingDetails?.finalPrice ?? 0), 0);
  const commission = rows.reduce((n, r) => n + (r.closingDetails?.commissionAmount ?? 0), 0);
  return {
    answer: `${rows.length} ${pluralize(rows.length, say("affaire clôturée", "closed deal", "صفقة مغلقة", "affaire clôturée"), say("affaires clôturées", "closed deals", "صفقات مغلقة", "affaires clôturées"), input.language === "en" ? "en" : "fr")}` +
      (range ? ` · ${formatInTimeZone(range.$gte, "Africa/Algiers", "dd/MM/yyyy")} → ${formatInTimeZone(new Date(range.$lt.getTime() - 1), "Africa/Algiers", "dd/MM/yyyy")}` : "") +
      `\n• ${say("Montant des transactions", "Transaction value", "قيمة المعاملات", "Montant ta3 les transactions")} : ${money(total)}\n• ${say("Commissions enregistrées", "Recorded commissions", "العمولات المسجلة", "Commissions enregistrées")} : ${money(commission)}`,
    records: rows.map(r => ({
      label: [r.closingSnapshot?.listingReference || r.listing?.referenceCode, r.closingSnapshot?.listingTitle || r.listing?.title].filter(Boolean).join(" · ") || say("Affaire clôturée", "Closed deal", "صفقة مغلقة", "Affaire clôturée"),
      detail: [r.closedAt ? formatInTimeZone(r.closedAt, "Africa/Algiers", "dd/MM/yyyy") : null,
        r.closingSnapshot?.agentName || r.agent?.name || [r.agent?.firstname, r.agent?.lastname].filter(Boolean).join(" "),
        r.closingSnapshot?.clientReference || r.client?.referenceCode,
        money(r.closingDetails?.finalPrice ?? 0), money(r.closingDetails?.commissionAmount ?? 0)].filter(Boolean).join(" · "),
      href: `/dashboard/negotiations/${r._id}`,
    })),
    verifiedReport: true,
  };
}
