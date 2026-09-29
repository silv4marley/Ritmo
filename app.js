'use strict';
/* Ritmo — planner de rotina e hábitos. Tudo fica no aparelho (localStorage). */

const KEY = 'ritmo.v1';
const SPH = { prod: 'Produção', cm: 'Corpo e mente', life: 'Vida' };
const METRICS = {
  training: 'Treino', read: 'Leitura', call: 'Ligação com os filhos', hobby: 'Hobby / motocross',
  family: 'Tempo em família', social: 'Contato social', close: 'Fechamento do dia',
  review: 'Revisão semanal', extra: 'Trabalho extra'
};
const DAYN = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const WD = [1, 2, 3, 4, 5], MS = [1, 2, 3, 4, 5, 6], ALL = [0, 1, 2, 3, 4, 5, 6];

const GOALS = [
  { sp: 'prod', items: [
    { k: 'work', l: 'Pomodoros de trabalho', g: 40 },
    { k: 'close', l: 'Fechamentos do dia', g: 5 }] },
  { sp: 'cm', items: [
    { k: 'training', l: 'Treinos', g: 3 },
    { k: 'sleep', l: 'Noites com sono na meta', g: 5 },
    { k: 'water', l: 'Dias com água na meta', g: 5 },
    { k: 'study', l: 'Pomodoros de estudo', g: 10 },
    { k: 'read', l: 'Sessões de leitura', g: 5 }] },
  { sp: 'life', items: [
    { k: 'call', l: 'Ligações com os filhos', g: 5 },
    { k: 'hobby', l: 'Motocross / hobby', g: 1 },
    { k: 'family', l: 'Tempo de qualidade em família', g: 1 },
    { k: 'social', l: 'Contato social', g: 1 }] }
];

// Semana-modelo combinada. days: 0=Dom ... 6=Sáb. hide/only 'extra' = domingo de renda extra.
const B = (id, days, s, e, t, sp, x) => Object.assign({ id, days, s, e, t, sp }, x || {});
const DEFAULT_SCHEDULE = [
  B('wake', MS, '05:30', '06:40', 'Acordar, água, higiene e café', 'cm'),
  B('wakeSun', [0], '07:00', '08:00', 'Acordar com calma, água e café', 'cm'),
  B('workAM', MS, '06:55', '11:00', 'Trabalho · 4 pomodoros', 'prod', { pomo: 'work' }),
  B('lunch', MS, '11:00', '12:30', 'Almoço e descanso', 'cm'),
  B('workPM', WD, '12:30', '16:30', 'Trabalho · 4 pomodoros', 'prod', { pomo: 'work' }),
  B('arrive', WD, '16:45', '17:00', 'Chegar, água, trocar de roupa', 'cm'),
  B('train', [1, 3, 5], '17:00', '17:45', 'Treino', 'cm', { m: 'training' }),
  B('hobbyWD', [2, 4], '17:00', '17:45', 'Hobby ou tarefas pessoais', 'life', { m: 'hobby' }),
  B('shower', WD, '17:45', '18:00', 'Banho e lanche rápido', 'cm'),
  B('restSat', [6], '12:30', '14:00', 'Descanso', 'cm'),
  B('hobbySat', [6], '14:00', '17:00', 'Motocross ou hobby', 'life', { m: 'hobby' }),
  B('famSat', [6], '17:00', '18:00', 'Tempo de qualidade em família', 'life', { m: 'family' }),
  B('famSun', [0], '09:00', '12:00', 'Tempo de qualidade em família', 'life', { m: 'family', hide: 'extra' }),
  B('extraSun', [0], '08:00', '12:00', 'Trabalho extra (renda)', 'prod', { m: 'extra', only: 'extra' }),
  B('famSunX', [0], '12:00', '14:00', 'Almoço e tempo em família', 'life', { m: 'family', only: 'extra' }),
  B('leisureSun', [0], '14:00', '17:00', 'Lazer ou hobby', 'life', { m: 'hobby' }),
  B('socialSun', [0], '17:00', '18:00', 'Contato social', 'life', { m: 'social' }),
  B('call', ALL, '18:00', '19:00', 'Ligação com os filhos', 'life', { m: 'call' }),
  B('study1', WD, '19:00', '19:50', 'Estudo · pomodoro 1', 'cm', { pomo: 'study' }),
  B('dinner', WD, '19:50', '20:30', 'Pausa e jantar', 'cm'),
  B('study2', WD, '20:30', '21:20', 'Estudo · pomodoro 2', 'cm', { pomo: 'study' }),
  B('close', WD, '21:20', '21:35', 'Encerrar o dia e definir a tarefa de amanhã', 'prod', { m: 'close' }),
  B('review', [0], '20:30', '20:45', 'Revisão semanal', 'prod', { m: 'review' }),
  B('read', ALL, '21:35', '21:55', 'Leitura (papel, sem tela)', 'cm', { m: 'read' }),
  B('sleep', ALL, '21:55', '22:00', 'Telas desligadas e dormir', 'cm')
];
const DEF_SET = { water: 2500, glass: 250, focus: 50, brk: 10, sleepGoal: 7.5 };

