/**
 * One-time migration: replace old phone numbers in all listing descriptions.
 * Run with: npx tsx scripts/remove-old-phone.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");

// Old phone substrings → replace with new phones
const REPLACEMENTS: { find: string; replacement: string }[] = [
  {
    find: "0779 07 97 06 / 0792 11 65 96 / 0770 82 33 00",
    replacement: "0556510000 / 0779079706",
  },
  {
    find: "0556510000 / 0779079706",
    replacement: "0556 51 00 00 / 0779 07 97 06",
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: "Pyramide-Immobilier" });
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;
  const collection = db.collection("listings");

  let totalUpdated = 0;

  for (const { find, replacement } of REPLACEMENTS) {
    const count = await collection.countDocuments({
      description: { $regex: find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") },
    });

    console.log(`"${find}" → found in ${count} listing(s)`);

    if (count === 0) continue;

    const result = await collection.updateMany(
      { description: { $regex: find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") } },
      [
        {
          $set: {
            description: {
              $replaceAll: {
                input: "$description",
                find,
                replacement,
              },
            },
          },
        },
      ]
    );

    console.log(`  → updated ${result.modifiedCount} listing(s)`);
    totalUpdated += result.modifiedCount;
  }

  console.log(`\nDone. Total updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
