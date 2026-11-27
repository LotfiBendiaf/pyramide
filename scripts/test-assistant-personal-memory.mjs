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
// Persisted collection stub shared across calls, independent of conversation or role.
const rows = [];
const matches = (row, filter) =>
  Object.entries(filter).every(([key, value]) => row[key] === value);
const collection = {
  find: (filter) => {
    assert.deepEqual(Object.keys(filter), ["userId"]);
    let selected = rows.filter((row) => matches(row, filter));
    const cursor = {
      sort: () => {
        selected.sort((a, b) => b.createdAt - a.createdAt);
        return cursor;
      },
      limit: (count) => {
        selected = selected.slice(0, count);
        return cursor;
      },
      toArray: async () => selected,
    };
    return cursor;
  },
  updateOne: async (filter, update, options) => {
    assert.deepEqual(options, { upsert: true });
    assert.match(filter._id, /^[a-f0-9]{64}$/);
    assert.ok(filter.userId);
    if (!rows.some((row) => matches(row, filter))) rows.push({ ...filter, ...update.$setOnInsert });
    return { acknowledged: true };
  },
};
const mocks = {
  "@/lib/mongoose": {
    __esModule: true,
    default: async () => ({
      connection: {
        db: {
          collection: (name) => {
            assert.equal(name, "assistant_personal_memory");
            return collection;
          },
        },
      },
    }),
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

const { personalMemory } = load(
  path.join(root, "lib/assistant-personal-memory.ts"),
);
const alice = { userId: "000000000000000000000160", role: "ASSISTANT" };
const bob = { userId: "000000000000000000000161", role: "MANAGER" };
await test("latest user question grounds a note; exact duplicate is inserted once", async () => {
  const content = "Le client préfère les visites le matin.";
  const result = await personalMemory(
    alice,
    "remember_note",
    content,
    `Mémorise : ${content}`,
    undefined,
    "fr",
  );
  assert.equal(result.records[0].label, content);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, alice.userId);
  assert.ok(rows[0].createdAt instanceof Date);
  await personalMemory(
    alice,
    "remember_note",
    content,
    content,
    undefined,
    "fr",
  );
  assert.equal(rows.length, 1);
});
await test("last visible response can ground a note with normalized whitespace", async () => {
  const content = "Visite Nadia vendredi 14h30";
  const result = await personalMemory(
    alice,
    "remember_note",
    content,
    "Mémorise cette réponse",
    "VISITE Nadia  vendredi\n14h30",
    "fr",
  );
  assert.equal(result.records[0].label, content);
  assert.equal(rows.length, 2);
});
await test("invented model content, empty notes and oversized notes are rejected", async () => {
  for (const content of ["Le vendeur accepte 1 DA", "", "x".repeat(3001)]) {
    const result = await personalMemory(
      alice,
      "remember_note",
      content,
      "Mémorise son budget",
      "Budget 10 millions",
      "fr",
    );
    assert.equal(result.records, undefined);
    assert.match(result.answer, /exactement/);
  }
  assert.equal(rows.length, 2);
});
await test("owner isolation persists across conversations and same-user role changes", async () => {
  const unseen = await personalMemory(
    bob,
    "recall_notes",
    undefined,
    "Mes notes",
    undefined,
    "fr",
  );
  assert.deepEqual(unseen.records, []);
  await personalMemory(
    bob,
    "remember_note",
    "Mon rendez-vous privé",
    "Mon rendez-vous privé",
    undefined,
    "fr",
  );
  const restored = await personalMemory(
    { ...alice, role: "MANAGER" },
    "recall_notes",
    null,
    "Nouvelle conversation : rappelle mes notes",
    undefined,
    "fr",
  );
  assert.equal(restored.records.length, 2);
  assert.ok(
    restored.records.every((row) => row.label !== "Mon rendez-vous privé"),
  );
  const own = await personalMemory(
    bob,
    "recall_notes",
    null,
    "Mes notes",
    undefined,
    "en",
  );
  assert.deepEqual(own.records, [{ label: "Mon rendez-vous privé" }]);
});
