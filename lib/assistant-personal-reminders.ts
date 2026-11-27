import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import dbConnect from "@/lib/mongoose";
import { canUseAssistant, type AssistantScope } from "@/lib/assistant-access";

type Language = "fr" | "en" | "ar" | "darija";
type Reminder = {
  _id: Types.ObjectId;
  owner: string;
  text: string;
  dueAt: Date;
  createdAt: Date;
  deliveredAt?: Date;
};
export const personalReminderInput = z.object({
  text: z.string().trim().min(1).max(500),
  dueAt: z.string().datetime({ offset: true }),
});
const validOwner = (userId: string) => /^[a-f0-9]{24}$/i.test(userId);
const format = (date: Date) => new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Algiers", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
}).format(date);

export async function createPersonalReminder(scope: AssistantScope, input: unknown, language: Language = "fr", now = new Date()) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!validOwner(scope.userId) || !canUseAssistant(scope.role)) return { answer: say("Ce profil ne permet pas de créer un rappel.", "This profile cannot create reminders.", "لا يمكن لهذا الملف إنشاء تذكير.", "Had profil ma yqderch ydir rappel.") };
  const parsed = personalReminderInput.safeParse(input);
  const dueTime = parsed.success ? Date.parse(parsed.data.dueAt) : NaN;
  if (!parsed.success || !Number.isFinite(dueTime) || dueTime <= now.getTime()) return {
    answer: say("À quel moment dois-je vous le rappeler ? Indiquez une date et une heure futures.", "When should I remind you? Give a future date and time.", "متى أذكرك؟ حدد تاريخًا ووقتًا في المستقبل.", "Waqtach nfakrek ? 3tini date w sa3a f l'mosta9bal."),
  };
  const { text, dueAt: isoDate } = parsed.data;
  const dueAt = new Date(isoDate);
  const mongoose = await dbConnect();
  const collection = mongoose.connection.db!.collection<Reminder>("assistant_personal_reminders");
  // An exact retry is idempotent, including two simultaneous requests.
  const id = new Types.ObjectId(createHash("sha256").update(JSON.stringify([scope.userId, text, dueAt.toISOString()])).digest("hex").slice(0, 24));
  try {
    await collection.updateOne({ _id: id, owner: scope.userId }, { $setOnInsert: { text, dueAt, createdAt: now } }, { upsert: true });
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
    if (!await collection.findOne({ _id: id, owner: scope.userId })) throw error;
  }
  const when = format(dueAt) + " (Alger)";
  return {
    answer: say(`Rappel enregistré · ${when}\n• ${text}\nAlerte dans le CRM tant que le site est ouvert, ou à votre prochaine ouverture.`,
      `Reminder saved · ${when}\n• ${text}\nThe CRM alerts you while the site is open, or when you next open it.`,
      `تم حفظ التذكير · ${when}\n• ${text}\nيظهر التنبيه داخل الموقع أثناء فتحه أو عند فتحه لاحقًا.`,
      `Rappel tsajjel · ${when}\n• ${text}\nNfakrek f CRM ki site maftou7, wela ki t3awed t7ellou.`),
    records: [{ label: text, detail: when, href: "/dashboard/assistant" }],
    personalReminderId: String(id),
  };
}

// Called only with the authenticated user's ID by the notification poll. The
// reminder ID is also the notification ID, making retries and concurrent polls
// safe even after a crash between insertion and marking the reminder delivered.
export async function deliverDuePersonalReminders(userId: string, now = new Date()) {
  if (!validOwner(userId)) return 0;
  const mongoose = await dbConnect();
  const db = mongoose.connection.db!;
  const reminders = db.collection<Reminder>("assistant_personal_reminders");
  const due = await reminders.find({ owner: userId, deliveredAt: { $exists: false }, dueAt: { $lte: now } }).sort({ dueAt: 1 }).limit(50).toArray();
  let inserted = 0;
  for (const reminder of due) {
    try {
      const result = await db.collection("notifications").updateOne({ _id: reminder._id, recipient: new Types.ObjectId(userId) }, {
        $setOnInsert: {
          type: "PERSONAL_REMINDER", title: "Rappel personnel", body: reminder.text + " · " + format(reminder.dueAt) + " (Alger)",
          link: "/dashboard/assistant", read: false, createdAt: now, updatedAt: now,
        },
      }, { upsert: true });
      inserted += result.upsertedCount;
    } catch (error) {
      if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
      const existing = await db.collection("notifications").findOne({ _id: reminder._id, recipient: new Types.ObjectId(userId) });
      if (!existing) throw error;
    }
    await reminders.updateOne({ _id: reminder._id, owner: userId, deliveredAt: { $exists: false } }, { $set: { deliveredAt: now } });
  }
  return inserted;
}
