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
let clients, property, propertyQuery, clientQuery, modelInput, modelCalls;
const client = {
  _id: "000000000000000000000160",
  firstName: "Leila",
  phone: "+1 202 555 0160",
};
function chain(value) {
  const query = { lean: async () => value };
  for (const name of ["select", "collation", "limit"])
    query[name] = () => query;
  return query;
}
const mocks = {
  "@/models": {
    Client: {
      find: (q) => {
        clientQuery = q;
        return chain(clients);
      },
    },
    Listing: {
      findOne: (q) => {
        propertyQuery = q;
        return chain(property);
      },
    },
  },
  "@/lib/assistant-model": {
    askModel: async (_system, input) => {
      modelInput = input;
      modelCalls++;
      return JSON.stringify({ message: "Bonjour Leila" });
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

const { draftAssistantClientMessage: draft } = load(
  path.join(root, "lib/assistant-client-message.ts"),
);
const scope = { role: "ASSISTANT", userId: "000000000000000000000016" };
const listingId = "000000000000000000000161";
function reset() {
  clients = [client];
  property = {
    title: "F3 Akid",
    referenceCode: "V-00003",
    location: { city: "Oran", district: "Akid Lotfi" },
    price: 9000000,
    features: { area: 200 },
    status: "En Vente",
  };
  propertyQuery = undefined;
  modelInput = undefined;
  modelCalls = 0;
}
await test("implicit client receives verified accessible property facts only", async () => {
  reset();
  const result = await draft(
    scope,
    null,
    client._id,
    "Prépare-lui un message pour ce bien",
    ["Fausse villa prix 1 DA"],
    "fr",
    listingId,
  );
  assert.equal(result.clientContextId, client._id);
  assert.equal(result.visitMessage.phone, "12025550160");
  assert.deepEqual(propertyQuery, {
    _id: listingId,
    archived: { $ne: true },
    status: { $in: ["En Vente", "En Location"] },
    isValidated: true,
    validationStatus: "VALIDATED",
  });
  assert.deepEqual(modelInput.selectedProperty, {
    title: "F3 Akid",
    reference: "V-00003",
    city: "Oran",
    district: "Akid Lotfi",
    priceDzd: 9000000,
    priceLabel: undefined,
    areaM2: 200,
    transaction: "En Vente",
  });
  assert.equal(modelInput.selectedProperty.priceDzd, 9000000);
  assert.deepEqual(clientQuery.$and[1], {
    $or: [{ assignedAgent: scope.userId }, { createdBy: scope.userId }],
  });
});
await test("explicit identity overrides context and discards stale selected property", async () => {
  reset();
  await draft(
    scope,
    "BUY-00009",
    client._id,
    "Écris au client BUY-00009",
    [],
    "fr",
    listingId,
  );
  assert.equal(propertyQuery, undefined);
  assert.equal(modelInput.selectedProperty, undefined);
  assert.notDeepEqual(clientQuery.$and[0], { _id: client._id });
});
await test("unavailable property, invalid ID or inaccessible client never reaches model", async () => {
  reset();
  property = null;
  await draft(scope, null, client._id, "Ce bien", [], "fr", listingId);
  assert.equal(modelCalls, 0);
  reset();
  await draft(scope, null, client._id, "Ce bien", [], "fr", "not-an-id");
  assert.equal(modelCalls, 0);
  assert.equal(propertyQuery, undefined);
  reset();
  clients = [];
  await draft(scope, null, client._id, "Ce bien", [], "fr", listingId);
  assert.equal(modelCalls, 0);
  assert.equal(propertyQuery, undefined);
});
