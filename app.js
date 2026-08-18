// ============================================================
// AI in visual storytelling — the room's standard
// LA workshop, Aug 26 2026
//
// Vanilla JS, no build step. Three surfaces:
//   #/            table view — persona, sprint, swap
//   #/guide       the one-page guide the room writes
//   #/facilitator the console + #/present for the read-aloud
//
// Offline-first: every keystroke lands in localStorage. Airtable
// is the sync layer so tables can see each other. If the wifi is
// bad the table view still works end to end; only the swap round
// and the facilitator view need the network.
// ============================================================

'use strict';

// ---------- Airtable field map ----------
// key in state.answers  ->  field name in Airtable

const FIELD_MAP = {
  primaryReal: 'Primary sources — must be real',
  primaryMissing: "Primary sources — when it doesn't exist",
  transparencyAllowed: 'Transparency — allowed with disclosure',
  disclosureLine: 'Disclosure line',
  legalDefend: "Legal — what we'd defend",
  legalWontTouch: "Legal — what we won't touch",
  peopleNever: 'People — never',
  peopleOnlyIf: 'People — only if',
  peopleSignoff: 'People — who signs off',
  sixPm: 'The 6 p.m. question',
};

const ANSWER_KEYS = Object.keys(FIELD_MAP);

// Fixed deal, four tables to a cycle:
//   T1 → 1,5,3   T2 → 4,2,7   T3 → 9,6,8   T4 → 10,1,4
// All ten cards are drawn by table 4, and the four that split every room
// (1, 4, 9, 10) land inside the first cycle. Tables 5+ repeat it.
const DEAL_ORDER = [1, 5, 3, 4, 2, 7, 9, 6, 8, 10, 1, 4];

const LS_KEY = 'la-visual-standards-v1';

// ---------- state ----------

const state = {
  table: null,
  scribe: '',
  answers: {},
  cases: {},          // { cardNumber: { verdict: 'yes'|'no', fix: '' } }
  status: 'draft',
  recordId: null,
  timers: {},         // { sprint: startMs, swap: startMs }
  room: [],           // all records pulled from Airtable
  presentIndex: 0,
};

let saveTimer = null;
let tickTimer = null;
let pollTimer = null;

// ============================================================
// helpers
// ============================================================

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function wordCount(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function isGenericLabel(str) {
  if (!str || wordCount(str) < 2) return false;
  return EMPTY_LABEL_PATTERNS.some(function (re) { return re.test(str.trim()); });
}

function personaForTable(n) {
  return PERSONAS[(n - 1) % PERSONAS.length];
}

function cardsForTable(n) {
  const start = ((n - 1) % 4) * 3;
  return DEAL_ORDER.slice(start, start + 3).map(function (num) {
    return CASE_CARDS.find(function (c) { return c.n === num; });
  });
}

function fmtClock(ms) {
  const over = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return (over ? '+' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function airtableReady() {
  return typeof AIRTABLE_CONFIG !== 'undefined' &&
    AIRTABLE_CONFIG.apiKey && AIRTABLE_CONFIG.apiKey.indexOf('pat') === 0 &&
    AIRTABLE_CONFIG.baseId && AIRTABLE_CONFIG.baseId.indexOf('app') === 0;
}

// ============================================================
// local storage
// ============================================================

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      table: state.table,
      scribe: state.scribe,
      answers: state.answers,
      cases: state.cases,
      status: state.status,
      recordId: state.recordId,
      timers: state.timers,
    }));
  } catch (e) { /* private mode, quota — the app still works in-session */ }
}

function restore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    state.table = d.table || null;
    state.scribe = d.scribe || '';
    state.answers = d.answers || {};
    state.cases = d.cases || {};
    state.status = d.status || 'draft';
    state.recordId = d.recordId || null;
    state.timers = d.timers || {};
  } catch (e) { /* corrupt payload — start clean */ }
}

// ============================================================
// sync
// ============================================================

function setSync(mode, text) {
  const el = $('#sync');
  el.hidden = false;
  el.className = 'sync' + (mode ? ' ' + mode : '');
  $('#sync-text').textContent = text;
  if (mode === '') {
    clearTimeout(setSync._t);
    setSync._t = setTimeout(function () { el.hidden = true; }, 2200);
  }
}

