// Isolated server-action regression tests; no database or notifications are contacted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';
import { Types } from 'mongoose';
const id = '507f1f77bcf86cd799439011';
let role, entity, pending, created, updated, filter, notices, paths;
const request = () => ({ entityType: 'LISTING', entityId: id, status: 'PENDING', reason: 'Bien indisponible', requestedBy: id, save: async () => {} });
function reset() {
  role = 'AGENT'; entity = { archived: false }; pending = null;
  created = updated = filter = null; notices = []; paths = [];
}
const mocks = {
  '@/models': {
    Listing: { findById: () => ({ select: async () => entity }), findByIdAndUpdate: async (_, update) => { updated = update; return entity; } },
    Client: {},
    ArchiveRequest: {
      findOne: async () => pending,
      create: async (value) => { created = value; },
      findById: async () => pending,
      findByIdAndUpdate: async () => {},
      findOneAndUpdate: async (value) => { filter = value; return pending; },
    },
  },
  '../getUserBySessionEmail': { getUserBySessionEmail: async () => role ? { data: { role, _id: id } } : null },
  '../handlers/error': { default: (error) => ({ success: false, error }) },
  '../handlers/action': { default: async ({ params, schema }) => { const result = schema.safeParse(params); return result.success ? { params: result.data } : new Error('Invalid input'); } },
  '../validators/client': {
    archiveRequestSchema: z.object({ entityType: z.enum(['CLIENT', 'LISTING']), entityId: z.string(), reason: z.string().trim().min(5) }),
    archiveReviewSchema: z.object({ requestId: z.string(), managerNote: z.string().optional() }),
  },
  mongoose: { Types },
  '../mongoose': { default: async () => {} },
  'next/cache': { revalidatePath: (path) => paths.push(path) },
  '@/constants/routes': { default: new Proxy({}, { get: (_, key) => key.includes('DETAIL') ? (value) => `${key}/${value}` : key }) },
  '../notifications/notify': { notify: async (value) => notices.push(value), notifyManagers: async (value) => notices.push(value) },
};
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync('lib/actions/archiveRequest.action.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
vm.runInNewContext(source, { exports: exportsObject, require: (name) => { assert.ok(mocks[name], name); return mocks[name]; }, Error, Date });
const actions = exportsObject;
(async () => {
  reset();
  assert.equal((await actions.requestArchive({ entityType: 'LISTING', entityId: id, reason: '  Bien indisponible  ' })).success, true);
  assert.equal(created.status, 'PENDING'); assert.equal(created.reason, 'Bien indisponible'); assert.equal(updated, null);
  assert.equal(notices[0].type, 'ARCHIVE_REQUESTED');
  reset();
  assert.equal((await actions.requestArchive({ entityType: 'LISTING', entityId: id, reason: '     ' })).success, false);
  assert.equal(created, null);
  reset(); pending = request();
  assert.equal((await actions.requestArchive({ entityType: 'LISTING', entityId: id, reason: 'Duplicate' })).status, 409);
  reset(); entity = null;
  assert.equal((await actions.requestArchive({ entityType: 'LISTING', entityId: id, reason: 'Missing' })).status, 404);
  reset(); entity.archived = true;
  assert.equal((await actions.requestArchive({ entityType: 'LISTING', entityId: id, reason: 'Archived' })).status, 409);
  reset(); pending = request();
  assert.equal((await actions.approveArchiveRequest({ requestId: id })).status, 403); assert.equal(updated, null);
  role = 'MANAGER';
  assert.equal((await actions.approveArchiveRequest({ requestId: id })).success, true);
  assert.equal(updated.archived, true); assert.equal(updated.isPublished, false); assert.equal(updated.archiveReason, pending.reason);
  assert.equal(notices[0].type, 'ARCHIVE_APPROVED');
  reset(); role = 'MANAGER'; pending = request();
  assert.equal((await actions.rejectArchiveRequest({ requestId: id, managerNote: 'Toujours disponible' })).success, true);
  assert.equal(pending.status, 'REJECTED'); assert.equal(updated, null); assert.ok(paths.includes('LISTINGS_DASHBOARD'));
  reset(); pending = request();
  assert.equal((await actions.cancelListingArchiveRequest(id)).success, true);
  assert.equal(filter.entityType, 'LISTING'); assert.equal(filter.requestedBy, id); assert.equal(filter.status, 'PENDING');
  role = 'MANAGER'; await actions.cancelListingArchiveRequest(id); assert.equal(filter.requestedBy, undefined);
  reset(); role = null;
  assert.equal((await actions.cancelListingArchiveRequest(id)).status, 401);
  console.log('Listing archive regression checks passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
