import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
let calls = 0;
const model = { aggregate: () => { calls++; return { option: async () => [{ _id: null, value: 12, records: 2 }] }; } };
globalThis.__analyticsMocks = { model, user: { find: () => ({ select: () => ({ lean: async () => [] }) }) } };
let source = await readFile(new URL('../lib/assistant-analytics.ts', import.meta.url), 'utf8');
source = source.replace('from "mongoose"', `from ${JSON.stringify(pathToFileURL(require.resolve('mongoose')).href)}`)
  .replace('from "zod"', `from ${JSON.stringify(pathToFileURL(require.resolve('zod')).href)}`)
  .replace(/import \{ agencyListingsVisibility[^\n]+\n/, 'const agencyListingsVisibility = {}; const isAgencyScope = access => access.role === "ADMIN"; const canReadAssistantSource = () => true;\n')
  .replace(/import \{ Client[^\n]+\n/, 'const { model, user: User } = globalThis.__analyticsMocks; const Client=model, FollowUp=model, Listing=model, Negotiation=model, Task=model, Visit=model;\n');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { analyticsSchema, runAnalytics } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const scope = { userId: '000000000000000000000001', role: 'ADMIN' };
await test('rejects unsupported transaction filters and metrics at planning validation', () => {
  const base = { source: 'negotiations', operation: 'count', group: 'agent', filters: [{ field: 'listing.status', op: 'eq', value: 'Vendu' }] };
  assert.equal(analyticsSchema.safeParse([base]).success, false);
  assert.equal(analyticsSchema.safeParse([{ ...base, filters: [], operation: 'sum', field: 'price' }]).success, false);
  assert.equal(analyticsSchema.safeParse([{ ...base, filters: [], dateField: 'madeUpDate' }]).success, false);
  assert.equal(analyticsSchema.safeParse([{ ...base, filters: [], group: 'listing.status' }]).success, false);
  assert.equal(analyticsSchema.safeParse([{ ...base, filters: [{ field: 'status', op: 'eq', value: 'DEAL_DONE' }], dateField: 'closedAt' }]).success, true);
});
await test('runtime invalid query never aggregates, exposes technical filters or claims available results', async () => {
  calls = 0;
  const invalid = { source: 'negotiations', operation: 'count', group: 'agent', filters: [{ field: 'listing.status', op: 'eq', value: 'Vendu' }], period: 'month', order: 'desc' };
  const result = await runAnalytics([invalid, invalid], () => undefined, scope);
  assert.equal(calls, 0);
  assert.equal(result.available, false);
  assert.doesNotMatch(result.summary, /negotiations|\(filter\)/);
  assert.equal(result.summary.split('\n\n').length, 1);
  const english = await runAnalytics([invalid], () => undefined, scope, 'en');
  assert.match(english.summary, /No figures have been confirmed/);
});
await test('valid aggregates remain available, partial failure stays unavailable', async () => {
  const [valid] = analyticsSchema.parse([{ source: 'negotiations', operation: 'sum', field: 'commission', filters: [{ field: 'status', op: 'eq', value: 'DEAL_DONE' }] }]);
  const result = await runAnalytics([valid], () => undefined, scope);
  assert.equal(result.available, true);
  assert.match(result.summary, /12 DZD/);
  const partial = await runAnalytics([valid, { ...valid, field: 'madeUp' }], () => undefined, scope);
  assert.equal(partial.available, false);
});
delete globalThis.__analyticsMocks;
