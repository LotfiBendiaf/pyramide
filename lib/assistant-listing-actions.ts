import { Listing } from "@/models";
import { requestArchive } from "@/lib/actions/archiveRequest.action";
import { canUseAssistantOperations } from "@/constants/values";
import { isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation } from "@/lib/assistant-client-lookup";

export async function archiveAssistantListing(scope: AssistantScope, identity: string | null | undefined, reason: string | null | undefined, language: "fr" | "en" | "ar" | "darija") {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!canUseAssistantOperations(scope.role)) return { answer: say("Accès refusé.", "Access denied.", "غير مسموح.", "Accès refusé.") };
  if (!identity) return { answer: say("Quel bien souhaitez-vous archiver ? Indiquez sa référence.", "Which property? Give its reference.", "أي عقار؟ أرسل مرجعه.", "Anhi bien ? 3tini référence.") };
  const matches = await Listing.find({ $or: [{ referenceCode: identity.trim() }, { title: identity.trim() }], ...(isAgencyScope(scope) ? {} : { agent: scope.userId }) }).collation(assistantNameCollation).select("_id title referenceCode archived").limit(2).lean();
  if (matches.length !== 1) return { answer: say("Précisez la référence d’un bien accessible.", "Specify an accessible property's reference.", "حدد مرجع عقار متاح لك.", "3tini référence ta3 bien accessible.") };
  const listing = matches[0];
  if (listing.archived) return { answer: say("Ce bien est déjà archivé.", "This property is already archived.", "هذا العقار مؤرشف بالفعل.", "Had bien déjà archivé.") };
  const result = await requestArchive({ entityType: "LISTING", entityId: String(listing._id), reason: reason || "Archivage demandé dans l’assistant." });
  if (!result.success) return { answer: result.error?.message || say("Archivage impossible.", "Could not archive.", "تعذرت الأرشفة.", "Archivage ma khdemch.") };
  const ref = listing.referenceCode || listing.title;
  return { answer: scope.role === "ADMIN" ? say(`Bien ${ref} archivé.`, `Property ${ref} archived.`, `تمت أرشفة العقار ${ref}.`, `Bien ${ref} t’archiva.`) : say(`Demande d’archivage de ${ref} envoyée au gérant.`, `Archive request for ${ref} sent to management.`, `تم إرسال طلب أرشفة ${ref} إلى المدير.`, `Demande d’archivage ta3 ${ref} t’b3at lel gérant.`) };
}
