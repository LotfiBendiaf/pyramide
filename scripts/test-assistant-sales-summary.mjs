import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../lib/assistant-sales-summary.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { summarizeSalesHistory, historyTransactionKind } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

await test('groups recorded deals by agent, preserves rental/sale amounts and includes zero-result agents', () => {
  const result = summarizeSalesHistory([
    { agentId: 'amine', agentName: 'Amine', listingReference: 'V-0000001', finalPrice: 18500000, commissionAmount: 370000 },
    { agentId: 'manager', agentName: 'Gérant', listingReference: 'L-0000002', finalPrice: 78000, commissionAmount: 78000 },
  ], [{ id: 'amine', name: 'Amine' }, { id: 'manager', name: 'Gérant' }, { id: 'sarah', name: 'Sarah' }]);
  assert.equal(result.total.count, 2);
  assert.equal(result.total.transactionValue, 18578000);
  assert.equal(result.total.commissionValue, 448000);
  assert.equal(result.sale.count, 1);
  assert.equal(result.sale.transactionValue, 18500000);
  assert.equal(result.rent.count, 1);
  assert.equal(result.rent.transactionValue, 78000);
  assert.equal(result.agents[0].id, 'amine');
  assert.equal(result.agents.find(a => a.id === 'sarah').total.count, 0);
});

await test('historical reference wins over a later changed status; unknown types stay unknown', () => {
  assert.equal(historyTransactionKind({ listingReference: 'L-0000002', listingStatus: 'Vendu' }), 'rent');
  assert.equal(historyTransactionKind({ listingReference: 'V-0000001', listingStatus: 'Loué' }), 'sale');
  assert.equal(historyTransactionKind({ listingStatus: 'Loué' }), 'rent');
  assert.equal(historyTransactionKind({}), 'unknown');
});

await test('uses recorded commission or explicit stored percentage and reports absent values', () => {
  const result = summarizeSalesHistory([
    { agentId: 'a', agentName: 'Agent', listingStatus: 'Vendu', finalPrice: 100.15, commissionPercentage: 2 },
    { agentId: 'a', agentName: 'Agent', listingStatus: 'Vendu', finalPrice: 100, commissionAmount: 0, commissionPercentage: 2 },
    { agentId: 'a', agentName: 'Agent' },
  ]);
  assert.equal(result.total.commissionValue, 2);
  assert.equal(result.total.transactionValue, 200.15);
  assert.equal(result.total.missingPriceCount, 1);
  assert.equal(result.total.missingCommissionCount, 1);
  assert.equal(result.unknown.count, 1);
});
