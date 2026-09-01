import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const js = read('app.js');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

assert(html.includes('href="styles.css?v=5"'), 'CSS stylesheet is not linked.');
assert(/<script src="app\.js(?:\?[^\"]+)?" defer><\/script>/.test(html), 'Application JavaScript is not linked.');
assert(html.includes('alarmOverlay'), 'Alarm overlay root is missing.');
assert(css.includes('.alarm-overlay'), 'Alarm overlay styles are missing.');
new Function(js);
new Function(sw);

for (const needle of [
  "const SOUNDS",
  'function unlockAudio',
  'function playSound',
  'function fireDueMoments',
  'function nextOccurrence',
  'function momentsFor',
  "repeat === 'gw5d'",
  'end-warning',
  'function validateBackup',
  'function exportBackup',
  'function importBackup',
  'TIER_PRICING',
  'account-menu',
  'select-tier',
  'renderPlansView',
  'BILLING_PERIODS',
  'BILLING_LABELS',
  '1 Woche',
  '6 Monate',
  'Lifetime',
  'perAccount',
  'bubbleAlarms',
  'eventAlarms',
  'Accounts',
  'Account wechseln',
  'FREE_TRIAL_DURATION_MS',
  'freeTrialStartedAt',
  'freeTrialEndsAt',
  'start-free-trial',
  '72 Stunden kostenlos testen',
  'viewFromLocation',
  'history.replaceState',
  'Bubble- und GW-Zeiten im Blick.',
  'Plane deine Bubble-Zeiten',
  'localStorage',
  'AudioContext',
  'FOUNDER_ACCOUNT_NAMES',
  'FOUNDER_ACCESS_TIER',
  'founderAccessForAccount',
  'GODFATHER LIFETIME · KOSTENFREI',
  'Dauerhaft freigeschaltet',
]) assert(js.includes(needle), `Missing local gaming behavior: ${needle}`);
for (const founderName of ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred']) {
  assert(js.includes(founderName), `Founder account is missing: ${founderName}`);
}

for (const phrase of ['Alarmweiterleitung', 'SMS', 'Sensor-Gateway', 'Leitstellenintegration', 'Rauchmelder', 'Feuerwehr']) {
  assert(!js.includes(phrase) && !html.includes(phrase), `Out-of-scope integration text found: ${phrase}`);
}
assert(!js.includes('Keine Bubble mehr verpassen.'), 'Commercial hero copy is still present.');
assert(js.includes('3 * DAY_MS') && js.includes('Testphase starten'), 'Three-day free trial is not configured correctly.');
assert(!js.includes('Kommando'), 'Visible command terminology remains in the frontend.');
for (const price of ['weekly:4.99', 'sixMonth:129.99', 'yearly:199.99', 'lifetime:299.99', 'lifetime:799.99']) {
  assert(js.includes(price), `Tier pricing value is missing: ${price}`);
}
for (const marker of ['TODO', 'FIXME', 'Lorem ipsum']) {
  assert(!new RegExp(marker, 'i').test(js + html + css), `Placeholder marker found: ${marker}`);
}

assert(sw.includes('./styles.css?v=5') && sw.includes('./app.js?v=12'), 'Offline shell does not cache the versioned application files.');
assert(sw.includes('./assets/notifications/alarm-pulse.wav'), 'Pulse sound is not cached offline.');
assert(sw.includes('./assets/notifications/alarm-siren.wav'), 'Siren sound is not cached offline.');
assert(sw.includes('./assets/notifications/alarm-chime.wav'), 'Chime sound is not cached offline.');
assert(manifest.orientation === 'any', 'Portrait and landscape orientations are not enabled.');
assert(css.includes('touch-action: pan-x') && css.includes('overflow-x: auto'), 'Navigation is not touch-scrollable.');
assert(!css.includes('.app-shell { display: none; }'), 'Portrait layout is still blocked.');

for (const asset of [
  'assets/notifications/alarm-pulse.wav',
  'assets/notifications/alarm-siren.wav',
  'assets/notifications/alarm-chime.wav',
]) {
  const path = new URL(asset, root);
  assert(existsSync(path) && statSync(path).size > 44, `Gaming sound asset is missing or empty: ${asset}`);
}

console.log('TGM ALARM CENTER local web core validation: PASS');
