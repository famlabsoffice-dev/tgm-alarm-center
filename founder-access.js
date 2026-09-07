(() => {
  'use strict';

  const STORAGE_KEY = 'tgm-alarm-center-web-v2';
  const BASE_TIER_KEY = `${STORAGE_KEY}:founder-base-tier`;
  const GODFATHER_TIER = 'godfather';
  const VALID_TIERS = new Set(['free', 'streetBoss', 'caporegime', 'underboss', 'boss', GODFATHER_TIER]);
  const FOUNDER_IDS = new Set([
    'dGdtYWNr',
    'dGdta2VsbHo=',
    'dGdtajk=',
    'dGdtdmFueQ==',
    'dGdtcmVk',
  ]);

  const encodeFounderId = (name) => {
    const normalized = String(name ?? '').trim().toLowerCase();
    if (!normalized) return '';
    try {
      return btoa(unescape(encodeURIComponent(normalized)));
    } catch {
      return '';
    }
  };

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

  const activeAccount = (state) => state.accounts.find((account) => account.id === state.activeAccountId) || null;
  const isFounderState = (state) => Boolean(activeAccount(state)?.name) && FOUNDER_IDS.has(encodeFounderId(activeAccount(state).name));

  const enforceFounderTier = (state) => {
    if (!state) return state;
    const founder = isFounderState(state);
    const storedBaseTier = localStorage.getItem(BASE_TIER_KEY);

    if (founder) {
      if (state.tier !== GODFATHER_TIER) {
        if (!storedBaseTier && VALID_TIERS.has(state.tier) && state.tier !== GODFATHER_TIER) {
          localStorage.setItem(BASE_TIER_KEY, state.tier);
        }
        state.tier = GODFATHER_TIER;
      }
      return state;
    }

    if (state.tier === GODFATHER_TIER && storedBaseTier && VALID_TIERS.has(storedBaseTier) && storedBaseTier !== GODFATHER_TIER) {
      state.tier = storedBaseTier;
      localStorage.removeItem(BASE_TIER_KEY);
    } else if (storedBaseTier) {
      localStorage.removeItem(BASE_TIER_KEY);
    }
    return state;
  };

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    if (key === STORAGE_KEY) {
      try {
        const state = JSON.parse(value);
        const enforced = enforceFounderTier(state);
        value = JSON.stringify(enforced);
      } catch {
        // Preserve normal localStorage semantics for malformed values.
      }
    }
    originalSetItem(key, value);
  };

  const syncFounderEntitlement = () => {
    const state = readState();
    if (!state) return;
    const enforced = enforceFounderTier(state);
    const serialized = JSON.stringify(enforced);
    if (localStorage.getItem(STORAGE_KEY) !== serialized) originalSetItem(STORAGE_KEY, serialized);
  };

  syncFounderEntitlement();
  let lastState = localStorage.getItem(STORAGE_KEY);
  setInterval(() => {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current === lastState) return;
    lastState = current;
    syncFounderEntitlement();
  }, 250);
})();
