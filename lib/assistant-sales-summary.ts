export type HistoryTransactionKind = "sale" | "rent" | "unknown";
export type HistoryFinancialRow = {
  agentId: string;
  agentName: string;
  listingReference?: string | null;
  listingStatus?: string | null;
  finalPrice?: number | null;
  commissionAmount?: number | null;
  commissionPercentage?: number | null;
};
export type HistoryMetrics = {
  count: number;
  transactionValue: number;
  commissionValue: number;
  missingPriceCount: number;
  missingCommissionCount: number;
};
export type HistoryBreakdown = {
  total: HistoryMetrics;
  sale: HistoryMetrics;
  rent: HistoryMetrics;
  unknown: HistoryMetrics;
};

export function historyTransactionKind(row: Pick<HistoryFinancialRow, "listingReference" | "listingStatus">): HistoryTransactionKind {
  // Prefer a persisted reference supplied by the caller, so a later status change
  // cannot turn an historical rental into a sale or vice versa.
  if (/^V-/i.test(row.listingReference ?? "")) return "sale";
  if (/^L-/i.test(row.listingReference ?? "")) return "rent";
  if (["En Vente", "Vendu"].includes(row.listingStatus ?? "")) return "sale";
  if (["En Location", "Loué"].includes(row.listingStatus ?? "")) return "rent";
  return "unknown";
}

const emptyMetrics = (): HistoryMetrics => ({ count: 0, transactionValue: 0, commissionValue: 0, missingPriceCount: 0, missingCommissionCount: 0 });
const emptyBreakdown = (): HistoryBreakdown => ({ total: emptyMetrics(), sale: emptyMetrics(), rent: emptyMetrics(), unknown: emptyMetrics() });
const amount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const sumMoney = (left: number, right: number) => Math.round((left + right) * 100) / 100;

function add(metrics: HistoryMetrics, row: HistoryFinancialRow) {
  metrics.count++;
  if (amount(row.finalPrice)) metrics.transactionValue = sumMoney(metrics.transactionValue, row.finalPrice);
  else metrics.missingPriceCount++;
  const commission = amount(row.commissionAmount) ? row.commissionAmount
    : amount(row.finalPrice) && amount(row.commissionPercentage) ? Math.round(row.finalPrice * row.commissionPercentage) / 100
      : undefined;
  if (commission !== undefined) metrics.commissionValue = sumMoney(metrics.commissionValue, commission);
  else metrics.missingCommissionCount++;
}

export function summarizeSalesHistory(rows: HistoryFinancialRow[], directory: { id: string; name: string }[] = []) {
  const overall = emptyBreakdown();
  const agents = new Map(directory.map(agent => [agent.id, { id: agent.id, name: agent.name, ...emptyBreakdown() }]));
  for (const row of rows) {
    const agent = agents.get(row.agentId) ?? { id: row.agentId, name: row.agentName, ...emptyBreakdown() };
    const kind = historyTransactionKind(row);
    add(overall.total, row);
    add(overall[kind], row);
    add(agent.total, row);
    add(agent[kind], row);
    agents.set(row.agentId, agent);
  }
  return {
    ...overall,
    agents: [...agents.values()].sort((a, b) => b.total.commissionValue - a.total.commissionValue || b.total.transactionValue - a.total.transactionValue || a.name.localeCompare(b.name, "fr")),
  };
}
