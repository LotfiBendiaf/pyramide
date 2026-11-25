import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { MongoClient } from 'mongodb';
import ts from 'typescript';

// Integration test of the actual storage code against an explicitly selected local test database.
const uri = process.env.ASSISTANT_TEST_MONGODB_URI;
if (!uri) throw new Error('ASSISTANT_TEST_MONGODB_URI is required; select a local test database explicitly.');
const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 3000 });
const db = client.db('Pyramide-Immobilier');
const prefix = 'qa-single-conversation:' + randomUUID();
const owners = [prefix + ':agent', prefix + ':assistant'];
try {
  let source = await readFile(new URL('../lib/assistant-history.ts', import.meta.url), 'utf8');
  source = source.replace('import dbConnect from "@/lib/mongoose";', 'const dbConnect = async () => ({connection:{db:globalThis.__assistantHistoryTestDb}});');
  globalThis.__assistantHistoryTestDb = db;
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  const history = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  await test('one persistent conversation ignores new client-generated IDs and isolates owners', async () => {
    const ids = await Promise.all(Array.from({ length: 6 }, () => history.continuousConversationId(owners[0])));
    assert.equal(new Set(ids).size, 1);
    const first = await history.readConversations(owners[0]);
    assert.equal(first.length, 1);
    assert.equal(first[0].id, ids[0]);
    await history.saveAssistantMessage(owners[0], randomUUID(), { question: 'Synthetic A', answer: 'A', clientContextId: '000000000000000000000001' });
    await history.saveAssistantMessage(owners[0], randomUUID(), { question: 'Synthetic B', answer: 'B', visitContext: { clientId: '000000000000000000000001', visitId: '000000000000000000000002' } });
    const stored = await history.readConversations(owners[0]);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].id, ids[0]);
    assert.equal(stored[0].messages.length, 2);
    const context = await history.recentConversation(owners[0], randomUUID());
    assert.equal(context.visit.visitId, '000000000000000000000002');
    const other = await history.recentConversation(owners[1], ids[0]);
    assert.equal(other.questions.length, 0);
    assert.equal(other.clientId, undefined);
    assert.equal(await db.collection('assistant_message_archive').countDocuments({ owner: owners[0] }), 2);
    await history.saveAssistantMessage(owners[0], randomUUID(), { question: 'Synthetic different client', answer: 'C', clientContextId: '000000000000000000000003' });
    const changed = await history.recentConversation(owners[0], ids[0]);
    assert.equal(changed.visit, undefined);
  });
} finally {
  // Only the disposable owners minted by this test are removed.
  await db.collection('assistant_sessions').deleteMany({ _id: { $in: owners } });
  await db.collection('assistant_conversations').deleteMany({ owner: { $in: owners } });
  await db.collection('assistant_message_archive').deleteMany({ owner: { $in: owners } });
  delete globalThis.__assistantHistoryTestDb;
  await client.close();
}