/* ---------- estado ---------- */
const clone = o => JSON.parse(JSON.stringify(o));
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && Array.isArray(r.schedule) && r.log) { r.set = Object.assign({}, DEF_SET, r.set); return r; }
  } catch (e) {}
  return { schedule: clone(DEFAULT_SCHEDULE), log: {}, set: Object.assign({}, DEF_SET), timer: null, cat: 'work' };
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
function L(key) {
  const l = S.log[key] || (S.log[key] = {});
  if (!l.st) l.st = {};
  if (!l.p) l.p = { work: 0, study: 0 };
  if (l.w == null) l.w = 0;
  if (l.sl === undefined) l.sl = null;
  return l;
}
function blocksFor(d) {
  const wd = d.getDay(), extra = !!(S.log[iso(d)] && S.log[iso(d)].extra);
  return S.schedule
    .filter(b => b.days.includes(wd) && !(b.hide === 'extra' && extra) && !(b.only === 'extra' && !extra))
    .sort((a, b) => toMin(a.s) - toMin(b.s));
}
function weekDates(offset) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  const back = (d.getDay() + 6) % 7; // semana começa na segunda
  d.setDate(d.getDate() - back + (offset || 0) * 7);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
}
function weekTotals(dates) {
  const c = { work: 0, study: 0, sleep: 0, water: 0 };
  Object.keys(METRICS).forEach(k => c[k] = 0);
  dates.forEach(d => {
    const l = S.log[iso(d)]; if (!l) return;
    if (l.p) { c.work += l.p.work || 0; c.study += l.p.study || 0; }
    if ((l.w || 0) >= S.set.water) c.water++;
    if (l.sl != null && l.sl >= S.set.sleepGoal) c.sleep++;
    Object.values(l.st || {}).forEach(x => { if (x.s === 'done' && x.m) c[x.m] = (c[x.m] || 0) + 1; });
  });
  return c;
}
function sphereScores(c) {
  const out = {};
  GOALS.forEach(g => {
    const v = g.items.map(i => Math.min(1, (c[i.k] || 0) / i.g));
    out[g.sp] = Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length);
  });
  return out;
}
function extraHoursMonth() {
  const m = iso(new Date()).slice(0, 7); let h = 0;
  Object.keys(S.log).forEach(k => { if (k.startsWith(m)) Object.values(S.log[k].st || {}).forEach(x => { if (x.s === 'done' && x.m === 'extra') h += x.h || 0; }); });
  return h;
}

