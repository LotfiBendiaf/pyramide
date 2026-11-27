import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { Listing, Negotiation, User } from "@/models";
import { isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation } from "@/lib/assistant-client-lookup";
import { historyTransactionKind, summarizeSalesHistory, type HistoryMetrics } from "@/lib/assistant-sales-summary";
import { pluralize } from "@/lib/pluralize";

export async function answerSalesHistory(scope: AssistantScope, input: {
  agent?: string | null; listingQuery?: string | null; closedSince?: string | null; closedUntil?: string | null;
  own?: boolean; groupByAgent?: boolean; range?: { $gte: Date; $lt: Date }; language: "fr" | "en" | "ar" | "darija";
}) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[input.language];
  if (!isAgencyScope(scope) && scope.role !== "AGENT") return { answer: say("L’historique financier est réservé au gérant et à l’agent pour ses propres affaires.", "Financial history is available to management and agents for their own deals.", "السجل المالي متاح للمدير وللوكيل لصفقاته فقط.", "Historique financier lel gérant w lel agent ghir les affaires ta3ou.") };
  const filter: Record<string, unknown> = { status: "DEAL_DONE" };
  const constraints: Record<string, unknown>[] = [];
  if (!isAgencyScope(scope) || input.own) constraints.push({ agent: scope.userId });
  let selectedAgentId: string | undefined;
  if (input.agent) {
    const agents = await User.find({ $or: [{ firstname: input.agent }, { lastname: input.agent }, { name: input.agent }, { username: input.agent }] }).collation(assistantNameCollation).select("_id").limit(2).lean();
    if (agents.length !== 1) return { answer: say("Précisez le nom complet de l’agent.", "Specify the agent’s full name.", "حدد الاسم الكامل للوكيل.", "3tini esm kamel ta3 l’agent.") };
    selectedAgentId = String(agents[0]._id);
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
    .populate("listing", "referenceCode title status")
    .populate("client", "referenceCode firstName lastName").lean();
  const compareAgents = input.groupByAgent === true || (isAgencyScope(scope) && !input.agent && !input.own && !input.listingQuery);
  const agentIds = rows.map(row => String(row.agent));
  const fixedAgentId = !isAgencyScope(scope) || input.own ? scope.userId : selectedAgentId;
  const directoryFilter = compareAgents && isAgencyScope(scope) && !fixedAgentId
    ? { $or: [{ role: { $in: ["AGENT", "MANAGER", "ADMIN"] } }, { _id: { $in: agentIds } }] }
    : { _id: { $in: [...agentIds, ...(fixedAgentId ? [fixedAgentId] : [])] } };
  const people = await User.find(directoryFilter).select("_id firstname lastname name").lean();
  const directory = people.map(person => ({
    id: String(person._id),
    name: person.name || [person.firstname, person.lastname].filter(Boolean).join(" ") || say("Agent non identifié", "Unknown agent", "وكيل غير معروف", "Agent machi ma3rouf"),
  }));
  const names = new Map(directory.map(agent => [agent.id, agent.name]));
  const financialRows = rows.map(row => ({
    agentId: String(row.agent),
    agentName: row.closingSnapshot?.agentName || names.get(String(row.agent)) || say("Agent non identifié", "Unknown agent", "وكيل غير معروف", "Agent machi ma3rouf"),
    listingReference: row.closingSnapshot?.listingReference || row.listing?.referenceCode,
    listingStatus: row.listing?.status,
    finalPrice: row.closingDetails?.finalPrice,
    commissionAmount: row.closingDetails?.commissionAmount,
    commissionPercentage: row.closingDetails?.commissionPercentage,
  }));
  const summary = summarizeSalesHistory(financialRows, compareAgents ? directory : []);
  const money = (n: number) => new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(n) + " DA";
  const countLabel = (count: number) => `${count} ${pluralize(count, say("affaire clôturée", "closed deal", "صفقة مغلقة", "affaire clôturée"), say("affaires clôturées", "closed deals", "صفقات مغلقة", "affaires clôturées"), input.language === "en" ? "en" : "fr")}`;
  const transactionLabel = say("Transactions", "Transactions", "المعاملات", "Transactions");
  const commissionLabel = say("Commissions", "Commissions", "العمولات", "Commissions");
  const metricsDetail = (metrics: HistoryMetrics) => [
    countLabel(metrics.count), `${transactionLabel} : ${money(metrics.transactionValue)}`, `${commissionLabel} : ${money(metrics.commissionValue)}`,
    ...(metrics.missingPriceCount ? [say(`Prix absent pour ${metrics.missingPriceCount}`, `Missing price for ${metrics.missingPriceCount}`, `سعر غير مسجل لـ ${metrics.missingPriceCount}`, `Prix machi renseigné pour ${metrics.missingPriceCount}`)] : []),
    ...(metrics.missingCommissionCount ? [say(`Commission absente pour ${metrics.missingCommissionCount}`, `Missing commission for ${metrics.missingCommissionCount}`, `عمولة غير مسجلة لـ ${metrics.missingCommissionCount}`, `Commission machi renseignée pour ${metrics.missingCommissionCount}`)] : []),
  ].join(" · ");
  const kindLabel = (kind: "sale" | "rent" | "unknown") => kind === "sale"
    ? say("Ventes", "Sales", "المبيعات", "Ventes")
    : kind === "rent" ? say("Locations", "Rentals", "الإيجارات", "Locations")
      : say("Type non renseigné", "Unspecified type", "نوع غير مسجل", "Type machi renseigné");
  const kinds = ["sale", "rent", ...(summary.unknown.count ? ["unknown"] : [])] as ("sale" | "rent" | "unknown")[];
  return {
    answer: countLabel(summary.total.count) +
      (range ? ` · ${formatInTimeZone(range.$gte, "Africa/Algiers", "dd/MM/yyyy")} → ${formatInTimeZone(new Date(range.$lt.getTime() - 1), "Africa/Algiers", "dd/MM/yyyy")}` : "") +
      `\n• ${say("Montant des transactions", "Transaction value", "قيمة المعاملات", "Montant ta3 les transactions")} : ${money(summary.total.transactionValue)}\n• ${say("Commissions enregistrées", "Recorded commissions", "العمولات المسجلة", "Commissions enregistrées")} : ${money(summary.total.commissionValue)}` +
      (summary.total.count ? "\n" + kinds.map(kind => `• ${kindLabel(kind)} : ${metricsDetail(summary[kind])}`).join("\n") : ""),
    ...(compareAgents ? {
      groups: summary.agents.map(agent => ({
        label: agent.name, count: agent.total.count,
        records: [
          { label: say("Total", "Total", "الإجمالي", "Total"), detail: metricsDetail(agent.total) },
          ...kinds.filter(kind => kind !== "unknown" || agent.unknown.count > 0).map(kind => ({ label: kindLabel(kind), detail: metricsDetail(agent[kind]) })),
        ],
      })),
    } : {}),
    records: compareAgents ? [] : rows.map((row, index) => ({
      label: [financialRows[index].listingReference, row.closingSnapshot?.listingTitle || row.listing?.title].filter(Boolean).join(" · ") || say("Affaire clôturée", "Closed deal", "صفقة مغلقة", "Affaire clôturée"),
      detail: [row.closedAt ? formatInTimeZone(row.closedAt, "Africa/Algiers", "dd/MM/yyyy") : null,
        financialRows[index].agentName,
        row.closingSnapshot?.clientReference || row.client?.referenceCode,
        kindLabel(historyTransactionKind(financialRows[index])),
        row.closingDetails?.finalPrice != null ? money(row.closingDetails.finalPrice) : say("Prix non renseigné", "Price not recorded", "السعر غير مسجل", "Prix machi renseigné"),
        row.closingDetails?.commissionAmount != null ? money(row.closingDetails.commissionAmount) : say("Commission non renseignée", "Commission not recorded", "العمولة غير مسجلة", "Commission machi renseignée")].filter(Boolean).join(" · "),
      href: `/dashboard/negotiations/${row._id}`,
    })),
    verifiedReport: true,
  };
}