function recordFields() {
  const f = {
    Table: state.table,
    Persona: personaForTable(state.table).name,
    Scribe: state.scribe || '',
    Status: state.status,
    Updated: new Date().toISOString(),
    Corrections: JSON.stringify(state.cases || {}),
    'Cards drawn': cardsForTable(state.table).map(function (c) { return c.n; }).join(', '),
  };
  ANSWER_KEYS.forEach(function (k) { f[FIELD_MAP[k]] = state.answers[k] || ''; });
  return f;
}

async function pushRemote() {
  if (!airtableReady() || !state.table) return;
  setSync('saving', 'Saving…');
  const body = { fields: recordFields(), typecast: true };
  try {
    let res;
    if (state.recordId) {
      res = await fetch(AIRTABLE_CONFIG.apiUrl + '/' + state.recordId, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.status === 404) { state.recordId = null; return pushRemote(); }
    } else {
      // Adopt an existing row for this table if one is already out there,
      // so a second device at the same table edits the same standard.
      const existing = await findRemoteByTable(state.table);
      if (existing) {
        state.recordId = existing.id;
        persist();
        return pushRemote();
      }
      res = await fetch(AIRTABLE_CONFIG.apiUrl, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.id) { state.recordId = data.id; persist(); }
    setSync('', 'Saved to the room');
  } catch (e) {
    setSync('error', 'Saved on this device only');
  }
}

function authHeaders() {
  return {
    'Authorization': 'Bearer ' + AIRTABLE_CONFIG.apiKey,
    'Content-Type': 'application/json',
  };
}

async function findRemoteByTable(n) {
  // Coerce both sides to string so this works whether Table came out of the
  // schema API as a number or out of a CSV import as text.
  const url = AIRTABLE_CONFIG.apiUrl +
    '?maxRecords=1&filterByFormula=' + encodeURIComponent("({Table}&'')='" + n + "'");
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.records && data.records[0]) || null;
}

