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
  function templateCards() { return `<div class="tgm-int-list">${templates.map(([cat,title,desc]) => `<div class="tgm-int-row"><span class="tgm-int-dot"></span><div><strong>${esc(title)}</strong><small>${esc(desc)}</small></div><button class="tgm-int-button" data-int-action="template" data-category="${cat}">Planen</button></div>`).join('')}</div>`; }

  function recordsForCalendar(){
    const s=appState(); const aid=account()?.id; const alarms=(s?.alarms||[]).filter(a=>a.accountId===aid).map(a=>({at:Number(a.eventAt),title:a.title,type:a.type,source:'alarm'}));
    const records=model.records.filter(r=>r.accountId===aid).map(r=>({at:Date.parse(r.scheduledAt||r.deadlineAt),title:r.title,type:r.category,source:'plan'}));
    return alarms.concat(records).filter(x=>Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);
  }

  function overview(){ return `<div class="tgm-int-grid"><article class="tgm-int-card wide"><div class="tgm-int-kicker">EVENT → ALARM</div><h2>Alarm Bridge</h2><p>Erzeuge aus Event-, Ziel- und Fraktionsdaten echte lokale Alarme mit den vorhandenen Vorwarnregeln.</p><div class="tgm-int-buttons"><button class="tgm-int-button primary" data-int-action="tab" data-tab="events">Event erfassen</button><button class="tgm-int-button" data-int-action="tab" data-tab="goals">Ziele & Fraktion</button><button class="tgm-int-button" data-int-action="tab" data-tab="gw">GW Command Center</button></div></article><article class="tgm-int-card"><div class="tgm-int-kicker">SMART TEMPLATES</div><h2>Schnellplanung</h2>${templateCards()}</article><article class="tgm-int-card"><div class="tgm-int-kicker">PERSONAL TGM CALENDAR</div><h2>Kalender</h2><p>${recordsForCalendar().filter(x=>x.at>=Date.now()).length} kommende Einträge werden aus Alarmen und Planungen zusammengeführt.</p><button class="tgm-int-button" data-int-action="tab" data-tab="calendar">Kalender öffnen</button></article></div>`; }
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
    const data=new globalThis.FormData(form); const a=account(); if(!a){toast('Lege zuerst einen Account an.');return;}
    if(form.dataset.intForm==='event'){
      const eventAt=parseLocal(data.get('date'),data.get('time')); const category=String(data.get('category') || 'event'); const config=TYPE_MAP[category]; const warnings=[...form.querySelectorAll('input[name="warning"]:checked')].map(x=>Number(x.value));
      if(!Number.isFinite(eventAt)||eventAt<=Date.now()||!config||!warnings.length){toast('Eventdaten sind ungültig.');return;} const title=String(data.get('title')||'Event Alarm').trim(); const ids=createAlarms([{title,type:config.type,repeat:config.repeat,sound:config.sound,warnings,protected:config.protected,eventAt}]); if(!ids.length)return; pushRecord({kind:'event',category,title,accountId:a.id,scheduledAt:iso(eventAt),linkedAlarmIds:ids}); toast('Event wurde als Alarm geplant.');
    }
    if(form.dataset.intForm==='goal'){
      const category=String(data.get('category')); const current=Number(data.get('current')); const target=Number(data.get('target')); const unit=String(data.get('unit')||'').trim(); const deadlineInput=String(data.get('deadline')); const deadline=Date.parse(deadlineInput);
      if(!Number.isFinite(current)||!Number.isFinite(target)||current<0||target<=current||!unit||!Number.isFinite(deadline)||deadline<=Date.now()){toast('Zielwerte oder Deadline sind ungültig.');return;} const cfg=TYPE_MAP[category]; const title=`${CATEGORY_LABEL[category]}: ${target} ${unit}`; const ids=createAlarms([{title,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:false,eventAt:deadline}]); if(!ids.length)return; pushRecord({kind:'goal',category,title,accountId:a.id,current,target,unit,deadlineAt:iso(deadline),scheduledAt:iso(deadline),linkedAlarmIds:ids}); toast('Zielalarm wurde angelegt.');
    }
    if(form.dataset.intForm==='faction'){
      const title=String(data.get('title')||'Faction Reminder').trim(); const missing=Number(data.get('missing')); const total=Number(data.get('total')); const eventAt=parseLocal(data.get('date'),data.get('time'));
      if(!title||!Number.isInteger(missing)||!Number.isInteger(total)||missing<1||total<missing||!Number.isFinite(eventAt)||eventAt<=Date.now()){toast('Fraktionsdaten sind ungültig.');return;} const cfg=TYPE_MAP.faction; const ids=createAlarms([{title:`${title}: ${missing} fehlen`,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:false,eventAt}]); if(!ids.length)return; pushRecord({kind:'faction',category:'faction',title:`${title}: ${missing} fehlen`,accountId:a.id,missing,total,scheduledAt:iso(eventAt),linkedAlarmIds:ids}); toast('Fraktions-Erinnerung wurde geplant.');
    }
    if(form.dataset.intForm==='gw'){
      const values=['start','end','bubble','reward','prep'].map((name)=>[name,Date.parse(String(data.get(name)||''))]).filter(([,value])=>Number.isFinite(value));
      const valid=values.every(([,value])=>value>Date.now()); if(!valid||!values.length){toast('GW-Zeitpunkte sind ungültig.');return;} const defs=values.map(([name,value])=>{ const map={start:['GW Start','gw'],end:['GW Ende','gw'],bubble:['GW Bubble','bubble'],reward:['GW Reward','gw-reward'],prep:['GW Vorbereitung','gw-prep']}; const [label,category]=map[name]; const cfg=TYPE_MAP[category]; return {title:label,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:cfg.protected,eventAt:value}; }); const ids=createAlarms(defs); if(!ids.length)return; const start=Date.parse(String(data.get('start'))); const cycle=String(data.get('cycle')||'GW-Zyklus').trim(); pushRecord({kind:'gw',category:'gw',title:cycle,accountId:a.id,scheduledAt:iso(start),linkedAlarmIds:ids}); toast('GW Command Center wurde geplant.');
    }
    render();
  }

  function template(category){
    const now=Date.now(); const cfg=TYPE_MAP[category]; if(!cfg){toast('Vorlage nicht verfügbar.');return;}
    const offsets={bubble:2*3600000,gw:DAY,event:3*3600000,protection:4*3600000,resource:6*3600000,training:8*3600000,upgrade:10*3600000,faction:DAY,'insignia-goal':DAY,'family-currency-goal':DAY,'helicopter-training':12*3600000,'resource-goal':DAY};
    const eventAt=now+(offsets[category]||DAY); const title=CATEGORY_LABEL[category]||'Alarm'; const ids=createAlarms([{title,type:cfg.type,repeat:cfg.repeat,sound:cfg.sound,warnings:cfg.warnings,protected:cfg.protected,eventAt}]); if(!ids.length)return; pushRecord({kind:'template',category,title,accountId:account()?.id,scheduledAt:iso(eventAt),linkedAlarmIds:ids}); toast('Vorlage wurde als Alarm angelegt.');
  }

  document.addEventListener('click',(event)=>{
    const target=event.target.closest('[data-int-action]'); if(!target)return; const action=target.dataset.intAction;
    if(action==='tab'){tab=target.dataset.tab||'overview';render();}
    else if(action==='refresh'){model=load();render();}
    else if(action==='leave'){location.hash='';}
    else if(action==='template'){template(target.dataset.category);}
    else if(action==='done'){const r=model.records.find(x=>x.id===target.dataset.id);if(r){r.status='done';save();render();}}
  });
  document.addEventListener('submit',(event)=>{ if(event.target.matches('[data-int-form]')){event.preventDefault();handleForm(event.target);} });
  function mount(){ if(location.hash.slice(1)==='intelligence'){if(!model)model=load();render();} else if(Date.now()-lastMounted<1500){model=load();} }
  window.addEventListener('hashchange',mount);
  window.addEventListener('tgm-intelligence-alarm-created',()=>{if(location.hash.slice(1)==='intelligence')render();});
  const observer=new MutationObserver(()=>{if(location.hash.slice(1)==='intelligence'&&document.getElementById('app')?.children.length===0)render();}); observer.observe(document.documentElement,{childList:true,subtree:true});
  mount();
})();
