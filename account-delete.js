(() => {
  'use strict';

  const STORE = 'tgm-alarm-center-web-v2';
  const PENDING_STORE = `${STORE}:pending`;
  const MAX_ACCOUNTS = 100;
  const MAX_ALARMS = 1000;

  const safeParse = (raw) => {
    if (!raw || raw.length > 512 * 1024) return null;
    try {
      const value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  };

  function loadRawState() {
    return safeParse(localStorage.getItem(STORE)) || safeParse(localStorage.getItem(PENDING_STORE));
  }

  function persistRawState(state) {
    const serialized = JSON.stringify(state);
    if (serialized.length > 512 * 1024) return false;
    localStorage.setItem(PENDING_STORE, serialized);
    localStorage.setItem(STORE, serialized);
    localStorage.removeItem(PENDING_STORE);
    return true;
  }

  function installDeleteButton() {
    const modal = document.querySelector('#modalRoot .modal');
    if (!modal || modal.dataset.accountDeleteReady === 'true') return;
    const title = modal.querySelector('#modalTitle')?.textContent?.trim();
    const saveButton = modal.querySelector('[data-action="save-account"]');
    if (title !== 'Account bearbeiten' || !saveButton?.dataset.id) return;

    const footer = modal.querySelector('.modal-footer');
    if (!footer) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn danger';
    button.dataset.action = 'delete-account';
    button.dataset.id = saveButton.dataset.id;
    button.setAttribute('aria-label', 'Account löschen');
    button.textContent = 'Account löschen';
    footer.insertBefore(button, footer.firstChild);
    modal.dataset.accountDeleteReady = 'true';
  }

  function deleteAccount(id) {
    if (!id) return;
    const state = loadRawState();
    if (!state || !Array.isArray(state.accounts) || !Array.isArray(state.alarms)) return;

    const account = state.accounts.find((item) => item && item.id === id);
    if (!account) return;

    const accountAlarmIds = new Set(state.alarms.filter((alarm) => alarm?.accountId === id).map((alarm) => alarm.id).filter(Boolean));
    const alarmCount = accountAlarmIds.size;
    const warning = alarmCount === 1
      ? `\n\nDer zugehörige Alarm wird ebenfalls gelöscht.`
      : alarmCount > 1
        ? `\n\nDie ${alarmCount} zugehörigen Alarme werden ebenfalls gelöscht.`
        : '';

    if (!window.confirm(`Account „${account.name}“ wirklich löschen?${warning}`)) return;

    state.accounts = state.accounts.filter((item) => item?.id !== id).slice(0, MAX_ACCOUNTS);
    state.alarms = state.alarms.filter((alarm) => alarm?.accountId !== id).slice(0, MAX_ALARMS);
    if (state.firedMoments && typeof state.firedMoments === 'object') {
      for (const key of Object.keys(state.firedMoments)) {
        if ([...accountAlarmIds].some((alarmId) => key.startsWith(`${alarmId}|`))) delete state.firedMoments[key];
      }
    }
    state.activeAccountId = state.accounts.some((item) => item.id === state.activeAccountId)
      ? state.activeAccountId
      : (state.accounts[0]?.id || null);
    state.updatedAt = new Date().toISOString();

    if (!persistRawState(state)) return;
    document.querySelector('#modalRoot')?.replaceChildren();
    document.body.classList.remove('modal-open');
    window.location.reload();
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-action="delete-account"]') : null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    deleteAccount(target.dataset.id || '');
  }, true);

  const observer = new MutationObserver(installDeleteButton);
  const start = () => {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    observer.observe(root, { childList: true, subtree: true });
    installDeleteButton();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