async function fetchRoom() {
  if (!airtableReady()) return [];
  try {
    const res = await fetch(AIRTABLE_CONFIG.apiUrl + '?pageSize=100', { headers: authHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.room = (data.records || [])
      .map(function (r) {
        const a = {};
        ANSWER_KEYS.forEach(function (k) { a[k] = (r.fields[FIELD_MAP[k]] || '').trim(); });
        let cases = {};
        try { cases = JSON.parse(r.fields.Corrections || '{}'); } catch (e) { cases = {}; }
        return {
          id: r.id,
          table: Number(r.fields.Table),
          persona: r.fields.Persona || '',
          scribe: r.fields.Scribe || '',
          status: r.fields.Status || 'draft',
          answers: a,
          cases: cases,
        };
      })
      .filter(function (r) { return Number.isFinite(r.table); })
      .sort(function (a, b) { return a.table - b.table; });
    return state.room;
  } catch (e) {
    return state.room;
  }
}

// Everything the room has, with this device's own draft merged in so the
// guide is never missing the table that's reading it.
function roomWithSelf() {
  const rows = state.room.slice();
  if (!state.table) return rows;
  const mine = {
    id: state.recordId || 'local',
    table: state.table,
    persona: personaForTable(state.table).name,
    scribe: state.scribe,
    status: state.status,
    answers: state.answers,
    cases: state.cases,
  };
  const i = rows.findIndex(function (r) { return r.table === state.table; });
  if (i >= 0) rows[i] = mine; else rows.push(mine);
  return rows.sort(function (a, b) { return a.table - b.table; });
}

function queueSave() {
  persist();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushRemote, 1200);
}

// ============================================================
// router
// ============================================================

const ROUTES = {
  '': 'join',
  '/': 'join',
  '/persona': 'persona',
  '/sprint': 'sprint',
  '/swap': 'swap',
  '/done': 'done',
  '/guide': 'guide',
  '/facilitator': 'facilitator',
  '/present': 'present',
};

function go(path) {
  if (location.hash === '#' + path) route();
  else location.hash = '#' + path;
}

function route() {
  const path = location.hash.replace(/^#/, '') || '/';
  const name = ROUTES[path] || 'join';

  // Guard the table screens — no table, no sprint.
  if (!state.table && ['persona', 'sprint', 'swap', 'done'].indexOf(name) >= 0) {
    return go('/');
  }

  $$('.screen').forEach(function (s) { s.classList.remove('active'); });
  const el = $('#screen-' + name);
  if (el) el.classList.add('active');

  clearInterval(pollTimer);
  window.scrollTo(0, 0);

  if (name === 'join') renderJoin();
  if (name === 'persona') renderPersona();
  if (name === 'sprint') enterSprint();
  if (name === 'swap') enterSwap();
  if (name === 'done') renderDone();
  if (name === 'guide') enterGuide();
  if (name === 'facilitator') enterFacilitator();
  if (name === 'present') enterPresent();
}

// ============================================================
// join
// ============================================================

function renderJoin() {
  const grid = $('#table-grid');
  grid.innerHTML = '';
  for (let n = 1; n <= SESSION.tableCount; n++) {
    const p = personaForTable(n);
    const taken = state.room.some(function (r) { return r.table === n && r.status === 'submitted'; });
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'table-btn' + (state.table === n ? ' selected' : '') + (taken ? ' taken' : '');
    b.innerHTML = n + '<small>' + esc(taken ? 'in use' : p.short) + '</small>';
    b.addEventListener('click', function () {
      state.table = n;
      persist();
      renderJoin();
    });
    grid.appendChild(b);
  }

  const btn = $('#join-btn');
  btn.disabled = !state.table;
  btn.textContent = state.table
    ? 'Table ' + state.table + ' — you are ' + personaForTable(state.table).name
    : 'Pick a table to start';

  $('#scribe').value = state.scribe || '';
}

// ============================================================
// persona
// ============================================================

function personaCardHtml(p) {
  return '<h1>' + esc(p.name) + '</h1>' +
    '<p class="tag">' + esc(p.tag) + '</p>' +
    '<dl>' +
    p.fields.map(function (f) {
      return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>';
    }).join('') +
    '<div class="pressure"><dt>Your pressure</dt><dd>' + esc(p.pressure) + '</dd></div>' +
    '</dl>' +
    '<footer><b>Your table\'s job:</b> fill in all four sections. Write the disclosure wording as ' +
    'words a reader would actually see — ' + SESSION.disclosureLimit + ' or fewer. Then answer the 6 p.m. question.</footer>';
}

function renderPersona() {
  const p = personaForTable(state.table);
  $('#persona-kicker').textContent = p.kicker + ' for the next ' + SESSION.sprintMinutes + ' minutes';
  $('#persona-card').innerHTML = personaCardHtml(p);
}

// ============================================================
// sprint
// ============================================================

let sprintBuilt = false;

function buildSprint() {
  if (sprintBuilt) return;
  const host = $('#sprint-sections');
  host.innerHTML = SECTIONS.map(function (sec) {
    const subs = sec.fields.map(function (f) {
      const counter = f.counted
        ? '<div class="counter-row"><span class="counter" id="count-' + f.key + '">0 / ' + SESSION.disclosureLimit + ' words</span></div>' +
          '<div id="nudge-' + f.key + '"></div>'
        : '';
      return '<div class="sub">' +
        '<label for="f-' + f.key + '">' + esc(f.label) + '</label>' +
        (f.sublabel ? '<span class="hint">' + esc(f.sublabel) + '</span>' : '') +
        '<textarea id="f-' + f.key + '" data-key="' + f.key + '" rows="' + (f.counted ? 2 : 3) + '" placeholder="' + esc(f.placeholder || '') + '"></textarea>' +
        counter +
        '</div>';
    }).join('');

    return '<div class="sec">' +
      '<div class="sec-head"><span class="sec-num">' + esc(sec.num) + '</span><h2>' + esc(sec.title) + '</h2></div>' +
      '<p class="blurb">' + esc(sec.blurb) + '</p>' +
      subs +
      '</div>';
  }).join('');

  $('#sixpm-title').textContent = SIX_PM.title;
  $('#sixpm-prompt').textContent = SIX_PM.prompt;
  $('#f-sixPm').placeholder = SIX_PM.placeholder;

  $$('#screen-sprint textarea[data-key]').forEach(function (ta) {
    ta.addEventListener('input', function () {
      state.answers[ta.dataset.key] = ta.value;
      if (ta.dataset.key === 'disclosureLine') updateCounter();
      queueSave();
    });
  });

  sprintBuilt = true;
}

function updateCounter() {
  const val = state.answers.disclosureLine || '';
  const n = wordCount(val);
  const c = $('#count-disclosureLine');
  if (c) {
    c.textContent = n + ' / ' + SESSION.disclosureLimit + ' words';
    c.className = 'counter' + (n === 0 ? '' : n > SESSION.disclosureLimit ? ' over' : ' ok');
  }
  const nudgeHost = $('#nudge-disclosureLine');
  if (!nudgeHost) return;
  if (isGenericLabel(val)) {
    nudgeHost.innerHTML = '<div class="nudge"><b>That is the label that costs trust.</b>' +
      'It tells a reader nothing about what was done. What actually changed in the image?</div>';
  } else if (n > SESSION.disclosureLimit) {
    nudgeHost.innerHTML = '<div class="nudge"><b>' + (n - SESSION.disclosureLimit) + ' word' +
      (n - SESSION.disclosureLimit === 1 ? '' : 's') + ' over.</b>' +
      'Cut it down. A caption nobody finishes reading is a caption nobody reads.</div>';
  } else {
    nudgeHost.innerHTML = '';
  }
}

function enterSprint() {
  buildSprint();
  $('#sprint-persona').textContent = 'You are ' + personaForTable(state.table).name;
  ANSWER_KEYS.forEach(function (k) {
    const el = $('#f-' + k);
    if (el) el.value = state.answers[k] || '';
  });
  updateCounter();
  startTimer('sprint', SESSION.sprintMinutes, '#sprint-timer');
}

function submitSprint() {
  state.status = 'submitted';
  persist();
  pushRemote();
  go('/swap');
}

// ============================================================
// timers
// ============================================================

function startTimer(name, minutes, sel) {
  if (!state.timers[name]) { state.timers[name] = Date.now(); persist(); }
  clearInterval(tickTimer);
  const tick = function () {
    const el = $(sel);
    if (!el) return;
    const remaining = minutes * 60000 - (Date.now() - state.timers[name]);
    el.textContent = fmtClock(remaining);
    el.className = 'timer' + (remaining < 120000 ? ' warn' : '');
  };
  tick();
  tickTimer = setInterval(tick, 1000);
}

// ============================================================
// swap
// ============================================================

async function enterSwap() {
  startTimer('swap', SESSION.swapMinutes, '#swap-timer');
  renderSwapCards();
  $('#swap-received').innerHTML = '<div class="received empty"><p class="who">Fetching</p>' +
    '<p>Pulling another table\'s standard…</p></div>';
  await fetchRoom();
  renderReceived();
}

function pickReceived() {
  const others = state.room.filter(function (r) {
    return r.table !== state.table && r.status === 'submitted' && r.answers.disclosureLine;
  });
  if (!others.length) return null;
  const myPersona = personaForTable(state.table).name;
  const different = others.filter(function (r) { return r.persona !== myPersona; });
  const pool = different.length ? different : others;
  // Deterministic rotation so two tables rarely land on the same standard.
  return pool[(state.table - 1) % pool.length];
}

function renderReceived() {
  const r = pickReceived();
  const host = $('#swap-received');
  if (!r) {
    host.innerHTML = '<div class="received empty">' +
      '<p class="who">Nothing to swap yet</p>' +
      '<p>No other table has sent its standard. Trade sheets with the table next to you, ' +
      'read theirs off their screen, and write your corrections below — they still count.</p></div>';
    return;
  }
  const a = r.answers;
  const line = a.disclosureLine || '';
  host.innerHTML = '<div class="received">' +
    '<p class="who">You received Table ' + esc(r.table) + '</p>' +
    '<h2>' + esc(r.persona) + '</h2>' +
    sec('1 · Primary sources', [
      ['Must be real', a.primaryReal],
      ["When it doesn't exist", a.primaryMissing],
    ]) +
    '<div class="rsec"><h3>2 · Transparency</h3>' +
    (a.transparencyAllowed ? '<p class="rline">' + esc(a.transparencyAllowed) + '</p>' : '') +
    (line ? '<div class="label-quote">' + esc(line) + '</div>' : '<p class="rline"><em>No label written.</em></p>') +
    '</div>' +
    sec('3 · Legal exposure', [
      ["What we'd defend", a.legalDefend],
      ["What we won't touch", a.legalWontTouch],
    ]) +
    sec('4 · Simulating real people', [
      ['Never', a.peopleNever],
      ['Only if', a.peopleOnlyIf],
      ['Signs off', a.peopleSignoff],
    ]) +
    (a.sixPm ? '<div class="rsec"><h3>At 6 p.m., who decides</h3><p class="rline">' + esc(a.sixPm) + '</p></div>' : '') +
    '</div>';

  function sec(title, pairs) {
    const rows = pairs.filter(function (p) { return p[1]; }).map(function (p) {
      return '<p class="rline"><em>' + esc(p[0]) + ':</em> ' + esc(p[1]) + '</p>';
    }).join('');
    return '<div class="rsec"><h3>' + esc(title) + '</h3>' +
      (rows || '<p class="rline"><em>Left blank.</em></p>') + '</div>';
  }
}

function renderSwapCards() {
  const host = $('#swap-cards');
  host.innerHTML = cardsForTable(state.table).map(function (c) {
    const saved = state.cases[c.n] || {};
    return '<div class="case" data-card="' + c.n + '">' +
      '<p class="num">Card ' + c.n + '</p>' +
      '<p class="text">' + esc(c.text) + '</p>' +
      '<p class="ask">' + esc(c.ask) + '</p>' +
      '<div class="answer-toggle">' +
        '<button type="button" class="toggle-btn yes' + (saved.verdict === 'yes' ? ' on' : '') + '" data-v="yes">The standard answers it</button>' +
        '<button type="button" class="toggle-btn no' + (saved.verdict === 'no' ? ' on' : '') + '" data-v="no">It can\'t</button>' +
      '</div>' +
      '<label class="fix-label" for="fix-' + c.n + '">What the rule should have said</label>' +
      '<textarea id="fix-' + c.n + '" rows="3" placeholder="Write the sentence that would have covered this.">' + esc(saved.fix || '') + '</textarea>' +
      '</div>';
  }).join('');

  $$('#swap-cards .toggle-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      const box = b.closest('.case');
      const n = box.dataset.card;
      const v = b.dataset.v;
      state.cases[n] = state.cases[n] || {};
      state.cases[n].verdict = state.cases[n].verdict === v ? null : v;
      // Repaint this card's toggle only — a full re-render would yank the
      // cursor out of whatever the scribe is typing.
      const chosen = state.cases[n].verdict;
      box.querySelectorAll('.toggle-btn').forEach(function (t) {
        t.className = 'toggle-btn ' + t.dataset.v + (t.dataset.v === chosen ? ' on' : '');
      });
      queueSave();
    });
  });

  $$('#swap-cards textarea').forEach(function (ta) {
    ta.addEventListener('input', function () {
      const n = ta.closest('.case').dataset.card;
      state.cases[n] = state.cases[n] || {};
      state.cases[n].fix = ta.value;
      queueSave();
    });
  });
}

