import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../lib/assistant-model.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { askModel, AssistantUnavailable, providerRetryDelay } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

await test('structured model request uses strict schema; plain reply stays plain', async t => {
  const savedFetch = globalThis.fetch;
  const savedGroq = process.env.GROQ_API_KEY;
  const savedOpenAI = process.env.OPENAI_API_KEY;
  t.after(() => { globalThis.fetch = savedFetch; if (savedGroq === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = savedGroq; if (savedOpenAI === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = savedOpenAI; });
  delete process.env.OPENAI_API_KEY;
  process.env.GROQ_API_KEY = 'dummy-test-key';
  const requests = [];
  globalThis.fetch = async (_url, options) => { requests.push(JSON.parse(options.body)); return Response.json({ choices: [{ message: { content: '{"language":"en"}' } }] }); };
  const contract = { name: 'language', schema: { type: 'object', additionalProperties: false, properties: { language: { type: 'string' } }, required: ['language'] } };
  await askModel('Test', { question: 'Synthetic' }, true, contract);
  assert.equal(requests[0].response_format.type, 'json_schema');
  assert.equal(requests[0].response_format.json_schema.strict, true);
  assert.deepEqual(requests[0].response_format.json_schema.schema, contract.schema);
  await askModel('Test', {}, false);
  assert.equal(requests[1].response_format, undefined);
});

await test('long quota delay returns a typed error without another request', async t => {
  const savedFetch = globalThis.fetch;
  const savedKey = process.env.GROQ_API_KEY;
  const savedOpenAI = process.env.OPENAI_API_KEY;
  t.after(() => { globalThis.fetch = savedFetch; if (savedKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = savedKey; if (savedOpenAI === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = savedOpenAI; });
  delete process.env.OPENAI_API_KEY;
  process.env.GROQ_API_KEY = 'dummy-test-key';
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('', { status: 429, headers: { 'retry-after': '256' } }); };
  await assert.rejects(askModel('Test', {}), error => error instanceof AssistantUnavailable && error.reason === 'quota' && error.retryAfterSeconds === 256);
  assert.equal(calls, 1);
});

await test('Retry-After parses seconds and dates without a negative delay', () => {
  assert.equal(providerRetryDelay('2.5'), 3);
  assert.equal(providerRetryDelay(null), undefined);
  assert.equal(providerRetryDelay('invalid'), undefined);
  assert.equal(providerRetryDelay('Wed, 25 Nov 2026 12:00:05 GMT', Date.parse('2026-11-25T12:00:00Z')), 5);
  assert.equal(providerRetryDelay('Wed, 25 Nov 2026 11:00:00 GMT', Date.parse('2026-11-25T12:00:00Z')), 1);
});
