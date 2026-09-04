import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pricing = readFileSync(new URL('../src/domain/pricing.ts', import.meta.url), 'utf8');
const backup = readFileSync(new URL('../src/backup/backup.ts', import.meta.url), 'utf8');
const founderCheck = readFileSync(new URL('./check-founder.mjs', import.meta.url), 'utf8');
const contract = readFileSync(new URL('../docs/FOUNDER_TEAM_ACCESS.md', import.meta.url), 'utf8');

const founders = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];

assert.match(pricing, /FOUNDER_ACCESS_TIER:\s*Tier\s*=\s*'godfather'/);
assert.match(pricing, /FOUNDER_ACCOUNT_NAMES\s*=\s*\['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'\]/);
assert.match(pricing, /accountName\.trim\(\)\.toLowerCase\(\)/);
assert.match(pricing, /return isFounderAccountName\(accountName\) \? FOUNDER_ACCESS_TIER : tier;/);

for (const founder of founders) assert.match(pricing, new RegExp(founder));
assert.match(founderCheck, /effectiveTierForAccount\('free', name\) !== 'godfather'/);
assert.match(founderCheck, /effectiveTierForAccount\('underboss', name\) !== 'godfather'/);
assert.match(founderCheck, /TGMack2.*TGM.*TGMredx.*TGM-red.*Founder/s);

// Backup/restore must preserve the persisted application state, while the canonical
// effective-tier calculation restores Founder access from the account identity.
assert.match(backup, /data\.accounts/);
assert.match(backup, /data\.tier/);
assert.match(backup, /return validateBackup\(parsed\)\.data;/);

assert.match(contract, /restart/i);
assert.match(contract, /backup\/restore/i);
assert.match(contract, /payment/i);
assert.match(contract, /Store\/IAP/i);
assert.match(contract, /refactoring/i);
assert.match(contract, /migrations/i);
assert.match(contract, /security hardening/i);

console.log('TGM ALARM CENTER Founder/Team access release gate: PASS');
