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
let calls = [];
const mocks = {
  "@/lib/assistant-model": {
    askModel: async (system, input) => {
      calls.push({ system, input });
      return JSON.stringify({
        message: "Maman, tu peux venir me chercher, s’il te plaît ?",
        phone: "9999999999",
      });
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

const { draftDirectMessage: draft } = load(
  path.join(root, "lib/assistant-direct-message.ts"),
);
const scope = { userId: "000000000000000000000160", role: "ASSISTANT" };
await test("personal Arabizi request passes user language and exact normalized destination", async () => {
  calls = [];
  const question = "gol mama tji tedini au 0541446689, écris en français";
  const result = await draft(scope, question, "darija");
  assert.equal(result.visitMessage.phone, "213541446689");
  assert.equal(
    result.visitMessage.message,
    "Maman, tu peux venir me chercher, s’il te plaît ?",
  );
  assert.deepEqual(calls[0].input, {
    question,
    language: "darija",
    phone: "213541446689",
  });
  assert.match(
    calls[0].system,
    /explicitly request another recipient language/,
  );
  assert.match(calls[0].system, /personal messages/);
  assert.equal(result.clientContextId, undefined);
});
await test("missing, ambiguous or invalid phone asks clarification without model", async () => {
  calls = [];
  for (const question of [
    "Écris à maman",
    "Écris au 0541446689 ou +1 202 555 0160",
    "Écris au 0541",
  ]) {
    const result = await draft(scope, question, "fr");
    assert.equal(result.visitMessage, undefined);
    assert.match(result.answer, /un seul numéro/);
  }
  assert.equal(calls.length, 0);
});
await test("unknown role denied; international supplied destination retained", async () => {
  calls = [];
  const blocked = await draft(
    { ...scope, role: "UNKNOWN" },
    "Bonjour au +1 202 555 0160",
    "en",
  );
  assert.equal(blocked.visitMessage, undefined);
  assert.equal(calls.length, 0);
  const valid = await draft(scope, "Say hello to +1 202 555 0160", "en");
  assert.equal(valid.visitMessage.phone, "12025550160");
  assert.equal(calls.length, 1);
});
