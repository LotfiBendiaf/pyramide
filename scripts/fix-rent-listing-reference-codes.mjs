/**
 * One-time migration: ensure rental listings use L- reference codes.
 *
 * Targets listings with status "En Location" or "Loué" whose referenceCode is
 * missing or does not start with L-. Preview by default, write with --apply.
 *
 * Dry run:
 *   node scripts/fix-rent-listing-reference-codes.mjs
 *
 * Apply:
 *   node scripts/fix-rent-listing-reference-codes.mjs --apply
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "Pyramide-Immobilier";
const RENT_STATUSES = ["En Location", "Loué"];
const L_REF_PATTERN = /^L-(\d{7})$/;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

function upsertReferenceInDescription(description, referenceCode, status) {
  if (!description) return description;

  let nextDescription = description;
  const statusLine =
    status === "Loué"
      ? "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en location"
      : "𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en location";

  nextDescription = nextDescription.replace(
    /^𝗣𝗬𝗥𝗔𝗠𝗜𝗗𝗘 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥 met en vente$/m,
    statusLine
  );

  if (nextDescription.includes("Réf :")) {
    return nextDescription.replace(/^Réf : .+$/m, `Réf : ${referenceCode}`);
  }

  return nextDescription.replace(
    /^([\s\S]*?)(Type :)/m,
    `$1Réf : ${referenceCode}\n$2`
  );
}

function getReferenceNumber(referenceCode) {
  const match = referenceCode?.match(L_REF_PATTERN);
  return match ? Number(match[1]) : null;
}

async function main() {
  const shouldApply = process.argv.includes("--apply");

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  console.log(`Connected to MongoDB (${DB_NAME})`);

  const listings = mongoose.connection.db.collection("listings");

  const existingLCodes = await listings
    .find({ referenceCode: { $regex: "^L-\\d{7}$" } })
    .project({ referenceCode: 1 })
    .toArray();

  let nextNumber = existingLCodes.reduce((max, listing) => {
    return Math.max(max, getReferenceNumber(listing.referenceCode) ?? 0);
  }, 0);

  const targets = await listings
    .find({
      status: { $in: RENT_STATUSES },
      $or: [
        { referenceCode: { $exists: false } },
        { referenceCode: null },
        { referenceCode: "" },
        { referenceCode: { $not: /^L-/ } },
      ],
    })
    .project({
      _id: 1,
      referenceCode: 1,
      status: 1,
      title: 1,
      description: 1,
    })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();

  const updates = targets.map((listing) => {
    nextNumber += 1;
    const nextReferenceCode = `L-${String(nextNumber).padStart(7, "0")}`;

    return {
      _id: listing._id,
      title: listing.title,
      status: listing.status,
      from: listing.referenceCode,
      to: nextReferenceCode,
      description: upsertReferenceInDescription(
        listing.description,
        nextReferenceCode,
        listing.status
      ),
    };
  });

  console.log(
    `Found ${updates.length} rental listing reference code(s) to fix.`
  );

  if (updates.length === 0) {
    await mongoose.disconnect();
    return;
  }

  console.log("Preview:");
  for (const update of updates.slice(0, 30)) {
    console.log(
      `  ${update.from ?? "(missing)"} -> ${update.to} | ${update.status} | ${
        update.title ?? update._id
      }`
    );
  }
  if (updates.length > 30) {
    console.log(`  ...and ${updates.length - 30} more`);
  }

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to write changes.");
    await mongoose.disconnect();
    return;
  }

  const operations = updates.map((update) => ({
    updateOne: {
      filter: {
        _id: update._id,
        $or: [
          { referenceCode: update.from },
          { referenceCode: { $exists: false } },
          { referenceCode: null },
          { referenceCode: "" },
        ],
      },
      update: {
        $set: {
          referenceCode: update.to,
          status: update.status,
          description: update.description,
        },
      },
    },
  }));

  const result = await listings.bulkWrite(operations, { ordered: true });
  console.log(`Updated ${result.modifiedCount} listing(s).`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
