import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const accessibilityCss = read('styles-accessibility.css');
const js = read('app.js');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

assert(html.includes('href="styles.css?v=8"'), 'CSS stylesheet is not linked.');
assert(html.includes('href="styles-accessibility.css?v=1"'), 'Accessibility stylesheet is not linked.');
assert(html.includes('<a class="skip-link" href="#app">'), 'Skip navigation link is missing.');
assert(html.includes('<div id="app" role="main" tabindex="-1"'), 'Main application landmark is missing.');
assert(/<script src="app\.js(?:\?[^\"]+)?" defer><\/script>/.test(html), 'Application JavaScript is not linked.');
assert(html.includes('alarmOverlay'), 'Alarm overlay root is missing.');
assert(css.includes('.alarm-overlay'), 'Alarm overlay styles are missing.');
assert(accessibilityCss.includes('.skip-link') && accessibilityCss.includes('prefers-reduced-motion'), 'Accessibility hardening stylesheet is incomplete.');
assert(accessibilityCss.includes('min-height: 44px'), 'Touch-target hardening is missing.');
new Function(js);
new Function(sw);
for (const runtimeMarker of [
  "const app = document.getElementById('app');",
  "const modalRoot = document.getElementById('modalRoot');",
  "const toastRoot = document.getElementById('toast');",
  "const overlayRoot = document.getElementById('alarmOverlay');",
  'const now = () => Date.now();',
  'const iso = (ms) => new Date(ms).toISOString();',
  'const uid = () =>',
  'const esc = (value)',
  'const formatDateInput = (ms)',
  'const formatTimeInput = (ms)',
  'const countdown = (ms)',
]) assert(js.includes(runtimeMarker), `Missing web runtime scaffold: ${runtimeMarker}`);

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
]) assert(js.includes(needle), `Missing web core contract: ${needle}`);

assert(existsSync(new URL('styles.css', root)), 'Web stylesheet file is missing.');
assert(statSync(new URL('styles.css', root)).size > 0, 'Web stylesheet file is empty.');
assert(existsSync(new URL('styles-accessibility.css', root)), 'Accessibility stylesheet file is missing.');
assert(existsSync(new URL('app.js', root)), 'Web application file is missing.');
assert(existsSync(new URL('sw.js', root)), 'Service worker file is missing.');
assert(existsSync(new URL('manifest.webmanifest', root)), 'Web manifest is missing.');
assert(typeof manifest.name === 'string' && manifest.name.length > 0, 'Web manifest name is missing.');
assert(typeof manifest.start_url === 'string' && manifest.start_url.length > 0, 'Web manifest start URL is missing.');

console.log('Web core verification: PASS');
