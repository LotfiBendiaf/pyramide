import "dotenv/config";
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");
const DB_NAME = "Pyramide-Immobilier";
const CODE_PATTERN = /^([VL])-(\d{7})$/;

function prefixForStatus(status) {
  return status === "En Location" || status === "Loué" ? "L" : "V";
}

function formatCode(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(7, "0")}`;
}

function upsertReferenceInDescription(description, referenceCode) {
  if (!description) return description;
  if (/^Réf : .+$/m.test(description)) {
    return description.replace(/^Réf : .+$/m, `Réf : ${referenceCode}`);
  }
  if (/^Type :/m.test(description)) {
    return description.replace(/^Type :/m, `Réf : ${referenceCode}\nType :`);
  }
  return `${description.trimEnd()}\n\nRéf : ${referenceCode}`;
}

function effectiveDate(listing) {
  return listing.validatedAt ?? listing.createdAt ?? listing._id.getTimestamp();
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
  const db = mongoose.connection.db;
  const listingsCollection = db.collection("listings");
  const countersCollection = db.collection("referencecounters");
  const listings = await listingsCollection.find({}).toArray();

  const max = { V: 0, L: 0 };
  const byCode = new Map();

  for (const listing of listings) {
    const match = listing.referenceCode?.match(CODE_PATTERN);
    if (match) {
      const prefix = match[1];
      max[prefix] = Math.max(max[prefix], Number(match[2]));
    }
    if (listing.referenceCode) {
      const group = byCode.get(listing.referenceCode) ?? [];
      group.push(listing);
      byCode.set(listing.referenceCode, group);
    }
  }

  const changes = [];
  const duplicateGroups = [...byCode.entries()].filter(
    ([, group]) => group.length > 1
  );

  for (const [code, group] of duplicateGroups) {
    group.sort(
      (a, b) =>
        effectiveDate(a).getTime() - effectiveDate(b).getTime() ||
        a._id.toString().localeCompare(b._id.toString())
    );

    for (const listing of group.slice(1)) {
      const prefix = prefixForStatus(listing.status);
      const nextCode = formatCode(prefix, ++max[prefix]);
      changes.push({
        listing,
        reason: `duplicate ${code}`,
        referenceCode: nextCode,
        referenceGeneratedAt: new Date(),
      });
    }
  }

  const missingValidated = listings
    .filter(
      (listing) =>
        listing.isValidated &&
        (listing.referenceCode === undefined ||
          listing.referenceCode === null ||
          listing.referenceCode === "")
    )
    .sort(
      (a, b) =>
        effectiveDate(a).getTime() - effectiveDate(b).getTime() ||
        a._id.toString().localeCompare(b._id.toString())
    );

  for (const listing of missingValidated) {
    const prefix = prefixForStatus(listing.status);
    changes.push({
      listing,
      reason: "validated without reference",
      referenceCode: formatCode(prefix, ++max[prefix]),
      referenceGeneratedAt: new Date(),
    });
  }

  const changedIds = new Set(
    changes.map(({ listing }) => listing._id.toString())
  );
  const backfills = listings.filter(
    (listing) =>
      listing.referenceCode &&
      !listing.referenceGeneratedAt &&
      !changedIds.has(listing._id.toString())
  );

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        listingCount: listings.length,
        duplicateGroups: duplicateGroups.map(([code, group]) => ({
          code,
          count: group.length,
        })),
        missingValidated: missingValidated.length,
        referenceChanges: changes.map(({ listing, reason, referenceCode }) => ({
          id: listing._id,
          title: listing.title,
          reason,
          from: listing.referenceCode ?? null,
          to: referenceCode,
        })),
        referenceGeneratedAtBackfills: backfills.length,
        finalCounters: max,
      },
      null,
      2
    )
  );

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
    return;
  }

  const operations = [
    ...changes.map(
      ({ listing, referenceCode, referenceGeneratedAt }) => ({
        updateOne: {
          filter: { _id: listing._id },
          update: {
            $set: {
              referenceCode,
              referenceGeneratedAt,
              description: upsertReferenceInDescription(
                listing.description,
                referenceCode
              ),
            },
          },
        },
      })
    ),
    ...backfills.map((listing) => ({
      updateOne: {
        filter: { _id: listing._id },
        update: {
          $set: { referenceGeneratedAt: effectiveDate(listing) },
        },
      },
    })),
  ];

  if (operations.length > 0) {
    const result = await listingsCollection.bulkWrite(operations, {
      ordered: true,
    });
    console.log(
      `Updated ${result.modifiedCount} listings (${result.matchedCount} matched).`
    );
  }

  await Promise.all(
    ["V", "L"].map((prefix) =>
      countersCollection.updateOne(
        { _id: `listing:${prefix}` },
        {
          $max: { sequence: max[prefix] },
          $set: { prefix, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )
    )
  );

  const referenceIndex = (await listingsCollection.indexes()).find(
    (index) => index.name === "referenceCode_1"
  );
  if (referenceIndex && !referenceIndex.unique) {
    await listingsCollection.dropIndex("referenceCode_1");
  }
  await listingsCollection.createIndex(
    { referenceCode: 1 },
    {
      name: "referenceCode_1",
      unique: true,
      partialFilterExpression: {
        referenceCode: { $type: "string", $gt: "" },
      },
    }
  );

  console.log("Reference counters and unique index are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
