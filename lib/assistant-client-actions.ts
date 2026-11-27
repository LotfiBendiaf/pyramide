import { Client } from "@/models";
import { archiveClient } from "@/lib/actions/client.action";
import { isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation, clientIdentityFilter } from "@/lib/assistant-client-lookup";

export async function archiveAssistantClient(scope: AssistantScope, identity: string | null | undefined, reason: string | null | undefined, language: "fr" | "en" | "ar" | "darija") {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!["ADMIN", "MANAGER", "AGENT", "ASSISTANT"].includes(scope.role)) return { answer: say("Votre profil ne permet pas d’archiver un client.", "Your profile cannot archive clients.", "لا تسمح صلاحياتك بأرشفة العملاء.", "Profil ta3ek ma ykhalikch b l’archivage.") };
  if (!identity) return { answer: say("Quel client souhaitez-vous archiver ? Indiquez sa référence, son nom ou son numéro.", "Which client should be archived? Give their reference, name or phone.", "أي عميل تريد أرشفته؟ أرسل مرجعه أو اسمه أو رقمه.", "Chkoun le client ? A3tini référence, esm wela numéro.") };
  const clients = await Client.find({ $and: [clientIdentityFilter(identity), isAgencyScope(scope) ? {} : scope.role === "ASSISTANT" ? { $or: [{ assignedAgent: scope.userId }, { createdBy: scope.userId }] } : { assignedAgent: scope.userId }] }).collation(assistantNameCollation).select("_id referenceCode archived").limit(2).lean();
  if (!clients.length) return { answer: say("Client introuvable dans vos dossiers accessibles.", "Client not found in your accessible records.", "لم أجد العميل ضمن ملفاتك المتاحة.", "Ma l9itch had client f les dossiers ta3ek.") };
  if (clients.length > 1) return { answer: say("Plusieurs clients correspondent. Précisez la référence CRM.", "Several clients match. Specify the CRM reference.", "يوجد عدة عملاء مطابقين. حدد مرجع العميل.", "Kayen plusieurs clients. A3tini référence CRM.") };
  const client = clients[0];
  if (client.archived) return { answer: say("Ce client est déjà archivé.", "This client is already archived.", "هذا العميل مؤرشف بالفعل.", "Had client déjà archivé.") };
  const result = await archiveClient(String(client._id), reason || "Archivage demandé par l’utilisateur dans l’assistant IA.");
  if (!result.success) return { answer: result.error?.message || say("L’archivage a échoué.", "Archiving failed.", "تعذرت الأرشفة.", "L’archivage ma khdemch.") };
  const ref = client.referenceCode || identity;
  return { answer: scope.role === "ADMIN"
    ? say(`Client ${ref} archivé.`, `Client ${ref} archived.`, `تمت أرشفة العميل ${ref}.`, `Client ${ref} t’archiva.`)
    : say(`Demande d’archivage de ${ref} envoyée au responsable pour validation.`, `Archive request for ${ref} sent to management for approval.`, `تم إرسال طلب أرشفة ${ref} للمسؤول للموافقة.`, `Talab d’archivage ta3 ${ref} t’b3at lel responsable bach yvalidi.`) };
}
