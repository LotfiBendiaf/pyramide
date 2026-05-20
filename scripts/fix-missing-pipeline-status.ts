/**
 * One-time migration: set missing listing pipelineStatus to PHOTO_VISIT_PENDING.
 * Run with: npx tsx scripts/fix-missing-pipeline-status.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: "Pyramide-Immobilier" });
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;
  const collection = db.collection("listings");

  const filter = {
    $or: [
      { pipelineStatus: { $exists: false } },
      { pipelineStatus: null },
      { pipelineStatus: "" },
    ],
  };

  const count = await collection.countDocuments(filter);
  console.log(`Found ${count} listing(s) with missing pipelineStatus`);

  if (count === 0) {
    console.log("No updates needed.");
  } else {
    const result = await collection.updateMany(filter, {
      $set: { pipelineStatus: "PHOTO_VISIT_PENDING" },
    });
    console.log(`Updated ${result.modifiedCount} listing(s).`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
