import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { PipelineStage } from "mongoose";
import { z } from "zod";
import { FollowUp, Visit } from "@/models";

export const inactivityInput = z.object({
  amount: z.number().int().min(1).max(3650),
  unit: z.enum(["days", "weeks", "months", "years"]),
});
type Options = {
  inactivity?: z.infer<typeof inactivityInput> | null;
  unfollowedSince?: string | null;
  unfollowedUntil?: string | null;
};
export type InactivityWindow = { start?: Date; end: Date };
const tz = "Africa/Algiers";

export function inactivityWindow(options: Options, now = new Date()): InactivityWindow {
  const day = (value: string) => {
    const date = fromZonedTime(value + "T00:00:00", tz);
    if (!Number.isFinite(date.getTime()) || formatInTimeZone(date, tz, "yyyy-MM-dd") !== value) throw new RangeError("Invalid date");
    return date;
  };
  let end = now;
  if (options.unfollowedUntil) {
    end = new Date(day(options.unfollowedUntil).getTime() + 86_400_000);
    if (end > now) end = now;
  }
  let start = options.unfollowedSince ? day(options.unfollowedSince) : undefined;
  if (!start && options.inactivity) {
    const { amount, unit } = options.inactivity;
    if (unit === "days" || unit === "weeks") start = new Date(end.getTime() - amount * (unit === "weeks" ? 7 : 1) * 86_400_000);
    else {
      const local = new Date(formatInTimeZone(end, tz, "yyyy-MM-dd'T'HH:mm:ss") + "Z");
      const originalDay = local.getUTCDate();
      local.setUTCDate(1);
      local.setUTCMonth(local.getUTCMonth() - amount * (unit === "years" ? 12 : 1));
      const lastDay = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 0)).getUTCDate();
      local.setUTCDate(Math.min(originalDay, lastDay));
      start = fromZonedTime(local.toISOString().slice(0, 19), tz);
    }
  }
  if (start && start >= end) throw new RangeError("Invalid inactivity interval");
  return { start, end };
}

export function unfollowedClientStages(filter: object, window: InactivityWindow, fields: object): PipelineStage[] {
  const { start, end } = window;
  const latestContact = (from: string, status: string, date: object, as: string, extra: object = {}): PipelineStage.Lookup => ({
    $lookup: {
      from, let: { clientId: "$_id" },
      pipeline: [
        { $match: { status, ...extra, $expr: { $eq: ["$client", "$$clientId"] } } },
        { $set: { contactAt: date } },
        { $match: { contactAt: { $lt: end } } },
        { $group: { _id: null, date: { $max: "$contactAt" } } },
      ],
      as,
    },
  });
  return [
    { $match: filter },
    ...(start ? [{ $match: { createdAt: { $lte: start } } }] : []),
    latestContact(FollowUp.collection.name, "DONE",
      { $ifNull: ["$completedAt", { $ifNull: ["$updatedAt", "$createdAt"] }] }, "lastFollowup", { context: { $ne: "LISTING" } }),
    latestContact(Visit.collection.name, "COMPLETED",
      { $ifNull: ["$completedAt", "$scheduledAt"] }, "lastVisit"),
    { $set: {
      lastContactedAt: { $max: [
        { $cond: [{ $lt: ["$lastContactedAt", end] }, "$lastContactedAt", null] },
        { $arrayElemAt: ["$lastFollowup.date", 0] },
        { $arrayElemAt: ["$lastVisit.date", 0] },
      ] },
    } },
    { $match: start ? { $or: [{ lastContactedAt: null }, { lastContactedAt: { $lt: start } }] } : { lastContactedAt: null } },
    { $sort: { lastContactedAt: 1, createdAt: 1, _id: 1 } },
    { $project: fields },
  ];
}
