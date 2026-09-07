import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const write = (file, content) => writeFileSync(resolve(root, file), content, 'utf8');
const fail = (message) => { throw new Error(`Browser repair failed: ${message}`); };
const replaceOnce = (source, pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) fail(`replacement anchor not found: ${label}`);
  return next;
};

const founderRuntimePatch = `\n  // Founder access is a runtime entitlement, not a display-only/localStorage side effect.\n  const FOUNDER_ACCOUNT_NAMES = new Set(['tgmack', 'tgmkellz', 'tgmj9', 'tgmvany', 'tgmred']);\n  const isFounderAccount = (account) => FOUNDER_ACCOUNT_NAMES.has(String(account?.name ?? '').trim().toLowerCase());\n  const hasFounderAccess = () => {\n    const account = state?.accounts?.find((item) => item.id === state.activeAccountId) || null;\n    return isFounderAccount(account);\n  };\n\n`;

let app = read('app.js');
if (!app.includes('const FOUNDER_ACCOUNT_NAMES')) {
  app = replaceOnce(
    app,
    "  const BILLING_LABELS = { weekly: '1 Woche', monthly: '1 Monat', sixMonth: '6 Monate', yearly: '1 Jahr', lifetime: 'Lifetime' };\n",
    "  const BILLING_LABELS = { weekly: '1 Woche', monthly: '1 Monat', sixMonth: '6 Monate', yearly: '1 Jahr', lifetime: 'Lifetime' };\n" + founderRuntimePatch,
    'founder runtime helpers',
  );
}
app = replaceOnce(
  app,
  "  const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';",
  "  const effectiveTierKey = () => hasFounderAccess() ? 'godfather' : (freeTrialActive() ? FREE_TRIAL_TIER : 'free');",
  'effective tier founder gate',
);
app = replaceOnce(
  app,
  "  function persist() {\n    state.updatedAt = iso(now());",
  "  function persist() {\n    if (hasFounderAccess()) state.tier = 'godfather';\n    state.updatedAt = iso(now());",
  'founder persistence gate',
);
app = replaceOnce(
  app,
  "  state = loadState();\n  ticker = window.setInterval(() => { fireDueMoments(); refreshLiveCountdowns(); }, 1000);",
  "  state = loadState();\n  if (hasFounderAccess()) state.tier = 'godfather';\n  ticker = window.setInterval(() => { fireDueMoments(); refreshLiveCountdowns(); }, 1000);",
  'initial founder entitlement sync',
);
write('app.js', app);

const greenOverride = `\n/* GREEN REFERENCE SYSTEM — primary visual accent mandated by the supplied screens. */\n:root {\n  --tgm-gold: #48D383;\n  --tgm-gold-bright: #6BE6A0;\n  --tgm-green: #48D383;\n  --tgm-green-deep: #176C49;\n  --gold: #48D383;\n  --mint: #48D383;\n  --blue: #78AFA0;\n}\nbody {\n  background:\n    radial-gradient(circle at 50% -20%, rgba(72,211,131,.10), transparent 34%),\n    #050708;\n}\n.btn.primary {\n  color: #06150D !important;\n  background: linear-gradient(180deg, #6BE6A0, #2EAC68) !important;\n  border-color: #48D383 !important;\n  box-shadow: 0 7px 22px rgba(72,211,131,.20) !important;\n}\n.btn.ghost, .nav button.active, .mobile-bottom-nav button.active,\n.plan .plan-price, .plan-price-row.featured strong, .alarm-time .time-left,\n.timeline-item .when, .next-panel .next-at, .hero-next strong, .note strong, .plan-badge {\n  color: #48D383 !important;\n}\n.nav button.active { border-bottom-color: #48D383 !important; }\n.account-row.selected, .plan.current, .main > section:not(.reference-dashboard) .account-row.selected,\n.main > section:not(.reference-dashboard) .plan.current {\n  border-color: #48D383 !important;\n  box-shadow: 0 0 0 1px rgba(72,211,131,.18) inset !important;\n}\n.reference-heading h1, .reference-heading strong,\n.reference-brand div, .reference-brand b,\n.reference-cycle-copy h3, .reference-editor-heading h2, .reference-back,\n.reference-warning-row b, .reference-upcoming-copy strong, .reference-field-icon {\n  color: #48D383 !important;\n}\n.reference-system-copy strong, .reference-system-state, .reference-ring small,\n.reference-info-row strong, .reference-cycle-copy p.ok,\n.reference-cycle-day.active strong, .reference-cycle-day.active small,\n.reference-upcoming-right strong, .reference-row-bell {\n  color: #48D383 !important;\n}\n.reference-brand img { filter: drop-shadow(0 0 26px rgba(72,211,131,.24)) !important; }\n.reference-ring {\n  border-color: #2BC57A !important;\n  border-left-color: #176C49 !important;\n  box-shadow: inset 0 0 0 2px rgba(72,211,131,.16), 0 0 24px rgba(72,211,131,.12) !important;\n}\n.reference-cycle-day.active::before {\n  border-color: #48D383 !important;\n  box-shadow: 0 0 18px rgba(72,211,131,.24), inset 0 0 16px rgba(72,211,131,.08) !important;\n}\n.reference-row-bell { border-color: #319C62 !important; background: #0D2419 !important; }\n.reference-save {\n  color: #06150D !important;\n  border-color: #6BE6A0 !important;\n  background: linear-gradient(180deg, #6BE6A0, #2EAC68) !important;\n  box-shadow: 0 5px 24px rgba(72,211,131,.24), inset 0 1px 0 rgba(255,255,255,.55) !important;\n}\n.reference-radio, .reference-radio.checked { border-color: #2BC57A !important; }\n.reference-radio.checked i { background: #48D383 !important; }\n.reference-editor-section h3, .reference-select-chevron { color: #48D383 !important; }\n.status.active { border-color: #A8212E !important; }\n.alarm-card.active-card { border-left-color: #A8212E !important; }\n`;