/* ---------- pomodoro ---------- */
let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      const at = audioCtx.currentTime + t;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2); o.start(at); o.stop(at + 0.22);
    });
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
}
function timerLeft() {
  const t = S.timer;
  if (!t) return S.set.focus * 60;
  return t.end ? Math.max(0, Math.ceil((t.end - Date.now()) / 1000)) : t.left;
}
function timerTotal() { return S.timer ? S.timer.dur : S.set.focus * 60; }
function timerStart() {
  unlockAudio();
  const t = S.timer;
  if (!t) S.timer = { mode: 'focus', cat: S.cat, dur: S.set.focus * 60, end: Date.now() + S.set.focus * 60000 };
  else if (!t.end) { t.end = Date.now() + t.left * 1000; }
  save(); render();
}
function timerPause() { const t = S.timer; if (t && t.end) { t.left = Math.max(0, Math.ceil((t.end - Date.now()) / 1000)); t.end = null; save(); render(); } }
function timerReset() { S.timer = null; save(); render(); }
function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume && audioCtx.resume(); } catch (e) {} }
function timerCheck() {
  const t = S.timer;
  if (!t || !t.end || Date.now() < t.end) return false;
  if (t.mode === 'focus') {
    L(iso(new Date())).p[t.cat] = (L(iso(new Date())).p[t.cat] || 0) + 1;
    S.timer = { mode: 'break', cat: t.cat, dur: S.set.brk * 60, end: Date.now() + S.set.brk * 60000 };
  } else {
    S.timer = null;
  }
  beep(); save(); render();
  return true;
}

/* ---------- views ---------- */
let view = 'hoje', selDay = new Date().getDay(), expanded = null, weekOff = 0;
const app = document.getElementById('app');
const fmtT = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);

function strip(c) {
  const sc = sphereScores(c);
  return '<div class="strip">' + ['prod', 'cm', 'life'].map(k =>
    `<div><small>${SPH[k]}</small><b class="c-${k}">${sc[k]}%</b><div class="pbar"><i class="b-${k}" style="width:${sc[k]}%"></i></div></div>`).join('') + '</div>';
}

