import { createHash } from "node:crypto";
import dbConnect from "@/lib/mongoose";
import type { AssistantScope } from "@/lib/assistant-access";

type Language = "fr" | "en" | "ar" | "darija";
export async function personalMemory(scope: AssistantScope, action: "remember_note" | "recall_notes", content: string | null | undefined, question: string, previousAnswer: string | undefined, language: Language) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  const mongoose = await dbConnect();
  const notes = mongoose.connection.db!.collection<{ _id: string; id: string; userId: string; text: string; createdAt: Date }>("assistant_personal_memory");
  if (action === "recall_notes") {
    const rows = await notes.find({ userId: scope.userId }).sort({ createdAt: -1 }).limit(30).toArray();
    return { answer: rows.length ? say("Vos notes mémorisées", "Your saved notes", "ملاحظاتك المحفوظة", "Hado les notes li 7fedthom lik") : say("Aucune note mémorisée pour le moment.", "No notes saved yet.", "لا توجد ملاحظات محفوظة بعد.", "Mazal ma 7fedna hata note."), records: rows.map(note => ({ label: note.text })) };
  }
  const text = content?.trim();
  const normalize = (value: string) => value.replace(/\s+/gu, " ").trim().toLocaleLowerCase();
  // A note must be grounded in what the user said or the last visible response.
  if (!text || text.length > 3000 || ![question, previousAnswer].some(source => source && normalize(source).includes(normalize(text)))) {
    return { answer: say("Que souhaitez-vous mémoriser exactement ?", "What exactly should I remember?", "ما الذي تريد مني حفظه تحديدًا؟", "Wach exactement n7fedlek ?") };
  }
  const id = createHash("sha256").update(JSON.stringify([scope.userId, text])).digest("hex");
  await notes.updateOne({ _id: id, userId: scope.userId }, { $setOnInsert: { id, text, createdAt: new Date() } }, { upsert: true });
  return { answer: say("C’est mémorisé dans vos notes personnelles.", "Saved in your personal notes.", "تم حفظها في ملاحظاتك الشخصية.", "Saha, 7fedtha f les notes personnelles ta3ek."), records: [{ label: text }] };
}
