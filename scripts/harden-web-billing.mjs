import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../app.js', import.meta.url);
const source = readFileSync(path, 'utf8');
const forbiddenNames = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];
const plansStart = source.indexOf('  function renderPlansView() {');
const settingsStart = source.indexOf('  function renderSettingsView() {', plansStart);
if (plansStart < 0 || settingsStart < 0 || settingsStart <= plansStart) throw new Error('Billing hardening could not locate renderPlansView boundaries.');

const normalizePlanSection = (text) => text.replaceAll('\\`', '`').replaceAll('\\${', '${');
const hasLegacyBypass = forbiddenNames.some((name) => source.includes(name)) || source.includes('FAMILY_ACCOUNT_NAMES') || source.includes('familyAccessForAccount') || source.includes('isFamilyAccountName');
const effectiveTierPattern = /  const effectiveTierKey = \(\) => .*;\n/;

if (!hasLegacyBypass && source.includes("const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';")) {
  const existingPlanSection = source.slice(plansStart, settingsStart);
  const normalizedPlanSection = normalizePlanSection(existingPlanSection);
  const normalized = `${source.slice(0, plansStart)}${normalizedPlanSection}${source.slice(settingsStart)}`;
  if (normalized !== source) writeFileSync(path, normalized, 'utf8');
  if (normalized.includes('\\`') || normalized.includes('\\${')) throw new Error('Billing hardening left invalid template escaping in renderPlansView.');
  for (const name of forbiddenNames) if (normalized.includes(name)) throw new Error(`Hardened app.js still contains legacy founder name '${name}'.`);
  console.log('TGM billing hardening: PASS');
  process.exit(0);
}

let output = source.replace(
  /  const FAMILY_ACCESS_TIER = 'godfather';\n  const FAMILY_ACCOUNT_NAMES = Object\.freeze\(\['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'\]\);\n  const FAMILY_ACCOUNT_NAME_KEYS = new Set\(FAMILY_ACCOUNT_NAMES\.map\(\(name\) => name\.toLowerCase\(\)\)\);\n/,
  '',
);
output = output
  .replace(/  const isFamilyAccountName = .*\n/, '')
  .replace(/  const familyAccessForAccount = .*\n/, '')
  .replace(effectiveTierPattern, "  const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';\n");

const start = output.indexOf('  function renderPlansView() {');
const end = output.indexOf('  function renderSettingsView() {', start);
if (start < 0 || end < 0 || end <= start) throw new Error('Billing hardening could not locate post-migration renderPlansView boundaries.');