function viewHoje() {
  const today = new Date(), key = iso(today), l = L(key), bl = blocksFor(today), m = nowMin();
  const cur = bl.find(b => toMin(b.s) <= m && m < toMin(b.e));
  const next = bl.find(b => toMin(b.s) > m);
  const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  let h = `<h1>Hoje</h1><p class="sub">${days[today.getDay()]}, ${today.getDate()} de ${months[today.getMonth()]}</p>`;
  h += strip(weekTotals(weekDates(0)));

  // Agora
  const focus = cur || next;
  if (focus) {
    const isCur = !!cur, left = isCur ? toMin(cur.e) - m : toMin(next.s) - m;
    const stt = (l.st[focus.id] || {}).s;
    h += `<div class="card now sp-${focus.sp}"><div class="lbl">${isCur ? 'Agora' : 'Próximo'}</div>
      <div class="ttl">${esc(focus.t)}</div>
      <div class="meta">${focus.s}–${focus.e} · ${isCur ? 'faltam ' : 'começa em '}${left >= 60 ? Math.floor(left / 60) + ' h ' + (left % 60) + ' min' : left + ' min'}</div>
      ${isCur ? `<div class="row-btns">
        <button class="${stt === 'done' ? 'pri' : ''}" data-act="st" data-id="${focus.id}" data-s="done">Feito</button>
        <button data-act="st" data-id="${focus.id}" data-s="later">Adiar</button>
        <button data-act="st" data-id="${focus.id}" data-s="skip">Pular</button></div>` : ''}</div>`;
  } else {
    h += '<div class="card now"><div class="lbl">Dia encerrado</div><div class="ttl">Descanse bem</div><div class="meta">Sono é parte do plano.</div></div>';
  }

  // Pomodoro
  const t = S.timer, running = !!(t && t.end), left = timerLeft(), tot = timerTotal();
  const cat = t ? t.cat : (cur && cur.pomo) || S.cat;
  const C = 2 * Math.PI * 76;
  h += `<div class="card pomo"><div class="seg">
      <button class="${cat === 'work' ? 'on' : ''}" data-act="cat" data-c="work">Trabalho</button>
      <button class="${cat === 'study' ? 'on' : ''}" data-act="cat" data-c="study">Estudo</button></div>
    <div class="ring"><svg width="170" height="170"><circle cx="85" cy="85" r="76" fill="none" stroke="#10141a" stroke-width="10"/>
      <circle id="pring" cx="85" cy="85" r="76" fill="none" stroke="${t && t.mode === 'break' ? 'var(--cm)' : cat === 'study' ? 'var(--cm)' : 'var(--prod)'}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - left / tot)}"/></svg>
      <div class="tm"><span id="ptime">${fmtT(left)}</span><small id="pmode">${t ? (t.mode === 'break' ? 'pausa' : 'foco') : 'pronto'}</small></div></div>
    <div class="row-btns">${running ? '<button class="pri" data-act="pause">Pausar</button>'
      : `<button class="pri" data-act="start">${t ? 'Continuar' : 'Iniciar foco'}</button>`}
      <button data-act="reset">${t && t.mode === 'break' ? 'Pular pausa' : 'Zerar'}</button></div>
    <div class="cnt">Hoje: ${l.p.work} de trabalho · ${l.p.study} de estudo · ${S.set.focus}/${S.set.brk} min</div></div>`;

  // Água e sono
  const wp = Math.min(100, Math.round(100 * l.w / S.set.water));
  h += `<div class="grid2"><div class="card"><div class="lbl" style="font-size:12px;color:var(--mut)">ÁGUA</div>
      <div class="big">${(l.w / 1000).toFixed(2).replace('.', ',')}<small> / ${(S.set.water / 1000).toFixed(1).replace('.', ',')} L</small></div>
      <div class="pbar"><i class="b-prod" style="width:${wp}%"></i></div>
      <div class="mini"><button data-act="water" data-d="-1">−</button><button class="pri" data-act="water" data-d="1">+${S.set.glass}</button></div></div>
    <div class="card"><div class="lbl" style="font-size:12px;color:var(--mut)">SONO (NOITE PASSADA)</div>
      <div class="big">${l.sl == null ? '—' : String(l.sl).replace('.', ',')}<small> h</small></div>
      <div class="pbar"><i class="b-cm" style="width:${l.sl == null ? 0 : Math.min(100, Math.round(100 * l.sl / S.set.sleepGoal))}%"></i></div>
      <div class="mini"><button data-act="sleep" data-d="-0.5">−</button><button class="pri" data-act="sleep" data-d="0.5">+</button></div></div></div>`;

  if (today.getDay() === 0) {
    h += `<div class="card" style="margin-top:12px"><div class="row-btns" style="align-items:center"><span style="flex:2">Domingo de renda extra</span>
      <button class="${l.extra ? 'pri' : ''}" data-act="extra">${l.extra ? 'Ligado' : 'Desligado'}</button></div></div>`;
  }

  // Linha do tempo
  h += '<h2>Linha do tempo</h2><div class="tl">';
  bl.forEach(b => {
    const st = (l.st[b.id] || {}).s || '';
    const isCur = cur && cur.id === b.id, open = expanded === b.id;
    const icon = st === 'done' ? '✓' : st === 'skip' ? '×' : st === 'later' ? '↷' : '';
    h += `<div class="item ${st} ${isCur ? 'cur' : ''}"><div class="hd" data-act="expand" data-id="${b.id}">
      <div class="sb b-${b.sp}"></div><div class="t">${b.s}<br>${b.e}</div>
      <div class="n"><b>${esc(b.t)}</b><span>${SPH[b.sp]}${b.m ? ' · ' + METRICS[b.m] : ''}</span></div>
      <div class="st">${icon}</div></div>
      ${open ? `<div class="acts"><button data-act="st" data-id="${b.id}" data-s="done">Feito</button>
        <button data-act="st" data-id="${b.id}" data-s="later">Adiar</button>
        <button data-act="st" data-id="${b.id}" data-s="skip">Pular</button></div>` : ''}</div>`;
  });
  return h + '</div>';
}

