import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../app.js', import.meta.url);
const source = readFileSync(path, 'utf8');

const forbiddenNames = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];
for (const name of forbiddenNames) {
  if (!source.includes(name)) throw new Error(`Billing hardening expected legacy family grant marker '${name}' to exist before migration.`);
}

let output = source;

output = output.replace(
  /  const FAMILY_ACCESS_TIER = 'godfather';\n  const FAMILY_ACCOUNT_NAMES = Object\.freeze\(\['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'\]\);\n  const FAMILY_ACCOUNT_NAME_KEYS = new Set\(FAMILY_ACCOUNT_NAMES\.map\(\(name\) => name\.toLowerCase\(\)\)\);\n/,
  ''
);

output = output.replace(
  /  const isFamilyAccountName = \(accountName\) => typeof accountName === 'string' && FAMILY_ACCOUNT_NAME_KEYS\.has\(accountName\.trim\(\)\.toLowerCase\(\)\);\n  const familyAccessForAccount = \(account = activeAccount\(\)\) => Boolean\(account && isFamilyAccountName\(account\.name\)\);\n  const effectiveTierKey = \(\) => familyAccessForAccount\(\) \? FAMILY_ACCESS_TIER : \(freeTrialActive\(\) \? FREE_TRIAL_TIER : \(state\.tier \|\| 'free'\)\);/,
  "  const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';"
);

const plansStart = output.indexOf('  function renderPlansView() {');
const settingsStart = output.indexOf('  function renderSettingsView() {', plansStart);
if (plansStart < 0 || settingsStart < 0 || settingsStart <= plansStart) {
  throw new Error('Billing hardening could not locate renderPlansView boundaries.');
}

const hardenedPlansView = String.raw`  function renderPlansView() {
    const currentTier = effectiveTierKey();
    const trialPanel = freeTrialActive()
      ? \`<div class="note trial-panel active"><strong>Kostenlose Testphase läuft</strong><br>Alle Funktionen sind freigeschaltet. \${esc(trialCountdownLabel())}</div>\`
      : freeTrialAvailable()
        ? \`<div class="note trial-panel"><strong>72 Stunden kostenlos testen</strong><br>Nutze den vollständigen Funktionsumfang drei Tage lang auf diesem Gerät.<div class="actions"><button class="btn primary" type="button" data-action="start-free-trial">Testphase starten</button></div></div>\`
        : \`<div class="note trial-panel expired"><strong>Testphase bereits genutzt</strong><br>Die kostenlose Testphase kann auf diesem Gerät nur einmal gestartet werden.</div>\`;
    return \`<section><div class="section-head"><div><div class="eyebrow">PREISE UND FUNKTIONSUMFANG</div><h2>Pläne und Preise</h2><p>Vergleiche den verfügbaren Umfang für Accounts und Alarme.</p></div><span class="badge gold">\${freeTrialActive() ? 'TESTPHASE · ' : 'AKTIV · '}\${esc(TIER_PRICING[currentTier].name)}</span></div><div class="note plan-intro"><strong>Auswahl über Store-Entitlement</strong><br>Bezahlte Funktionen werden erst nach erfolgreicher Store-Zahlung und serverseitiger Verifizierung freigeschaltet. Die lokale Plananzeige ist keine Berechtigung.</div>\${trialPanel}<div class="plan-grid">\${TIER_ORDER.map((tier) => { const plan = TIER_PRICING[tier]; const current = tier === currentTier; const paid = tier !== 'free'; return \`<article class="card plan \${current ? 'current' : ''}"><div class="plan-badge">\${current ? 'AKTIV' : tier === 'free' ? 'BASIS' : tier === 'godfather' ? 'UNBEGRENZT' : 'ERWEITERT'}</div><h3>\${esc(plan.name)}</h3><div class="plan-price">\${formatPlanPrice(plan.eur.monthly, 'EUR')} <span>/ Monat</span></div>\${plan.annualSavingPercent ? \`<div class="plan-note">Bei jährlicher Zahlung \${plan.annualSavingPercent}% weniger als bei 12 Monatszahlungen</div>\` : '<div class="plan-note">Grundumfang für die lokale Alarmplanung</div>'}<div class="plan-limit-grid"><div class="plan-limit"><span>Accounts</span><strong>\${formatPlanLimit(plan.limits.accounts)}</strong></div><div class="plan-limit"><span>Bubble Alarm je Account</span><strong>\${formatPlanLimit(plan.limits.perAccount.bubbleAlarms)}</strong></div><div class="plan-limit"><span>Event Alarm je Account</span><strong>\${formatPlanLimit(plan.limits.perAccount.eventAlarms)}</strong></div><div class="plan-limit"><span>Individual Timer je Account</span><strong>\${formatPlanLimit(plan.limits.perAccount.individualAlarms)}</strong></div><div class="plan-limit"><span>RSS Timer je Account</span><strong>\${formatPlanLimit(plan.limits.perAccount.rssAlarms)}</strong></div></div><ul>\${TIER_FEATURES[tier].map((feature) => \`<li>\${esc(feature)}</li>\`).join('')}</ul><div class="plan-price-list"><div class="plan-price-row plan-price-head"><span>Laufzeit</span><span>EUR</span><span>USD (Store)</span></div>\${BILLING_PERIODS.map((period) => \`<div class="plan-price-row \${period === 'monthly' ? 'featured' : ''}"><span>\${BILLING_LABELS[period]}</span><strong>\${formatPlanPrice(plan.eur[period], 'EUR')}</strong><strong>\${formatPlanPrice(plan.usdStore[period], 'USD')}</strong></div>\`).join('')}</div><button class="btn \${current || paid ? 'ghost' : 'secondary'} full" type="button" data-action="select-tier" data-tier="\${tier}" \${current || paid ? 'disabled' : ''}>\${current ? 'Aktiver Plan' : paid ? 'Store-Verifizierung erforderlich' : 'Basisplan verwenden'}</button></article>\`; }).join('')}</div></section>\`;
  }
`;
output = `${output.slice(0, plansStart)}${hardenedPlansView}${output.slice(settingsStart)}`;

const oldSelect = /    if \(action === 'select-tier'\) \{ const tier = button\.dataset\.tier; if \(!TIER_PRICING\[tier\]\) return; state\.tier = tier; persist\(\); render\(\); showToast\(`\$\{TIER_PRICING\[tier\]\.name\} ist jetzt aktiv\.\`\); return; \}/;
if (!oldSelect.test(output)) throw new Error('Billing hardening could not locate the local paid-tier mutation handler.');
output = output.replace(oldSelect, "    if (action === 'select-tier') { const tier = button.dataset.tier; if (!TIER_PRICING[tier]) return; if (tier !== 'free') return showToast('Bezahlte Funktionen werden erst nach Store-Zahlung und serverseitiger Verifizierung aktiviert.'); state.tier = 'free'; persist(); render(); return; }");

for (const name of forbiddenNames) {
  if (output.includes(name)) throw new Error(`Billing hardening left legacy family grant name '${name}' in app.js.`);
}
if (/const effectiveTierKey = \(\) => .*state\.tier/.test(output)) throw new Error('Billing hardening left state.tier in the effective entitlement path.');
if (output.includes('familyAccessForAccount') || output.includes('isFamilyAccountName') || output.includes('FAMILY_ACCESS_TIER')) throw new Error('Billing hardening left family account entitlement logic in app.js.');
if (!output.includes("const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';")) throw new Error('Hardened effective tier policy is missing.');

writeFileSync(path, output, 'utf8');
console.log('TGM billing hardening: PASS');
