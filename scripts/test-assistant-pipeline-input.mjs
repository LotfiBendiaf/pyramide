import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const root = fileURLToPath(new URL('..', import.meta.url));
const req = createRequire(path.join(root, 'package.json'));
const ts = req('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/assistant-pipeline.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('require', 'module', 'exports', source)((id) => id.startsWith('@/') || id === 'next/cache' ? {} : req(id), mod, mod.exports);
const { pipelineInput, parsePipelineDetails } = mod.exports;
const id = '6b0a045aef09c20a12c30c08';
test('ignores malformed or invented negotiation IDs and retains real action details', () => {
  assert.equal(pipelineInput.parse({ negotiationId: 'V-0000004' }).negotiationId, undefined);
  for (const negotiationId of ['V-0000004', id, '', '6b0a045aef09c20a12c30c09']) {
    const details = parsePipelineDetails(JSON.stringify({ negotiationId, finalPrice: 19500000 }), 'Clôture son affaire pour V-0000004 au prix final de 19 500 000 DA.');
    assert.equal(details.negotiationId, undefined);
    assert.equal(details.finalPrice, 19500000);
  }
});
test('accepts only an exact explicit ObjectId token, including uppercase', () => {
  assert.equal(parsePipelineDetails(JSON.stringify({ negotiationId: id }), `Clôture ${id}.`).negotiationId, id);
  assert.equal(parsePipelineDetails(JSON.stringify({ negotiationId: id }), `Clôture ${id.toUpperCase()}.`).negotiationId, id);
  assert.equal(parsePipelineDetails(JSON.stringify({ negotiationId: id }), `Clôture x${id}x.`).negotiationId, undefined);
});
test('malformed extraction and invalid financial/date values remain rejected', () => {
  for (const text of ['oops', 'null', '[]', '{"finalPrice":-1}', '{"finalPrice":"19500000"}', '{"paymentDate":"tomorrow"}']) {
    assert.throws(() => parsePipelineDetails(text, 'Clôture cette affaire.'));
  }
});