function viewSemana() {
  const todayWd = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  let h = '<h1>Semana</h1><p class="sub">Semana-modelo: edite uma vez e vale para todas as semanas</p><div class="days">' +
    order.map(d => `<button class="${d === selDay ? 'on' : ''} ${d === todayWd ? 'today' : ''}" data-act="day" data-d="${d}">${DAYN[d]}</button>`).join('') + '</div><div class="tl">';
  const ref = new Date(); ref.setDate(ref.getDate() + ((selDay - ref.getDay() + 7) % 7));
  S.schedule.filter(b => b.days.includes(selDay)).sort((a, b) => toMin(a.s) - toMin(b.s)).forEach(b => {
    h += `<div class="item"><div class="hd" data-act="edit" data-id="${b.id}"><div class="sb b-${b.sp}"></div>
      <div class="t">${b.s}<br>${b.e}</div><div class="n"><b>${esc(b.t)}</b>
      <span>${SPH[b.sp]}${b.m ? ' · ' + METRICS[b.m] : ''}${b.only === 'extra' || b.hide === 'extra' ? ' · modo renda extra' : ''}</span></div></div></div>`;
  });
  return h + `</div><div style="margin-top:12px"><button class="pri" style="width:100%" data-act="add">+ Novo bloco</button></div>`;
}

function viewEquilibrio() {
  const dates = weekDates(weekOff), c = weekTotals(dates), sc = sphereScores(c);
  const f = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  let h = `<h1>Equilíbrio</h1><div class="wk"><button data-act="wk" data-d="-1">‹</button>
    <span>${f(dates[0])} a ${f(dates[6])}${weekOff === 0 ? ' · esta semana' : ''}</span>
    <button data-act="wk" data-d="1" ${weekOff >= 0 ? 'disabled style="opacity:.3"' : ''}>›</button></div>`;
  GOALS.forEach(g => {
    h += `<div class="card sph"><h3><span style="font-size:17px;font-weight:600">${SPH[g.sp]}</span><span class="c-${g.sp}">${sc[g.sp]}%</span></h3>
      <div class="pbar"><i class="b-${g.sp}" style="width:${sc[g.sp]}%"></i></div>`;
    g.items.forEach(i => {
      const v = c[i.k] || 0;
      h += `<div class="met"><span>${i.l}</span><b>${v} / ${i.g}</b></div>
        <div class="pbar"><i class="b-${g.sp}" style="width:${Math.min(100, Math.round(100 * v / i.g))}%;opacity:.6"></i></div>`;
    });
    h += '</div>';
  });
  h += `<div class="card"><div class="met" style="margin:0"><span>Renda extra este mês</span><b>${extraHoursMonth().toFixed(1).replace('.', ',')} h</b></div></div>`;
  return h;
}

function viewAjustes() {
  const s = S.set;
  return `<h1>Ajustes</h1><p class="sub">Metas e pomodoro</p>
  <div class="card">
    <label>Meta de água por dia (ml)</label><input type="number" inputmode="numeric" data-set="water" value="${s.water}">
    <label>Tamanho do copo (ml)</label><input type="number" inputmode="numeric" data-set="glass" value="${s.glass}">
    <label>Foco (min)</label><input type="number" inputmode="numeric" data-set="focus" value="${s.focus}">
    <label>Pausa (min)</label><input type="number" inputmode="numeric" data-set="brk" value="${s.brk}">
    <label>Meta de sono (horas)</label><input type="number" inputmode="decimal" step="0.5" data-set="sleepGoal" value="${s.sleepGoal}">
  </div>
  <h2>Lembretes no iPhone</h2>
  <div class="card"><p class="note">Gera um calendário "Ritmo" com todos os blocos da semana-modelo e alerta no horário de início. Abra o arquivo no iPhone e toque em <b>Adicionar todos</b>. Os avisos passam a vir do próprio Calendário, com o app fechado. Se mudar a semana-modelo, apague o calendário "Ritmo" e importe de novo.</p>
    <button class="pri" style="width:100%" data-act="ics">Baixar calendário (.ics)</button></div>
  <h2>Backup</h2>
  <div class="card"><p class="note">Seus dados existem só neste aparelho. Faça backup de vez em quando.</p>
    <div class="row-btns"><button data-act="export">Exportar</button><button data-act="import">Importar</button></div>
    <input type="file" id="file" accept="application/json,.json" hidden></div>
  <h2>Semana-modelo</h2>
  <div class="card"><button class="dng" style="width:100%" data-act="resetsched">Restaurar horários originais</button></div>
  <p class="note" style="text-align:center;margin-top:18px">Ritmo · Alcatech</p>`;
}

