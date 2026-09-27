// Isolated regression checks; no database or Google requests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

let account, refreshed, updates, clients;
class OAuth2 {
  constructor() { clients.push(this); }
  setCredentials(credentials) { this.credentials = credentials; }
  async refreshAccessToken() {
    await Promise.resolve();
    if (refreshed instanceof Error) throw refreshed;
    return { credentials: refreshed ?? { access_token: this.credentials.refresh_token } };
  }
}
const dependencies = {
  googleapis: { google: { auth: { OAuth2 } } },
  '@/lib/mongoose': { default: async () => {} },
  '@/models': { Account: {
    findOne: async () => account,
    updateOne: async (...args) => updates.push(args),
  } },
};
const context = { exports: {}, require: name => dependencies[name], process: { env: {} }, console: { error() {} }, Date };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/googleCalendar/tokenManager.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const api = context.exports;
function reset() {
  account = { _id: 'account', accessToken: 'old', refreshToken: 'refresh', tokenExpiresAt: new Date(Date.now() - 1000) };
  refreshed = undefined; updates = []; clients = [];
}
reset(); refreshed = {};
assert.equal(await api.getValidAccessToken('user'), null, 'Failed refresh must not reuse expired token');
assert.equal(updates.length, 0);
reset(); refreshed = new Error('invalid_grant');
assert.equal(await api.getValidAccessToken('user'), null);
reset(); delete account.refreshToken;
assert.equal(await api.getValidAccessToken('user'), null);
await assert.rejects(api.getOAuth2Client('user'), /Reconnectez Google Calendar/);
reset(); account.tokenExpiresAt = new Date(Date.now() + 3600000);
assert.equal(await api.getValidAccessToken('user'), 'old');
assert.equal(clients.length, 0);
reset(); delete account.tokenExpiresAt;
assert.equal(await api.getValidAccessToken('user'), 'refresh');
assert.equal(updates.length, 1);
reset();
const tokens = await Promise.all([api.refreshAccessToken('user-a'), api.refreshAccessToken('user-b')]);
assert.deepEqual(tokens.map(token => token.accessToken), ['user-a', 'user-b']);
assert.equal(clients.length, 2, 'Concurrent users need isolated OAuth clients');
console.log('Calendar token refresh regression checks passed');
