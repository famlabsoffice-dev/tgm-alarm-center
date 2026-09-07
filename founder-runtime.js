(() => {
  'use strict';

  const STORE = 'tgm-alarm-center-web-v2';
  const FOUNDER_ACCOUNT_NAMES = new Set(['tgmack', 'tgmkellz', 'tgmj9', 'tgmvany', 'tgmred']);
  const SOURCE_URL = './app.js?v=26';

  const encodeState = (state) => JSON.stringify(state);
  const readState = () => {
    try {
      const raw = localStorage.getItem(STORE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const activeAccount = (state) => state?.accounts?.find((account) => account.id === state.activeAccountId) || null;
  const hasFounderAccess = (state) => FOUNDER_ACCOUNT_NAMES.has(String(activeAccount(state)?.name ?? '').trim().toLowerCase());
  const enforceStoredFounderEntitlement = () => {
    const state = readState();
    if (!state || !hasFounderAccess(state) || state.tier === 'godfather') return;
    state.tier = 'godfather';
    localStorage.setItem(STORE, encodeState(state));
  };

  const patch = (source) => {
    let transformed = source;
    const helperAnchor = "  const FREE_TRIAL_TIER = 'godfather';\n";
    if (!transformed.includes('const FOUNDER_ACCOUNT_NAMES = new Set')) {
      const helperBlock = `${helperAnchor}  const FOUNDER_ACCOUNT_NAMES = new Set(['tgmack', 'tgmkellz', 'tgmj9', 'tgmvany', 'tgmred']);\n  const isFounderAccount = (account) => FOUNDER_ACCOUNT_NAMES.has(String(account?.name ?? '').trim().toLowerCase());\n  const hasFounderAccess = () => { const account = state?.accounts?.find((item) => item.id === state.activeAccountId) || null; return isFounderAccount(account); };\n`;
      transformed = transformed.replace(helperAnchor, helperBlock);
    }
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
    return transformed;
  };

  const boot = async () => {
    enforceStoredFounderEntitlement();
    const response = await fetch(SOURCE_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`TGM ALARM CENTER konnte nicht geladen werden (${response.status}).`);
    const source = await response.text();
    const transformed = patch(source);
    const script = document.createElement('script');
    script.text = transformed;
    document.head.appendChild(script);
  };

  boot().catch((error) => {
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<section style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#050708;color:#f1f0ea;font-family:system-ui,sans-serif"><div style="max-width:520px;text-align:center"><h1 style="color:#48D383">TGM ALARM CENTER</h1><p>Die Alarmzentrale konnte nicht geladen werden.</p><p style="color:#929a97">${String(error?.message || 'Unbekannter Ladefehler').replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character]))}</p><button type="button" onclick="location.reload()" style="border:1px solid #48D383;border-radius:12px;padding:11px 16px;background:#48D383;color:#06150D;font-weight:800">Erneut laden</button></div></section>`;
  });
})();
