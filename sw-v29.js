const CACHE = 'tgm-alarm-center-v29';
const INDEX = './index.html';
const ASSETS = [
  './', './index.html', './account-delete.js?v=1', './ui-cleanup.js?v=3', './founder-access.js?v=3', './manifest.webmanifest', './icon.png', './assets/notifications/alarm-pulse.wav', './assets/notifications/alarm-siren.wav', './assets/notifications/alarm-chime.wav',
];

const FOUNDER_PATCH = `
  // Founder access is a runtime entitlement for the authorized test accounts.
  const FOUNDER_ACCOUNT_NAMES = new Set(['tgmack', 'tgmkellz', 'tgmj9', 'tgmvany', 'tgmred']);
  const isFounderAccount = (account) => FOUNDER_ACCOUNT_NAMES.has(String(account?.name ?? '').trim().toLowerCase());
  const hasFounderAccess = () => {
    const account = state?.accounts?.find((item) => item.id === state.activeAccountId) || null;
    return isFounderAccount(account);
  };
`;

const GREEN_REFERENCE_CSS = `
/* GREEN REFERENCE SYSTEM — primary accent for the supplied reference screens. */
:root {
  --tgm-gold: #48D383;
  --tgm-gold-bright: #6BE6A0;
  --tgm-green: #48D383;
  --tgm-green-deep: #176C49;
  --gold: #48D383;
  --mint: #48D383;
  --blue: #78AFA0;
}
body {
  background: radial-gradient(circle at 50% -20%, rgba(72,211,131,.10), transparent 34%), #050708 !important;
}
.btn.primary {
  color: #06150D !important;
  background: linear-gradient(180deg, #6BE6A0, #2EAC68) !important;
  border-color: #48D383 !important;
  box-shadow: 0 7px 22px rgba(72,211,131,.20) !important;
}
.btn.ghost, .nav button.active, .mobile-bottom-nav button.active,
.plan .plan-price, .plan-price-row.featured strong, .alarm-time .time-left,
.timeline-item .when, .next-panel .next-at, .hero-next strong, .note strong, .plan-badge {
  color: #48D383 !important;
}
.account-row.selected, .plan.current,
.main > section:not(.reference-dashboard) .account-row.selected,
.main > section:not(.reference-dashboard) .plan.current {
  border-color: #48D383 !important;
  box-shadow: 0 0 0 1px rgba(72,211,131,.18) inset !important;
}
.reference-heading h1, .reference-heading strong,
.reference-brand div, .reference-brand b,
.reference-cycle-copy h3, .reference-editor-heading h2, .reference-back,
.reference-warning-row b, .reference-upcoming-copy strong, .reference-field-icon {
  color: #48D383 !important;
}
.reference-system-copy strong, .reference-system-state, .reference-ring small,
.reference-info-row strong, .reference-cycle-copy p.ok,
.reference-cycle-day.active strong, .reference-cycle-day.active small,
.reference-upcoming-right strong, .reference-row-bell {
  color: #48D383 !important;
}
.reference-brand img { filter: drop-shadow(0 0 26px rgba(72,211,131,.24)) !important; }
.reference-ring {
  border-color: #2BC57A !important;
  border-left-color: #176C49 !important;
  box-shadow: inset 0 0 0 2px rgba(72,211,131,.16), 0 0 24px rgba(72,211,131,.12) !important;
}
.reference-cycle-day.active::before {
  border-color: #48D383 !important;
  box-shadow: 0 0 18px rgba(72,211,131,.24), inset 0 0 16px rgba(72,211,131,.08) !important;
}
.reference-row-bell { border-color: #319C62 !important; background: #0D2419 !important; }
.reference-save {
  color: #06150D !important;
  border-color: #6BE6A0 !important;
  background: linear-gradient(180deg, #6BE6A0, #2EAC68) !important;
  box-shadow: 0 5px 24px rgba(72,211,131,.24), inset 0 1px 0 rgba(255,255,255,.55) !important;
}
.reference-radio, .reference-radio.checked { border-color: #2BC57A !important; }
.reference-radio.checked i { background: #48D383 !important; }
.reference-editor-section h3, .reference-select-chevron { color: #48D383 !important; }
`;

async function transformResponse(request, response) {
  if (!response || !response.ok) return response;
  const pathname = new URL(request.url).pathname;
  const isApp = pathname.endsWith('/app.js');
  const isStyle = pathname.endsWith('/styles.css') || pathname.endsWith('/reference-theme.css') || pathname.endsWith('/reference-theme-global.css');
  if (!isApp && !isStyle) return response;

  const source = await response.text();
  let transformed = source;
  if (isApp && !source.includes('FOUNDER_ACCOUNT_NAMES')) {
    const helpersAnchor = "  const BILLING_LABELS = { weekly: '1 Woche', monthly: '1 Monat', sixMonth: '6 Monate', yearly: '1 Jahr', lifetime: 'Lifetime' };\n";
    if (!source.includes(helpersAnchor)) return response;
    transformed = transformed.replace(helpersAnchor, helpersAnchor + FOUNDER_PATCH);
    transformed = transformed.replace(
      "  const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';",
      "  const effectiveTierKey = () => hasFounderAccess() ? 'godfather' : (freeTrialActive() ? FREE_TRIAL_TIER : 'free');",
    );
    transformed = transformed.replace(
      "  function persist() {\n    state.updatedAt = iso(now());",
      "  function persist() {\n    if (hasFounderAccess()) state.tier = 'godfather';\n    state.updatedAt = iso(now());",
    );
    transformed = transformed.replace(
      "  state = loadState();\n  ticker = window.setInterval(() => { fireDueMoments(); refreshLiveCountdowns(); }, 1000);",
      "  state = loadState();\n  if (hasFounderAccess()) state.tier = 'godfather';\n  ticker = window.setInterval(() => { fireDueMoments(); refreshLiveCountdowns(); }, 1000);",
    );
  }
  if (isStyle && !source.includes('GREEN REFERENCE SYSTEM')) transformed += GREEN_REFERENCE_CSS;

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(transformed, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(INDEX, copy));
      return response;
    }).catch(() => caches.match(INDEX)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => transformResponse(event.request, response)).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }),
  );
});
