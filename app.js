(() => {
  'use strict';

  const STORE = 'tgm-alarm-center-web-v2';
  const SCHEMA_VERSION = 2;
  const BACKUP_FORMAT = 'tgm-alarm-center-backup';
  const BACKUP_VERSION = 2;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const FIVE_DAYS_MS = 5 * DAY_MS;
  const MAX_TITLE_LENGTH = 80;
  const MAX_WARNINGS = 7 * 24 * 60;
  const SOUNDS = {
    pulse: { label: 'Pulse', file: 'alarm-pulse.wav', description: 'Klarer Doppelimpuls für normale Bubble-Zeiten', symbol: 'P' },
    siren: { label: 'Siren', file: 'alarm-siren.wav', description: 'Durchdringender Wechselton für GW-Bubble', symbol: 'S' },
    chime: { label: 'Chime', file: 'alarm-chime.wav', description: 'Dreistufiger Klang für eigene Events', symbol: 'C' },
  };
  const TYPE_LABEL = { bubble: 'Bubble', gw: 'GW Bubble', custom: 'Eigenes Event' };
  const REPEAT_LABEL = { once: 'Einmalig', daily: 'Täglich', gw5d: 'GW-Zyklus · alle 5 Tage' };
  const DEFAULT_PREFS = {
    sound: 'pulse', warningSound: true, eventSound: true, vibration: true,
    criticalAlerts: true, audioEnabled: false,
  };
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modalRoot');
  const toastRoot = document.getElementById('toast');
  const overlayRoot = document.getElementById('alarmOverlay');

  let state;
  let view = 'today';
  let editingId = null;
  let modalMode = null;
  let audioContext = null;
  let currentAudio = null;
  let ticker = null;
  let toastTimer = null;
  let alertTimer = null;

  const now = () => Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const uid = () => (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') ? globalThis.crypto.randomUUID() : `tgm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const money = (value) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  const formatDateTime = (ms) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
  const formatTime = (ms) => new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
  const formatDateInput = (ms) => { const date = new Date(ms); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
  const formatTimeInput = (ms) => { const date = new Date(ms); return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
  const countdown = (ms) => {
    const remaining = Math.max(0, ms - now());
    if (remaining < 60_000) return `${Math.floor(remaining / 1000)} Sek.`;
    const minutes = Math.floor(remaining / 60_000);
    if (minutes < 60) return `${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} Std. · ${minutes % 60} Min.`;
    return `${Math.floor(hours / 24)} Tage · ${hours % 24} Std.`;
  };

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      activeAccountId: null,
      accounts: [],
      alarms: [],
      preferences: { ...DEFAULT_PREFS },
      firedMoments: {},
      testConfirmedAt: null,
      updatedAt: iso(now()),
    };
  }

  function validDateTime(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const day = Number(date.slice(8, 10));
    const hour = Number(time.slice(0, 2));
    const minute = Number(time.slice(3, 5));
    const candidate = new Date(year, month - 1, day, hour, minute, 0, 0);
    return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day && candidate.getHours() === hour && candidate.getMinutes() === minute;
  }

  function localDateTime(date, time) {
    if (!validDateTime(date, time)) return null;
    const value = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), Number(time.slice(0, 2)), Number(time.slice(3, 5)), 0, 0).getTime();
    return Number.isFinite(value) ? value : null;
  }

  function normalize(raw) {
    const base = emptyState();
    if (!raw || typeof raw !== 'object') return base;
    const accounts = Array.isArray(raw.accounts) ? raw.accounts.map((account) => ({
      id: typeof account?.id === 'string' ? account.id : '',
      name: typeof account?.name === 'string' ? account.name.trim().slice(0, 80) : '',
      color: typeof account?.color === 'string' ? account.color : '#F4C969',
      createdAt: Number.isFinite(Date.parse(account?.createdAt)) ? new Date(account.createdAt).toISOString() : iso(now()),
    })).filter((account) => account.id && account.name) : [];
    const uniqueAccounts = accounts.filter((account, index, all) => all.findIndex((item) => item.id === account.id) === index);
    const accountIds = new Set(uniqueAccounts.map((account) => account.id));
    const alarms = Array.isArray(raw.alarms) ? raw.alarms.map((alarm) => {
      if (!alarm || typeof alarm !== 'object') return null;
      const id = typeof alarm.id === 'string' && alarm.id ? alarm.id : uid();
      const accountId = typeof alarm.accountId === 'string' && accountIds.has(alarm.accountId) ? alarm.accountId : null;
      const title = typeof alarm.title === 'string' ? alarm.title.trim().slice(0, MAX_TITLE_LENGTH) : '';
      const type = alarm.type === 'bubble' || alarm.type === 'gw' || alarm.type === 'custom' ? alarm.type : 'custom';
      let eventAt = Number.isFinite(alarm.eventAt) ? alarm.eventAt : Date.parse(alarm.eventAtUtc);
      if (!Number.isFinite(eventAt) && validDateTime(alarm.date, alarm.time)) eventAt = localDateTime(alarm.date, alarm.time);
      if (!accountId || !title || !Number.isFinite(eventAt)) return null;
      const eventDate = new Date(eventAt);
      const repeat = alarm.repeat === 'daily' || alarm.repeat === 'gw5d' ? alarm.repeat : 'once';
      const warnings = Array.isArray(alarm.warnings) ? alarm.warnings.filter((item) => Number.isInteger(item) && item > 0 && item <= MAX_WARNINGS).filter((item, index, all) => all.indexOf(item) === index).sort((a, b) => b - a) : [15];
      const completed = Array.isArray(alarm.completedOccurrences) ? alarm.completedOccurrences.reduce((result, key) => { if (typeof key === 'string') result[key] = true; return result; }, {}) : (alarm.completedOccurrences && typeof alarm.completedOccurrences === 'object' ? Object.fromEntries(Object.entries(alarm.completedOccurrences).filter(([, value]) => value === true)) : {});
      return {
        id, accountId, title, type: repeat === 'gw5d' ? 'gw' : type,
        eventAt, date: formatDateInput(eventAt), time: formatTimeInput(eventAt), warnings: warnings.length ? warnings : [15],
        repeat, sound: SOUNDS[alarm.sound] ? alarm.sound : 'pulse', active: alarm.active !== false, protected: alarm.protected === true,
        completedOccurrences: completed,
        createdAt: Number.isFinite(Date.parse(alarm.createdAt)) ? new Date(alarm.createdAt).toISOString() : iso(now()),
        updatedAt: Number.isFinite(Date.parse(alarm.updatedAt)) ? new Date(alarm.updatedAt).toISOString() : iso(now()),
      };
    }).filter(Boolean) : [];
    const oldPreferences = raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : {};
    const preferences = {
      ...DEFAULT_PREFS,
      ...oldPreferences,
      warningSound: oldPreferences.warningSound !== false,
      eventSound: oldPreferences.eventSound !== false && oldPreferences.alarmSound !== false,
      vibration: oldPreferences.vibration !== false,
      criticalAlerts: oldPreferences.criticalAlerts !== false && oldPreferences.criticalAlertsEnabled !== false,
      sound: SOUNDS[oldPreferences.sound] ? oldPreferences.sound : DEFAULT_PREFS.sound,
      audioEnabled: oldPreferences.audioEnabled === true,
    };
    const firedMoments = raw.firedMoments && typeof raw.firedMoments === 'object' ? Object.fromEntries(Object.entries(raw.firedMoments).filter(([key, value]) => value === true && Number(key.split('|')[1]) > now() - 14 * DAY_MS)) : {};
    return {
      schemaVersion: SCHEMA_VERSION,
      activeAccountId: typeof raw.activeAccountId === 'string' && accountIds.has(raw.activeAccountId) ? raw.activeAccountId : (uniqueAccounts[0]?.id ?? null),
      accounts: uniqueAccounts,
      alarms: alarms.filter((alarm, index, all) => all.findIndex((item) => item.id === alarm.id) === index),
      preferences,
      firedMoments,
      testConfirmedAt: typeof raw.testConfirmedAt === 'string' && Number.isFinite(Date.parse(raw.testConfirmedAt)) ? new Date(raw.testConfirmedAt).toISOString() : null,
      updatedAt: iso(now()),
    };
  }

  function loadState() {
    try { return normalize(JSON.parse(localStorage.getItem(STORE) || 'null')); } catch { return emptyState(); }
  }

  function persist() {
    state.updatedAt = iso(now());
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function activeAccount() { return state.accounts.find((account) => account.id === state.activeAccountId) || null; }
  function accountAlarms(accountId) { return state.alarms.filter((alarm) => alarm.accountId === accountId); }
  function ensureAccount() {
    const current = activeAccount();
    if (current) return current;
    const account = { id: uid(), name: 'Mein TGM-Kommando', color: '#F4C969', createdAt: iso(now()) };
    state.accounts.push(account);
    state.activeAccountId = account.id;
    persist();
    return account;
  }

  function isCompleted(alarm, eventAt) { return alarm.completedOccurrences[`${alarm.id}|${eventAt}`] === true; }
  function occurrenceKey(alarm, eventAt) { return `${alarm.id}|${eventAt}`; }

  function nextOccurrence(alarm, reference = now()) {
    if (!alarm.active) return null;
    if (alarm.repeat === 'once') return alarm.eventAt > reference && !isCompleted(alarm, alarm.eventAt) ? alarm.eventAt : null;
    if (alarm.repeat === 'gw5d') {
      if (!Number.isFinite(alarm.eventAt)) return null;
      const cycles = reference < alarm.eventAt ? 0 : Math.floor((reference - alarm.eventAt) / FIVE_DAYS_MS) + 1;
      let candidate = alarm.eventAt + cycles * FIVE_DAYS_MS;
      for (let attempt = 0; attempt < 370; attempt += 1) {
        if (candidate > reference && !isCompleted(alarm, candidate)) return candidate;
        candidate += FIVE_DAYS_MS;
      }
      return null;
    }
    const base = new Date(alarm.eventAt);
    let candidate = new Date(new Date(reference).getFullYear(), new Date(reference).getMonth(), new Date(reference).getDate(), base.getHours(), base.getMinutes(), 0, 0).getTime();
    if (candidate <= reference) candidate += DAY_MS;
    for (let attempt = 0; attempt < 370; attempt += 1) {
      if (!isCompleted(alarm, candidate)) return candidate;
      const date = new Date(candidate);
      date.setDate(date.getDate() + 1);
      candidate = date.getTime();
    }
    return null;
  }

  function momentsFor(alarm, reference = now()) {
    const eventAt = nextOccurrence(alarm, reference);
    if (!eventAt) return [];
    const moments = [];
    for (const warning of alarm.warnings.slice().sort((a, b) => b - a)) {
      const at = eventAt - warning * 60 * 1000;
      if (at > reference) moments.push({ alarmId: alarm.id, eventAt, at, kind: 'warning', warning });
    }
    if (eventAt > reference) moments.push({ alarmId: alarm.id, eventAt, at: eventAt, kind: 'main' });
    if (alarm.repeat === 'gw5d') {
      const endAt = eventAt + DAY_MS;
      const endWarning = endAt - 60 * 60 * 1000;
      if (endWarning > reference) moments.push({ alarmId: alarm.id, eventAt, at: endWarning, kind: 'end-warning', endAt });
      if (endAt > reference) moments.push({ alarmId: alarm.id, eventAt, at: endAt, kind: 'end', endAt });
    }
    return moments.sort((a, b) => a.at - b.at);
  }

  function allMoments(reference = now()) { return state.alarms.flatMap((alarm) => momentsFor(alarm, reference)).sort((a, b) => a.at - b.at); }
  function nextMoment() { return allMoments()[0] || null; }
  function typeLabel(type) { return TYPE_LABEL[type] || TYPE_LABEL.custom; }
  function repeatLabel(repeat) { return REPEAT_LABEL[repeat] || REPEAT_LABEL.once; }
  function momentLabel(moment) { return moment.kind === 'warning' ? `${moment.warning} Min. Vorwarnung` : moment.kind === 'end-warning' ? 'Bubble-Ende-Warnung' : moment.kind === 'end' ? 'Bubble endet' : 'Hauptereignis'; }
  function momentBody(alarm, moment) {
    if (moment.kind === 'end-warning') return `${alarm.title}: Der Schutz endet um ${formatTime(moment.endAt)}.`;
    if (moment.kind === 'end') return `${alarm.title}: Das Bubble-Schutzfenster endet jetzt.`;
    if (moment.kind === 'warning') return `${typeLabel(alarm.type)} beginnt um ${formatTime(moment.eventAt)}.`;
    return `${alarm.title} ist jetzt fällig.`;
  }

  function showToast(message) {
    toastRoot.textContent = message;
    toastRoot.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastRoot.classList.remove('show'), 2800);
  }

  function showAlarmOverlay(alarm, moment) {
    overlayRoot.innerHTML = `<div class="alarm-alert" role="alertdialog" aria-modal="true"><div class="alert-icon">${esc(SOUNDS[alarm.sound]?.symbol || '!')}</div><div class="eyebrow">${esc(momentLabel(moment))}</div><h2>${esc(alarm.title)}</h2><p>${esc(momentBody(alarm, moment))}</p><button class="btn primary" type="button" data-action="dismiss-alert">Bestätigen</button></div>`;
    overlayRoot.classList.add('show');
    document.title = `TGM · ${alarm.title}`;
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => dismissAlert(), 60_000);
  }

  function dismissAlert() {
    overlayRoot.classList.remove('show');
    overlayRoot.innerHTML = '';
    document.title = 'TGM ALARM CENTER';
    clearTimeout(alertTimer);
  }

  async function unlockAudio() {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      gain.gain.value = 0.0001;
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.02);
      state.preferences.audioEnabled = true;
      persist();
      render();
      showToast('Gaming-Alarmtöne sind aktiviert.');
    } catch {
      showToast('Audio konnte in diesem Browser nicht aktiviert werden.');
    }
  }

  function playSound(profile) {
    if (!state.preferences.audioEnabled) return false;
    const sound = SOUNDS[profile] || SOUNDS.pulse;
    try {
      if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
      currentAudio = new Audio(`assets/notifications/${sound.file}`);
      currentAudio.volume = 0.92;
      currentAudio.play().catch(() => showToast('Tippe auf „Audio aktivieren“, um Alarmtöne zu hören.'));
      return true;
    } catch { return false; }
  }

  function occurrenceAtOrBefore(alarm, reference) {
    if (!alarm.active) return null;
    if (alarm.repeat === 'once') return alarm.eventAt <= reference ? alarm.eventAt : null;
    if (alarm.repeat === 'gw5d') {
      const cycles = Math.floor((reference - alarm.eventAt) / FIVE_DAYS_MS);
      return cycles >= 0 ? alarm.eventAt + cycles * FIVE_DAYS_MS : null;
    }
    const base = new Date(alarm.eventAt);
    const referenceDate = new Date(reference);
    const candidateDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), base.getHours(), base.getMinutes(), 0, 0);
    if (candidateDate.getTime() > reference) candidateDate.setDate(candidateDate.getDate() - 1);
    return candidateDate.getTime();
  }

  function dueMoments(alarm, reference) {
    const eventAt = occurrenceAtOrBefore(alarm, reference);
    if (!eventAt || isCompleted(alarm, eventAt)) return [];
    const moments = alarm.warnings.map((warning) => ({ alarmId: alarm.id, eventAt, at: eventAt - warning * 60 * 1000, kind: 'warning', warning }));
    moments.push({ alarmId: alarm.id, eventAt, at: eventAt, kind: 'main' });
    if (alarm.repeat === 'gw5d') {
      const endAt = eventAt + DAY_MS;
      moments.push({ alarmId: alarm.id, eventAt, at: endAt - 60 * 60 * 1000, kind: 'end-warning', endAt });
      moments.push({ alarmId: alarm.id, eventAt, at: endAt, kind: 'end', endAt });
    }
    return moments.filter((moment) => moment.at <= reference && reference - moment.at <= 120000);
  }

  function fireDueMoments() {
    const reference = now();
    const due = state.alarms.flatMap((alarm) => dueMoments(alarm, reference).map((moment) => ({ alarm, moment })));
    let changed = false;
    for (const { alarm, moment } of due) {
      const key = `${alarm.id}|${moment.at}|${moment.kind}`;
      if (state.firedMoments[key]) continue;
      state.firedMoments[key] = true;
      changed = true;
      const soundEnabled = moment.kind === 'warning' || moment.kind === 'end-warning' ? state.preferences.warningSound : state.preferences.eventSound;
      if (soundEnabled) playSound(alarm.sound);
      if (state.preferences.vibration && navigator.vibrate) navigator.vibrate([160, 100, 260]);
      showAlarmOverlay(alarm, moment);
      showToast(`${momentLabel(moment)} · ${alarm.title}`);
    }
    if (changed) { persist(); render(); }
  }

  function openEditor(id = null, template = 'bubble') {
    editingId = id;
    modalMode = 'alarm';
    modalRoot.innerHTML = renderAlarmModal(id, template);
    document.body.classList.add('modal-open');
    modalRoot.querySelector('[autofocus]')?.focus();
  }

  function openAccountEditor(id = null) {
    modalMode = 'account';
    const account = id ? state.accounts.find((item) => item.id === id) : null;
    modalRoot.innerHTML = `<div class="modal-wrap"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><h2 id="modalTitle">${account ? 'Account bearbeiten' : 'Account anlegen'}</h2><button class="close" type="button" data-action="close-modal" aria-label="Schließen">×</button></div><div class="field"><label for="accountName">Bezeichnung</label><input id="accountName" maxlength="80" value="${esc(account?.name || '')}" placeholder="z. B. Hauptkommando" autofocus></div><div class="field"><label for="accountColor">Farbe</label><input id="accountColor" type="color" value="${esc(account?.color || '#F4C969')}"></div><div class="modal-footer"><button class="btn ghost" type="button" data-action="close-modal">Abbrechen</button><button class="btn primary" type="button" data-action="save-account" data-id="${esc(id || '')}">${account ? 'Änderungen speichern' : 'Account anlegen'}</button></div></section></div>`;
    document.body.classList.add('modal-open');
  }

  function renderAlarmModal(id, templateKey) {
    const existing = id ? state.alarms.find((alarm) => alarm.id === id) : null;
    const template = templateKey === 'gw' ? { type: 'gw', title: 'GW-Zeitfenster', warnings: [60, 30, 15], repeat: 'once', sound: 'siren', protected: true } : templateKey === 'custom' ? { type: 'custom', title: 'Mein TGM-Event', warnings: [15], repeat: 'once', sound: 'chime', protected: false } : { type: 'bubble', title: 'Bubble-Zeitfenster', warnings: [60, 15], repeat: 'once', sound: 'pulse', protected: true };
    const eventAt = existing?.eventAt || now() + 60 * 60 * 1000;
    const type = existing?.type || template.type;
    const repeat = existing?.repeat || template.repeat;
    const sound = existing?.sound || template.sound;
    const warnings = existing?.warnings || template.warnings;
    return `<div class="modal-wrap"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><h2 id="modalTitle">${existing ? 'Alarm bearbeiten' : 'Neuer Gaming-Alarm'}</h2><button class="close" type="button" data-action="close-modal" aria-label="Schließen">×</button></div><div class="note"><strong>Lokaler Gaming-Alarm</strong><br>Der Alarm wird nur in diesem Browser gespeichert und gibt einen Ton auf diesem Gerät aus.</div><div class="field"><label for="eTitle">Bezeichnung</label><input id="eTitle" maxlength="80" value="${esc(existing?.title || template.title)}" placeholder="z. B. Abend-Bubble" autofocus></div><div class="field"><label for="eType">Alarmtyp</label><select id="eType"><option value="bubble" ${type === 'bubble' ? 'selected' : ''}>Bubble</option><option value="gw" ${type === 'gw' ? 'selected' : ''}>GW Bubble</option><option value="custom" ${type === 'custom' ? 'selected' : ''}>Eigenes Event</option></select></div><div class="two-col"><div class="field"><label for="eDate">Datum</label><input id="eDate" type="date" value="${formatDateInput(eventAt)}"></div><div class="field"><label for="eTime">Uhrzeit</label><input id="eTime" type="time" value="${formatTimeInput(eventAt)}"></div></div><div class="field"><span class="choice-label">Vorwarnungen</span><div class="choice-grid">${[60, 30, 15].map((minutes) => `<label class="choice"><input type="checkbox" name="warning" value="${minutes}" ${warnings.includes(minutes) ? 'checked' : ''}>${minutes} Minuten</label>`).join('')}</div><span class="field-help">Mehrere Vorwarnungen können gleichzeitig aktiviert werden.</span></div><div class="field"><label for="eRepeat">Wiederholung</label><select id="eRepeat"><option value="once" ${repeat === 'once' ? 'selected' : ''}>Einmalig</option><option value="daily" ${repeat === 'daily' ? 'selected' : ''}>Täglich</option><option value="gw5d" ${repeat === 'gw5d' ? 'selected' : ''}>GW Bubble · alle 5 Tage · 24 Stunden Schutz</option></select></div><div class="field"><label for="eSound">Alarmton</label><select id="eSound">${Object.entries(SOUNDS).map(([key, value]) => `<option value="${key}" ${sound === key ? 'selected' : ''}>${value.label} · ${value.description}</option>`).join('')}</select></div><div class="switch-row"><label for="eProtected">Als geschützt markieren</label><input id="eProtected" type="checkbox" ${existing?.protected ?? template.protected ? 'checked' : ''}></div><div class="switch-row"><label for="eActive">Alarm aktiv</label><input id="eActive" type="checkbox" ${existing?.active !== false ? 'checked' : ''}></div><div class="modal-footer"><button class="btn ghost" type="button" data-action="preview-sound" data-sound="${esc(sound)}">Ton anhören</button><button class="btn ghost" type="button" data-action="close-modal">Abbrechen</button><button class="btn primary" type="button" data-action="save-alarm" data-id="${esc(id || '')}">${existing ? 'Änderungen speichern' : 'Alarm speichern'}</button></div></section></div>`;
  }

  function render() {
    app.innerHTML = `<div class="app-shell"><header class="topbar"><div class="toprow"><div class="brand"><div class="brand-mark" aria-hidden="true">TGM</div><div class="brand-copy"><strong>TGM ALARM CENTER</strong><span>Lokale Gaming-Alarmzentrale für The Grand Mafia</span></div></div><div class="toolbar"><button class="audio-state ${state.preferences.audioEnabled ? 'ready' : ''}" type="button" data-action="unlock-audio"><span class="audio-dot"></span>${state.preferences.audioEnabled ? 'Gaming-Töne aktiv' : 'Audio aktivieren'}</button>${activeAccount() ? `<div class="account-pill"><span class="account-dot"></span>${esc(activeAccount().name)}</div>` : ''}</div></div><nav class="nav" aria-label="Hauptnavigation">${navButton('today', 'Übersicht')}${navButton('alarms', 'Alarme')}${navButton('accounts', 'Accounts')}${navButton('sounds', 'Gaming-Töne')}${navButton('settings', 'Einstellungen')}</nav></header><main class="main">${view === 'today' ? renderDashboard() : view === 'alarms' ? renderAlarmsView() : view === 'accounts' ? renderAccountsView() : view === 'sounds' ? renderSoundsView() : renderSettingsView()}</main><footer class="footer">TGM ALARM CENTER · lokale Speicherung · lokale Gaming-Alarmtöne · ${SCHEMA_VERSION.toString()}</footer></div>`;
  }

  function navButton(key, label) { return `<button type="button" class="${view === key ? 'active' : ''}" data-action="view" data-view="${key}">${label}</button>`; }

  function renderDashboard() {
    const next = nextMoment();
    const active = state.alarms.filter((alarm) => alarm.active).length;
    const protectedCount = state.alarms.filter((alarm) => alarm.active && alarm.protected).length;
    const gwCount = state.alarms.filter((alarm) => alarm.active && alarm.repeat === 'gw5d').length;
    const timeline = allMoments().slice(0, 5);
    return `<section class="grid grid-hero"><div class="card hero"><div class="eyebrow">DEIN GAMING-ALARM CENTER</div><h1>Keine Bubble mehr verpassen.</h1><p class="hero-copy">Plane Bubble-Zeiten, GW-Schutzfenster und eigene Events. Deine Daten bleiben auf diesem Gerät, deine Alarmtöne ertönen lokal.</p>${next ? `<div class="hero-next"><strong>${esc(nextMomentAlarm(next)?.title || 'Nächster Alarm')}</strong><span>${esc(momentLabel(next))} · ${formatDateTime(next.at)}</span><div class="countdown">${countdown(next.at)}</div></div>` : `<div class="hero-next"><strong>Bereit für deinen nächsten Alarm.</strong><span>Lege mit einem Gaming-Template los.</span></div>`}<div class="hero-actions"><button class="btn primary" type="button" data-action="new-alarm" data-template="bubble">Bubble anlegen</button><button class="btn secondary" type="button" data-action="new-alarm" data-template="gw">GW Bubble</button><button class="btn ghost" type="button" data-action="new-alarm" data-template="custom">Eigenes Event</button></div></div><aside class="card next-panel"><div><div class="eyebrow">ALS NÄCHSTES</div>${next ? `<div class="next-title">${esc(nextMomentAlarm(next)?.title || 'Alarm')}</div><div class="next-at">${esc(momentLabel(next))} · ${formatDateTime(next.at)}</div><div class="countdown">${countdown(next.at)}</div>` : `<div class="next-title">Keine offenen Termine</div><div class="muted">Deine Alarmzentrale wartet.</div>`}</div>${timeline.length ? `<div class="timeline">${timeline.slice(0, 3).map((moment) => { const alarm = nextMomentAlarm(moment); return `<div class="timeline-item"><span class="when">${formatTime(moment.at)}</span><div><strong>${esc(alarm?.title || 'Alarm')}</strong><small>${esc(momentLabel(moment))}</small></div><span class="badge ${moment.kind === 'end' ? 'red' : moment.kind === 'main' ? 'gold' : 'blue'}">${esc(typeLabel(alarm?.type))}</span></div>`; }).join('')}</div>` : ''}</aside></section><section class="stats"><div class="card stat"><div class="stat-head"><span class="eyebrow">AKTIVE ALARME</span><span class="stat-icon">A</span></div><div class="stat-value">${active}</div><div class="stat-label">auf diesem Gerät</div></div><div class="card stat"><div class="stat-head"><span class="eyebrow">GESCHÜTZT</span><span class="stat-icon">盾</span></div><div class="stat-value">${protectedCount}</div><div class="stat-label">markierte Alarme</div></div><div class="card stat"><div class="stat-head"><span class="eyebrow">GW-ZYKLEN</span><span class="stat-icon">GW</span></div><div class="stat-value">${gwCount}</div><div class="stat-label">mit 24h Schutzfenster</div></div><div class="card stat"><div class="stat-head"><span class="eyebrow">AUDIO-ENGINE</span><span class="stat-icon">♪</span></div><div class="stat-value ${state.preferences.audioEnabled ? 'mint' : 'gold'}">${state.preferences.audioEnabled ? 'OK' : 'OFF'}</div><div class="stat-label">${state.preferences.audioEnabled ? 'Töne bereit' : 'Aktivierung nötig'}</div></div></section><section><div class="section-head"><h2>Schnellstart</h2><p>Vorlagen mit passenden Alarmtönen</p></div><div class="template-grid"><button class="template" type="button" data-action="new-alarm" data-template="bubble"><span class="template-icon">B</span><strong>Bubble-Zeitfenster</strong><span>60 · 15 Min. · Pulse</span></button><button class="template" type="button" data-action="new-alarm" data-template="gw"><span class="template-icon">GW</span><strong>GW-Zeitfenster</strong><span>60 · 30 · 15 Min. · Siren</span></button><button class="template" type="button" data-action="new-alarm" data-template="custom"><span class="template-icon">E</span><strong>Eigenes Event</strong><span>15 Min. · Chime</span></button></div></section><section><div class="section-head"><h2>Deine nächsten Alarme</h2><p>${state.alarms.length} gespeichert</p></div>${renderAlarmList(5)}</section>`;
  }

  function nextMomentAlarm(moment) { return state.alarms.find((alarm) => alarm.id === moment?.alarmId) || null; }

  function renderAlarmsView() { return `<section><div class="section-head"><div><div class="eyebrow">VERWALTUNG</div><h2>Alle Gaming-Alarme</h2></div><button class="btn primary" type="button" data-action="new-alarm" data-template="custom">+ Alarm anlegen</button></div>${renderAlarmList() }</section>`; }

  function renderAlarmList(limit = Infinity) {
    const alarms = state.alarms.slice().sort((a, b) => (nextOccurrence(a) || Infinity) - (nextOccurrence(b) || Infinity)).slice(0, limit);
    if (!alarms.length) return `<div class="card empty"><div class="empty-icon">+</div><h3>Noch kein Gaming-Alarm</h3><p>Lege eine Bubble, ein GW-Schutzfenster oder ein eigenes Event an.</p><div class="actions"><button class="btn primary" type="button" data-action="new-alarm" data-template="bubble">Bubble anlegen</button></div></div>`;
    return `<div class="alarm-list">${alarms.map(renderAlarmCard).join('')}</div>`;
  }

  function renderAlarmCard(alarm) {
    const eventAt = nextOccurrence(alarm);
    const moments = momentsFor(alarm);
    const stateClass = alarm.active ? 'active-card' : '';
    return `<article class="card alarm-card ${stateClass}"><div class="alarm-head"><div class="alarm-title"><strong>${esc(alarm.title)}</strong><span>${esc(typeLabel(alarm.type))} · ${esc(repeatLabel(alarm.repeat))} · ${esc(SOUNDS[alarm.sound]?.label || 'Pulse')}</span></div><span class="status ${alarm.active ? 'active' : 'paused'}">${alarm.active ? 'AKTIV' : 'PAUSIERT'}</span></div><div class="badges">${alarm.protected ? '<span class="badge gold">GESCHÜTZT</span>' : ''}${alarm.repeat === 'gw5d' ? '<span class="badge blue">24H BUBBLE</span>' : ''}${moments[0] ? `<span class="badge ${moments[0].kind === 'end' ? 'red' : 'mint'}">${esc(momentLabel(moments[0]))}</span>` : ''}</div><div class="alarm-time"><div><small>NÄCHSTER TERMIN</small><strong>${eventAt ? formatDateTime(eventAt) : 'Kein zukünftiger Termin'}</strong></div>${eventAt ? `<span class="time-left">${countdown(eventAt)}</span>` : ''}</div><div class="alarm-actions"><button class="alarm-action" type="button" data-action="edit-alarm" data-id="${esc(alarm.id)}">Bearbeiten</button><button class="alarm-action" type="button" data-action="toggle-alarm" data-id="${esc(alarm.id)}">${alarm.active ? 'Pausieren' : 'Aktivieren'}</button>${eventAt ? `<button class="alarm-action complete" type="button" data-action="complete-alarm" data-id="${esc(alarm.id)}">Erledigt</button>` : ''}<button class="alarm-action" type="button" data-action="duplicate-alarm" data-id="${esc(alarm.id)}">Duplizieren</button><button class="alarm-action delete" type="button" data-action="delete-alarm" data-id="${esc(alarm.id)}">Löschen</button></div></article>`;
  }

  function renderAccountsView() {
    return `<section><div class="section-head"><div><div class="eyebrow">PROFILE</div><h2>Accounts</h2></div><button class="btn primary" type="button" data-action="new-account">+ Account anlegen</button></div><div class="grid grid-2"><div class="card pad"><div class="section-head"><h2>Deine Kommandos</h2><p>${state.accounts.length} angelegt</p></div><div class="account-list">${state.accounts.length ? state.accounts.map((account) => `<div class="account-row ${account.id === state.activeAccountId ? 'selected' : ''}"><span class="account-color" style="background:${esc(account.color)}"></span><div class="account-main"><strong>${esc(account.name)}</strong><small>${accountAlarms(account.id).length} Gaming-Alarme</small></div><div class="account-actions"><button class="btn small ${account.id === state.activeAccountId ? 'ghost' : 'secondary'}" type="button" data-action="select-account" data-id="${esc(account.id)}">${account.id === state.activeAccountId ? 'Aktiv' : 'Auswählen'}</button><button class="btn small ghost" type="button" data-action="edit-account" data-id="${esc(account.id)}">Bearbeiten</button></div></div>`).join('') : '<div class="empty"><div class="empty-icon">+</div><h3>Erstes Kommando anlegen</h3><p>Organisiere Alarme getrennt nach deinen Accounts.</p></div>'}</div></div><div class="card pad"><div class="eyebrow">LOKALER STATUS</div><h2>Alarmzentrale bereit</h2><div class="healthGrid"><div class="note"><strong class="mint">${state.preferences.audioEnabled ? 'Bereit' : 'Wartet'}</strong><br>Gaming-Tonengine</div><div class="note"><strong class="mint">Aktiv</strong><br>Lokale Persistenz</div><div class="note"><strong class="mint">Aktiv</strong><br>Wiederholungslogik</div><div class="note"><strong class="mint">Aktiv</strong><br>GW-Ende-Warnung</div></div></div></div></section>`;
  }

  function renderSoundsView() {
    return `<section><div class="section-head"><div><div class="eyebrow">AUDIO</div><h2>Gaming-Alarmtöne</h2></div><button class="btn primary" type="button" data-action="unlock-audio">${state.preferences.audioEnabled ? 'Audio aktiviert' : 'Audio aktivieren'}</button></div><div class="note"><strong>Einmal aktivieren, dauerhaft bereit.</strong><br>Browser erlauben Audio erst nach einer Nutzeraktion. Danach werden die lokalen Töne für Vorwarnungen, Hauptereignisse und GW-Bubble-Enden verwendet.</div><div class="grid grid-3" style="margin-top:16px">${Object.entries(SOUNDS).map(([key, sound]) => `<article class="card pad"><div class="stat-icon">${esc(sound.symbol)}</div><h2>${esc(sound.label)}</h2><p class="muted">${esc(sound.description)}</p><div class="badges"><span class="badge ${key === 'siren' ? 'red' : key === 'chime' ? 'blue' : 'gold'}">${key === 'siren' ? 'GW' : key === 'chime' ? 'EVENT' : 'BUBBLE'}</span></div><button class="btn secondary full" type="button" data-action="preview-sound" data-sound="${esc(key)}">${state.preferences.audioEnabled ? 'Ton anhören' : 'Audio zuerst aktivieren'}</button></article>`).join('')}</div></section>`;
  }

  function renderSettingsView() {
    return `<section><div class="section-head"><div><div class="eyebrow">KONFIGURATION</div><h2>Einstellungen</h2></div></div><div class="grid grid-2"><div class="card pad"><div class="eyebrow">ALARMVERHALTEN</div><div class="settings-list"><div class="switch-row"><label for="prefWarningSound">Vorwarnungen mit Ton</label><input id="prefWarningSound" data-pref="warningSound" type="checkbox" ${state.preferences.warningSound ? 'checked' : ''}></div><div class="switch-row"><label for="prefEventSound">Hauptereignisse mit Ton</label><input id="prefEventSound" data-pref="eventSound" type="checkbox" ${state.preferences.eventSound ? 'checked' : ''}></div><div class="switch-row"><label for="prefVibration">Vibration auf Mobilgeräten</label><input id="prefVibration" data-pref="vibration" type="checkbox" ${state.preferences.vibration ? 'checked' : ''}></div><div class="switch-row"><label for="prefCritical">Zeitkritische Alarmstärke</label><input id="prefCritical" data-pref="criticalAlerts" type="checkbox" ${state.preferences.criticalAlerts ? 'checked' : ''}></div></div></div><div class="card pad"><div class="eyebrow">DATEN AUF DIESEM GERÄT</div><h2>Backup & Wiederherstellung</h2><p class="muted small">Exportiere Accounts, Alarme, Vorwarnungen, Wiederholungen und Gaming-Ton-Einstellungen als JSON-Datei. Der Import wird vollständig geprüft und atomar übernommen.</p><div class="actions"><button class="btn primary" type="button" data-action="export-backup">Backup exportieren</button><label class="btn secondary">Backup importieren<input id="backupFile" type="file" accept="application/json,.json" hidden></label><button class="btn danger" type="button" data-action="reset-app">Alle lokalen Daten löschen</button></div></div></div><div class="card pad" style="margin-top:16px"><div class="eyebrow">ZEITMODELL</div><h2>Lokale Gerätezeit</h2><p class="muted small">Einmalige und GW-Termine werden als absolute Zeitwerte gespeichert. Tägliche Alarme verwenden die lokale Uhrzeit. Die Anzeige folgt der Gerätezeitzone.</p><div class="grid grid-3"><div class="note"><strong>Gespeichert</strong><br>${esc(state.updatedAt)}</div><div class="note"><strong>Alarme</strong><br>${state.alarms.length}</div><div class="note"><strong>Accounts</strong><br>${state.accounts.length}</div></div></div></section>`;
  }

  function saveAlarm(id) {
    const account = ensureAccount();
    const title = document.getElementById('eTitle')?.value.trim() || '';
    const type = document.getElementById('eType')?.value;
    const date = document.getElementById('eDate')?.value || '';
    const time = document.getElementById('eTime')?.value || '';
    const eventAt = localDateTime(date, time);
    const repeat = document.getElementById('eRepeat')?.value;
    const sound = document.getElementById('eSound')?.value;
    const warnings = [...document.querySelectorAll('input[name="warning"]:checked')].map((input) => Number(input.value)).filter(Number.isInteger).sort((a, b) => b - a);
    if (!title || title.length > MAX_TITLE_LENGTH) return showToast('Bitte eine Bezeichnung mit 1 bis 80 Zeichen eingeben.');
    if (!eventAt) return showToast('Datum oder Uhrzeit ist ungültig.');
    if (!id && repeat === 'once' && eventAt <= now()) return showToast('Ein neuer einmaliger Alarm muss in der Zukunft liegen.');
    if (!['bubble', 'gw', 'custom'].includes(type)) return showToast('Alarmtyp ist ungültig.');
    if (repeat === 'gw5d' && type !== 'gw') return showToast('Der 5-Tage-Zyklus ist nur für GW Bubble verfügbar.');
    if (!['once', 'daily', 'gw5d'].includes(repeat)) return showToast('Wiederholung ist ungültig.');
    if (!SOUNDS[sound]) return showToast('Alarmton ist ungültig.');
    if (!warnings.length) return showToast('Bitte mindestens eine Vorwarnung wählen.');
    const existing = id ? state.alarms.find((alarm) => alarm.id === id) : null;
    const record = {
      id: existing?.id || uid(), accountId: account.id, title, type, eventAt, date, time, repeat, sound, warnings,
      protected: document.getElementById('eProtected')?.checked === true, active: document.getElementById('eActive')?.checked !== false,
      completedOccurrences: existing && existing.eventAt === eventAt && existing.repeat === repeat ? existing.completedOccurrences : {},
      createdAt: existing?.createdAt || iso(now()), updatedAt: iso(now()),
    };
    if (existing) state.alarms = state.alarms.map((alarm) => alarm.id === id ? record : alarm); else state.alarms.push(record);
    persist(); closeModal(); render(); showToast(existing ? 'Alarm gespeichert.' : 'Gaming-Alarm angelegt.');
  }

  function saveAccount(id) {
    const name = document.getElementById('accountName')?.value.trim() || '';
    const color = document.getElementById('accountColor')?.value || '#F4C969';
    if (!name || name.length > 80) return showToast('Bitte eine Bezeichnung mit 1 bis 80 Zeichen eingeben.');
    if (id) {
      const account = state.accounts.find((item) => item.id === id);
      if (account) { account.name = name; account.color = color; }
    } else {
      const account = { id: uid(), name, color, createdAt: iso(now()) };
      state.accounts.push(account);
      if (!state.activeAccountId) state.activeAccountId = account.id;
    }
    persist(); closeModal(); render(); showToast('Account gespeichert.');
  }

  function completeAlarm(id) {
    const alarm = state.alarms.find((item) => item.id === id);
    const eventAt = alarm && nextOccurrence(alarm);
    if (!alarm || !eventAt) return showToast('Für diesen Alarm gibt es keinen offenen Termin.');
    alarm.completedOccurrences[occurrenceKey(alarm, eventAt)] = true;
    alarm.updatedAt = iso(now());
    persist(); render(); showToast('Termin erledigt.');
  }

  function toggleAlarm(id) {
    const alarm = state.alarms.find((item) => item.id === id);
    if (!alarm) return;
    alarm.active = !alarm.active;
    alarm.updatedAt = iso(now());
    persist(); render(); showToast(alarm.active ? 'Alarm aktiviert.' : 'Alarm pausiert.');
  }

  function duplicateAlarm(id) {
    const source = state.alarms.find((item) => item.id === id);
    if (!source) return;
    const copy = { ...source, id: uid(), title: `${source.title} Kopie`.slice(0, MAX_TITLE_LENGTH), active: false, createdAt: iso(now()), updatedAt: iso(now()), completedOccurrences: {} };
    state.alarms.push(copy);
    persist(); render(); showToast('Alarm dupliziert und pausiert gespeichert.');
  }

  function deleteAlarm(id) {
    const alarm = state.alarms.find((item) => item.id === id);
    if (!alarm || !window.confirm(`„${alarm.title}“ wirklich löschen?`)) return;
    state.alarms = state.alarms.filter((item) => item.id !== id);
    Object.keys(state.firedMoments).filter((key) => key.startsWith(`${id}|`)).forEach((key) => delete state.firedMoments[key]);
    persist(); render(); showToast('Alarm gelöscht.');
  }

  function makeBackup() { return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: iso(now()), schemaVersion: SCHEMA_VERSION, data: state }; }

  function validateBackup(value) {
    if (!value || typeof value !== 'object' || value.format !== BACKUP_FORMAT || value.version !== BACKUP_VERSION || value.schemaVersion !== SCHEMA_VERSION || !value.data || typeof value.data !== 'object') throw new Error('Backupformat oder Version ungültig.');
    const candidate = normalize(value.data);
    if (!candidate.accounts.length && value.data.accounts?.length) throw new Error('Accountdaten im Backup sind ungültig.');
    if (Array.isArray(value.data.alarms) && candidate.alarms.length !== value.data.alarms.length) throw new Error('Alarmdaten im Backup sind ungültig.');
    return candidate;
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(makeBackup(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tgm-alarm-center-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Backup exportiert.');
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const candidate = validateBackup(JSON.parse(await file.text()));
      state = candidate;
      persist();
      render();
      showToast('Backup vollständig wiederhergestellt.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Backup konnte nicht importiert werden.'); }
  }

  function resetApp() {
    if (!window.confirm('Alle lokalen Accounts und Gaming-Alarme löschen?')) return;
    state = emptyState();
    persist();
    render();
    showToast('Lokale Daten gelöscht.');
  }

  function closeModal() { modalRoot.innerHTML = ''; modalMode = null; editingId = null; document.body.classList.remove('modal-open'); }

  function handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'view') { view = button.dataset.view || 'today'; render(); return; }
    if (action === 'unlock-audio') { unlockAudio(); return; }
    if (action === 'new-alarm') { openEditor(null, button.dataset.template || 'custom'); return; }
    if (action === 'edit-alarm') { openEditor(button.dataset.id); return; }
    if (action === 'save-alarm') { saveAlarm(button.dataset.id || null); return; }
    if (action === 'close-modal') { closeModal(); return; }
    if (action === 'preview-sound') { const sound = button.dataset.sound || 'pulse'; if (!state.preferences.audioEnabled) { unlockAudio().then(() => playSound(sound)); } else playSound(sound); return; }
    if (action === 'toggle-alarm') { toggleAlarm(button.dataset.id); return; }
    if (action === 'complete-alarm') { completeAlarm(button.dataset.id); return; }
    if (action === 'duplicate-alarm') { duplicateAlarm(button.dataset.id); return; }
    if (action === 'delete-alarm') { deleteAlarm(button.dataset.id); return; }
    if (action === 'new-account') { openAccountEditor(); return; }
    if (action === 'edit-account') { openAccountEditor(button.dataset.id); return; }
    if (action === 'save-account') { saveAccount(button.dataset.id || null); return; }
    if (action === 'select-account') { state.activeAccountId = button.dataset.id; persist(); render(); showToast('Account aktiviert.'); return; }
    if (action === 'export-backup') { exportBackup(); return; }
    if (action === 'reset-app') { resetApp(); return; }
    if (action === 'dismiss-alert') { dismissAlert(); return; }
  }

  function handleChange(event) {
    const preference = event.target.closest('[data-pref]');
    if (preference) {
      state.preferences[preference.dataset.pref] = preference.checked;
      persist();
      showToast('Einstellung gespeichert.');
    }
    if (event.target.id === 'backupFile') importBackup(event.target.files?.[0]);
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modalMode) closeModal(); if (event.key === 'Escape' && overlayRoot.classList.contains('show')) dismissAlert(); });
  window.addEventListener('focus', fireDueMoments);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fireDueMoments(); });
  state = loadState();
  ticker = window.setInterval(() => { fireDueMoments(); render(); }, 1000);
  window.addEventListener('beforeunload', () => window.clearInterval(ticker));
  render();
})();
