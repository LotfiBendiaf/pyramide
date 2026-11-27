import { pluralize } from "@/lib/pluralize";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Client, FollowUp, Listing, Negotiation, Task, Visit } from "@/models";

import { agencyListingsVisibility, canReadAssistantSource, isAgencyScope, type AssistantScope } from "@/lib/assistant-access";

const timeZone = "Africa/Algiers";

export async function readAssistantBriefing(scope: AssistantScope, now = new Date()) {
  const day = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
  const tomorrow = new Date(day + "T00:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const createdAt = {
    $gte: fromZonedTime(day + "T00:00:00", timeZone),
    $lt: fromZonedTime(tomorrow.toISOString().slice(0, 10) + "T00:00:00", timeZone),
  };
  const all = isAgencyScope(scope);
  const own = all ? {} : { agent: scope.userId };
  const clientScope = all ? {} : scope.role === "ASSISTANT"
    ? { $or: [{ assignedAgent: scope.userId }, { createdBy: scope.userId }] }
    : { assignedAgent: scope.userId };
  const listingScope = scope.role === "VIEWER" || scope.role === "ASSISTANT" ? { ...agencyListingsVisibility, archived: { $ne: true } } : own;
  const [clients, listings, visits, negotiations, hotClients, scheduledVisits, completedVisits, cancelledVisits] = await Promise.all([
    canReadAssistantSource(scope, "clients") ? Client.countDocuments({ createdAt, ...clientScope }) : null,
    Listing.countDocuments({ createdAt, ...listingScope }),
    canReadAssistantSource(scope, "visits") ? Visit.countDocuments({ createdAt, ...own }) : null,
    canReadAssistantSource(scope, "negotiations") ? Negotiation.countDocuments({ createdAt, ...own }) : null,
    all ? Client.countDocuments({ createdAt, clientTemperature: "HOT" }) : null,
    all ? Visit.countDocuments({ scheduledAt: createdAt, status: "SCHEDULED" }) : null,
    all ? Visit.countDocuments({ scheduledAt: createdAt, status: "COMPLETED" }) : null,
    all ? Visit.countDocuments({ scheduledAt: createdAt, status: "CANCELLED" }) : null,
  ]);
  return { clients, listings, visits, negotiations, hotClients, scheduledVisits, completedVisits, cancelledVisits, day };
}

export async function dailyAssistantPlan(scope: AssistantScope, language: "fr" | "en" | "ar" | "darija" = "fr", now = new Date(), teamFollowUps = false) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!canReadAssistantSource(scope, "visits")) return { answer: say("Ce profil ne possède pas de planning opérationnel.", "This role has no operational schedule.", "هذا الملف لا يملك جدول عمليات.", "Had profil ma 3andouch planning opérationnel.") };
  const start = fromZonedTime(formatInTimeZone(now, timeZone, "yyyy-MM-dd") + "T00:00:00", timeZone);
  const nextDay = new Date(start.getTime() + 86_400_000);
  const own = isAgencyScope(scope) ? {} : { agent: scope.userId };
  const [visits, followups, tasks, feedback] = await Promise.all([
    Visit.find({ ...own, status: "SCHEDULED", scheduledAt: { $gte: start, $lt: nextDay } })
      .populate("client", "firstName lastName referenceCode").populate("listing", "title referenceCode")
      .populate("agent", "firstname lastname").sort({ scheduledAt: 1 }).lean(),
    FollowUp.find({ ...(isAgencyScope(scope) && teamFollowUps ? {} : { agent: scope.userId }), status: { $in: ["PENDING", "OVERDUE"] }, reminderAt: { $lt: nextDay } })
      .populate("client", "firstName lastName referenceCode").populate("agent", "firstname lastname")
      .sort({ reminderAt: 1 }).lean(),
    Task.find({ ...own, status: { $in: ["PENDING", "IN_PROGRESS"] }, dueDate: { $lt: nextDay } }).sort({ dueDate: 1 }).lean(),
    Visit.find({ ...own, status: "SCHEDULED", scheduledAt: { $lt: now } })
      .populate("client", "firstName lastName referenceCode").populate("listing", "title referenceCode")
      .sort({ scheduledAt: 1 }).lean(),
  ]);
  const name = (person?: { firstName?: string; lastName?: string; referenceCode?: string }) =>
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") || person?.referenceCode || "";
  const when = (date: Date) => formatInTimeZone(date, timeZone, "dd/MM HH:mm");
  const overdue = followups.filter((item) => item.reminderAt < start).length;
  const groups = [
    {
      label: say("Visites du jour", "Today's visits", "زيارات اليوم", "Les visites ta3 lyoum"), count: visits.length,
      records: visits.map((item) => ({
        label: when(item.scheduledAt) + " · " + (item.listing?.title || item.externalListingRef || ""),
        detail: [name(item.client), isAgencyScope(scope) ? [item.agent?.firstname, item.agent?.lastname].filter(Boolean).join(" ") : ""].filter(Boolean).join(" · "),
        href: "/dashboard/schedule",
      })),
    },
    {
      kind: "followups",
      label: isAgencyScope(scope) && !teamFollowUps ? say("Mes relances", "My follow-ups", "متابعاتي", "Les relances ta3i") : say("Relances à traiter", "Follow-ups to handle", "المتابعات المطلوبة", "Les relances li khassek"), count: followups.length,
      records: followups.map((item) => ({
        label: when(item.reminderAt) + " · " + (item.title || name(item.client)),
        detail: item.note || name(item.client), href: "/dashboard/schedule",
      })),
    },
    {
      label: say("Tâches à traiter", "Tasks to handle", "المهام المطلوبة", "Les tâches li khassek"), count: tasks.length,
      records: tasks.map((item) => ({ label: item.title, detail: when(item.dueDate), href: "/dashboard/schedule" })),
    },
    {
      label: say("Retours de visite à renseigner", "Visits awaiting feedback", "زيارات تنتظر تسجيل النتيجة", "Les retours ta3 visites li mazal"), count: feedback.length,
      records: feedback.map((item) => ({ label: when(item.scheduledAt) + " · " + name(item.client), detail: item.listing?.title || item.externalListingRef || "", href: "/dashboard/schedule" })),
    },
  ];
  return {
    answer: [
      say("Votre journée", "Your day", "برنامج يومك", "Planning ta3 lyoum") + " · " + formatInTimeZone(now, timeZone, "dd/MM/yyyy") + " (Alger)",
      "• " + visits.length + " " + say(pluralize(visits.length, "visite"), pluralize(visits.length, "visit", "visits", "en"), "زيارة", pluralize(visits.length, "visite")),
      "• " + followups.length + " " + say(pluralize(followups.length, "relance") + ", dont ", pluralize(followups.length, "follow-up", "follow-ups", "en") + ", including ", "متابعة، منها ", pluralize(followups.length, "relance") + ", menhom ") + overdue + " " + say("en retard", "overdue", "متأخرة", "en retard"),
      "• " + tasks.length + " " + say(pluralize(tasks.length, "tâche"), pluralize(tasks.length, "task", "tasks", "en"), "مهمة", pluralize(tasks.length, "tâche")),
      "• " + feedback.length + " " + say(pluralize(feedback.length, "retour") + " de visite à renseigner", "visit feedback " + pluralize(feedback.length, "item", "items", "en") + " to record", "نتيجة زيارة للتسجيل", pluralize(feedback.length, "retour") + " ta3 visite mazal"),
    ].join("\n"),
    personalFollowUps: !teamFollowUps ? { count: followups.length, overdue, records: groups[1].records } : undefined,
    groups: groups.filter((group) => group.count > 0),
  };
}
