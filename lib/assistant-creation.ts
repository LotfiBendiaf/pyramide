import { z } from "zod";

import ROUTES from "@/constants/routes";
import { canUseAssistantOperations, isElevatedRole, PROPERTY_TYPES, UNIT_TYPES } from "@/constants/values";
import { createClient } from "@/lib/actions/client.action";
import { createListing } from "@/lib/actions/listings.action";
import { createResidence } from "@/lib/actions/residence.action";
import { explicitPhoneIn } from "@/lib/assistant-client-lookup";
import type { AssistantScope } from "@/lib/assistant-access";
import { normalizePhoneKey } from "@/lib/phone";
import { clientSchema } from "@/lib/validators/client";
import { listingCreateSchema } from "@/lib/validators/listing";
import { residenceSchema } from "@/lib/validators/residence";

export const creationIntents = ["create_client", "create_listing", "create_residence"] as const;
type CreationIntent = typeof creationIntents[number];
type Language = "fr" | "en" | "ar" | "darija";

export type CreationDraft = {
  intent: CreationIntent;
  data: Record<string, unknown>;
};

export const creationInstructions = `
Use ${creationIntents.join(", ")} only for an explicit request to save a new CRM record or when providing fields for a pending creation. Questions about whether creation is possible, viewing or editing existing records, examples, and hypothetical scenarios are not authorization to create. Set creation to an object of fields supplied by the user. Never invent a phone, name, email, price, measurement, publication state, date or property feature. Do not mix the client's or seller's phone with anyone else's. Ask no questions yourself; return whatever is already supplied.
- create_client: firstName and lastName are optional. Never require or invent them; a client needs their phone, type and leadSource. Extract leadSource only when stated and include creation.leadSourceEvidence as a short verbatim quote from the latest message that establishes the source; omit both when missing so the application asks. Never default it to UNKNOWN. Use UNKNOWN only when the user explicitly says they do not know the source. A reply giving only the source continues the pending creation and preserves all earlier criteria. Fields: firstName, lastName, phone, phone2, email, type (BUYER, SELLER, RENTER, INVESTOR, INTERMEDIARY), city, preferredLocation, wantedPropertyType, budgetMin, budgetMax, priceCurrency (DZD, EUR, USD), wantedArea, wantedAreaMin, rooms, floorMin, floorMax, extraNotes, leadSource (TIKTOK, FACEBOOK, INSTAGRAM, OUEDKNISS, REFERRAL, DIRECT_CALL, WALK_IN, WEBSITE, OTHER, UNKNOWN), leadSourceDetails. In prose, a person described as looking to purchase/rent is a BUYER/RENTER. A single maximum budget maps to budgetMax. Always extract explicit area requirements even when units are omitted in a surface context. Minimum area maps to wantedAreaMin and wantedArea, in square metres. Keep minimum wording in extraNotes. Preserve all draft criteria when a later message only supplies a telephone. A requested F3 or T3 implies wantedPropertyType Appartement and rooms 3.
- Interpret abbreviated client intake by meaning, including omitted verbs and punctuation. F3/T3 means Appartement and rooms 3. "max 1 etage" means floorMax 1; do not set floorMin. For Algerian real estate amounts expressed as "milliard" without an explicit currency, use the customary centime unit: 1 milliard centimes = 10,000,000 DZD. An explicitly specified currency or centime unit takes precedence; never reinterpret "1 milliard DA/DZD" as centimes. A bare budget is budgetMax. Store the user's original money expression and its DZD interpretation as one short note so the user can verify it. Several neighbourhood names indicate alternatives, not a single combined district. Keep every requested neighbourhood in preferredLocation separated by " / ", and note that they are alternatives. Only expand an abbreviation or correct a spelling when the intended place is clear; otherwise retain the original wording. Never silently drop an unfamiliar place. Do not infer a city solely from an ambiguous neighbourhood name. A compact creation request with no phone starts a pending draft and asks only for the missing required fields.
- Client notes: understand French, English, Arabic and Algerian Darija including Arabizi and mixed languages. For every explicitly supplied preference or constraint without a dedicated client field (parking, lift, terrace, accessibility, sunlight, quietness, proximity, legal documents, urgency, payment preferences, etc.), save a concise faithful summary in creation.extraNotes. Use one short bullet per distinct point, with newline separators and "- " prefixes. Preserve negations, quantities and whether a requirement is mandatory or optional. Use the language and script of the user's description. Never invent preferences. Continue to populate dedicated fields such as budget, area and city. When continuing a creationDraft, creation.extraNotes must contain the complete updated list: retain earlier points, incorporate new points and replace any explicitly corrected point. If a phone-only reply has no new preferences, omit extraNotes to preserve the saved notes.
- Agency geographic context: the default city for every new client, listing and residence is Oran, Algeria. Always use Oran when the user omits the city, even when no neighbourhood is provided. Never ask for a missing city. Use a different city only when the user explicitly states it; retain an explicitly selected city throughout the pending draft. In local intake "Akid" is the abbreviation for Akid Lotfi in Oran. Resolve clear local neighbourhood references to both their district and city, including spelling variants and Darija, without asking for an already inferable city. For a listing or residence set location.district and location.city; for a client set preferredLocation and city. An explicitly supplied city overrides this local context. Only ask for a location clarification if several plausible places remain after considering the agency context and the conversation.
- create_listing fields: title, description, price (DZD), priceLabel, status ("En Vente" or "En Location"), propertyType (exactly one of ${PROPERTY_TYPES.join(", ")}), propertyTypeCustom, location (city, district, address), features (area, bedrooms, bathrooms, layoutNotation F or T, roomCount, etage, nombreEtages, furnished, parking, balcony, garden, pool, elevator), sellerFirstName, sellerLastName, sellerPhone, sellerPhone2, sellerEmail. A factual title may be composed from an explicitly stated property type and location. F3 means layoutNotation F and roomCount 3, but does not specify bathroom or bedroom count. A telephone following "estimation" is a contact number, never a valuation or asking price. When the user requests an estimation without a monetary amount, omit price and set priceLabel to "À estimer". Only extract a price when the message actually supplies a monetary amount. Never copy any telephone into price. Preserve incomplete contact numbers for validation; do not invent a missing digit or prefix. For ambiguous shorthand money, omit the price unless the currency and value are clear.
- create_residence fields: title (program name), description, tagline, developerName, location (city, district, address), deliveryDate (YYYY-MM-DD), completionStatus (PLANNED, UNDER_CONSTRUCTION, DELIVERED), amenities (array of strings), units (array of objects with unitNumber, type, typeCustom, area, price, floor, bedrooms, bathrooms, status, label; supported type values: ${UNIT_TYPES.join(", ")}). A short factual description may be composed from stated details; never add marketing claims.
When a creationDraft exists and the latest message supplies missing fields or corrects that same record, use its intent and set continueCreation true. In creation include only information from the latest message. A new explicit creation request starts a new draft unless it explicitly continues the current one. Unrelated questions use their own intent. A request to abandon the draft uses discard_creation.`;

