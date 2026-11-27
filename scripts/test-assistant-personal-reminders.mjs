import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const uri = process.env.ASSISTANT_TEST_MONGODB_URI;
if (!uri) throw new Error('ASSISTANT_TEST_MONGODB_URI is required for the isolated local reminder integration test.');
const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 3000 });
const db = client.db('Pyramide-Immobilier');
const owners = [new ObjectId(), new ObjectId()];
const scope = { userId: String(owners[0]), role: 'ASSISTANT' };
try {
  globalThis.__reminderTestDb = db;
  let source = await readFile(new URL('../lib/assistant-personal-reminders.ts', import.meta.url), 'utf8');
  source = source.replace('from "mongoose"', `from ${JSON.stringify(pathToFileURL(require.resolve('mongoose')).href)}`)
    .replace('from "zod"', `from ${JSON.stringify(pathToFileURL(require.resolve('zod')).href)}`)
    .replace('import dbConnect from "@/lib/mongoose";', 'const dbConnect = async () => ({connection:{db:globalThis.__reminderTestDb}});')
    .replace(/import \{ canUseAssistant[^\n]+\n/, 'const canUseAssistant = role => ["ADMIN", "MANAGER", "AGENT", "ASSISTANT", "VIEWER"].includes(role);\n');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  const { createPersonalReminder, deliverDuePersonalReminders } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  const start = new Date('2026-11-27T10:00:00Z');
  const due = '2026-11-27T12:00:00+01:00';
  let id;
  await test('validates owner and future time without creating invalid reminders', async () => {
    for (const input of [{ text: 'QA test', dueAt: 'tomorrow' }, { text: 'QA test', dueAt: '2026-11-27T12:00:00+24:00' }, { text: '', dueAt: due }, { text: 'QA test', dueAt: '2026-11-27T09:00:00Z' }]) {
      const result = await createPersonalReminder(scope, input, 'fr', start);
      assert.equal(result.personalReminderId, undefined);
    }
    assert.equal((await createPersonalReminder({ ...scope, userId: 'foreign' }, { text: 'QA test', dueAt: due }, 'fr', start)).personalReminderId, undefined);
    assert.equal(await db.collection('assistant_personal_reminders').countDocuments({ owner: scope.userId }), 0);
  });
  await test('concurrent exact retries create one private reminder and confirm Algiers time', async () => {
    const results = await Promise.all(Array.from({ length: 4 }, () => createPersonalReminder(scope, { text: 'QA rappeler un appel personnel', dueAt: due }, 'fr', start)));
    id = results[0].personalReminderId;
    assert.ok(id);
    assert.equal(new Set(results.map(result => result.personalReminderId)).size, 1);
    assert.match(results[0].answer, /27\/11\/2026.*12:00/);
    assert.match(results[0].answer, /site est ouvert/);
    assert.equal(await db.collection('assistant_personal_reminders').countDocuments({ owner: scope.userId }), 1);
    assert.equal(await deliverDuePersonalReminders(scope.userId, new Date('2026-11-27T10:59:59Z')), 0);
    assert.equal(await db.collection('notifications').countDocuments({ recipient: owners[0] }), 0);
  });
  await test('due notifications are private, once-only under concurrent polls and crash recovery', async () => {
    await createPersonalReminder({ ...scope, userId: String(owners[1]) }, { text: 'QA other owner', dueAt: due }, 'en', start);
    const delivered = await Promise.all(Array.from({ length: 5 }, () => deliverDuePersonalReminders(scope.userId, new Date('2026-11-27T11:01:00Z'))));
    assert.equal(delivered.reduce((a, b) => a + b, 0), 1);
    assert.equal(await db.collection('notifications').countDocuments({ recipient: owners[0] }), 1);
    assert.equal(await db.collection('notifications').countDocuments({ recipient: owners[1] }), 0);
    const notification = await db.collection('notifications').findOne({ recipient: owners[0] });
    assert.equal(notification.type, 'PERSONAL_REMINDER');
    assert.equal(notification.read, false);
    assert.match(notification.body, /QA rappeler un appel personnel/);
    const reminder = await db.collection('assistant_personal_reminders').findOne({ owner: scope.userId });
    assert.ok(reminder.deliveredAt);
    await db.collection('assistant_personal_reminders').updateOne({ _id: new ObjectId(id), owner: scope.userId }, { $unset: { deliveredAt: 1 } });
    assert.equal(await deliverDuePersonalReminders(scope.userId, new Date('2026-11-27T11:02:00Z')), 0);
    assert.equal(await db.collection('notifications').countDocuments({ recipient: owners[0] }), 1);
    assert.ok((await db.collection('assistant_personal_reminders').findOne({ owner: scope.userId })).deliveredAt);
  });
} finally {
  await db.collection('assistant_personal_reminders').deleteMany({ owner: { $in: owners.map(String) } });
  await db.collection('notifications').deleteMany({ recipient: { $in: owners } });
  delete globalThis.__reminderTestDb;
  await client.close();
}
