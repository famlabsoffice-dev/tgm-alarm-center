(() => {
  'use strict';

  const STORAGE_KEY = 'tgm-alarm-center-web-v2';
  const BASE_TIER_KEY = `${STORAGE_KEY}:founder-base-tier`;
  const GODFATHER_TIER = 'godfather';
  const VALID_TIERS = new Set(['free', 'streetBoss', 'caporegime', 'underboss', 'boss', GODFATHER_TIER]);
  const FOUNDER_NAME_HASHES = new Set([
    '4a96bdc78702bfc1f03fea88a4ccb6a661113d7d4739a428fc683b8ccd1d0e3e',
    '1d4c5dd0de03fe655fdcecf45f2ca3be9527c95f6fb764778cb4785e0f73260e',
    '2b4651a8bcb9f05fba64801a1de9235984bb91a7950a7e6ff15fd99880969be6',
    '98829b72c7acf54e4ab033f5bbeab5b8644b3630a1c243c0bfc18533c4b54fef',
    'f2cc6c229ad68ac06c0085da255fbc9da52643c03736fb5a79e3e30fb5a20bb9',
  ]);

  const readState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (!state || state.schemaVersion !== 2 || !Array.isArray(state.accounts)) return null;
      return state;
    } catch {
      return null;
    }
  };

  const writeState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const sha256 = async (value) => {
    const bytes = new TextEncoder().encode(value.trim().toLowerCase());
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const syncFounderEntitlement = async () => {
    const state = readState();
    if (!state) return;
    const active = state.accounts.find((account) => account.id === state.activeAccountId);
    const isFounder = Boolean(active?.name) && FOUNDER_NAME_HASHES.has(await sha256(active.name));
    const storedBaseTier = localStorage.getItem(BASE_TIER_KEY);

    if (isFounder) {
      if (state.tier !== GODFATHER_TIER) {
        if (!storedBaseTier && VALID_TIERS.has(state.tier) && state.tier !== GODFATHER_TIER) localStorage.setItem(BASE_TIER_KEY, state.tier);
        state.tier = GODFATHER_TIER;
        writeState(state);
        location.reload();
      }
      return;
    }

    if (state.tier === GODFATHER_TIER && storedBaseTier && VALID_TIERS.has(storedBaseTier) && storedBaseTier !== GODFATHER_TIER) {
      state.tier = storedBaseTier;
      localStorage.removeItem(BASE_TIER_KEY);
      writeState(state);
      location.reload();
    } else if (storedBaseTier) {
      localStorage.removeItem(BASE_TIER_KEY);
    }
  };

  const start = () => {
    syncFounderEntitlement().catch(() => undefined);
    let lastState = localStorage.getItem(STORAGE_KEY);
    setInterval(() => {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current === lastState) return;
      lastState = current;
      syncFounderEntitlement().catch(() => undefined);
    }, 250);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
