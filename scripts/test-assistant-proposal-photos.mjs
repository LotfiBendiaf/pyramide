import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");
const cache = new Map();
let listingQuery; let listingRows = [];
const client = {
  _id: "000000000000000000000160",
  city: "Oran",
  type: "BUYER",
  preferredLocation: "Akid / Maraval",
  wantedPropertyType: "Appartement",
  rooms: 3,
  wantedAreaMin: 190,
  floorMin: 0,
  floorMax: 1,
  budgetMin: 7000000,
  budgetMax: 10000000,
  priceCurrency: "DZD",
};
function chain(rows) {
  const query = { lean: async () => rows };
  for (const method of ["collation", "select", "limit", "sort"])
    query[method] = () => query;
  return query;
}
const mocks = {
  "@/models": {
    Client: { find: () => chain([client]) },
    Listing: {
      find: (query) => {
        listingQuery = query;
        return chain(listingRows);
      },
    },
  },
};
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const local = (id) => {
    if (mocks[id]) return mocks[id];
    if (id.startsWith("@/")) return load(path.join(root, id.slice(2)) + ".ts");
    if (id.startsWith("."))
      return load(path.resolve(path.dirname(file), id) + ".ts");
    return req(id);
  };
  new Function("require", "module", "exports", source)(local, mod, mod.exports);
  return mod.exports;
}
const { prepareVisitProposals } = load(path.join(root, "lib/assistant-proposals.ts"));

test("proposal exposes existing public photos and excludes private or unsafe URLs", async () => {
  // Public local images mirror the format stored on the L-0000001 simulation listing.
  listingRows = [{
    _id: "000000000000000000000161", referenceCode: "L-0000001",
    title: "Simulation photo", location: {city: "Oran", district: "Bir El Djir"},
    status: "En Location", price: 55000,
    images: [
      {url: "/immo1.jpg", isPublic: true},
      {url: "/immo2.jpg", isPublic: true},
      {url: "/confidentiel.jpg", isPublic: false},
      {url: "javascript:alert(1)", isPublic: true},
      {url: "//untrusted.invalid/photo.jpg", isPublic: true},
      {url: "https://example.com/public-photo.jpg", isPublic: true}
    ]
  }];
  const result = await prepareVisitProposals(
    {role: "ASSISTANT", userId: "000000000000000000000016"}, null,
    {listing: "L-0000001"}, {clientId: client._id});
  assert.deepEqual(result.proposals[0].photos,
    ["/immo1.jpg", "/immo2.jpg", "https://example.com/public-photo.jpg"]);
  assert.equal(result.proposals[0].listingReference, "L-0000001");
  assert.deepEqual(listingQuery.$and[0], {
    archived: {$ne: true}, status: {$in: ["En Vente", "En Location"]},
    isValidated: true, validationStatus: "VALIDATED"
  });
});
