// Isolated regression checks; never connects to a database.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

let clients, sequence, counterRace, insertRace;
const Client = {
  async aggregate(pipeline) {
    const pattern = new RegExp(pipeline[0].$match.referenceCode.$regex);
    return [{ codeNum: Math.max(0, ...clients
      .filter(c => pattern.test(c.referenceCode))
      .map(c => Number(c.referenceCode.split('-')[1]))) }];
  },
  async create(client) {
    if (insertRace) {
      insertRace = false;
      clients.push({ ...client });
    }
    if (clients.some(c => c.referenceCode === client.referenceCode)) {
      throw { code: 11000, keyPattern: { referenceCode: 1 } };
    }
    clients.push(client);
    return client;
  },
};
const ReferenceCounter = {
  findOneAndUpdate(filter, pipeline) {
    assert.equal(filter._id, 'client:BUY');
    return { async lean() {
      if (counterRace) {
        counterRace = false;
        throw { code: 11000, keyPattern: { _id: 1 } };
      }
      sequence = Math.max(sequence ?? 0, pipeline[0].$set.sequence.$add[0].$max[1]) + 1;
      return { sequence };
    } };
  },
};
const dependencies = {
  '@/models': { Client, ReferenceCounter },
  '../handlers/action': { default: async ({ params }) => ({ params }) },
  '../utils': { clientPrefix: () => 'BUY' },
  '../getUserBySessionEmail': { getUserBySessionEmail: async () => ({ data: { _id: 'agent', role: 'AGENT' } }) },
  '../handlers/error': { default: error => ({ success: false, error }) },
  '@/constants/values': { isElevatedRole: () => false },
};
const context = { exports: {}, require: name => dependencies[name] ?? {} };
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync('lib/actions/client.action.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText, context);
const create = () => context.exports.createClient({ type: 'BUYER', firstName: 'Test' });

(async () => {
  clients = [{ type: 'RENTER', archived: true, referenceCode: 'BUY-01591' },
    { type: 'BUYER', referenceCode: 'BUY-01590' },
    { type: 'BUYER', referenceCode: 'RENT-99999' },
    { type: 'BUYER', referenceCode: 'BUY-invalid' }];
  sequence = undefined;
  let result = await create();
  assert.equal(result.data.referenceCode, 'BUY-01592');
  assert.equal(result.data.assignedAgent, 'agent');
  sequence = 1; // stale counter
  result = await create();
  assert.equal(result.data.referenceCode, 'BUY-01593');
  const results = await Promise.all(Array.from({ length: 20 }, create));
  assert.ok(results.every(r => r.success));
  assert.equal(new Set(results.map(r => r.data.referenceCode)).size, 20);
  counterRace = true;
  assert.equal((await create()).success, true);
  insertRace = true;
  assert.equal((await create()).success, true);
  clients.push({ referenceCode: 'BUY-100000' });
  assert.equal((await create()).data.referenceCode, 'BUY-100001');
  console.log('PASS: changed types, archived codes, malformed codes, missing/stale counters, concurrent allocation, duplicate retries, numeric ordering');
})().catch(error => { console.error(error); process.exitCode = 1; });
