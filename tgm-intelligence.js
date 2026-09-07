(() => {
  'use strict';

  const STORE = 'tgm-alarm-center-web-v2';
  const INT_STORE = 'tgm-alarm-center-intelligence-v1';
  const MAX = 2000;
  const DAY = 86400000;
  const BROWSER_CRYPTO = globalThis.crypto;
  const TYPE_MAP = {
    gw: { type: 'gw', repeat: 'gw5d', sound: 'siren', warnings: [1440, 360, 60, 15], protected: true },
    bubble: { type: 'bubble', repeat: 'once', sound: 'siren', warnings: [60, 15], protected: true },
    event: { type: 'custom', repeat: 'once', sound: 'pulse', warnings: [15], protected: false },
    protection: { type: 'custom', repeat: 'once', sound: 'pulse', warnings: [60, 15], protected: true },
    resource: { type: 'individual', repeat: 'once', sound: 'pulse', warnings: [15], protected: false },
    training: { type: 'individual', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
    upgrade: { type: 'individual', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
    faction: { type: 'custom', repeat: 'daily', sound: 'pulse', warnings: [30, 15], protected: false },
    'insignia-goal': { type: 'individual', repeat: 'daily', sound: 'chime', warnings: [60, 15], protected: false },
    'family-currency-goal': { type: 'individual', repeat: 'daily', sound: 'chime', warnings: [60, 15], protected: false },
    'helicopter-training': { type: 'individual', repeat: 'once', sound: 'chime', warnings: [60, 15], protected: false },
    'resource-goal': { type: 'individual', repeat: 'daily', sound: 'pulse', warnings: [60, 15], protected: false },
    'gw-reward': { type: 'custom', repeat: 'once', sound: 'chime', warnings: [360, 60, 15], protected: true },
    'gw-prep': { type: 'gw', repeat: 'gw5d', sound: 'siren', warnings: [1440, 360, 60, 15], protected: true },
    'custom-operation': { type: 'custom', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
  };
  const CATEGORY_LABEL = {
    gw: 'GW', bubble: 'Bubble', event: 'Event', protection: 'Schutz', resource: 'Ressourcen', training: 'Training', upgrade: 'Upgrade', faction: 'Fraktion',
    'insignia-goal': 'Insignia Ziel', 'family-currency-goal': 'Family Currency Ziel', 'helicopter-training': 'Helikopter Training', 'resource-goal': 'Ressourcen Ziel',
    'gw-reward': 'GW Reward', 'gw-prep': 'GW Vorbereitung', 'custom-operation': 'Eigener Vorgang',
  };
  const CATEGORY_OPTIONS = Object.keys(TYPE_MAP);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (BROWSER_CRYPTO && typeof BROWSER_CRYPTO.randomUUID === 'function' ? BROWSER_CRYPTO.randomUUID() : `int-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fmt = (ms) => Number.isFinite(ms) ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms)) : '—';
  const short = (ms) => Number.isFinite(ms) ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : '—';
  const iso = (ms) => new Date(ms).toISOString();
  const parseLocal = (date, time) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time))) return NaN;
    const [y,m,d] = String(date).split('-').map(Number); const [h,min] = String(time).split(':').map(Number);
    const candidate = new Date(y, m - 1, d, h, min, 0, 0);
    return candidate.getFullYear() === y && candidate.getMonth() === m - 1 && candidate.getDate() === d && candidate.getHours() === h && candidate.getMinutes() === min ? candidate.getTime() : NaN;
  };
  const dateValue = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const timeValue = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

  let model = null;
  let tab = 'overview';
  let lastMounted = 0;

  const empty = () => ({ version: 1, records: [], updatedAt: iso(Date.now()) });
  const load = () => { try { const raw = localStorage.getItem(INT_STORE); const parsed = raw ? JSON.parse(raw) : null; return parsed && parsed.version === 1 && Array.isArray(parsed.records) ? parsed : empty(); } catch { return empty(); } };
  const save = () => { model.updatedAt = iso(Date.now()); localStorage.setItem(INT_STORE, JSON.stringify(model)); };
  const appState = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } };
  const account = () => { const s = appState(); return s?.accounts?.find((a) => a.id === s.activeAccountId) || s?.accounts?.[0] || null; };
  const tier = () => { const s = appState(); return s?.freeTrialEndsAt && Date.parse(s.freeTrialEndsAt) > Date.now() ? 'godfather' : (s?.tier || 'free'); };
  const limits = {
    free: { accounts: 1, bubble: 1, custom: 1, individual: 0, rss: 0 }, streetBoss: { accounts: 2, bubble: 1, custom: 1, individual: 0, rss: 0 },
    caporegime: { accounts: 3, bubble: 1, custom: 1, individual: 1, rss: 0 }, underboss: { accounts: 5, bubble: 1, custom: 1, individual: 1, rss: 1 },
    boss: { accounts: 10, bubble: 1, custom: 2, individual: 2, rss: 2 }, godfather: { accounts: Infinity, bubble: Infinity, custom: Infinity, individual: Infinity, rss: Infinity },
  };
  const countType = (s, aid, type) => (s?.alarms || []).filter((a) => a.accountId === aid && a.type === type).length;
  const canCreate = (type) => {
    const s = appState(); const a = account(); if (!s || !a) return false;
    const lim = limits[tier()] || limits.free; const key = type === 'gw' ? 'bubble' : type;
    return Number.isFinite(lim[key]) ? countType(s, a.id, type) < lim[key] : true;
  };
  const toast = (message) => { const root = document.getElementById('toast'); if (!root) return; root.textContent = message; root.classList.add('show'); setTimeout(() => root.classList.remove('show'), 2800); };

  function createAlarms(definitions) {
    const s = appState(); const a = account(); if (!s || !a) { toast('Lege zuerst einen Account an.'); return []; }
    const existing = Array.isArray(s.alarms) ? s.alarms : [];
    const additions = [];
    for (const def of definitions) {
      if (!Number.isFinite(def.eventAt)) { toast('Ungültiger Alarmzeitpunkt.'); continue; }
      if (def.eventAt <= Date.now() && def.repeat === 'once') continue;
      if (!canCreate(def.type)) { toast('Der aktuelle Plan erreicht das Alarm-Limit für diesen Alarmtyp.'); break; }
      const id = uid();
      additions.push({ id, accountId: a.id, title: String(def.title).trim().slice(0, 80), type: def.type, eventAt: def.eventAt, date: dateValue(def.eventAt), time: timeValue(def.eventAt), warnings: [...new Set(def.warnings || [15])].sort((x,y)=>y-x), repeat: def.repeat || 'once', sound: def.sound || 'pulse', active: true, protected: Boolean(def.protected), completedOccurrences: {}, createdAt: iso(Date.now()), updatedAt: iso(Date.now()) });
    }
    if (!additions.length) return [];
    s.alarms = existing.concat(additions);
    localStorage.setItem(STORE, JSON.stringify(s));
    window.dispatchEvent(new Event('tgm-intelligence-alarm-created'));
    return additions.map((x) => x.id);
  }

  function pushRecord(record) {
    model.records.unshift({ id: uid(), createdAt: iso(Date.now()), status: 'planned', ...record });
    if (model.records.length > MAX) model.records = model.records.slice(0, MAX);
    save(); render();
  }

  function categorySelect(value, label = 'Kategorie') {
    return `<div class="tgm-int-field"><label>${esc(label)}</label><select name="category">${CATEGORY_OPTIONS.map((k) => `<option value="${k}" ${k === value ? 'selected' : ''}>${esc(CATEGORY_LABEL[k])}</option>`).join('')}</select></div>`;
  }
  function eventForm() {
    const base = Date.now() + 2 * 3600000; return `<form class="tgm-int-form" data-int-form="event"><div class="tgm-int-form grid-2"><div class="tgm-int-field"><label>Bezeichnung</label><input name="title" maxlength="80" value="Event Alarm"></div>${categorySelect('event')}</div><div class="tgm-int-form grid-2"><div class="tgm-int-field"><label>Datum</label><input name="date" type="date" value="${dateValue(base)}"></div><div class="tgm-int-field"><label>Uhrzeit</label><input name="time" type="time" value="${timeValue(base)}"></div></div><div class="tgm-int-field"><label>Vorwarnungen</label><div class="tgm-int-checks">${[1440,360,60,30,15].map((v) => `<label class="tgm-int-check"><input type="checkbox" name="warning" value="${v}" ${v === 15 ? 'checked' : ''}>${v >= 60 ? `${Math.round(v/60)} Std.` : `${v} Min.`}</label>`).join('')}</div></div><div class="tgm-int-buttons"><button class="tgm-int-button primary" type="submit">Event als Alarm planen</button></div></form>`;
  }
  function goalForm() { const deadline = Date.now()+DAY; return `<form class="tgm-int-form" data-int-form="goal"><div class="tgm-int-form grid-3"><div class="tgm-int-field"><label>Zieltyp</label><select name="category"><option value="insignia-goal">Insignia</option><option value="family-currency-goal">Family Currency</option><option value="resource-goal">Ressourcen</option></select></div><div class="tgm-int-field"><label>Aktuell</label><input name="current" type="number" min="0" step="any" value="0"></div><div class="tgm-int-field"><label>Ziel</label><input name="target" type="number" min="0.0001" step="any" value="100"></div></div><div class="tgm-int-form grid-2"><div class="tgm-int-field"><label>Einheit</label><input name="unit" maxlength="24" value="Punkte"></div><div class="tgm-int-field"><label>Deadline</label><input name="deadline" type="datetime-local" value="${new Date(deadline).toISOString().slice(0,16)}"></div></div><div class="tgm-int-buttons"><button class="tgm-int-button primary" type="submit">Zielalarm anlegen</button></div></form>`; }
  function factionForm() { const at = Date.now()+DAY; return `<form class="tgm-int-form" data-int-form="faction"><div class="tgm-int-form grid-3"><div class="tgm-int-field"><label>Fraktionsname</label><input name="title" maxlength="80" value="Faction Reminder"></div><div class="tgm-int-field"><label>Fehlende Mitglieder</label><input name="missing" type="number" min="1" value="1"></div><div class="tgm-int-field"><label>Mitglieder gesamt</label><input name="total" type="number" min="1" value="10"></div></div><div class="tgm-int-form grid-2"><div class="tgm-int-field"><label>Nächste Erinnerung</label><input name="date" type="date" value="${dateValue(at)}"></div><div class="tgm-int-field"><label>Uhrzeit</label><input name="time" type="time" value="${timeValue(at)}"></div></div><div class="tgm-int-buttons"><button class="tgm-int-button primary" type="submit">Fraktions-Erinnerung planen</button></div></form>`; }
  function gwForm() { const base = Date.now()+DAY; return `<form class="tgm-int-form" data-int-form="gw"><div class="tgm-int-form grid-2"><div class="tgm-int-field"><label>Zyklus-ID</label><input name="cycle" maxlength="40" value="GW-${new Date().toISOString().slice(0,10)}"></div><div class="tgm-int-field"><label>Account</label><input value="${esc(account()?.name || 'Kein Account')}" disabled></div></div><div class="tgm-int-form grid-2"><div class="tgm-int-field"><label>GW Start</label><input name="start" type="datetime-local" value="${new Date(base).toISOString().slice(0,16)}"></div><div class="tgm-int-field"><label>GW Ende</label><input name="end" type="datetime-local" value="${new Date(base+DAY).toISOString().slice(0,16)}"></div></div><div class="tgm-int-form grid-3"><div class="tgm-int-field"><label>GW Bubble</label><input name="bubble" type="datetime-local" value="${new Date(base+2*3600000).toISOString().slice(0,16)}"></div><div class="tgm-int-field"><label>Reward Deadline</label><input name="reward" type="datetime-local" value="${new Date(base+DAY+2*3600000).toISOString().slice(0,16)}"></div><div class="tgm-int-field"><label>Vorbereitung</label><input name="prep" type="datetime-local" value="${new Date(base-6*3600000).toISOString().slice(0,16)}"></div></div><div class="tgm-int-buttons"><button class="tgm-int-button primary" type="submit">GW Command Center planen</button></div></form>`; }

  const templates = [
    ['bubble','Bubble Schutz','Bubble Schutzfenster planen'], ['gw','GW Zyklus','GW Start, Ende und Schutzfenster'], ['event','Event Alarm','Freies Event mit Vorwarnung'], ['protection','Schutzende','Schutzende als Termin'],
    ['resource','Ressourcen','Ressourcen-Fortschritt'], ['training','Training','Trainingsabschluss'], ['upgrade','Upgrade','Upgrade-Abschluss'], ['faction','Fraktion','Fraktions-Erinnerung'],
    ['insignia-goal','Insignia Ziel','Insignia-Fortschritt'], ['family-currency-goal','Family Currency Ziel','Family Currency-Fortschritt'], ['helicopter-training','Helikopter Training','Trainingsabschluss'], ['resource-goal','Ressourcen Ziel','Ressourcen-Meilenstein'],
  ];
  function templateCards() { return `<div class="tgm-int-list">${templates.map(([cat,title,desc]) => `<div class="tgm-int-row"><span class="tgm-int-dot"></span><div><strong>${esc(title)}</strong><small>${esc(desc)}</small></div><button class="tgm-int-button" data-int-action="template" data-category="${cat}">Anlegen</button></div>`).join('')}</div>`; }

  function recordsForCalendar() {
    const s = appState(); const alarms = (s?.alarms || []).filter((a) => a.accountId === account()?.id).map((a) => ({ id: a.id, title: a.title, at: a.eventAt, type: a.type, source: 'alarm' }));
    const int = model.records.map((r) => ({ id: r.id, title: r.title, at: Date.parse(r.scheduledAt || r.deadlineAt || r.startAt), type: r.category, source: r.kind }));
    return [...alarms, ...int].filter((x) => Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);
  }

  function overview() {
    const upcoming = recordsForCalendar().filter((x) => x.at >= Date.now()).slice(0,8); const planned = model.records.filter((r)=>r.status==='planned').length; const done = model.records.filter((r)=>r.status==='done').length;
    return `<div class="tgm-int-grid"><article class="tgm-int-card"><div class="tgm-int-kicker">ALARM BRIDGE</div><div class="tgm-int-metric">${planned}</div><p>Geplante Intelligence-Vorgänge</p></article><article class="tgm-int-card"><div class="tgm-int-kicker">VERLAUF</div><div class="tgm-int-metric">${done}</div><p>Abgeschlossene Vorgänge</p></article><article class="tgm-int-card"><div class="tgm-int-kicker">KALENDER</div><div class="tgm-int-metric">${upcoming.length}</div><p>Nächste Termine</p></article><article class="tgm-int-card wide"><div class="tgm-int-kicker">NÄCHSTE ALARME</div><div class="tgm-int-list">${upcoming.length ? upcoming.map((x)=>`<div class="tgm-int-row"><span class="tgm-int-dot"></span><div><strong>${esc(x.title)}</strong><small>${esc(typeof x.type==='string'&&CATEGORY_LABEL[x.type]?CATEGORY_LABEL[x.type]:'Alarm')} · ${esc(fmt(x.at))}</small></div><span class="tgm-int-badge">${esc(x.source==='alarm'?'ALARM':'INTELLIGENCE')}</span></div>`).join('') : '<div class="tgm-int-empty">Noch keine Termine angelegt.</div>'}</div></article><article class="tgm-int-card wide"><div class="tgm-int-kicker">SMART TEMPLATES</div><h2>Planbare Operationen</h2><p>Jede Vorlage erzeugt echte lokale Alarme und bleibt in der lokalen Datenhaltung erhalten.</p>${templateCards()}</div></div>`;
  }
  function eventView(){ return `<div class="tgm-int-grid"><article class="tgm-int-card wide"><div class="tgm-int-kicker">EVENT INBOX</div><h2>Event erfassen</h2><p>Erfasse einen Termin und übergib ihn direkt an die lokale Alarmplanung.</p>${eventForm()}</article><article class="tgm-int-card"><div class="tgm-int-kicker">EVENT HISTORY</div><h2>Verlauf</h2><div class="tgm-int-list">${model.records.filter(r=>r.kind==='event').slice(0,12).map((r)=>`<div class="tgm-int-row"><span class="tgm-int-dot ${r.status==='done'?'gold':''}"></span><div><strong>${esc(r.title)}</strong><small>${esc(fmt(Date.parse(r.scheduledAt)))}</small></div><button class="tgm-int-button" data-int-action="done" data-id="${r.id}">${r.status==='done'?'OK':'Erledigt'}</button></div>`).join('') || '<div class="tgm-int-empty">Noch kein Event-Verlauf.</div>'}</div></article></div>`; }
  function gwView(){ return `<div class="tgm-int-grid"><article class="tgm-int-card wide"><div class="tgm-int-kicker">GW COMMAND CENTER</div><h2>GW-Zyklus planen</h2><p>Ein Zyklus erzeugt Start, Ende sowie optionale Bubble-, Reward- und Vorbereitungsalarme.</p>${gwForm()}</article><article class="tgm-int-card"><div class="tgm-int-kicker">GEPLANTE ZYKLEN</div><div class="tgm-int-list">${model.records.filter(r=>r.kind==='gw').slice(0,10).map(r=>`<div class="tgm-int-row"><span class="tgm-int-dot"></span><div><strong>${esc(r.title)}</strong><small>${esc(fmt(Date.parse(r.scheduledAt)))}</small></div><span class="tgm-int-badge gold">GW</span></div>`).join('') || '<div class="tgm-int-empty">Noch kein GW-Zyklus angelegt.</div>'}</div></article></div>`; }
  function goalView(){ return `<div class="tgm-int-grid"><article class="tgm-int-card wide"><div class="tgm-int-kicker">GOAL ALARMS</div><h2>Ziel → Alarm</h2><p>Ein Fortschrittsziel erhält eine Deadline und einen echten lokalen Alarm.</p>${goalForm()}</article><article class="tgm-int-card"><div class="tgm-int-kicker">FACTION REMINDERS</div><h2>Fehlende Mitglieder</h2><p>Nutze die gleiche Alarmbrücke für tägliche Fraktions-Erinnerungen.</p>${factionForm()}</article><article class="tgm-int-card full"><div class="tgm-int-kicker">AKTIVE ZIELE</div><div class="tgm-int-list">${model.records.filter(r=>r.kind==='goal'||r.kind==='faction').slice(0,20).map(r=>`<div class="tgm-int-row"><span class="tgm-int-dot"></span><div><strong>${esc(r.title)}</strong><small>${esc(CATEGORY_LABEL[r.category]||r.category)} · ${esc(fmt(Date.parse(r.scheduledAt||r.deadlineAt)))}</small></div><span class="tgm-int-badge">${r.status==='done'?'ERLEDIGT':'GEPLANT'}</span></div>`).join('') || '<div class="tgm-int-empty">Noch keine Ziele oder Erinnerungen.</div>'}</div></article></div>`; }
  function calendarView(){ const rows=recordsForCalendar().filter(x=>x.at>=Date.now()).slice(0,60); return `<article class="tgm-int-card full"><div class="tgm-int-kicker">PERSONAL TGM CALENDAR</div><h2>Persönlicher Kalender</h2><p>Alarme und Intelligence-Termine werden nach lokaler Gerätezeit zusammengeführt.</p><div class="tgm-int-calendar">${rows.length ? rows.map(x=>`<div class="tgm-int-cal-row"><span class="tgm-int-cal-time">${esc(short(x.at))}</span><div><strong>${esc(x.title)}</strong><small>${esc(CATEGORY_LABEL[x.type]||x.type||'Alarm')}</small></div><span class="tgm-int-badge">${esc(x.source==='alarm'?'ALARM':'PLAN')}</span></div>`).join('') : '<div class="tgm-int-empty">Keine kommenden Termine.</div>'}</div></article>`; }
  function renderBody(){ return tab==='events' ? eventView() : tab==='gw' ? gwView() : tab==='goals' ? goalView() : tab==='calendar' ? calendarView() : overview(); }
  function render(){
    const app=document.getElementById('app'); if(!app || location.hash.slice(1)!=='intelligence') return;
    lastMounted=Date.now(); app.innerHTML=`<div class="app-shell"><header class="topbar"><div class="toprow"><button class="crest-button" type="button" data-int-action="leave"><span class="brand-mark">TGM</span></button><div class="header-title">TGM ALARM-CENTER</div><button class="live-button" type="button" data-int-action="leave"><span class="live-dot"></span><span>LIVE</span></button></div><div class="tgm-int-nav"><span class="tgm-int-badge">INTELLIGENCE</span></div></header><main class="main"><section class="tgm-intelligence"><div class="tgm-int-header"><div><div class="tgm-int-kicker">TGM INTELLIGENCE</div><h1>Planer & Alarm Bridge</h1><p>Events, Ziele, GW, Fraktion und persönlicher Kalender werden direkt in die lokale Alarmplanung überführt.</p></div><div class="tgm-int-actions"><button class="tgm-int-button" data-int-action="refresh">Aktualisieren</button><button class="tgm-int-button ghost" data-int-action="leave">Zurück</button></div></div><div class="tgm-int-tabs">${[['overview','Übersicht'],['events','Events'],['gw','GW Command Center'],['goals','Ziele & Fraktion'],['calendar','Kalender']].map(([k,l])=>`<button class="tgm-int-tab ${tab===k?'active':''}" data-int-action="tab" data-tab="${k}">${l}</button>`).join('')}</div>${renderBody()}</section></main></div>`;
  }

  function handleForm(form){
    const data=new FormData(form); const a=account(); if(!a){toast('Lege zuerst einen Account an.');return;}
    if(form.dataset.intForm==='event'){
      const eventAt=parseLocal(data.get('date'),data.get('time')); const category=String(data.get('category') || 'event'); const config=TYPE_MAP[category]; const warnings=[...form.querySelectorAll('input[name="warning"]:checked')].map(x=>Number(x.value));
      if(!Number.isFinite(eventAt)||eventAt<=Date.now()||!config||!warnings.length){toast('Eventdaten sind ungültig.');return;} const title=String(data.get('title')||'Event Alarm').trim(); const ids=createAlarms([{title,type:config.type,repeat:config.repeat,sound:config.sound,warnings,protected:config.protected,eventAt}]); if(!ids.length)return; pushRecord({kind:'event',category,title,accountId:a.id,scheduledAt:iso(eventAt),linkedAlarmIds:ids}); toast('Event wurde als Alarm geplant.');
    }
    if(form.dataset.intForm==='goal'){
      const category=String(data.get('category')); const current=Number(data.get('current')); const target=Number(data.get('target')); const unit=String(data.get('unit')||'').trim(); const deadlineInput=String(data.get('deadline')); const deadline=Date.parse(deadlineInput);
      if(!Number.isFinite(current)||!Number.isFinite(target)||current<0||target<=current||!unit||!Number.isFinite(deadline)||deadline<=Date.now()){toast('Zielwerte oder Deadline sind ungültig.');return;} const cfg=TYPE_MAP[category]; const title=`${CATEGORY_LABEL[category]}: ${target} ${unit}`; const ids=createAlarms([{title,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:false,eventAt:deadline}]); if(!ids.length)return; pushRecord({kind:'goal',category,title,accountId:a.id,current,target,unit,deadlineAt:iso(deadline),scheduledAt:iso(deadline),linkedAlarmIds:ids}); toast('Zielalarm wurde angelegt.');
    }
    if(form.dataset.intForm==='faction'){
      const missing=Number(data.get('missing')); const total=Number(data.get('total')); const eventAt=parseLocal(data.get('date'),data.get('time')); const title=String(data.get('title')||'Faction Reminder').trim(); const cfg=TYPE_MAP.faction;
      if(!Number.isInteger(missing)||!Number.isInteger(total)||missing<1||total<missing||!Number.isFinite(eventAt)||eventAt<=Date.now()){toast('Fraktionsdaten sind ungültig.');return;} const ids=createAlarms([{title:`${title}: ${missing} fehlend`,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:false,eventAt}]); if(!ids.length)return; pushRecord({kind:'faction',category:'faction',title,accountId:a.id,missingMembers:missing,totalMembers:total,scheduledAt:iso(eventAt),linkedAlarmIds:ids}); toast('Fraktions-Erinnerung wurde angelegt.');
    }
    if(form.dataset.intForm==='gw'){
      const cycle=String(data.get('cycle')||'').trim(); const start=Date.parse(String(data.get('start'))); const end=Date.parse(String(data.get('end'))); const bubble=Date.parse(String(data.get('bubble'))); const reward=Date.parse(String(data.get('reward'))); const prep=Date.parse(String(data.get('prep'))); const defs=[];
      if(!cycle||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||start<=Date.now()){toast('GW-Zeitpunkte sind ungültig.');return;}
      defs.push({title:'GW Start',type:'gw',repeat:'gw5d',sound:'siren',warnings:[1440,360,60,15],protected:true,eventAt:start}); defs.push({title:'GW Ende',type:'custom',repeat:'once',sound:'chime',warnings:[360,60,15],protected:true,eventAt:end}); if(Number.isFinite(bubble)&&bubble>start)defs.push({title:'GW Bubble',type:'gw',repeat:'gw5d',sound:'siren',warnings:[1440,360,60,15],protected:true,eventAt:bubble}); if(Number.isFinite(reward)&&reward>end)defs.push({title:'GW Reward',type:'custom',repeat:'once',sound:'chime',warnings:[360,60,15],protected:true,eventAt:reward}); if(Number.isFinite(prep)&&prep>0&&prep<start)defs.push({title:'GW Vorbereitung',type:'gw',repeat:'gw5d',sound:'siren',warnings:[1440,360,60,15],protected:true,eventAt:prep});
      const ids=[]; for(const d of defs){ const created=createAlarms([d]); ids.push(...created); } if(!ids.length)return; pushRecord({kind:'gw',category:'gw',title:`GW ${cycle}`,accountId:a.id,scheduledAt:iso(start),startAt:iso(start),endAt:iso(end),linkedAlarmIds:ids,cycleId:cycle}); toast('GW Command Center wurde geplant.');
    }
  }

  function template(category){ const a=account(); const cfg=TYPE_MAP[category]; if(!a||!cfg){toast('Vorlage konnte nicht angelegt werden.');return;} const eventAt=Date.now()+2*3600000; const title=CATEGORY_LABEL[category] || category; const ids=createAlarms([{title,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:cfg.protected,eventAt}]); if(!ids.length)return; pushRecord({kind:'template',category,title,accountId:a.id,scheduledAt:iso(eventAt),linkedAlarmIds:ids}); toast(`${title} wurde als Alarm angelegt.`); }

  document.addEventListener('click',(event)=>{
    const target=event.target.closest('[data-int-action]'); if(!target) return;
    if(location.hash.slice(1)==='intelligence' || target.dataset.intAction==='leave' || target.dataset.intAction==='tab') event.stopImmediatePropagation();
    const action=target.dataset.intAction;
    if(action==='leave'){ location.hash='today'; return; }
    if(action==='tab'){ tab=target.dataset.tab||'overview'; render(); return; }
    if(action==='refresh'){ model=load(); render(); return; }
    if(action==='template'){ template(target.dataset.category); return; }
    if(action==='done'){ const r=model.records.find(x=>x.id===target.dataset.id); if(r){r.status='done';save();render();} return; }
  },true);
  document.addEventListener('submit',(event)=>{ const form=event.target.closest('[data-int-form]'); if(!form||location.hash.slice(1)!=='intelligence')return; event.preventDefault(); event.stopImmediatePropagation(); handleForm(form); },true);

  function enhanceNavigation(){
    const nav=document.querySelector('.nav'); if(!nav) return;
    if(!nav.querySelector('[data-tgm-intelligence-link]')){ const b=document.createElement('button'); b.type='button'; b.className='tgm-int-nav'; b.textContent='Intelligence'; b.dataset.tgmIntelligenceLink='1'; b.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();location.hash='intelligence';render();},{capture:true}); nav.appendChild(b); }
  }
  function sync(){
    if(location.hash.slice(1)==='intelligence'){ if(Date.now()-lastMounted>250) render(); }
    else enhanceNavigation();
  }
  model=load();
  const app=document.getElementById('app');
  const observer = new MutationObserver(sync); observer.observe(app||document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>{ if(location.hash.slice(1)==='intelligence')render(); else setTimeout(enhanceNavigation,0); });
  const boot=()=>{ sync(); if(location.hash.slice(1)==='intelligence')render(); }; setTimeout(boot,250); setTimeout(boot,1000); setTimeout(boot,2000);
})();