import "dotenv/config";
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");
const DB_NAME = "Pyramide-Immobilier";

function wasApprovedWithoutReferenceBeforeReferenceMigration(referenceCode) {
  const match = referenceCode?.match(/^([VL])-(\d{7})$/);
  if (!match) return false;

  const sequence = Number(match[2]);
  return (
    (match[1] === "V" && sequence >= 721 && sequence <= 746) ||
    (match[1] === "L" && sequence >= 37 && sequence <= 41)
  );
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
  const collection = mongoose.connection.db.collection("listings");
  const listings = await collection
    .find(
      {},
      {
        projection: {
          referenceCode: 1,
          isValidated: 1,
          validationStatus: 1,
        },
      }
    )
    .toArray();

  const operations = listings.map((listing) => {
    const validationStatus = !listing.isValidated
      ? "NEUTRAL"
      : wasApprovedWithoutReferenceBeforeReferenceMigration(
            listing.referenceCode
          )
        ? "APPROVED"
        : "VALIDATED";

    return {
      updateOne: {
        filter: { _id: listing._id },
        update: { $set: { validationStatus } },
      },
    };
  });

  const counts = operations.reduce(
    (result, operation) => {
      const status = operation.updateOne.update.$set.validationStatus;
      result[status] += 1;
      return result;
    },
    { NEUTRAL: 0, APPROVED: 0, VALIDATED: 0 }
  );

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        listingCount: listings.length,
        counts,
      },
      null,
      2
    )
  );

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
    return;
  }

  const result = await collection.bulkWrite(operations, { ordered: true });
  console.log(
    `Updated ${result.modifiedCount} listings (${result.matchedCount} matched).`
  );
  await collection.createIndex(
    { validationStatus: 1 },
    { name: "validationStatus_1" }
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