// ============================================================
// done
// ============================================================

function renderDone() {
  $('#done-table').textContent = state.table;
  const line = (state.answers.disclosureLine || '').trim();
  $('#done-line').textContent = line
    ? '“' + line + '” — that is what a reader sees. It goes on the screen at 3:33.'
    : 'Your standard is in the guide. You never wrote a disclosure label — go back and write one before the read-aloud.';
}

// ============================================================
// guide
// ============================================================

async function enterGuide() {
  renderGuide();
  await fetchRoom();
  renderGuide();
}

function renderGuide() {
  const rows = roomWithSelf().filter(function (r) {
    return ANSWER_KEYS.some(function (k) { return (r.answers[k] || '').trim(); });
  });
  const host = $('#guide-body');

  if (!rows.length) {
    host.innerHTML = '<div class="empty-state">Nothing written yet.<br>' +
      'This page fills in as the tables work.</div>';
    return;
  }

  let html = SECTIONS.map(function (sec) {
    const entries = rows.map(function (r) {
      const parts = sec.fields.map(function (f) {
        const v = (r.answers[f.key] || '').trim();
        if (!v) return '';
        if (f.counted) {
          const n = wordCount(v);
          const over = n > SESSION.disclosureLimit;
          return '<div class="guide-label' + (over ? ' over' : '') + '">' + esc(v) + '</div>' +
            (over ? '<p class="wordflag">' + n + ' words — over the limit</p>' : '');
        }
        return '<p class="pair"><strong>' + esc(f.label) + '</strong><span>' + esc(v) + '</span></p>';
      }).filter(Boolean).join('');
      if (!parts) return '';
      return '<div class="entry' + (sec.id === 'transparency' ? ' entry-label' : '') + '">' +
        '<p class="from">Table ' + esc(r.table) + ' · ' + esc(r.persona) + '</p>' + parts + '</div>';
    }).filter(Boolean).join('');

    if (!entries) return '';
    return '<div class="gsec">' +
      '<div class="gsec-head"><span class="sec-num">' + esc(sec.num) + '</span><h2>' + esc(sec.title) + '</h2></div>' +
      '<p class="blurb">' + esc(sec.blurb) + '</p>' + entries + '</div>';
  }).join('');

  // Corrections — what the swap round broke.
  const fixes = collectCorrections(rows);
  if (fixes.length) {
    html += '<div class="gsec"><div class="gsec-head"><span class="sec-num">+</span>' +
      '<h2>What the cases broke</h2></div>' +
      '<p class="blurb">Cases these standards could not answer, and the rule that should have been there.</p>' +
      fixes.map(function (f) {
        const card = CASE_CARDS.find(function (c) { return c.n === f.card; });
        return '<div class="entry"><p class="from">Card ' + f.card + ' · from Table ' + esc(f.table) + '</p>' +
          '<p class="pair"><strong>' + esc(card ? card.text : '') + '</strong>' +
          '<span>' + esc(f.fix) + '</span></p></div>';
      }).join('') + '</div>';
  }

  // The 6 p.m. answers.
  const sixes = rows.filter(function (r) { return (r.answers.sixPm || '').trim(); });
  if (sixes.length) {
    html += '<div class="gsec"><div class="gsec-head"><span class="sec-num">?</span>' +
      '<h2>At 6 p.m., who decides</h2></div>' +
      '<p class="blurb">' + esc(SIX_PM.prompt) + '</p>' +
      sixes.map(function (r) {
        return '<div class="entry"><p class="from">Table ' + esc(r.table) + ' · ' + esc(r.persona) + '</p>' +
          '<p class="pair"><span>' + esc(r.answers.sixPm) + '</span></p></div>';
      }).join('') + '</div>';
  }

  host.innerHTML = html;
}

