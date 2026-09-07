import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(join(process.cwd(), 'founder-access.js'), 'utf8');
const founderNames = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];

function createContext(state) {
  const values = new Map();
  if (state) values.set('tgm-alarm-center-web-v2', JSON.stringify(state));
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const context = {
    localStorage: storage,
    btoa(value) { return Buffer.from(value, 'binary').toString('base64'); },
    encodeURIComponent,
    unescape,
    setInterval() { return { unref() {} }; },
  };
  vm.runInNewContext(source, context, { filename: 'founder-access.js' });
  return storage;
}

function stateFor(name, tier = 'free') {
  return {
    schemaVersion: 2,
    tier,
    activeAccountId: 'founder-account',
    accounts: [{ id: 'founder-account', name }],
    alarms: [],
  };
}

test('all authorized founder accounts receive persistent Godfather entitlement', () => {
  for (const name of founderNames) {
    const storage = createContext(stateFor(name));
    const state = JSON.parse(storage.getItem('tgm-alarm-center-web-v2'));
    assert.equal(state.tier, 'godfather', `${name} must resolve to Godfather`);
  }
});

test('non-founder accounts retain their original tier after founder switching', () => {
  const storage = createContext(stateFor('TGMack', 'streetBoss'));
  assert.equal(JSON.parse(storage.getItem('tgm-alarm-center-web-v2')).tier, 'godfather');

  storage.setItem('tgm-alarm-center-web-v2', JSON.stringify(stateFor('RegularPlayer', 'streetBoss')));
  const state = JSON.parse(storage.getItem('tgm-alarm-center-web-v2'));
  assert.equal(state.tier, 'streetBoss');
});
