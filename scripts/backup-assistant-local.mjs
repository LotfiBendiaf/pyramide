import { MongoClient, BSON } from "mongodb";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI est requis.");
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db("Pyramide-Immobilier");
  const collections = {};
  for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    collections[name] = await db.collection(name).find({}).toArray();
  }
  const directory = resolve(".local-data/backups");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, new Date().toISOString().replace(/[:.]/g, "-") + ".ejson");
  await writeFile(path, BSON.EJSON.stringify({ database: db.databaseName, createdAt: new Date(), collections }, { relaxed: false }), { mode: 0o600, flag: "wx" });
  console.log(`Sauvegarde locale créée : ${path}`);
} finally {
  await client.close();
}
