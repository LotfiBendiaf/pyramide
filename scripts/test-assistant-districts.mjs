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
let listingQuery;
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
        return chain([]);
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
const { expandPreferredDistricts } = load(
  path.join(root, "lib/assistant-districts.ts"),
);
const { prepareVisitProposals } = load(
  path.join(root, "lib/assistant-proposals.ts"),
);

test("exact Oran alias expands alternatives and deduplicates", () => {
  assert.deepEqual(expandPreferredDistricts("Akid / Maraval", "Oran"), [
    "Akid Lotfi",
    "Akid",
    "Maraval",
  ]);
  assert.deepEqual(
    expandPreferredDistricts(
      " AKID LOTFI ; Akid ou Maraval or Maraval ، ",
      "  ORAN ",
    ),
    ["Akid Lotfi", "Akid", "Maraval"],
  );
});
test("unknown districts, other cities and regex-like text stay literal", () => {
  for (const city of [undefined, "Alger"])
    assert.deepEqual(expandPreferredDistricts("Akid / Maraval", city), [
      "Akid",
      "Maraval",
    ]);
  assert.deepEqual(
    expandPreferredDistricts("Akid Ahmed / Marval / Akid.*", "Oran"),
    ["Akid Ahmed", "Marval", "Akid.*"],
  );
  assert.deepEqual(expandPreferredDistricts(null, "Oran"), []);
});
test("actual proposal query keeps every mandatory constraint alongside geographic alias", async () => {
  await prepareVisitProposals(
    { role: "ASSISTANT", userId: "000000000000000000000016" },
    null,
    null,
    { clientId: client._id, matchOnly: true },
  );
  const filters = listingQuery.$and;
  for (const expected of [
    { "features.area": { $gte: 190 } },
    { "features.etage": { $gte: 0 } },
    { "features.etage": { $lte: 1 } },
    { price: { $gte: 7000000 } },
    { price: { $lte: 10000000 } },
    { propertyType: "Appartement" },
    { status: "En Vente" },
    { "location.district": { $in: ["Akid Lotfi", "Akid", "Maraval"] } },
    { $or: [{ "location.city": "Oran" }, { "location.district": "Oran" }] },
    {
      $or: [
        { "features.roomCount": 3 },
        { "features.roomCount": null, "features.bedrooms": 3 },
      ],
    },
  ])
    assert.ok(
      filters.some((filter) => {
        try {
          assert.deepEqual(filter, expected);
          return true;
        } catch {
          return false;
        }
      }),
      JSON.stringify(expected),
    );
  assert.deepEqual(filters[0], {
    archived: { $ne: true },
    status: { $in: ["En Vente", "En Location"] },
    isValidated: true,
    validationStatus: "VALIDATED",
  });
});