function render() {
  if (document.activeElement && document.activeElement.matches('input')) return;
  app.innerHTML = { hoje: viewHoje, semana: viewSemana, equilibrio: viewEquilibrio, ajustes: viewAjustes }[view]();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
}

/* ---------- edição de blocos ---------- */
let editing = null;
function openEdit(id) {
  const b = id ? S.schedule.find(x => x.id === id) : { id: 'u' + Date.now(), days: [selDay], s: '09:00', e: '10:00', t: '', sp: 'life', isNew: true };
  editing = clone(b);
  const m = document.getElementById('modal');
  m.hidden = false;
  m.innerHTML = `<div class="sheet"><h1 style="font-size:20px">${b.isNew ? 'Novo bloco' : 'Editar bloco'}</h1>
    <label>Nome</label><input type="text" id="e-t" value="${esc(b.t)}">
    <div class="grid2"><div><label>Início</label><input type="time" id="e-s" value="${b.s}"></div>
    <div><label>Fim</label><input type="time" id="e-e" value="${b.e}"></div></div>
    <label>Dias</label><div class="chips" id="e-days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button data-act="eday" data-d="${d}" class="${b.days.includes(d) ? 'on' : ''}">${DAYN[d]}</button>`).join('')}</div>
    <label>Esfera</label><select id="e-sp">${Object.keys(SPH).map(k => `<option value="${k}" ${b.sp === k ? 'selected' : ''}>${SPH[k]}</option>`).join('')}</select>
    <label>Conta como meta</label><select id="e-m"><option value="">Nenhuma</option>${Object.keys(METRICS).map(k => `<option value="${k}" ${b.m === k ? 'selected' : ''}>${METRICS[k]}</option>`).join('')}</select>
    <div class="row-btns" style="margin-top:16px"><button data-act="ecancel">Cancelar</button><button class="pri" data-act="esave">Salvar</button></div>
    ${b.isNew ? '' : '<div style="margin-top:10px"><button class="dng" style="width:100%" data-act="edel">Remover bloco</button></div>'}</div>`;
}
function closeModal() { const m = document.getElementById('modal'); m.hidden = true; m.innerHTML = ''; editing = null; }
function saveEdit() {
  const t = document.getElementById('e-t').value.trim(), s = document.getElementById('e-s').value, e = document.getElementById('e-e').value;
  if (!t || !s || !e || toMin(e) <= toMin(s)) { alert('Preencha o nome e use um fim depois do início.'); return; }
  if (!editing.days.length) { alert('Escolha pelo menos um dia.'); return; }
  const nb = Object.assign({}, editing, { t, s, e, sp: document.getElementById('e-sp').value });
  const m = document.getElementById('e-m').value; if (m) nb.m = m; else delete nb.m;
  delete nb.isNew;
  const i = S.schedule.findIndex(x => x.id === nb.id);
  if (i >= 0) S.schedule[i] = nb; else S.schedule.push(nb);
  save(); closeModal(); render();
}

/* ---------- exportações ---------- */
function download(name, type, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function icsText() {
  const z = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  const q = s => String(s).replace(/([,;\\])/g, '\\$1');
  const L2 = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alcatech//Ritmo//PT', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Ritmo'];
  const stamp = z(new Date());
  S.schedule.filter(b => !b.only).forEach(b => {
    const start = new Date(); start.setHours(12, 0, 0, 0);
    for (let i = 0; i < 7 && !b.days.includes(start.getDay()); i++) start.setDate(start.getDate() + 1);
    const ds = iso(start).replace(/-/g, '');
    L2.push('BEGIN:VEVENT', `UID:${b.id}-${ds}@ritmo.alcatech`, 'DTSTAMP:' + stamp,
      `DTSTART:${ds}T${b.s.replace(':', '')}00`, `DTEND:${ds}T${b.e.replace(':', '')}00`,
      'RRULE:FREQ=WEEKLY;BYDAY=' + b.days.map(d => DAYICS[d]).join(','),
      'SUMMARY:' + q(b.t), 'DESCRIPTION:' + q(SPH[b.sp]),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + q(b.t), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  });
  L2.push('END:VCALENDAR');
  return L2.join('\r\n') + '\r\n';
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, D = t.dataset;
  switch (a) {
    case 'tab': view = D.v; expanded = null; closeModal(); render(); window.scrollTo(0, 0); break;
    case 'start': timerStart(); break;
    case 'pause': timerPause(); break;
    case 'reset': timerReset(); break;
    case 'cat': if (S.timer && S.timer.mode === 'focus') S.timer.cat = D.c; S.cat = D.c; save(); render(); break;
    case 'water': { const l = L(iso(new Date())); l.w = Math.max(0, l.w + Number(D.d) * S.set.glass); save(); render(); break; }
    case 'sleep': { const l = L(iso(new Date())); l.sl = Math.max(0, Math.min(14, (l.sl == null ? S.set.sleepGoal : l.sl + Number(D.d)))); save(); render(); break; }
    case 'extra': { const l = L(iso(new Date())); l.extra = !l.extra; save(); render(); break; }
    case 'expand': expanded = expanded === D.id ? null : D.id; render(); break;
    case 'st': {
      const l = L(iso(new Date())), b = S.schedule.find(x => x.id === D.id);
      if (l.st[D.id] && l.st[D.id].s === D.s) delete l.st[D.id];
      else l.st[D.id] = { s: D.s, m: b && b.m || '', h: b ? (toMin(b.e) - toMin(b.s)) / 60 : 0 };
      save(); render(); break;
    }
    case 'day': selDay = Number(D.d); render(); break;
    case 'edit': openEdit(D.id); break;
    case 'add': openEdit(null); break;
    case 'eday': { const d = Number(D.d), i = editing.days.indexOf(d); if (i >= 0) editing.days.splice(i, 1); else editing.days.push(d); t.classList.toggle('on'); break; }
    case 'ecancel': closeModal(); break;
    case 'esave': saveEdit(); break;
    case 'edel': if (confirm('Remover este bloco da semana-modelo?')) { S.schedule = S.schedule.filter(x => x.id !== editing.id); save(); closeModal(); render(); } break;
    case 'wk': weekOff = Math.min(0, weekOff + Number(D.d)); render(); break;
    case 'ics': download('ritmo-semana.ics', 'text/calendar', icsText()); break;
    case 'export': download('ritmo-backup-' + iso(new Date()) + '.json', 'application/json', JSON.stringify(S)); break;
    case 'import': document.getElementById('file').click(); break;
    case 'resetsched': if (confirm('Voltar todos os horários para a semana-modelo original? Seu histórico é mantido.')) { S.schedule = clone(DEFAULT_SCHEDULE); save(); render(); } break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.set) {
    const v = parseFloat(String(t.value).replace(',', '.'));
    if (v > 0) { S.set[t.dataset.set] = v; save(); }
    t.blur(); render();
  } else if (t.id === 'file' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!Array.isArray(d.schedule) || typeof d.log !== 'object') throw 0;
        if (!confirm('Substituir os dados atuais pelo backup?')) return;
        d.set = Object.assign({}, DEF_SET, d.set); S = d; save(); render();
      } catch (x) { alert('Arquivo de backup inválido.'); }
    };
    r.readAsText(t.files[0]);
  }
});
document.addEventListener('focusout', () => setTimeout(render, 50));

/* ---------- relógio ---------- */
let lastMinute = -1;
setInterval(() => {
  if (timerCheck()) return;
  const t = S.timer;
  if (view === 'hoje' && t && t.end) {
    const left = timerLeft(), tot = timerTotal(), C = 2 * Math.PI * 76;
    const pt = document.getElementById('ptime'), pr = document.getElementById('pring');
    if (pt) pt.textContent = fmtT(left);
    if (pr) pr.setAttribute('stroke-dashoffset', C * (1 - left / tot));
  }
  const m = nowMin();
  if (m !== lastMinute) { lastMinute = m; if (view === 'hoje') render(); }
}, 500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { timerCheck(); render(); } });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