function collectCorrections(rows) {
  const out = [];
  rows.forEach(function (r) {
    Object.keys(r.cases || {}).forEach(function (n) {
      const c = r.cases[n];
      if (c && c.fix && c.fix.trim()) {
        out.push({ card: parseInt(n, 10), table: r.table, fix: c.fix.trim(), verdict: c.verdict });
      }
    });
  });
  return out.sort(function (a, b) { return a.card - b.card; });
}

// ============================================================
// facilitator
// ============================================================

async function enterFacilitator() {
  await fetchRoom();
  renderFacilitator();
  pollTimer = setInterval(async function () {
    await fetchRoom();
    renderFacilitator();
  }, 8000);
}

function labelRows() {
  return roomWithSelf()
    .filter(function (r) { return (r.answers.disclosureLine || '').trim(); })
    .map(function (r) {
      const line = r.answers.disclosureLine.trim();
      return {
        table: r.table,
        persona: r.persona,
        line: line,
        words: wordCount(line),
        over: wordCount(line) > SESSION.disclosureLimit,
        generic: isGenericLabel(line),
      };
    });
}

function renderFacilitator() {
  const rows = roomWithSelf();
  const submitted = rows.filter(function (r) { return r.status === 'submitted'; });
  const labels = labelRows();

  $('#fac-status').textContent = airtableReady()
    ? submitted.length + '/' + SESSION.tableCount + ' in'
    : 'offline';

  $('#fac-counts').innerHTML =
    tile(rows.length, 'tables working') +
    tile(labels.length, 'labels written') +
    tile(collectCorrections(rows).length, 'corrections');

  function tile(n, l) {
    return '<div class="count-tile"><div class="n">' + n + '</div><div class="l">' + esc(l) + '</div></div>';
  }

  // labels
  $('#fac-labels').innerHTML = labels.length
    ? labels.map(function (l) {
        return '<div class="label-card' + (l.over ? ' over' : '') + (l.generic ? ' generic' : '') + '">' +
          '<div class="meta"><span>Table ' + esc(l.table) + ' · ' + esc(l.persona) + '</span>' +
          '<span>' + l.words + ' w</span></div>' +
          '<p class="line">' + esc(l.line) + '</p>' +
          (l.generic ? '<p class="tagline">Says nothing — read this one</p>' :
            l.over ? '<p class="tagline">Over ' + SESSION.disclosureLimit + ' words</p>' : '') +
          '</div>';
      }).join('')
    : '<div class="empty-state">No labels yet.</div>';

  // card tally
  const drawn = {};
  rows.forEach(function (r) {
    cardsForTable(r.table).forEach(function (c) { drawn[c.n] = (drawn[c.n] || 0) + 1; });
  });
  $('#fac-cards').innerHTML = CASE_CARDS.map(function (c) {
    const n = drawn[c.n] || 0;
    return '<div class="tally' + (n === 0 ? ' undrawn' : '') + (c.splitter ? ' splitter' : '') + '">' +
      '<span class="cn">Card ' + c.n + '</span>' +
      '<span class="ct">' + (n === 0 ? 'hold for close' : n + ' table' + (n === 1 ? '' : 's')) + '</span></div>';
  }).join('');

  // corrections
  const fixes = collectCorrections(rows);
  $('#fac-corrections').innerHTML = fixes.length
    ? fixes.map(function (f) {
        const card = CASE_CARDS.find(function (c) { return c.n === f.card; });
        return '<div class="correction">' +
          '<p class="cmeta">Card ' + f.card + ' · Table ' + esc(f.table) + '</p>' +
          (f.verdict === 'no' ? '<p class="cverdict">Standard could not answer it</p>' : '') +
          '<p class="ctext">' + esc(f.fix) + '</p>' +
          '<p class="cmeta" style="margin-top:6px">' + esc(card ? card.text : '') + '</p>' +
          '</div>';
      }).join('')
    : '<div class="empty-state">Corrections show up here during the swap round.</div>';

  // tables
  $('#fac-tables').innerHTML = rows.length
    ? rows.map(function (r) {
        const filled = ANSWER_KEYS.filter(function (k) { return (r.answers[k] || '').trim(); }).length;
        return '<div class="fac-table"><div class="ft-l">' +
          '<div class="ft-n">Table ' + esc(r.table) + ' — ' + esc(r.persona) + '</div>' +
          '<div class="ft-p">' + filled + '/' + ANSWER_KEYS.length + ' fields' +
          (r.scribe ? ' · ' + esc(r.scribe) : '') + '</div></div>' +
          '<div class="ft-s ' + (r.status === 'submitted' ? 'sent' : 'draft') + '">' +
          (r.status === 'submitted' ? 'sent' : 'drafting') + '</div></div>';
      }).join('')
    : '<div class="empty-state">No tables have joined.</div>';
}

