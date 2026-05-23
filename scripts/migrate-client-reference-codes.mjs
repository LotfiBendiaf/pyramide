/**
 * One-time migration: normalize client reference codes to 5 digits.
 *
 * Examples:
 *   BUY-571  -> BUY-00571
 *   RENT-12  -> RENT-00012
 *   SELL-001 -> SELL-00001
 *
 * Dry run:
 *   node scripts/migrate-client-reference-codes.mjs
 *
 * Apply:
 *   node scripts/migrate-client-reference-codes.mjs --apply
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "Pyramide-Immobilier";
const CODE_PATTERN = /^(BUY|RENT|SELL|INV)-(\d+)$/;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

function normalizeReferenceCode(referenceCode) {
  const match = referenceCode?.match(CODE_PATTERN);
  if (!match) return null;

  const [, prefix, rawNumber] = match;
  return `${prefix}-${String(Number(rawNumber)).padStart(5, "0")}`;
}

async function main() {
  const shouldApply = process.argv.includes("--apply");

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  console.log(`Connected to MongoDB (${DB_NAME})`);

  const clients = mongoose.connection.db.collection("clients");
  const cursor = clients
    .find({ referenceCode: { $regex: "^(BUY|RENT|SELL|INV)-\\d+$" } })
    .project({ _id: 1, referenceCode: 1 });

  const updates = [];
  for await (const client of cursor) {
    const nextReferenceCode = normalizeReferenceCode(client.referenceCode);

    if (
      nextReferenceCode &&
      nextReferenceCode !== client.referenceCode
    ) {
      updates.push({
        _id: client._id,
        from: client.referenceCode,
        to: nextReferenceCode,
      });
    }
  }

  console.log(`Found ${updates.length} client reference code(s) to normalize.`);

  if (updates.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const targetCounts = new Map();
  for (const update of updates) {
    targetCounts.set(update.to, (targetCounts.get(update.to) ?? 0) + 1);
  }

  const duplicatedTargets = [...targetCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([referenceCode]) => referenceCode);

  const existingTargets = await clients
    .find({
      referenceCode: { $in: updates.map((update) => update.to) },
      _id: { $nin: updates.map((update) => update._id) },
    })
    .project({ _id: 1, referenceCode: 1 })
    .toArray();

  if (duplicatedTargets.length > 0 || existingTargets.length > 0) {
    console.error("Aborting: normalization would create duplicate reference codes.");

    if (duplicatedTargets.length > 0) {
      console.error("Duplicate migration targets:");
      for (const referenceCode of duplicatedTargets) {
        console.error(`  ${referenceCode}`);
      }
    }

    if (existingTargets.length > 0) {
      console.error("Targets already used by other clients:");
      for (const client of existingTargets) {
        console.error(`  ${client.referenceCode} (${client._id})`);
      }
    }

    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Preview:");
  for (const update of updates.slice(0, 20)) {
    console.log(`  ${update.from} -> ${update.to}`);
  }
  if (updates.length > 20) {
    console.log(`  ...and ${updates.length - 20} more`);
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
        referenceCode: update.from,
      },
      update: {
        $set: { referenceCode: update.to },
      },
    },
  }));

  const result = await clients.bulkWrite(operations, { ordered: true });
  console.log(`Updated ${result.modifiedCount} client(s).`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