const localeIndex = { fr: 0, en: 1, ar: 2, darija: 3 };

const labels: Record<string, [string, string, string, string]> = {
  firstName: ["nom ou prénom", "name", "اسم الزبون", "esm l’client"],
  phone: ["numéro de téléphone du client", "client phone number", "رقم هاتف الزبون", "numéro ta3 l’client"],
  leadSource: ["source du lead (TikTok, Facebook, Instagram, Ouedkniss, recommandation, appel, passage à l’agence, site web…)", "lead source (TikTok, Facebook, Instagram, Ouedkniss, referral, phone call, walk-in, website…)", "مصدر الزبون (تيك توك، فيسبوك، إنستغرام، واد كنيس، توصية، اتصال، زيارة الوكالة، الموقع…)", "source ta3 l’client (TikTok, Facebook, Instagram, Ouedkniss, recommandation, appel, passage agence, site…)"],
  phone2: ["deuxième numéro de téléphone", "second phone number", "رقم الهاتف الثاني", "deuxième numéro"],
  type: ["type de client (acheteur, vendeur, locataire…)", "client type (buyer, seller, tenant…)", "نوع الزبون (مشتري، بائع، مستأجر…)", "type ta3 l’client (acheteur, vendeur, locataire…)"],
  "features.bedrooms": ["nombre de chambres", "number of bedrooms", "عدد غرف النوم", "nombre ta3 les chambres"],
  "features.bathrooms": ["nombre de salles de bain", "number of bathrooms", "عدد الحمامات", "nombre ta3 les salles de bain"],
  title: ["titre", "title", "العنوان", "titre"],
  description: ["description", "description", "الوصف", "description"],
  status: ["vente ou location", "sale or rental", "للبيع أو للإيجار", "vente wela location"],
  propertyType: ["type de bien", "property type", "نوع العقار", "type ta3 l’bien"],
  propertyTypeCustom: ["type de bien précis", "specific property type", "نوع العقار بالتحديد", "type précis ta3 l’bien"],
  "location.city": ["ville", "city", "المدينة", "mdina"],
  "features.area": ["surface en m²", "area in m²", "المساحة بالمتر المربع", "surface b m²"],
  "features.layoutNotation": ["nomenclature F ou T", "F or T layout", "تصنيف F أو T", "F wela T"],
  "features.roomCount": ["nombre de pièces", "number of rooms", "عدد الغرف", "nombre ta3 les pièces"],
  sellerPhone: ["numéro de téléphone du vendeur", "seller phone number", "رقم هاتف البائع", "numéro ta3 l’vendeur"],
  sellerPhone2: ["deuxième numéro du vendeur", "seller’s second phone number", "رقم الهاتف الثاني للبائع", "deuxième numéro ta3 l’vendeur"],
};