const hardenedPlansView = String.raw`  function renderPlansView() {
    const currentTier = effectiveTierKey();
    const trialPanel = freeTrialActive()
      ? __BT__<div class="note trial-panel active"><strong>Kostenlose Testphase läuft</strong><br>Alle Funktionen sind freigeschaltet. __DOLLAR_OPEN__esc(trialCountdownLabel())</div>__BT__
      : freeTrialAvailable()
        ? __BT__<div class="note trial-panel"><strong>72 Stunden kostenlos testen</strong><br>Nutze den vollständigen Funktionsumfang drei Tage lang auf diesem Gerät.<div class="actions"><button class="btn primary" type="button" data-action="start-free-trial">Testphase starten</button></div></div>__BT__
        : __BT__<div class="note trial-panel expired"><strong>Testphase bereits genutzt</strong><br>Die kostenlose Testphase kann auf diesem Gerät nur einmal gestartet werden.</div>__BT__;
    return __BT__<section><div class="section-head"><div><div class="eyebrow">PREISE UND FUNKTIONSUMFANG</div><h2>Pläne und Preise</h2><p>Vergleiche den verfügbaren Umfang für Accounts und Alarme.</p></div><span class="badge gold">__DOLLAR_OPEN__freeTrialActive() ? 'TESTPHASE · ' : 'AKTIV · '____DOLLAR_OPEN__esc(TIER_PRICING[currentTier].name)</span></div><div class="note plan-intro"><strong>Auswahl über Store-Entitlement</strong><br>Bezahlte Funktionen werden erst nach erfolgreicher Store-Zahlung und serverseitiger Verifizierung freigeschaltet. Die lokale Plananzeige ist keine Berechtigung.</div>__DOLLAR_OPEN__trialPanel<div class="plan-grid">__DOLLAR_OPEN__TIER_ORDER.map((tier) => { const plan = TIER_PRICING[tier]; const current = tier === currentTier; const paid = tier !== 'free'; return __BT__<article class="card plan __DOLLAR_OPEN__current ? 'current' : ''__BT__"><div class="plan-badge">__DOLLAR_OPEN__current ? 'AKTIV' : tier === 'free' ? 'BASIS' : tier === 'godfather' ? 'UNBEGRENZT' : 'ERWEITERT'__DOLLAR_OPEN__</div><h3>__DOLLAR_OPEN__esc(plan.name)</h3><div class="plan-price">__DOLLAR_OPEN__formatPlanPrice(plan.eur.monthly, 'EUR') <span>/ Monat</span></div>__DOLLAR_OPEN__plan.annualSavingPercent ? __BT__<div class="plan-note">Bei jährlicher Zahlung __DOLLAR_OPEN__plan.annualSavingPercent% weniger als bei 12 Monatszahlungen</div>__BT__ : '<div class="plan-note">Grundumfang für die lokale Alarmplanung</div>'__DOLLAR_OPEN__<div class="plan-limit-grid"><div class="plan-limit"><span>Accounts</span><strong>__DOLLAR_OPEN__formatPlanLimit(plan.limits.accounts)</strong></div><div class="plan-limit"><span>Bubble Alarm je Account</span><strong>__DOLLAR_OPEN__formatPlanLimit(plan.limits.perAccount.bubbleAlarms)</strong></div><div class="plan-limit"><span>Event Alarm je Account</span><strong>__DOLLAR_OPEN__formatPlanLimit(plan.limits.perAccount.eventAlarms)</strong></div><div class="plan-limit"><span>Individual Timer je Account</span><strong>__DOLLAR_OPEN__formatPlanLimit(plan.limits.perAccount.individualAlarms)</strong></div><div class="plan-limit"><span>RSS Timer je Account</span><strong>__DOLLAR_OPEN__formatPlanLimit(plan.limits.perAccount.rssAlarms)</strong></div></div><ul>__DOLLAR_OPEN__TIER_FEATURES[tier].map((feature) => __BT__<li>__DOLLAR_OPEN__esc(feature)</li>__BT__).join('')__DOLLAR_OPEN__</ul><div class="plan-price-list"><div class="plan-price-row plan-price-head"><span>Laufzeit</span><span>EUR</span><span>USD (Store)</span></div>__DOLLAR_OPEN__BILLING_PERIODS.map((period) => __BT__<div class="plan-price-row __DOLLAR_OPEN__period === 'monthly' ? 'featured' : ''__BT__"><span>__DOLLAR_OPEN__BILLING_LABELS[period]</span><strong>__DOLLAR_OPEN__formatPlanPrice(plan.eur[period], 'EUR')</strong><strong>__DOLLAR_OPEN__formatPlanPrice(plan.usdStore[period], 'USD')</strong></div>__BT__).join('')__DOLLAR_OPEN__</div><button class="btn __DOLLAR_OPEN__current || paid ? 'ghost' : 'secondary'__DOLLAR_OPEN__ full" type="button" data-action="select-tier" data-tier="__DOLLAR_OPEN__tier__DOLLAR_OPEN__" __DOLLAR_OPEN__current || paid ? 'disabled' : ''__DOLLAR_OPEN__>__DOLLAR_OPEN__current ? 'Aktiver Plan' : paid ? 'Store-Verifizierung erforderlich' : 'Basisplan verwenden'__DOLLAR_OPEN__</button></article>__BT__; }).join('')__DOLLAR_OPEN__</div></section>__BT__;
  }
`;
const hardened = hardenedPlansView.replaceAll('__BT__', '`').replaceAll('__DOLLAR_OPEN__', '${').replaceAll('__DOLLAR_OPEN____DOLLAR_OPEN__', '${');
output = `${output.slice(0, start)}${hardened}${output.slice(end)}`;

const oldSelect = /    if \(action === 'select-tier'\) \{.*?\n/;
if (!oldSelect.test(output)) throw new Error('Billing hardening could not locate the local tier selection handler.');
output = output.replace(oldSelect, "    if (action === 'select-tier') { const tier = button.dataset.tier; if (!TIER_PRICING[tier]) return; if (tier !== 'free') return showToast('Bezahlte Funktionen werden erst nach Store-Zahlung und serverseitiger Verifizierung aktiviert.'); state.tier = 'free'; persist(); render(); return; }\n");

const finalPlansStart = output.indexOf('  function renderPlansView() {');
const finalSettingsStart = output.indexOf('  function renderSettingsView() {', finalPlansStart);
const finalPlanSection = normalizePlanSection(output.slice(finalPlansStart, finalSettingsStart));
output = `${output.slice(0, finalPlansStart)}${finalPlanSection}${output.slice(finalSettingsStart)}`;
for (const name of forbiddenNames) if (output.includes(name)) throw new Error(`Billing hardening left legacy founder name '${name}'.`);
if (/const effectiveTierKey = \(\) => .*state\.tier/.test(output)) throw new Error('Billing hardening left state.tier in the effective entitlement path.');
if (output.includes('familyAccessForAccount') || output.includes('isFamilyAccountName') || output.includes('FAMILY_ACCESS_TIER')) throw new Error('Billing hardening left family account entitlement logic.');
if (finalPlanSection.includes('\\`') || finalPlanSection.includes('\\${')) throw new Error('Billing hardening left invalid template escaping in renderPlansView.');
if (!output.includes("const effectiveTierKey = () => freeTrialActive() ? FREE_TRIAL_TIER : 'free';")) throw new Error('Hardened effective tier policy is missing.');

writeFileSync(path, output, 'utf8');
console.log('TGM billing hardening: PASS');
