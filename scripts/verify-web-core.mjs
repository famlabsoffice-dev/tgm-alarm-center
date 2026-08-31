import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const manifest = readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const guards = readFileSync(new URL('../runtime-guards.js', import.meta.url), 'utf8');
const script = html.match(/<script>\s*'use strict';([\s\S]*?)<\/script>/)?.[1];
assert(script, 'Main application script is missing.');
new Function(script);
new Function(guards);

const required = [
  'schemaVersion:SCHEMA_VERSION',
  "tgm-alarm-center-backup",
  'function validateBackup',
  'function rescheduleWeb',
  'function occurrenceFor',
  "repeat==='gw5d'",
  "repeat==='daily'",
  'completedOccurrences',
  'SCHEDULE_HORIZON_DAYS=30',
  'MAX_WEB_SCHEDULED=64',
  'requestBrowserPermission',
  'runLocalTest',
  'openPlans',
  'openBackup'
];
for (const needle of required) assert(html.includes(needle), `Missing required product behavior: ${needle}`);
assert(/"orientation"\s*:\s*"landscape"/.test(manifest), 'Landscape orientation is not configured.');
assert(sw.includes('runtime-guards.js'), 'Offline shell does not install the production guard.');
assert(guards.includes('Store-Aktivierung ist noch nicht verifiziert.'), 'Unverified premium unlock guard is missing.');
assert(guards.includes('Browser-Test ausgelöst.'), 'Browser-only test guard is missing.');
assert(!/lorem ipsum/i.test(html), 'Placeholder text detected.');
assert(!/\bTODO\b/i.test(html), 'TODO marker detected.');

const tierPairs = [
  ['street', 4.99, 39.99, 79.99, 33],
  ['caporegime', 7.99, 69.99, 129.99, 27],
  ['godfather', 12.99, 99.99, 199.99, 36]
];
for (const [id, month, year, lifetime, saving] of tierPairs) {
  const marker = `${id}:{id:'${id}'`;
  assert(html.includes(marker), `Tier ${id} missing.`);
  assert(html.includes(`month:${month}`), `Tier ${id} monthly price missing.`);
  assert(html.includes(`year:${year}`), `Tier ${id} yearly price missing.`);
  assert(html.includes(`lifetime:${lifetime}`), `Tier ${id} lifetime price missing.`);
  assert(html.includes(`saving:${saving}`), `Tier ${id} saving rate missing.`);
}

console.log('TGM ALARM CENTER web core validation: PASS');