for (const file of ['styles.css', 'reference-theme.css', 'reference-theme-global.css']) {
  const source = read(file);
  if (!source.includes('GREEN REFERENCE SYSTEM')) write(file, source + greenOverride);
}

let index = read('index.html');
index = index.replace('styles.css?v=8', 'styles.css?v=9');
index = index.replace('app.js?v=24', 'app.js?v=25');
index = index.replace('founder-access.js?v=2', 'founder-access.js?v=3');
index = index.replace('reference-theme.css?v=2', 'reference-theme.css?v=3');
index = index.replace('reference-theme-global.css?v=1', 'reference-theme-global.css?v=2');
index = index.replace('sw-v28.js', 'sw-v29.js');
write('index.html', index);

const sw29 = `const CACHE = 'tgm-alarm-center-v29';\nconst INDEX = './index.html';\nconst ASSETS = [\n  './', './index.html', './styles.css?v=9', './app.js?v=25', './account-delete.js?v=1', './ui-cleanup.js?v=3', './founder-access.js?v=3', './reference-theme.css?v=3', './reference-theme-global.css?v=2', './manifest.webmanifest', './icon.png', './assets/notifications/alarm-pulse.wav', './assets/notifications/alarm-siren.wav', './assets/notifications/alarm-chime.wav',\n];\nself.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });\nself.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });\nself.addEventListener('fetch', (event) => {\n  if (event.request.method !== 'GET') return;\n  const requestUrl = new URL(event.request.url);\n  if (requestUrl.origin !== self.location.origin) return;\n  if (event.request.mode === 'navigate') {\n    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(INDEX, copy)); return response; }).catch(() => caches.match(INDEX)));\n    return;\n  }\n  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; })));\n});\n`;
write('sw-v29.js', sw29);

let test = read('tests/founder-access.test.mjs');
const testMarker = "test('browser runtime founder contract stays active for all authorized names', () => {";
if (!test.includes(testMarker)) {
  test += `\n\ntest('browser runtime founder contract stays active for all authorized names', () => {\n  const appSource = readFileSync(join(process.cwd(), 'app.js'), 'utf8');\n  assert.match(appSource, /FOUNDER_ACCOUNT_NAMES/);\n  assert.match(appSource, /tgmack/);\n  assert.match(appSource, /tgmkellz/);\n  assert.match(appSource, /tgmj9/);\n  assert.match(appSource, /tgmvany/);\n  assert.match(appSource, /tgmred/);\n  assert.match(appSource, /hasFounderAccess\\(\\) \\? 'godfather'/);\n});\n\ntest('reference surface keeps green as the primary accent', () => {\n  const css = readFileSync(join(process.cwd(), 'reference-theme-global.css'), 'utf8');\n  assert.match(css, /GREEN REFERENCE SYSTEM/);\n  assert.match(css, /--tgm-gold: #48D383/);\n  assert.match(css, /reference-save/);\n  assert.match(css, /#48D383/);\n});\n`;
  write('tests/founder-access.test.mjs', test);
}

for (const file of ['app.js', 'styles.css', 'reference-theme.css', 'reference-theme-global.css', 'index.html', 'sw-v29.js', 'tests/founder-access.test.mjs']) {
  if (!existsSync(resolve(root, file))) fail(`expected repaired file missing: ${file}`);
}

console.log('Browser repair PASS: green reference system + runtime founder entitlement + cache-busting service worker v29');
