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

assert(/href="styles\.css\?v=\d+"/.test(html), 'CSS stylesheet is not linked.');
assert(/href="styles-accessibility\.css\?v=\d+"/.test(html), 'Accessibility stylesheet is not linked.');
assert(/href="reference-theme\.css\?v=\d+"/.test(html), 'Reference theme stylesheet is not linked.');
assert(/href="reference-theme-global\.css\?v=\d+"/.test(html), 'Global reference theme stylesheet is not linked.');
assert(/href="reference-theme-final\.css\?v=\d+"/.test(html), 'Final reference theme stylesheet is not linked.');
assert(html.includes('<a class="skip-link" href="#app">'), 'Skip navigation link is missing.');
assert(html.includes('<div id="app" role="main" tabindex="-1"'), 'Main application landmark is missing.');
assert(/founder-access\.js\?v=\d+/.test(html), 'Founder access bootstrap is not linked.');
assert(/founder-runtime\.js\?v=\d+/.test(html), 'Founder runtime bootstrap is not linked.');
assert(/<script src="(?:app\.js|founder-runtime\.js)(?:\?[^\"]+)?" defer><\/script>/.test(html), 'Application runtime is not linked.');
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
assert(existsSync(new URL('sw.js', root)), 'Legacy service worker file is missing.');
assert(existsSync(new URL('sw-v30.js', root)), 'Current service worker file is missing.');
assert(existsSync(new URL('founder-runtime.js', root)), 'Founder runtime file is missing.');
assert(existsSync(new URL('reference-theme-final.css', root)), 'Final reference theme file is missing.');
assert(statSync(new URL('reference-theme-final.css', root)).size > 0, 'Final reference theme file is empty.');
assert(typeof manifest.name === 'string' && manifest.name.length > 0, 'Web manifest name is missing.');
assert(typeof manifest.start_url === 'string' && manifest.start_url.length > 0, 'Web manifest start URL is missing.');

console.log('Web core verification: PASS');