// ============================================================
// present mode — the read-aloud round
// ============================================================

function enterPresent() {
  renderPresent();
  pollTimer = setInterval(async function () { await fetchRoom(); }, 15000);
}

function renderPresent() {
  const labels = labelRows();
  if (!labels.length) {
    $('#present-meta').textContent = '';
    $('#present-line').textContent = 'No labels written yet.';
    $('#present-count').textContent = '';
    $('#present-pos').textContent = '';
    return;
  }
  if (state.presentIndex >= labels.length) state.presentIndex = 0;
  if (state.presentIndex < 0) state.presentIndex = labels.length - 1;
  const l = labels[state.presentIndex];
  $('#present-meta').textContent = 'Table ' + l.table + ' · ' + l.persona;
  $('#present-line').textContent = '“' + l.line + '”';
  $('#present-count').textContent = l.words + ' words' + (l.over ? ' — over the limit' : '');
  $('#present-pos').textContent = (state.presentIndex + 1) + ' / ' + labels.length;
}

function movePresent(d) {
  state.presentIndex += d;
  renderPresent();
}

// ============================================================
// markdown export — feeds the published synthesis
// ============================================================

function exportMarkdown() {
  const rows = roomWithSelf();
  let md = '# ' + SESSION.title + ' — the room\'s standard\n\n';
  md += SESSION.event + '\n' + SESSION.date + '\n\n';
  md += SESSION.presenters + '\n\n---\n\n';

  SECTIONS.forEach(function (sec) {
    md += '## ' + sec.num + '. ' + sec.title + '\n\n_' + sec.blurb + '_\n\n';
    rows.forEach(function (r) {
      const parts = sec.fields.map(function (f) {
        const v = (r.answers[f.key] || '').trim();
        return v ? '- **' + f.label + ':** ' + v : '';
      }).filter(Boolean);
      if (parts.length) {
        md += '**Table ' + r.table + ' — ' + r.persona + '**\n\n' + parts.join('\n') + '\n\n';
      }
    });
  });

  const fixes = collectCorrections(rows);
  if (fixes.length) {
    md += '## What the cases broke\n\n';
    fixes.forEach(function (f) {
      const card = CASE_CARDS.find(function (c) { return c.n === f.card; });
      md += '**Card ' + f.card + '** (Table ' + f.table + ')' +
        (f.verdict === 'no' ? ' — standard could not answer it' : '') + '\n\n' +
        '> ' + (card ? card.text : '') + '\n\n' + f.fix + '\n\n';
    });
  }

  md += '## At 6 p.m., who decides\n\n';
  rows.forEach(function (r) {
    if ((r.answers.sixPm || '').trim()) {
      md += '- **Table ' + r.table + ' (' + r.persona + '):** ' + r.answers.sixPm.trim() + '\n';
    }
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'la-visual-standards-' + new Date().toISOString().slice(0, 10) + '.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// wiring
// ============================================================

function init() {
  restore();

  $('#scribe').addEventListener('input', function (e) {
    state.scribe = e.target.value;
    persist();
  });

  $('#join-btn').addEventListener('click', function () {
    if (!state.table) return;
    persist();
    go('/persona');
  });

  $('#persona-continue').addEventListener('click', function () { go('/sprint'); });
  $('#persona-back').addEventListener('click', function () { go('/'); });
  $('#sprint-persona-btn').addEventListener('click', function () { go('/persona'); });
  $('#sprint-submit').addEventListener('click', submitSprint);

  $('#swap-done').addEventListener('click', function () {
    pushRemote();
    go('/done');
  });

  $('#done-edit').addEventListener('click', function () { go('/sprint'); });

  $('#guide-refresh').addEventListener('click', enterGuide);
  $('#guide-print').addEventListener('click', function () { window.print(); });

  $('#fac-refresh').addEventListener('click', async function () {
    await fetchRoom();
    renderFacilitator();
  });
  $('#fac-present').addEventListener('click', function () {
    state.presentIndex = 0;
    go('/present');
  });

  $('#present-prev').addEventListener('click', function () { movePresent(-1); });
  $('#present-next').addEventListener('click', function () { movePresent(1); });

  document.addEventListener('keydown', function (e) {
    if (!$('#screen-present').classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); movePresent(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); movePresent(-1); }
    if (e.key === 'Escape') go('/facilitator');
  });

  // Facilitator export: shift-E anywhere on the console.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'E' && e.shiftKey && $('#screen-facilitator').classList.contains('active')) {
      exportMarkdown();
    }
  });

  // Flush anything unsaved when the screen goes away.
  window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { persist(); pushRemote(); }
  });

  window.addEventListener('hashchange', route);

  // Warm the room list so the join screen can show which tables are live.
  fetchRoom().then(function () {
    if ($('#screen-join').classList.contains('active')) renderJoin();
  });

  route();
}

document.addEventListener('DOMContentLoaded', init);
