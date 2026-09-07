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

test('browser runtime founder contract stays active for all authorized names', () => {
  const appSource = readFileSync(join(process.cwd(), 'app.js'), 'utf8');
  const serviceWorker = readFileSync(join(process.cwd(), 'sw-v29.js'), 'utf8');
  for (const name of founderNames.map((value) => value.toLowerCase())) assert.match(appSource + serviceWorker, new RegExp(name));
  assert.match(appSource + serviceWorker, /hasFounderAccess\(\) \? 'godfather'/);
  assert.match(appSource + serviceWorker, /state\.tier = 'godfather'/);
});

test('reference surface keeps green as the primary accent', () => {
  const css = readFileSync(join(process.cwd(), 'reference-theme-global.css'), 'utf8');
  const serviceWorker = readFileSync(join(process.cwd(), 'sw-v29.js'), 'utf8');
  assert.match(css + serviceWorker, /GREEN REFERENCE SYSTEM/);
  assert.match(css + serviceWorker, /--tgm-gold: #48D383/);
  assert.match(css + serviceWorker, /reference-save/);
  assert.match(css + serviceWorker, /#48D383/);
});
