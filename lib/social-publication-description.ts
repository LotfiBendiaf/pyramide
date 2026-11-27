import { formatPriceAlgeria } from "@/lib/utils";
import type { ListingInput } from "@/lib/validators/listing";

const propertyWording: Record<
  string,
  { titleArticle: string; demonstrative: string; noun: string; agreement: string }
> = {
  Appartement: {
    titleArticle: "Un bel",
    demonstrative: "cet",
    noun: "appartement",
    agreement: "situé",
  },
  Maison: {
    titleArticle: "Une belle",
    demonstrative: "cette",
    noun: "maison",
    agreement: "située",
  },
  Villa: {
    titleArticle: "Une belle",
    demonstrative: "cette",
    noun: "villa",
    agreement: "située",
  },
  Studio: {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "studio",
    agreement: "situé",
  },
  Terrain: {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "terrain",
    agreement: "situé",
  },
  Commercial: {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "local commercial",
    agreement: "situé",
  },
  Duplex: {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "duplex",
    agreement: "situé",
  },
  Hangar: {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "hangar",
    agreement: "situé",
  },
  Penthouse: {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "penthouse",
    agreement: "situé",
  },
  "Local Commercial": {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: "local commercial",
    agreement: "situé",
  },
};

export function generateSocialPublicationDescription(
  listing: ListingInput & { priceLabel?: string; referenceCode?: string }
): string {
  const type = listing.propertyTypeCustom || listing.propertyType;
  const wording = propertyWording[type] || {
    titleArticle: "Un beau",
    demonstrative: "ce",
    noun: type.toLowerCase(),
    agreement: "situé",
  };
  const district = listing.location.district?.trim();
  const city = listing.location.city?.trim();
  const location = [district, city].filter(Boolean).join(" – ");
  const action = listing.status === "En Location" ? "met en location" : "met en vente";
  const roomCount = listing.features.roomCount ?? listing.features.bedrooms;
  const layoutNotation = listing.features.layoutNotation ?? "F";
  const roomLabel = roomCount > 0 ? ` ${layoutNotation}${roomCount}` : "";
  const title = `${wording.titleArticle} ${wording.noun}${roomLabel} de ${listing.features.area} m² à ${location}`;
  const intro = `Découvrez ${wording.demonstrative} ${wording.noun} d’une superficie de ${listing.features.area} m², ${wording.agreement} à ${location}.`;
  const amenities = [
    listing.features.furnished ? "Meublé" : null,
    listing.features.parking ? "Parking" : null,
    listing.features.balcony ? "Balcon" : null,
    listing.features.garden ? "Jardin" : null,
    listing.features.pool ? "Piscine" : null,
    listing.features.elevator && listing.features.etage === undefined
      ? "Ascenseur"
      : null,
  ].filter(Boolean);
  const details = [
    `Type : ${type}`,
    roomCount > 0 ? `Nombre de pièces : ${layoutNotation}${roomCount}` : null,
    `Superficie : ${listing.features.area} m²`,
    listing.features.facade ? `Façade : ${listing.features.facade} m` : null,
    listing.features.etage !== undefined
      ? `Étage : ${listing.features.etage}${listing.features.elevator ? " avec ascenseur" : ""}`
      : null,
    listing.features.nombreEtages
      ? `Nombre d’étages : ${listing.features.nombreEtages}`
      : null,
    amenities.length > 0 ? `Commodités : ${amenities.join(", ")}` : null,
    `Localisation : ${location}`,
    listing.price ? `Prix demandé : ${listing.priceLabel || `${formatPriceAlgeria(listing.price)} DA`}` : null,
    listing.referenceCode ? `Référence : ${listing.referenceCode}` : null,
  ].filter(Boolean);

  return [
    `𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 ${action}`,
    title,
    intro,
    details.join("\n"),
    "Une belle opportunité pour une résidence ou un investissement immobilier dans un secteur recherché.",
    "Pour plus d’informations ou pour organiser une visite :\n0556 51 00 00 / 0779 07 97 06",
    "PYRAMIDE IMMOBILIER",
  ].join("\n\n");
}
