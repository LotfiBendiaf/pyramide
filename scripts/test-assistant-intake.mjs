import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");
const loaded = new Map();
const calls = [];
const mocks = {
  "@/lib/actions/client.action": {
    createClient: async (data) => {
      calls.push({ type: "client", data });
      return {
        success: true,
        data: {
          ...data,
          _id: "000000000000000000000160",
          referenceCode: "BUY-QAS26",
        },
      };
    },
  },
  "@/lib/actions/listings.action": {
    createListing: async (data, fromAssistant) => {
      calls.push({ type: "listing", data, fromAssistant });
      return {
        success: true,
        data: {
          ...data,
          _id: "000000000000000000000161",
          title: data.title || "QAS26 title fixture",
        },
      };
    },
  },
  "@/lib/actions/residence.action": {
    createResidence: async (data) => ({
      success: true,
      data: {
        ...data,
        _id: "000000000000000000000162",
        referenceCode: "RES-QAS26",
      },
    }),
  },
};
function load(file) {
  if (loaded.has(file)) return loaded.get(file).exports;
  const mod = { exports: {} };
  loaded.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
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
  new Function("require", "module", "exports", code)(local, mod, mod.exports);
  return mod.exports;
}
const { createFromAssistant } = load(
  path.join(root, "lib/assistant-creation.ts"),
);

// These checks exercise intake preparation and validation with captured native-action payloads.
// They do not call a language model, database, or external messaging service.
await test("assistant intake preserves criteria and validates unsafe model output", async () => {
  const scope = { userId: "000000000000000000000016", role: "ASSISTANT" };
  let result = await createFromAssistant(
    scope,
    "create_client",
    {
      type: "BUYER",
      phone: "+12025550160",
      wantedPropertyType: "Appartement",
      rooms: 3,
      wantedAreaMin: 190,
      floorMax: 1,
      budgetMax: 10000000,
      extraNotes: "Ascenseur obligatoire\n- Quartier calme",
    },
    undefined,
    "fr",
    "Ajoute un client QAS26 sans nom.",
  );
  assert.match(result.answer, /source du lead/);
  assert.doesNotMatch(result.answer, /nom ou prénom/);
  assert.equal(calls.length, 0);
  assert.equal(result.creationContext.data.city, "Oran");
  console.log(
    "PASS nameless intake asks only for source, preserves Oran and criteria",
  );
  const draft = result.creationContext;
  result = await createFromAssistant(
    scope,
    "create_client",
    { leadSource: "FACEBOOK", leadSourceEvidence: "Facebook" },
    draft,
    "fr",
    "Facebook",
  );
  assert.equal(calls.length, 1);
  const client = calls.at(-1).data;
  assert.equal(client.firstName, undefined);
  assert.equal(client.lastName, undefined);
  assert.equal(client.phone, "+12025550160");
  assert.equal(client.city, "Oran");
  assert.equal(client.wantedAreaMin, 190);
  assert.equal(client.floorMax, 1);
  assert.equal(client.rooms, 3);
  assert.equal(client.budgetMax, 10000000);
  assert.equal(client.extraNotes, "- Ascenseur obligatoire\n- Quartier calme");
  assert.equal(client.leadSource, "FACEBOOK");
  console.log(
    "PASS source-only continuation preserves structured criteria and bullet notes",
  );
  const count = calls.length;
  result = await createFromAssistant(
    scope,
    "create_client",
    {
      type: "BUYER",
      phone: "+12025550161",
      leadSource: "FACEBOOK",
      leadSourceEvidence: "Facebook",
    },
    undefined,
    "fr",
    "Ajoute ce client QAS26.",
  );
  assert.equal(calls.length, count);
  assert.match(result.answer, /source du lead/);
  console.log("PASS invented lead-source evidence rejected");
  result = await createFromAssistant(
    scope,
    "create_listing",
    {
      title: "QAS26 Estimation",
      status: "En Vente",
      propertyType: "Appartement",
      price: 12025550162,
      priceLabel: "À estimer",
      sellerPhone: "+12025550162",
      location: { district: "Akid Lotfi" },
      features: { area: 250, layoutNotation: "F", roomCount: 5, etage: 11 },
    },
    undefined,
    "fr",
    "Ajoute QAS26 f5 Akid 250m2 11e étage estimation +12025550162 vente.",
  );
  const listing = calls.at(-1);
  assert.equal(listing.type, "listing", result.answer);
  assert.equal(listing.data.price, undefined);
  assert.equal(listing.data.priceLabel, "À estimer");
  assert.equal(listing.data.sellerPhone, "+12025550162");
  assert.equal(listing.data.location.city, "Oran");
  assert.equal(listing.data.features.area, 250);
  assert.equal(listing.data.features.etage, 11);
  assert.equal(result.records, undefined);
  assert.equal(listing.fromAssistant, true);
  console.log(
    "PASS phone-as-price stripped, estimation retained, Oran/floor/area kept, no assistant view link",
  );
  const before = calls.length;
  result = await createFromAssistant(
    scope,
    "create_listing",
    {
      title: "QAS26 invalid contact",
      status: "En Vente",
      propertyType: "Appartement",
      priceLabel: "À estimer",
      sellerPhone: "065839409",
      features: { area: 250 },
    },
    undefined,
    "fr",
    "QAS26 estimation 065839409",
  );
  assert.equal(calls.length, before);
  assert.match(result.answer, /téléphone du vendeur/);
  console.log("PASS incomplete local phone rejected without inventing digits");
  result = await createFromAssistant(
    scope,
    "create_client",
    {
      type: "BUYER",
      phone: "+12025550163",
      city: "Alger",
      leadSource: "DIRECT_CALL",
      leadSourceEvidence: "appel",
    },
    undefined,
    "fr",
    "QAS26 Alger, appel",
  );
  assert.equal(calls.at(-1).data.city, "Alger");
  console.log("PASS explicit city overrides default");
  console.log(
    JSON.stringify({ checks: 6, passed: 6, dbWrites: 0, modelCalls: 0 }),
  );
});