const shared = ["title", "description", "location"];
const fields: Record<CreationIntent, string[]> = {
  create_client: ["firstName", "lastName", "phone", "phone2", "email", "type", "city", "preferredLocation", "wantedPropertyType", "budgetMin", "budgetMax", "priceCurrency", "wantedArea", "wantedAreaMin", "rooms", "floorMin", "floorMax", "extraNotes", "leadSource", "leadSourceDetails"],
  create_listing: [...shared, "price", "priceLabel", "status", "propertyType", "propertyTypeCustom", "features", "sellerFirstName", "sellerLastName", "sellerPhone", "sellerPhone2", "sellerEmail"],
  create_residence: [...shared, "tagline", "developerName", "deliveryDate", "completionStatus", "amenities", "units"],
};

function presentFields(input: Record<string, unknown>, allowed: string[]) {
  return Object.fromEntries(allowed.filter((key) => input[key] != null && input[key] !== "").map((key) => [key, input[key]]));
}

function nested(value: unknown) {
  const result = z.record(z.unknown()).safeParse(value);
  return result.success ? result.data : {};
}

export async function createFromAssistant(
  scope: AssistantScope,
  intent: CreationIntent,
  input: Record<string, unknown>,
  previous: CreationDraft | undefined,
  language: Language,
  question: string,
) {
  const index = localeIndex[language];
  const copy = (fr: string, en: string, ar: string, darija: string) => [fr, en, ar, darija][index];
  const saved = previous?.intent === intent ? previous.data : {};
  const patch = presentFields(input, fields[intent]);
  if (intent === "create_client" && patch.leadSource !== undefined) {
    const evidence = typeof input.leadSourceEvidence === "string" ? input.leadSourceEvidence.trim() : "";
    if (!evidence || !/\p{L}{2}/u.test(evidence) || !question.toLocaleLowerCase().includes(evidence.toLocaleLowerCase())) {
      delete patch.leadSource;
    }
  }
  const phoneField = intent === "create_client" ? "phone" : intent === "create_listing" ? "sellerPhone" : undefined;
  // Recover a uniquely supplied number if this is the only missing primary contact.
  if (phoneField && !saved[phoneField] && !patch[phoneField] && !patch[phoneField + "2"]) {
    const phone = explicitPhoneIn(question);
    if (phone) patch[phoneField] = phone;
  }
  if (intent === "create_client" && typeof patch.extraNotes === "string") {
    const points = patch.extraNotes.split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
    patch.extraNotes = [...new Set(points)].map((point) => `- ${point}`).join("\n");
  }
  const data = { ...saved, ...patch };
  for (const key of ["location", "features"]) {
    if (patch[key] !== undefined) data[key] = { ...nested(saved[key]), ...nested(patch[key]) };
  }
  if (intent === "create_client") {
    data.city ??= "Oran";
  } else {
    data.location = { city: "Oran", ...nested(data.location) };
  }
  const creationContext = { intent, data };
  if (!canUseAssistantOperations(scope.role)) return { answer: copy("Votre profil ne permet pas cette création.", "Your role cannot create this record.", "ملفك لا يسمح بهذه الإضافة.", "Profil ta3ek ma yesma7ch b had l’ajout.") };

  const normalized = { ...data };
  for (const key of ["phone", "phone2", "sellerPhone", "sellerPhone2"]) {
    const value = normalized[key];
    if (typeof value === "string" && /^[+\d ().-]+$/.test(value)) {
      const number = normalizePhoneKey(value);
      if (number && !/^\+?0/.test(value.trim())) normalized[key] = `+${number}`;
      else if (/^0[567]\d{8}$/.test(value.replace(/\D/g, ""))) normalized[key] = `+213${value.replace(/\D/g, "").slice(1)}`;
    }
  }

  if (intent === "create_listing" && typeof normalized.price === "number") {
    const amountDigits = String(normalized.price);
    const contacts = [normalized.sellerPhone, normalized.sellerPhone2, data.sellerPhone, data.sellerPhone2]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.replace(/\D/g, "").replace(/^0+/, ""));
    if (contacts.some((phone) => phone === amountDigits || (phone.startsWith("213") && phone.slice(3) === amountDigits))) {
      delete normalized.price;
      delete data.price;
    }
  }

  const missing = (paths: string[]) => ({
    answer: copy("Il me faut encore", "I still need", "أحتاج أيضًا إلى", "Mazal khasni") + "\n" +
      [...new Set(paths)].map((path) => `• ${labels[path]?.[index] ?? path}`).join("\n"),
    creationContext,
  });
  const invalid = (error: z.ZodError) => missing(error.issues.map((issue) => issue.path.join(".")));
  const failure = (message?: string) => ({ answer: message || copy("L’enregistrement a échoué. Réessayez.", "Could not save the record. Try again.", "تعذر الحفظ. حاول مجددًا.", "Ma tsajlech. 3awed jarrab."), creationContext });

  if (intent === "create_client") {
    const parsed = clientSchema.safeParse({
      ...normalized, profileKind: normalized.type === "INTERMEDIARY" ? "BROKER" : "INDIVIDUAL",
      leadSource: normalized.leadSource,
    });
    const paths = parsed.success ? [] : parsed.error.issues.map((issue) => issue.path.join("."));
    if (paths.length || !parsed.success) return missing(paths);
    const result = await createClient(parsed.data);
    if (!result.success || !result.data) return failure(result.error?.message);
    const client = result.data;
    return {
      answer: [
        `${copy("Client ajouté", "Client added", "تمت إضافة الزبون", "Client tzad")} · ${[client.firstName, client.lastName, client.referenceCode].filter(Boolean).join(" ")}`,
        client.wantedPropertyType ? `• ${client.wantedPropertyType}` : "",
        [client.city, client.preferredLocation].filter(Boolean).length ? `• ${[client.city, client.preferredLocation].filter(Boolean).join(" · ")}` : "",
        typeof client.wantedAreaMin === "number" ? `• ${copy("Surface minimum", "Minimum area", "المساحة الدنيا", "Surface minimum")} · ${client.wantedAreaMin} m²`
          : typeof client.wantedArea === "number" ? `• ${copy("Surface", "Area", "المساحة", "Surface")} · ${client.wantedArea} m²` : "",
        typeof client.budgetMax === "number" ? `• ${copy("Budget maximum", "Maximum budget", "الميزانية القصوى", "Budget maximum")} · ${new Intl.NumberFormat("fr-DZ").format(client.budgetMax)} ${client.priceCurrency || "DZD"}` : "",
        client.extraNotes ? `\n${copy("Notes", "Notes", "ملاحظات", "Notes")}\n${client.extraNotes}` : "",
      ].filter(Boolean).join("\n"),
      creationContext: null,
      clientContextId: client._id,
      records: [{ label: copy("Voir la fiche", "Open client record", "عرض الملف", "Chouf la fiche"), href: ROUTES.CLIENT_DETAIL(client._id) }],
    };
  }

  const location = nested(normalized.location);
  if (intent === "create_listing") {
    const parsed = listingCreateSchema.safeParse({
      ...normalized, location, features: { bedrooms: 0, bathrooms: 0, ...nested(normalized.features) },
      evaluation: {}, isPublished: false,
    });
    if (!parsed.success) return invalid(parsed.error);
    const result = await createListing(parsed.data, true);
    if (!result.success || !result.data) return failure(result.error?.message);
    return {
      answer: `${copy("Bien ajouté", "Property added", "تمت إضافة العقار", "Bien tzad")} · ${result.data.title}`,
      creationContext: null,
      ...(scope.role !== "ASSISTANT" ? { records: [{ label: copy("Voir le bien", "Open property", "عرض العقار", "Chouf l’bien"), href: ROUTES.LISTING_DETAIL_DASHBOARD(result.data._id) }] } : {}),
    };
  }

  const parsed = residenceSchema.safeParse({
    ...normalized, location, isPublished: false,
    amenities: Array.isArray(data.amenities) ? data.amenities.map((value) => typeof value === "string" ? { value } : value) : data.amenities,
  });
  if (!parsed.success) return invalid(parsed.error);
  const result = await createResidence(parsed.data, true);
  if (!result.success || !result.data) return failure(result.error?.message);
  return {
    answer: `${copy("Résidence ajoutée en brouillon", "Residence saved as a draft", "تم حفظ المشروع السكني كمسودة", "Résidence tzadet brouillon")} · ${result.data.title} · ${result.data.referenceCode}`,
    creationContext: null,
    ...(isElevatedRole(scope.role) ? { records: [{ label: copy("Voir la résidence", "Open residence", "عرض المشروع السكني", "Chouf la résidence"), href: ROUTES.RESIDENCE_EDIT(result.data._id) }] } : {}),
  };
}
