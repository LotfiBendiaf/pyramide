import { Types } from "mongoose";
import { agencyListingsVisibility, canReadAssistantSource, isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { z } from "zod";
import { Client, FollowUp, Listing, Negotiation, Task, User, Visit } from "@/models";

const period = z.enum(["today", "yesterday", "tomorrow", "week", "last_week", "month", "last_month", "year", "last_year", "all"]);
const sources = {
  clients: { model: Client, agent: "assignedAgent", dates: ["createdAt", "lastContactedAt"], categories: ["type", "city", "clientTemperature", "pipelineStage", "leadSource", "priceCurrency"], numbers: ["budgetMax", "budgetMin"], distinct: ["_id"] },
  listings: { model: Listing, agent: "agent", dates: ["createdAt", "updatedAt"], categories: ["status", "propertyType", "location.city", "location.district"], numbers: ["price", "features.area"], distinct: ["_id"] },
  negotiations: { model: Negotiation, agent: "agent", dates: ["createdAt", "closedAt"], categories: ["status"], numbers: ["closingDetails.finalPrice", "commission"], distinct: ["client", "listing"] },
  visits: { model: Visit, agent: "agent", dates: ["scheduledAt", "completedAt", "cancelledAt", "createdAt"], categories: ["status", "outcome"], numbers: [], distinct: ["client", "listing"] },
  followups: { model: FollowUp, agent: "agent", dates: ["createdAt", "reminderAt", "completedAt"], categories: ["status", "type", "context", "channel"], numbers: [], distinct: ["client", "listing"] },
  tasks: { model: Task, agent: "agent", dates: ["createdAt", "dueDate", "completedAt"], categories: ["status", "priority"], numbers: [], distinct: ["client", "listing"] },
} as const;

type Source = keyof typeof sources;
const sourceNames = Object.keys(sources) as [Source, ...Source[]];
const field = z.string().max(60);
export const analyticsSchema = z.array(z.object({
  source: z.enum(sourceNames),
  listingScope: z.enum(["own", "agency"]).nullish(),
  operation: z.enum(["count", "sum", "average", "distinct"]).default("count"),
  field: field.nullish(),
  group: field.nullish(),
  agents: z.array(z.string().trim().min(1).max(100)).max(8).nullish(),
  period: period.default("all"),
  dateField: field.nullish(),
  filters: z.array(z.object({
    field,
    op: z.enum(["eq", "gte", "lte", "missing"]),
    value: z.union([z.string().trim().min(1).max(100), z.number().finite()]).nullish(),
  })).max(8).default([]),
  order: z.enum(["asc", "desc"]).default("desc"),
})).min(1).max(4);

export const analyticsInstructions = JSON.stringify(Object.fromEntries(
  Object.entries(sources).map(([key, { dates, categories, numbers, distinct }]) => [key, { dates, categories, numbers, distinct }]),
));

class QueryNotSupported extends Error {}

const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
const exact = (value: string) => new RegExp("^" + value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");

type Query = z.infer<typeof analyticsSchema>[number];
type DateRange = { $gte: Date; $lt: Date } | undefined;

export async function runAnalytics(queries: Query[], dateRange: (period: Query["period"]) => DateRange, access: AssistantScope) {
  const personal = !isAgencyScope(access);
  const employees = await User.find(personal ? { _id: access.userId } : { role: { $in: ["AGENT", "MANAGER", "ADMIN", "ASSISTANT", "EMPLOYEE"] } })
    .select("firstname lastname username").lean();
  const name = (employee: (typeof employees)[number]) => `${employee.firstname} ${employee.lastname}`;
  const byId = new Map(employees.map((employee) => [String(employee._id), name(employee)]));
  const results = await Promise.all(queries.map(async (query) => {
    try {
      const { source, operation, field, group, filters } = query;
      if (!canReadAssistantSource(access, source) || (personal && group === "agent")) throw new QueryNotSupported("outside the user's profile");
      const { model, agent, dates, categories, numbers, distinct } = sources[source];
      const isCategory = (key: string) => (categories as readonly string[]).includes(key);
      const isNumber = (key: string) => (numbers as readonly string[]).includes(key);
      const isDate = (key: string) => (dates as readonly string[]).includes(key);
      if (group && group !== "agent" && !isCategory(group)) throw new QueryNotSupported("group");
      if ((operation === "sum" || operation === "average") && (!field || !isNumber(field))) throw new QueryNotSupported("metric");
      if (operation === "distinct" && (!field || !(distinct as readonly string[]).includes(field))) throw new QueryNotSupported("metric");
      const monetary = (operation === "sum" || operation === "average") &&
        Boolean(field && ["budgetMax", "budgetMin", "price", "closingDetails.finalPrice", "commission"].includes(field));
      const budgetCurrency = source === "clients" && monetary
        ? filters.find((filter) => filter.field === "priceCurrency" && filter.op === "eq")?.value
        : undefined;
      if (source === "clients" && monetary && !budgetCurrency && group !== "priceCurrency") {
        throw new QueryNotSupported("budget amounts require a currency filter or grouping");
      }
      const unit = monetary ? budgetCurrency || (source === "clients" ? "currency indicated by group" : "DZD") : undefined;
      const dateField = query.dateField || dates[0];
      if (!isDate(dateField)) throw new QueryNotSupported("date field");
      const match: Record<string, unknown>[] = source === "clients" || source === "listings" ? [{ archived: { $ne: true } }] : [];
      const catalogue = personal && source === "listings" && (query.listingScope === "agency" || access.role === "VIEWER");
      if (personal) match.push(catalogue ? agencyListingsVisibility : { [agent]: new Types.ObjectId(access.userId) });
      const range = dateRange(query.period);
      if (range) match.push({ [dateField]: range });

      if (query.agents?.length) {
        const ids = query.agents.map((requested) => {
          const target = normalize(requested);
          const exactMatches = employees.filter((employee) => [name(employee), employee.username].some((alias) => alias && normalize(alias) === target));
          const matches = exactMatches.length ? exactMatches : employees.filter((employee) => [employee.firstname, employee.lastname].some((alias) => alias && normalize(alias) === target));
          if (matches.length !== 1) throw new QueryNotSupported(matches.length ? "ambiguous employee" : "employee not found");
          return matches[0]._id;
        });
        match.push({ [agent]: { $in: ids } });
      }

      for (const { field: key, op, value } of filters) {
        if (op === "eq" && isCategory(key) && typeof value === "string") match.push({ [key]: exact(value) });
        else if ((op === "gte" || op === "lte") && isNumber(key) && key !== "commission" && typeof value === "number") {
          match.push({ [key]: { [op === "gte" ? "$gte" : "$lte"]: value } });
        } else if (op === "missing" && (isDate(key) || isCategory(key))) match.push({ [key]: null });
        else throw new QueryNotSupported("filter");
      }

      const amount = field === "commission" ? {
        $ifNull: ["$closingDetails.commissionAmount", {
          $divide: [{ $multiply: ["$closingDetails.finalPrice", "$closingDetails.commissionPercentage"] }, 100],
        }],
      } : `$${field}`;
      const accumulator = operation === "count" ? { $sum: 1 }
        : operation === "sum" ? { $sum: amount }
        : operation === "average" ? { $avg: amount }
        : { $addToSet: amount };
      const rows = await model.aggregate<{ _id: unknown; value: number | null; records: number }>([
        ...(match.length ? [{ $match: { $and: match } }] : []),
        { $group: { _id: group ? `$${group === "agent" ? agent : group}` : null, value: accumulator, records: { $sum: 1 } } },
        ...(operation === "distinct" ? [{ $set: { value: { $size: { $setDifference: ["$value", [null]] } } } }] : []),
        { $sort: { value: query.order === "asc" ? 1 : -1, _id: 1 } },
        { $limit: 31 },
      ]).option({ maxTimeMS: 4000 });

      return {
        source, operation, field, group, unit, period: query.period, dateField, filters, agents: query.agents,
        results: !rows.length && !group ? [{ group: null, value: operation === "average" ? null : 0, matchingRecords: 0 }] : rows.slice(0, 30).map((row) => ({
          group: group === "agent" ? byId.get(String(row._id)) || (row._id ? "Unknown employee" : "Unassigned") : row._id,
          value: row.value, matchingRecords: row.records,
        })),
        truncated: rows.length > 30,
      };
    } catch (error) {
      if (error instanceof QueryNotSupported) return { source: query.source, unavailable: error.message };
      throw error;
    }
  }));
  return {
    facts: JSON.stringify(results),
    summary: results.map((result) => {
      if ("unavailable" in result) return `${result.source} · Calcul indisponible (${result.unavailable}).`;
      return [
        `${result.source} · ${result.operation} · ${result.field || ""} · ${result.period}`,
        ...result.results.map((row) => `${row.group ?? "Total"} : ${row.value ?? "—"}${result.unit ? ` ${result.unit}` : ""}`),
        ...(result.truncated ? ["30 premiers groupes affichés."] : []),
      ].join("\n");
    }).join("\n\n"),
  };
}
