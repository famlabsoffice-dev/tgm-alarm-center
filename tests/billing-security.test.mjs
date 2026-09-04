import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const pricing = readFileSync(new URL('../src/domain/pricing.ts', import.meta.url), 'utf8');
const entitlements = readFileSync(new URL('../src/billing/entitlements.ts', import.meta.url), 'utf8');
const offlineCache = readFileSync(new URL('../src/billing/offlineCache.ts', import.meta.url), 'utf8');
const verificationClient = readFileSync(new URL('../src/billing/verificationClient.ts', import.meta.url), 'utf8');
const nativeApp = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

const founderNames = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];

test('paid web tiers remain server-authoritative while native founder test access is explicit', () => {
  assert.match(app, /const effectiveTierKey = \(\) => freeTrialActive\(\) \? FREE_TRIAL_TIER : 'free';/);
  assert.doesNotMatch(app, /effectiveTierKey[^\n]*state\.tier/);
  assert.match(app, /Store-Verifizierung erforderlich/);
  for (const name of founderNames) assert.doesNotMatch(app, new RegExp(name, 'g'));
  assert.match(pricing, /FOUNDER_ACCESS_TIER: Tier = 'godfather'/);
  assert.match(pricing, /FOUNDER_ACCOUNT_NAMES = \['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'\]/);
  assert.match(pricing, /return isFounderAccountName\(accountName\) \? FOUNDER_ACCESS_TIER : tier;/);
  assert.match(nativeApp, /effectiveTierForAccount\(state\.tier, activeAccount\?\.name \?\? ''\)/);
});

test('founder account matching is exact, trimmed and case-insensitive', () => {
  const directCheck = readFileSync(new URL('../scripts/check-founder.mjs', import.meta.url), 'utf8');
  assert.match(directCheck, /TGMack.*TGMkellz.*TGMj9.*TGMvany.*TGMred/s);
  assert.match(pricing, /accountName\.trim\(\)\.toLowerCase\(\)/);
});

test('hardened plans renderer is valid JavaScript and preserves template interpolation', () => {
  const start = app.indexOf('function renderPlansView() {');
  const end = app.indexOf('function renderSettingsView() {', start);
  assert.ok(start >= 0 && end > start, 'renderPlansView boundary missing');
  const section = app.slice(start, end);
  assert.match(section, /\$\{TIER_ORDER\.map/);
  assert.doesNotThrow(() => new Function(app));
});

test('paid entitlement is explicitly server sourced and active-only', () => {
  assert.match(entitlements, /source: 'server'/);
  assert.match(entitlements, /entitlement\.source !== 'server' \|\| entitlement\.status !== 'active'/);
  assert.match(verificationClient, /v1\/verify\/purchase/);
  assert.match(verificationClient, /serverseitig/);
});

test('offline entitlement cache is bounded and accepts only active server entitlements', () => {
  assert.match(offlineCache, /OFFLINE_ENTITLEMENT_MAX_AGE_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(offlineCache, /item\.source !== 'server' \|\| item\.status !== 'active'/);
  assert.match(offlineCache, /isEntitlementUsable\(cached\.entitlement, at\)/);
  assert.match(offlineCache, /Nur aktive serverseitig verifizierte Entitlements/);
});

console.log('TGM ALARM CENTER billing security gate: PASS');
