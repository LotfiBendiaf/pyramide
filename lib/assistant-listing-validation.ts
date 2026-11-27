import { Types } from "mongoose";
import { Listing } from "@/models";
import { toggleListingValidation, setListingNeutre } from "@/lib/actions/listings.action";
import { isAgencyScope, type AssistantScope } from "@/lib/assistant-access";
import { assistantNameCollation } from "@/lib/assistant-client-lookup";
import ROUTES from "@/constants/routes";

type Intent = "pending_listings" | "validate_listing" | "reject_listing";
type Language = "fr" | "en" | "ar" | "darija";
export async function reviewAssistantListingValidation(scope: AssistantScope, intent: Intent, target: string | null | undefined, language: Language) {
  const say = (fr: string, en: string, ar: string, darija: string) => ({ fr, en, ar, darija })[language];
  if (!isAgencyScope(scope)) return { answer: say("Seul le gérant peut valider ou refuser un bien.", "Only management can approve or reject a property.", "المدير فقط يمكنه قبول العقار أو رفضه.", "Ghir le gérant yvalidi wela yrefusi bien.") };
  if (intent === "pending_listings") {
    const listings = await Listing.find({ archived: { $ne: true }, $or: [{ isValidated: { $ne: true } }, { validationStatus: { $ne: "VALIDATED" } }] }).select("title referenceCode validationStatus").sort({ createdAt: -1 }).limit(50).lean();
    return { answer: listings.length ? say("Biens à examiner", "Properties awaiting review", "عقارات للمراجعة", "Les biens li yestennaw validation") : say("Aucun bien en attente de validation.", "No properties awaiting approval.", "لا يوجد عقار ينتظر الموافقة.", "Ma kayen hata bien yestenna validation."), records: listings.map(item => ({ label: item.title || String(item._id), detail: item.referenceCode || String(item._id), href: ROUTES.LISTING_DETAIL_DASHBOARD(String(item._id)) })) };
  }
  if (!target) return { answer: say("Quel bien ? Indiquez sa référence, son titre ou son identifiant.", "Which property? Give its reference, title or ID.", "أي عقار؟ حدد مرجعه أو عنوانه أو معرفه.", "Anhi bien ? 3tini référence, titre wela ID.") };
  const identity = target.trim();
  const listings = await Listing.find({ archived: { $ne: true }, $or: [{ referenceCode: identity }, { title: identity }, ...(Types.ObjectId.isValid(identity) ? [{ _id: identity }] : [])] }).collation(assistantNameCollation).select("title referenceCode isValidated validationStatus").limit(2).lean();
  if (listings.length !== 1) return { answer: say("Précisez un bien unique à examiner.", "Specify one property to review.", "حدد عقارًا واحدًا للمراجعة.", "Précisi bien wa7ed bach nchoufou.") };
  const listing = listings[0];
  if (intent === "validate_listing" && listing.isValidated && listing.validationStatus === "VALIDATED") return { answer: say("Ce bien est déjà validé.", "This property is already approved.", "هذا العقار مقبول بالفعل.", "Had bien déjà validé.") };
  const result = intent === "validate_listing" ? await toggleListingValidation(String(listing._id), false) : await setListingNeutre(String(listing._id));
  if (!result.success) return { answer: result.error?.message || say("Impossible de traiter ce bien.", "Could not review the property.", "تعذرت مراجعة العقار.", "Ma qdertch ntraiti had bien.") };
  const stored = await Listing.findById(listing._id).select("referenceCode isValidated validationStatus").lean<{ referenceCode?: string; isValidated?: boolean; validationStatus?: string }>();
  const accepted = intent === "validate_listing";
  if (!stored || (accepted ? !stored.isValidated || stored.validationStatus !== "VALIDATED" : stored.isValidated || stored.validationStatus !== "NEUTRAL")) throw new Error("Property validation state not persisted");
  return { answer: accepted ? say(`Bien validé · ${stored.referenceCode}`, `Property approved · ${stored.referenceCode}`, `تم قبول العقار · ${stored.referenceCode}`, `Bien validé · ${stored.referenceCode}`) : say("Bien non validé · remis en état neutre.", "Property not approved · returned to neutral status.", "العقار غير مقبول وتمت إعادته إلى الحالة المحايدة.", "Bien machi validé · rja3 neutre."), records: [{ label: listing.title || stored.referenceCode || identity, href: ROUTES.LISTING_DETAIL_DASHBOARD(String(listing._id)) }] };
}
