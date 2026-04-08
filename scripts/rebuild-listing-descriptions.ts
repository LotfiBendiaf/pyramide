/**
 * One-time migration: rebuild all listing descriptions with the updated format
 * (city - address instead of city alone).
 * Run with: npx tsx scripts/rebuild-listing-descriptions.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");

/* ---------- helpers (mirrors listings.action.ts) ---------- */

function formatPriceAlgeria(value: number): string {
  if (value === 0) return "0";
  const centimes = value * 100;
  const billion = 1_000_000_000;
  const million = 1_000_000;
  if (centimes >= billion) {
    const billions = centimes / billion;
    return billions % 1 === 0
      ? `${Math.round(billions)} Milliards`
      : `${billions.toFixed(3)} Milliards`;
  }
  if (centimes >= million) {
    const millions = centimes / million;
    return millions % 1 === 0
      ? `${Math.round(millions)} Millions`
      : `${millions.toFixed(2)} Millions`;
  }
  return `${centimes.toLocaleString("fr-DZ")}`;
}

function buildListingDescription(listing: any, referenceCode?: string): string {
  const statusLine =
    listing.status === "En Location"
      ? "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en location"
      : "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en vente";

  const typeLabel =
    listing.propertyTypeCustom?.trim() || listing.propertyType;
  const lowerType = typeLabel.toLowerCase();
  const isVilla = lowerType.startsWith("villa");
  const article =
    lowerType.startsWith("maison") || isVilla ? "Une" : "Un";
  const situe = article === "Une" ? "située" : "situé";

  const _city = listing.location?.city?.trim();
  const _address = listing.location?.address?.trim();
  const locationLabel =
    listing.location?.district?.trim() ||
    (_city && _address ? `${_city} - ${_address}` : _city || _address || "");

  const areaLabel = listing.features?.area ? `${listing.features.area} m²` : "";
  const nombreEtages = listing.features?.nombreEtages;
  const nombreEtagesLine =
    nombreEtages !== undefined ? `Hauteur : R+${nombreEtages}` : undefined;
  const etage = listing.features?.etage;
  const etageSuffix = etage === 1 ? "er" : "e";
  const elevatorText = listing.features?.elevator ? " avec ascenseur" : "";
  const etageLine =
    etage !== undefined
      ? isVilla
        ? `R+${etage}${elevatorText}`
        : `Étage : ${etage}${etageSuffix}${elevatorText}`
      : undefined;

  const priceLabel = `${formatPriceAlgeria(listing.price ?? 0).replace(".", ",")} DA`;

  const villaTypeLabel =
    isVilla && etage !== undefined ? `${lowerType} R+${etage}` : lowerType;

  const intro =
    locationLabel && areaLabel
      ? `${article} ${villaTypeLabel} de ${areaLabel}, ${situe}${
          !isVilla && etage !== undefined ? ` au ${etage}${etageSuffix} étage` : ""
        } à ${locationLabel}.`
      : `${article} ${villaTypeLabel} spacieux et lumineux.`;

  const details = [
    referenceCode ? `Réf : ${referenceCode}` : undefined,
    `Type : ${typeLabel}`,
    areaLabel ? `Surface : ${areaLabel}` : undefined,
    etageLine,
    nombreEtagesLine,
    locationLabel ? `Emplacement : ${locationLabel}` : undefined,
    `Prix demandé : ${priceLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  const cityLabel = _city || locationLabel;
  const closing = cityLabel
    ? `Un bien rare à ${cityLabel}, alliant confort, accessibilité et standing dans l'un des quartiers les plus recherchés.`
    : "Un bien rare, alliant confort, accessibilité et standing.";

  const contact =
    "Pour plus d'informations ou pour organiser une visite :\n0556510000 / 0779079706";

  return [
    statusLine,
    "",
    intro,
    "",
    "Ce bien spacieux et lumineux offre de beaux volumes, un cadre agréable et un confort idéal pour une famille recherchant un lieu de vie moderne et bien situé.",
    "",
    details,
    "",
    closing,
    "",
    contact,
  ].join("\n");
}

/* ---------- main ---------- */

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: "Pyramide-Immobilier" });
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;
  const collection = db.collection("listings");

  const listings = await collection.find({}).toArray();
  console.log(`Found ${listings.length} listing(s) to update`);

  let updated = 0;
  for (const listing of listings) {
    const description = buildListingDescription(listing, listing.referenceCode);
    await collection.updateOne(
      { _id: listing._id },
      { $set: { description } }
    );
    updated++;
    console.log(`  [${updated}/${listings.length}] ${listing.referenceCode ?? listing._id}`);
  }

  console.log(`\nDone. Updated ${updated} listing(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
