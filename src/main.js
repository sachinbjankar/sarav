import '@fontsource/mukta/400.css';
import '@fontsource/mukta/600.css';
import '@fontsource/mukta/700.css';
import '@fontsource/mukta/800.css';
import './style.css';

import { Capacitor } from '@capacitor/core';
import { SUBJECTS, EXAMS, QUESTIONS } from './questions.js';
import { store, today } from './store.js';
import { initAds, showBanner, hideBanner, maybeInterstitial, showRewarded } from './ads.js';
import { QUIZ, APP, POINTS_PER_CORRECT } from './config.js';
import { backend } from './backend.js';
import { DISTRICTS, errText, scoreField } from './backend-common.js';

// ---------- मदतनीस ----------
const MR = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => MR[d]);
const LETTERS = ['अ', 'ब', 'क', 'ड'];
const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const subj = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
const examById = Object.fromEntries(EXAMS.map((e) => [e.id, e]));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MONTHS = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
const dateMr = (ms) => { const d = new Date(ms); return `${mr(d.getDate())} ${MONTHS[d.getMonth()]}`; };

function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- स्थिती ----------
const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
let view = 'home';
let quiz = null;
let timer = null;
let reviewOnlyWrong = false;
let user = null;          // { uid, email, name }
let player = null;        // players/{uid} दस्तऐवज
let authMode = 'signup';
let authMsg = '';
let busy = false;
let rankPeriod = 'week';
let rankExam = '';
const rankCache = {};     // key → { at, list, mine }

const exam = () => examById[store.get().exam] || EXAMS[0];

// ---------- विषय व प्रश्नसंच ----------
const baseIds = (sid) => subj[sid].pool || [sid];
const poolOf = (sid) => { const b = baseIds(sid); return QUESTIONS.filter((q) => b.includes(q.s)); };
const examBase = (e) => [...new Set(e.subjects.flatMap(baseIds))];
const examPool = (e) => { const b = examBase(e); return QUESTIONS.filter((q) => b.includes(q.s)); };

function buildItems(questions, rand = Math.random) {
  return questions.map((q) => {
    const order = shuffle([0, 1, 2, 3], rand);
    return { q, opts: order.map((k) => q.o[k]), correct: order.indexOf(0) };
  });
}

function prioritised(pool) {
  const ans = store.get().ans;
  const unseen = shuffle(pool.filter((q) => !ans[q.id]));
  const wrong = shuffle(pool.filter((q) => ans[q.id] && !ans[q.id].last));
  const rest = shuffle(pool.filter((q) => ans[q.id] && ans[q.id].last));
  return [...unseen, ...wrong, ...rest].slice(0, QUIZ.PER_TEST);
}

function dailyQuestions(e) {
  const rand = rng(`daily-${e.id}-${today()}`);
  const picked = e.subjects.map((sid) => { const p = poolOf(sid); return p[Math.floor(rand() * p.length)]; });
  const uniq = [...new Set(picked)];
  const rest = shuffle(examPool(e).filter((q) => !uniq.includes(q)), rand);
  return buildItems(shuffle([...uniq, ...rest.slice(0, QUIZ.PER_TEST - uniq.length)], rand), rand);
}

const wrongQuestions = (e) => {
  const ans = store.get().ans;
  return examPool(e).filter((q) => ans[q.id] && !ans[q.id].last);
};

// ---------- चाचणी ----------
function startQuiz(mode, sid) {
  const e = exam();
  let items;
  let title;
  let retry = false;
  if (mode === 'daily') {
    items = dailyQuestions(e);
    title = 'आजची प्रश्नमंजुषा';
    retry = store.dailyFor(e.id).date === today();
  } else if (mode === 'subject') {
    items = buildItems(prioritised(poolOf(sid)));
    title = subj[sid].name;
  } else if (mode === 'wrong') {
    items = buildItems(shuffle(wrongQuestions(e)).slice(0, QUIZ.PER_TEST));
    title = 'चुकलेल्या प्रश्नांचा सराव';
  } else if (mode === 'saved') {
    items = buildItems(shuffle(store.get().saved.map((id) => byId[id]).filter(Boolean)).slice(0, QUIZ.PER_TEST));
    title = 'जतन केलेले प्रश्न';
  } else {
    items = buildItems(prioritised(examPool(e)));
    title = 'मिश्र सराव चाचणी';
  }
  if (!items.length) return startQuiz('mixed');
  // रँकिंगचे गुण: आजची प्रश्नमंजुषा (पहिल्यांदा), विषय चाचणी व मिश्र चाचणी
  const ranked = (mode === 'daily' && !retry) || mode === 'subject' || mode === 'mixed';
  quiz = {
    mode, sid, title, items, retry, ranked, exam: e.id,
    i: 0,
    answers: items.map(() => null),
    removed: items.map(() => []),
    fifty: QUIZ.FREE_FIFTY_FIFTY,
    left: QUIZ.SECONDS_PER_Q,
    started: Date.now(),
  };
  go('quiz');
}

function startTimer() {
  stopTimer();
  quiz.left = QUIZ.SECONDS_PER_Q;
  timer = setInterval(() => {
    if (!quiz || quiz.answers[quiz.i]) return stopTimer();
    quiz.left--;
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = mr(quiz.left);
      el.parentElement.classList.toggle('low', quiz.left <= 10);
      el.parentElement.style.setProperty('--p', quiz.left / QUIZ.SECONDS_PER_Q);
    }
    if (quiz.left <= 0) answer(-1);
  }, 1000);
}
function stopTimer() { if (timer) clearInterval(timer); timer = null; }
function startTimerKeep() { const keep = quiz.left; startTimer(); quiz.left = keep; }

function answer(choice) {
  if (!quiz || quiz.answers[quiz.i]) return;
  stopTimer();
  const it = quiz.items[quiz.i];
  const ok = choice === it.correct;
  quiz.answers[quiz.i] = { choice, ok };
  store.record(it.q.id, ok);
  if (navigator.vibrate && !ok) navigator.vibrate(60);
  render();
}

function removeTwo() {
  const it = quiz.items[quiz.i];
  return shuffle([0, 1, 2, 3].filter((k) => k !== it.correct)).slice(0, 2);
}

async function useFifty() {
  if (!quiz || quiz.answers[quiz.i] || quiz.removed[quiz.i].length) return;
  if (quiz.fifty <= 0) {
    const ok = await confirmBox('५०:५० वापरण्यासाठी एक छोटी जाहिरात पहा?', 'जाहिरात पहा', 'नको');
    if (!ok) return;
    stopTimer();
    const got = await showRewarded();
    if (got) quiz.removed[quiz.i] = removeTwo(); else toast('जाहिरात पूर्ण झाली नाही');
    render(true);
    startTimerKeep();
    return;
  }
  quiz.fifty--;
  quiz.removed[quiz.i] = removeTwo();
  render(true);
}

function next() {
  if (quiz.i < quiz.items.length - 1) { quiz.i++; go('quiz'); } else finish();
}

async function finish() {
  stopTimer();
  const score = quiz.answers.filter((a) => a && a.ok).length;
  quiz.score = score;
  quiz.secs = Math.round((Date.now() - quiz.started) / 1000);
  quiz.pts = quiz.ranked ? score * POINTS_PER_CORRECT : 0;
  const n = store.finishTest({
    exam: quiz.exam, mode: quiz.mode, sid: quiz.sid || '', title: quiz.title,
    score, total: quiz.items.length, secs: quiz.secs, pts: quiz.pts, retry: quiz.retry,
  });
  if (quiz.pts > 0) {
    store.queueScore(quiz.exam, quiz.pts);
    delete rankCache[`${quiz.exam}-week`];
    delete rankCache[`${quiz.exam}-all`];
    flushScores();
  }
  syncProgress();
  await maybeInterstitial(n);
  go('result');
}

// ---------- खाते: गुण व प्रगती Firebase मध्ये ----------
let flushing = false;
async function flushScores() {
  if (!user || flushing) return;
  flushing = true;
  let denied = 0;
  try {
    let p;
    while (user && (p = store.takePending())) {
      try {
        await backend.addScore(user.uid, p.exam, p.pts);
        store.dropPending();
        denied = 0;
        if (store.takePending()) await sleep(31000); // सर्व्हर दर ३० सेकंदाला एकदाच गुण घेतो
      } catch (err) {
        if (err?.code === 'permission-denied' && denied < 2) { denied++; await sleep(31000); continue; }
        if (err?.code === 'permission-denied') { store.dropPending(); denied = 0; continue; }
        break; // इंटरनेट नाही: पुढच्या वेळी पाठवू
      }
    }
    if (user) player = await backend.getPlayer(user.uid);
    if (view === 'me' || view === 'rank') render();
  } catch (_) { /* पुढच्या वेळी */ }
  flushing = false;
}

let syncTimer = null;
function syncProgress() {
  if (!user) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => backend.saveProgress(user.uid, store.cloudCopy()).catch(() => {}), 1500);
}

backend.onAuth(async (u) => {
  user = u;
  player = null;
  if (u) {
    try {
      store.merge(await backend.loadProgress(u.uid));
      player = await backend.getPlayer(u.uid);
      if (!player) {
        // नवीन खाते तयार होत असताना प्रोफाइल थोड्या वेळात येते; तरीही नसेल तर तयार करा
        await sleep(5000);
        player = user && user.uid === u.uid ? await backend.getPlayer(u.uid) : player;
      }
      if (!player && user && user.uid === u.uid) {
        await backend.createPlayer(u.uid, (u.name || 'विद्यार्थी').slice(0, 30).padEnd(2, '.'), '');
        player = await backend.getPlayer(u.uid);
      }
      syncProgress();
      flushScores();
    } catch (_) { /* ऑफलाइन */ }
  }
  if (['me', 'rank', 'auth', 'home'].includes(view)) {
    if (view === 'auth' && u) go('me'); else render();
  }
});

// ---------- नेव्हिगेशन ----------
function go(v) {
  view = v;
  if (v === 'quiz' || v === 'pick' || v === 'auth') hideBanner(); else showBanner();
  render();
  window.scrollTo(0, 0);
  if (v === 'quiz') startTimer();
  if (v === 'rank') loadRank();
}

async function back() {
  if (modalRoot.firstChild) return closeModal(false);
  if (view === 'quiz') {
    if (await confirmBox('चाचणी अर्धवट सोडायची?', 'हो, सोडा', 'नाही')) { stopTimer(); quiz = null; go('home'); }
  } else if (view === 'review') go('result');
  else if (view === 'auth') go('me');
  else if (view === 'pick' && !store.get().exam) {
    /* पहिल्यांदा परीक्षा निवडल्याशिवाय पुढे नाही */
  } else if (view !== 'home') go('home');
  else if (Capacitor.isNativePlatform()) {
    const { App } = await import('@capacitor/app');
    App.exitApp();
  }
}

// ---------- संवाद / सूचना ----------
let modalResolve = null;
function openModal(html) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalRoot.innerHTML = `<div class="modal-bg" data-act="modal-no"><div class="modal" role="dialog">${html}</div></div>`;
    const first = modalRoot.querySelector('input, select');
    if (first) first.focus();
  });
}
const confirmBox = (text, yes, no) => openModal(`
  <p>${text}</p>
  <div class="modal-btns"><button class="btn ghost" data-act="modal-no">${no}</button><button class="btn primary" data-act="modal-yes">${yes}</button></div>`);
function closeModal(val) {
  modalRoot.innerHTML = '';
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(val); }
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

function tabbar() {
  const tab = (id, icon, label) =>
    `<button class="tab ${view === id ? 'on' : ''}" data-act="tab" data-v="${id}"><span>${icon}</span>${label}</button>`;
  return `<nav class="tabbar">${tab('home', '🏠', 'मुख्य')}${tab('rank', '🏆', 'रँकिंग')}${tab('saved', '⭐', 'जतन')}${tab('me', '👤', 'मी')}</nav>`;
}

function subjectStats(sid) {
  const ans = store.get().ans;
  const pool = poolOf(sid);
  const seen = pool.filter((q) => ans[q.id]);
  const right = seen.filter((q) => ans[q.id].last).length;
  return { total: pool.length, seen: seen.length, acc: seen.length ? Math.round((right / seen.length) * 100) : null };
}
function examStats(e) {
  const ans = store.get().ans;
  const pool = examPool(e);
  const seen = pool.filter((q) => ans[q.id]);
  const right = seen.filter((q) => ans[q.id].last).length;
  return { total: pool.length, seen: seen.length, acc: seen.length ? Math.round((right / seen.length) * 100) : 0 };
}

// ---------- पाने ----------
function pickView() {
  const first = !store.get().exam;
  return `
  <header class="top tall">
    <div class="brand"><div class="logo">स</div><div><h1>${APP.name}</h1><p>स्पर्धा परीक्षेचा रोजचा सराव</p></div></div>
  </header>
  <main class="wrap pick">
    <h2>${first ? 'तुम्ही कोणत्या परीक्षेची तयारी करत आहात?' : 'परीक्षा बदला'}</h2>
    <p class="muted">प्रत्येक परीक्षेचे विषय, आजची प्रश्नमंजुषा व रँकिंग वेगळे आहे. नंतर कधीही बदलता येईल.</p>
    ${EXAMS.map((e) => `
      <button class="exam-card ${store.get().exam === e.id ? 'on' : ''}" style="--c:${e.color}" data-act="pick-exam" data-id="${e.id}">
        <span class="ico">${e.icon}</span>
        <span class="grow"><b>${e.name}</b><small>${e.full}</small>
          <em>${e.subjects.map((s) => subj[s].name).join(' • ')}</em></span>
        <span class="arrow">›</span>
      </button>`).join('')}
  </main>`;
}

function examChip() {
  const e = exam();
  return `<button class="exam-chip" data-act="tab" data-v="pick">${e.icon} ${e.name} <span>▾</span></button>`;
}

function homeView() {
  const e = exam();
  const d = store.dailyFor(e.id);
  const doneToday = d.date === today();
  const st = examStats(e);
  const wrongN = wrongQuestions(e).length;
  return `
  <header class="top">
    <div class="brand">
      <div class="logo">स</div>
      <div><h1>${APP.name}</h1>${examChip()}</div>
    </div>
    <div class="streak" title="सलग दिवस">🔥 ${mr(store.streak())}</div>
  </header>

  <main class="wrap">
    <section class="daily ${doneToday ? 'done' : ''}">
      <div>
        <span class="chip">${e.name} • रोज नवीन</span>
        <h2>आजची प्रश्नमंजुषा</h2>
        <p>${doneToday
          ? `आजचे गुण: <b>${mr(d.score)}/${mr(d.total)}</b> • उद्या नवीन प्रश्न`
          : `${mr(QUIZ.PER_TEST)} प्रश्न • प्रत्येकी ${mr(QUIZ.SECONDS_PER_Q)} सेकंद • रँकिंगचे गुण`}</p>
      </div>
      <button class="btn light" data-act="start" data-mode="daily">${doneToday ? 'पुन्हा सोडवा' : 'सुरू करा'}</button>
    </section>

    ${user ? '' : `
    <button class="join-strip" data-act="tab" data-v="auth">
      <span>🏆</span><span class="grow"><b>रँकिंगमध्ये नाव झळकवा</b><small>मोफत खाते तयार करा • प्रगती कायमची जतन</small></span><span class="arrow">›</span>
    </button>`}

    <section class="mini-stats">
      <div><b>${mr(st.seen)}/${mr(st.total)}</b><span>प्रश्न सोडवले</span></div>
      <div><b>${mr(st.acc)}%</b><span>अचूकता</span></div>
      <div><b>${player ? mr(player[scoreField(e.id, 'all')] || 0) : mr(store.get().tests)}</b><span>${player ? 'एकूण गुण' : 'चाचण्या'}</span></div>
    </section>

    <div class="row2">
      <button class="card action" data-act="start" data-mode="mixed">
        <span class="big">🎯</span><b>मिश्र सराव</b><small>${e.name} चे सर्व विषय • ${mr(QUIZ.PER_TEST)} प्रश्न</small>
      </button>
      <button class="card action ${wrongN ? '' : 'disabled'}" data-act="start" data-mode="wrong">
        <span class="big">🔁</span><b>चुकलेले प्रश्न</b><small>${wrongN ? `${mr(wrongN)} प्रश्न पुन्हा सोडवा` : 'अजून एकही नाही'}</small>
      </button>
    </div>

    <h3 class="sec">${e.name} • विषयानुसार सराव</h3>
    <section class="subjects">
      ${e.subjects.map((sid) => {
        const s = subj[sid];
        const ss = subjectStats(sid);
        const pct = Math.round((ss.seen / ss.total) * 100);
        return `
        <button class="subject" style="--c:${s.color}" data-act="start" data-mode="subject" data-sid="${s.id}">
          <span class="ico">${s.icon}</span>
          <b>${s.name}</b>
          <small>${mr(ss.seen)}/${mr(ss.total)} सोडवले${ss.acc !== null ? ` • ${mr(ss.acc)}% बरोबर` : ''}</small>
          <i class="bar"><i style="width:${pct}%"></i></i>
        </button>`;
      }).join('')}
    </section>
    <p class="foot">नवीन प्रश्न नियमितपणे जोडले जातील.</p>
  </main>
  ${tabbar()}`;
}

function quizView(animate = true) {
  const it = quiz.items[quiz.i];
  const a = quiz.answers[quiz.i];
  const removed = quiz.removed[quiz.i];
  const s = subj[it.q.s];
  const saved = store.isSaved(it.q.id);
  const p = (quiz.i + (a ? 1 : 0)) / quiz.items.length;
  return `
  <header class="qtop">
    <button class="icon-btn" data-act="exit" aria-label="बाहेर">✕</button>
    <div class="qprog"><i style="width:${p * 100}%"></i></div>
    <div class="ring ${a ? 'stop' : ''}" style="--p:${a ? 0 : quiz.left / QUIZ.SECONDS_PER_Q}"><span id="timer">${a ? '✓' : mr(quiz.left)}</span></div>
  </header>
  <main class="wrap quiz ${animate ? 'enter' : ''}">
    <div class="qmeta">
      <span class="tag" style="--c:${s.color}">${s.icon} ${s.name}</span>
      <span>प्रश्न ${mr(quiz.i + 1)}/${mr(quiz.items.length)}</span>
    </div>
    <h2 class="qtext">${esc(it.q.q)}</h2>
    <div class="opts">
      ${it.opts.map((o, k) => {
        let cls = '';
        if (a) cls = k === it.correct ? 'right' : k === a.choice ? 'wrong' : 'dim';
        else if (removed.includes(k)) cls = 'gone';
        return `<button class="opt ${cls}" data-act="ans" data-k="${k}" ${a || removed.includes(k) ? 'disabled' : ''}>
          <span class="l">${LETTERS[k]}</span><span class="t">${esc(o)}</span>
        </button>`;
      }).join('')}
    </div>
    ${a ? `
      <div class="explain ${a.ok ? 'ok' : 'no'}">
        <b>${a.ok ? '✅ बरोबर!' : a.choice === -1 ? '⏰ वेळ संपली' : '❌ चूक'}</b>
        <p>${esc(it.q.e)}</p>
      </div>
      <div class="qactions">
        <button class="btn ghost" data-act="save">${saved ? '⭐ जतन केले' : '☆ जतन करा'}</button>
        <button class="btn primary" data-act="next">${quiz.i < quiz.items.length - 1 ? 'पुढील प्रश्न →' : 'निकाल पहा'}</button>
      </div>` : `
      <div class="qactions">
        <button class="btn ghost" data-act="save" aria-label="जतन करा">${saved ? '⭐' : '☆'}</button>
        <button class="btn lifeline" data-act="fifty" ${removed.length ? 'disabled' : ''}>
          ५०:५० ${quiz.fifty > 0 ? `<small>(${mr(quiz.fifty)} मोफत)</small>` : '<small>▶ जाहिरात</small>'}
        </button>
      </div>`}
  </main>`;
}

function resultView() {
  const total = quiz.items.length;
  const wrong = quiz.answers.filter((a) => a && !a.ok && a.choice !== -1).length;
  const skipped = quiz.answers.filter((a) => a && a.choice === -1).length;
  const pct = Math.round((quiz.score / total) * 100);
  const msg = pct >= 80 ? 'उत्कृष्ट! असाच सराव सुरू ठेवा 💪' : pct >= 50 ? 'छान! थोडा अजून सराव करा.' : 'हरकत नाही, चुकलेले प्रश्न पुन्हा सोडवा.';
  const min = Math.floor(quiz.secs / 60);
  const sec = quiz.secs % 60;
  let ptsLine = '';
  if (quiz.pts > 0) {
    ptsLine = user
      ? `<div class="pts-note ok">🏆 <b>+${mr(quiz.pts)} गुण</b> ${examById[quiz.exam].name} रँकिंगमध्ये जोडले</div>`
      : `<button class="pts-note" data-act="tab" data-v="auth">🏆 <b>+${mr(quiz.pts)} गुण</b> मिळाले! खाते तयार करा आणि रँकिंगमध्ये या ›</button>`;
  } else if (quiz.ranked === false) {
    ptsLine = '<div class="pts-note muted">ही सराव चाचणी होती; रँकिंगचे गुण आजची प्रश्नमंजुषा, विषय व मिश्र चाचणीला मिळतात.</div>';
  }
  return `
  <header class="top slim"><h1>निकाल</h1></header>
  <main class="wrap">
    <section class="result">
      <div class="score-ring" style="--p:${quiz.score / total}">
        <div><b>${mr(quiz.score)}</b><span>/${mr(total)}</span></div>
      </div>
      <h2>${quiz.title}</h2>
      <p>${msg}</p>
      <div class="mini-stats in">
        <div><b class="g">${mr(quiz.score)}</b><span>बरोबर</span></div>
        <div><b class="r">${mr(wrong)}</b><span>चूक</span></div>
        <div><b>${mr(skipped)}</b><span>वेळ संपली</span></div>
        <div><b>${mr(min)}:${mr(String(sec).padStart(2, '0'))}</b><span>वेळ</span></div>
      </div>
      ${ptsLine}
    </section>
    <div class="stack">
      <button class="btn primary" data-act="review">उत्तरे व स्पष्टीकरण पहा</button>
      <button class="btn ghost" data-act="again">पुन्हा नवीन चाचणी</button>
      <button class="btn ghost" data-act="share">📤 मित्रांना पाठवा</button>
      <button class="btn link" data-act="tab" data-v="home">मुख्य पानावर जा</button>
    </div>
  </main>`;
}

function reviewCard(q, opts, correct, choice, idx) {
  const saved = store.isSaved(q.id);
  return `
  <article class="rcard">
    <div class="qmeta"><span class="tag" style="--c:${subj[q.s].color}">${subj[q.s].name}</span>
      ${idx != null ? `<span>प्रश्न ${mr(idx + 1)}</span>` : ''}
      <button class="star" data-act="save-id" data-id="${q.id}" aria-label="जतन">${saved ? '⭐' : '☆'}</button>
    </div>
    <h4>${esc(q.q)}</h4>
    <ul>
      ${opts.map((o, k) => `<li class="${k === correct ? 'right' : k === choice ? 'wrong' : ''}"><span>${LETTERS[k]}</span>${esc(o)}</li>`).join('')}
    </ul>
    <p class="ex">💡 ${esc(q.e)}</p>
  </article>`;
}

function reviewView() {
  const list = quiz.items.map((it, i) => ({ it, a: quiz.answers[i], i })).filter((x) => !reviewOnlyWrong || !x.a || !x.a.ok);
  return `
  <header class="top slim"><button class="icon-btn" data-act="back" aria-label="मागे">←</button><h1>उत्तरे</h1></header>
  <main class="wrap">
    <div class="seg">
      <button class="${!reviewOnlyWrong ? 'on' : ''}" data-act="filter" data-v="all">सर्व</button>
      <button class="${reviewOnlyWrong ? 'on' : ''}" data-act="filter" data-v="wrong">फक्त चुकलेले</button>
    </div>
    ${list.length ? list.map(({ it, a, i }) => reviewCard(it.q, it.opts, it.correct, a ? a.choice : -1, i)).join('')
      : '<p class="empty">एकही चूक नाही! 🎉</p>'}
  </main>`;
}

function savedView() {
  const ids = store.get().saved.filter((id) => byId[id]);
  return `
  <header class="top slim"><h1>जतन केलेले प्रश्न</h1></header>
  <main class="wrap">
    ${ids.length ? `
      <button class="btn primary full" data-act="start" data-mode="saved">या प्रश्नांची चाचणी द्या</button>
      ${ids.map((id) => { const it = buildItems([byId[id]], rng(id))[0]; return reviewCard(it.q, it.opts, it.correct, -2); }).join('')}`
      : '<div class="empty"><span>☆</span><p>चाचणी देताना ☆ दाबून महत्त्वाचे प्रश्न येथे जतन करा.</p></div>'}
  </main>
  ${tabbar()}`;
}

// ---------- रँकिंग ----------
async function loadRank(force = false) {
  const e = rankExam || exam().id;
  const key = `${e}-${rankPeriod}`;
  const c = rankCache[key];
  if (!force && c && Date.now() - c.at < 5 * 60000) return;
  rankCache[key] = { at: Date.now(), loading: true, list: c?.list || [] };
  render();
  try {
    const list = await backend.leaderboard(e, rankPeriod);
    let mine = null;
    if (user) {
      const p = await backend.getPlayer(user.uid);
      player = p;
      const pts = p?.[scoreField(e, rankPeriod)] || 0;
      mine = { pts, rank: pts ? await backend.rankOf(e, rankPeriod, pts) : null };
    }
    rankCache[key] = { at: Date.now(), list, mine };
  } catch (err) {
    rankCache[key] = { at: 0, list: [], error: errText(err) };
  }
  if (view === 'rank') render();
}

function rankView() {
  const e = examById[rankExam || exam().id];
  const c = rankCache[`${e.id}-${rankPeriod}`] || { loading: true, list: [] };
  const list = c.list || [];
  const top = list.slice(0, 3);
  const podium = [top[1], top[0], top[2]];
  const row = (p, i) => `
    <li class="${user && p.uid === user.uid ? 'me' : ''}">
      <span class="rk">${mr(i + 1)}</span>
      <span class="av" style="--h:${(p.name.charCodeAt(0) * 37) % 360}">${esc(p.name.slice(0, 1))}</span>
      <span class="grow"><b>${esc(p.name)}</b><small>${esc(p.dist || '')}</small></span>
      <span class="pts">${mr(p.pts)}</span>
    </li>`;
  let mineCard;
  if (!user) {
    mineCard = `<button class="my-rank cta" data-act="tab" data-v="auth"><span>🏆</span><span class="grow"><b>तुमचे नाव या यादीत पाहायचे आहे?</b><small>मोफत खाते तयार करा</small></span><span class="arrow">›</span></button>`;
  } else if (c.mine) {
    mineCard = `<div class="my-rank"><span class="av" style="--h:${((player?.name || '?').charCodeAt(0) * 37) % 360}">${esc((player?.name || '?').slice(0, 1))}</span>
      <span class="grow"><b>तुमचा क्रमांक: ${c.mine.rank ? '#' + mr(c.mine.rank) : '–'}</b><small>${c.mine.pts ? `${mr(c.mine.pts)} गुण` : 'या कालावधीत अजून गुण नाहीत. चाचणी द्या!'}</small></span></div>`;
  } else mineCard = '';

  return `
  <header class="top slim rank-top">
    <h1>🏆 रँकिंग</h1>
    <button class="icon-btn" data-act="rank-refresh" aria-label="पुन्हा लोड करा">⟳</button>
  </header>
  <main class="wrap">
    <div class="exam-tabs">
      ${EXAMS.map((x) => `<button class="${x.id === e.id ? 'on' : ''}" data-act="rank-exam" data-id="${x.id}">${x.icon} ${x.name}</button>`).join('')}
    </div>
    <div class="seg">
      <button class="${rankPeriod === 'week' ? 'on' : ''}" data-act="rank-period" data-v="week">या आठवड्यात</button>
      <button class="${rankPeriod === 'all' ? 'on' : ''}" data-act="rank-period" data-v="all">सर्वकाळ</button>
    </div>
    ${backend.kind === 'mock' ? '<p class="demo-note">डेमो: इतर नावे नमुना आहेत. Firebase जोडल्यावर खरे विद्यार्थी दिसतील.</p>' : ''}
    ${mineCard}
    ${c.error ? `<p class="empty">${esc(c.error)}</p>` : c.loading && !list.length ? '<p class="empty">लोड होत आहे…</p>' : !list.length
      ? '<div class="empty"><span>🏁</span><p>अजून कोणीही गुण मिळवलेले नाहीत. पहिले तुम्ही व्हा!</p></div>'
      : `
      <section class="podium">
        ${podium.map((p, k) => (p ? `
          <div class="pod p${[2, 1, 3][k]}">
            <span class="crown">${['🥈', '🥇', '🥉'][k]}</span>
            <span class="av" style="--h:${(p.name.charCodeAt(0) * 37) % 360}">${esc(p.name.slice(0, 1))}</span>
            <b>${esc(p.name)}</b><small>${esc(p.dist || '')}</small>
            <div class="step"><span>${mr(p.pts)}</span></div>
          </div>` : '<div class="pod empty-pod"></div>')).join('')}
      </section>
      <ol class="ranklist">${list.slice(3).map((p, i) => row(p, i + 3)).join('')}</ol>
      <p class="foot">टॉप ५० • प्रत्येक बरोबर उत्तराला ${mr(POINTS_PER_CORRECT)} गुण • आठवडा सोमवारी नव्याने सुरू होतो</p>`}
  </main>
  ${tabbar()}`;
}

// ---------- प्रोफाइल (मी) ----------
function chartSvg(hist) {
  const pts = hist.slice(0, 15).reverse().map((h) => Math.round((h.score / h.total) * 100));
  if (pts.length < 2) return '<p class="muted small">प्रगतीचा आलेख पाहण्यासाठी किमान २ चाचण्या द्या.</p>';
  const W = 320; const H = 130; const P = 18;
  const x = (i) => P + (i * (W - 2 * P)) / (pts.length - 1);
  const y = (v) => H - P - (v * (H - 2 * P)) / 100;
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="शेवटच्या चाचण्यांचे गुण">
    ${[0, 50, 100].map((g) => `<line x1="${P}" x2="${W - P}" y1="${y(g)}" y2="${y(g)}" class="grid"/><text x="2" y="${y(g) + 4}" class="gl">${mr(g)}</text>`).join('')}
    <path d="${area}" class="area"/><path d="${line}" class="line"/>
    ${pts.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" class="dot"/>`).join('')}
  </svg>`;
}

function meView() {
  const e = exam();
  const d = store.get();
  const hist = d.hist.filter((h) => h.exam === e.id);
  const first5 = hist.slice(-5);
  const last5 = hist.slice(0, 5);
  const avg = (a) => (a.length ? Math.round(a.reduce((s, h) => s + (h.score / h.total) * 100, 0) / a.length) : 0);
  const improve = hist.length >= 6 ? avg(last5) - avg(first5) : null;
  const st = examStats(e);

  const head = user ? `
    <section class="profile">
      <span class="av big" style="--h:${((player?.name || user.name || '?').charCodeAt(0) * 37) % 360}">${esc((player?.name || user.name || '?').slice(0, 1))}</span>
      <div class="grow"><h2>${esc(player?.name || user.name)}</h2><p>${esc(player?.dist || '')}${player?.dist ? ' • ' : ''}${esc(user.email)}</p></div>
      <button class="icon-btn soft" data-act="edit-profile" aria-label="प्रोफाइल बदला">✎</button>
    </section>
    <section class="mini-stats">
      ${EXAMS.map((x) => `<div><b>${mr(player?.[scoreField(x.id, 'all')] || 0)}</b><span>${x.name} गुण</span></div>`).join('')}
    </section>` : `
    <section class="auth-card">
      <h2>तुमची प्रगती सुरक्षित ठेवा</h2>
      <ul><li>🏆 रँकिंगमध्ये नाव व क्रमांक</li><li>📈 सर्व चाचण्यांचे निकाल कायमचे जतन</li><li>📱 फोन बदलला तरी प्रगती तशीच</li></ul>
      <div class="row2"><button class="btn primary" data-act="auth-mode" data-v="signup">खाते तयार करा</button><button class="btn ghost" data-act="auth-mode" data-v="login">लॉगिन</button></div>
    </section>`;

  return `
  <header class="top slim"><h1>${user ? 'माझे प्रोफाइल' : 'माझी प्रगती'}</h1></header>
  <main class="wrap">
    ${head}
    <h3 class="sec">${e.icon} ${e.name} • प्रगती</h3>
    <section class="mini-stats">
      <div><b>🔥 ${mr(store.streak())}</b><span>सलग दिवस</span></div>
      <div><b>${mr(hist.length)}</b><span>चाचण्या</span></div>
      <div><b>${mr(st.acc)}%</b><span>अचूकता</span></div>
    </section>
    <section class="panel">
      <div class="panel-h"><b>शेवटच्या चाचण्यांचे गुण (%)</b>
        ${improve !== null ? `<span class="delta ${improve >= 0 ? 'up' : 'down'}">${improve >= 0 ? '▲' : '▼'} ${mr(Math.abs(improve))}% ${improve >= 0 ? 'सुधारणा' : 'घट'}</span>` : ''}</div>
      ${chartSvg(hist)}
    </section>

    <h3 class="sec">विषयानुसार अचूकता</h3>
    <section class="statlist">
      ${e.subjects.map((sid) => {
        const s = subj[sid];
        const ss = subjectStats(sid);
        return `<div class="srow">
          <span class="ico">${s.icon}</span>
          <div class="grow"><b>${s.name}</b>
            <i class="bar" style="--c:${s.color}"><i style="width:${ss.acc ?? 0}%"></i></i>
            <small>${mr(ss.seen)}/${mr(ss.total)} सोडवले</small></div>
          <b class="pct">${ss.acc === null ? '–' : mr(ss.acc) + '%'}</b>
        </div>`;
      }).join('')}
    </section>

    <h3 class="sec">चाचण्यांचा इतिहास</h3>
    ${hist.length ? `<section class="statlist hist">${hist.slice(0, 20).map((h) => `
      <div class="srow">
        <span class="hscore ${h.score / h.total >= 0.7 ? 'good' : h.score / h.total >= 0.4 ? 'mid' : 'low'}">${mr(h.score)}/${mr(h.total)}</span>
        <div class="grow"><b>${esc(h.title || '')}</b><small>${dateMr(h.at)}${h.pts ? ` • +${mr(h.pts)} गुण` : ''}</small></div>
      </div>`).join('')}</section>` : '<p class="muted small">अजून एकही चाचणी दिली नाही.</p>'}

    <div class="stack">
      <a class="btn link" href="${APP.privacyUrl}" target="_blank" rel="noopener">गोपनीयता धोरण</a>
      ${user ? '<button class="btn link" data-act="logout">लॉगआउट</button><button class="btn link danger" data-act="delete-account">खाते कायमचे हटवा</button>'
        : '<button class="btn link danger" data-act="reset">या फोनवरील प्रगती पुसून टाका</button>'}
    </div>
  </main>
  ${tabbar()}`;
}

function distOptions(sel = '') {
  return `<option value="">जिल्हा निवडा</option>${DISTRICTS.map((d) => `<option ${d === sel ? 'selected' : ''}>${d}</option>`).join('')}`;
}

function authView() {
  const m = authMode;
  const title = m === 'signup' ? 'नवीन खाते' : m === 'login' ? 'लॉगिन' : 'पासवर्ड विसरलात?';
  return `
  <header class="top slim"><button class="icon-btn" data-act="back" aria-label="मागे">←</button><h1>${title}</h1></header>
  <main class="wrap">
    ${m !== 'reset' ? `<div class="seg">
      <button class="${m === 'signup' ? 'on' : ''}" data-act="auth-mode" data-v="signup">नवीन खाते</button>
      <button class="${m === 'login' ? 'on' : ''}" data-act="auth-mode" data-v="login">लॉगिन</button>
    </div>` : ''}
    <form class="form" id="auth-form" novalidate>
      ${m === 'signup' ? `
        <label>तुमचे नाव <small>(रँकिंगमध्ये दिसेल)</small><input id="f-name" maxlength="30" autocomplete="name" required></label>
        <label>जिल्हा<select id="f-dist">${distOptions()}</select></label>` : ''}
      <label>ईमेल<input id="f-email" type="email" inputmode="email" autocomplete="email" required></label>
      ${m !== 'reset' ? `<label>पासवर्ड <small>(किमान ६ अक्षरे)</small><input id="f-pass" type="password" autocomplete="${m === 'signup' ? 'new-password' : 'current-password'}" required></label>` : ''}
      ${authMsg ? `<p class="form-msg">${esc(authMsg)}</p>` : ''}
      <button class="btn primary full" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'थांबा…' : m === 'signup' ? 'खाते तयार करा' : m === 'login' ? 'लॉगिन करा' : 'रीसेट लिंक पाठवा'}</button>
    </form>
    ${m === 'login' ? '<button class="btn link full" data-act="auth-mode" data-v="reset">पासवर्ड विसरलात?</button>' : ''}
    ${m === 'reset' ? '<button class="btn link full" data-act="auth-mode" data-v="login">← लॉगिनवर परत</button>' : ''}
    <p class="muted small center">खाते मोफत आहे. तुमचा ईमेल कोणालाही दिसत नाही; रँकिंगमध्ये फक्त नाव व जिल्हा दिसतो.</p>
  </main>`;
}

async function submitAuth() {
  const v = (id) => (document.getElementById(id)?.value || '').trim();
  const email = v('f-email');
  const pass = document.getElementById('f-pass')?.value || '';
  const name = v('f-name');
  const dist = v('f-dist');
  authMsg = '';
  if (authMode === 'signup') {
    if (name.length < 2) { authMsg = 'कृपया तुमचे नाव लिहा (किमान २ अक्षरे).'; return render(); }
    if (!dist) { authMsg = 'कृपया जिल्हा निवडा.'; return render(); }
  }
  busy = true; render();
  try {
    if (authMode === 'signup') {
      await backend.signUp({ name, dist, email, password: pass });
      toast('खाते तयार झाले! 🎉');
    } else if (authMode === 'login') {
      await backend.signIn(email, pass);
      toast('स्वागत आहे!');
    } else {
      await backend.resetPassword(email);
      authMsg = 'पासवर्ड बदलण्याची लिंक तुमच्या ईमेलवर पाठवली आहे.';
    }
  } catch (err) {
    authMsg = errText(err);
  }
  busy = false;
  if (user && view === 'auth') go('me'); else render();
}

async function editProfile() {
  const ok = await openModal(`
    <p>प्रोफाइल बदला</p>
    <div class="form">
      <label>नाव<input id="m-name" maxlength="30" value="${esc(player?.name || '')}"></label>
      <label>जिल्हा<select id="m-dist">${distOptions(player?.dist || '')}</select></label>
    </div>
    <div class="modal-btns"><button class="btn ghost" data-act="modal-no">रद्द</button><button class="btn primary" data-act="modal-get">जतन करा</button></div>`);
  if (!ok) return;
  const { name, dist } = ok;
  if (name.length < 2) return toast('नाव किमान २ अक्षरांचे असावे');
  try {
    await backend.updatePlayer(user.uid, { name, dist });
    player = await backend.getPlayer(user.uid);
    Object.keys(rankCache).forEach((k) => delete rankCache[k]);
    toast('प्रोफाइल जतन केले');
    render();
  } catch (err) { toast(errText(err)); }
}

async function deleteAccount() {
  const ok = await openModal(`
    <p>खाते कायमचे हटवायचे?</p>
    <p class="muted small">तुमचे नाव रँकिंगमधून जाईल आणि ऑनलाइन जतन केलेली प्रगती पुसली जाईल. हे परत आणता येणार नाही.</p>
    <div class="form"><label>खात्री करण्यासाठी पासवर्ड टाका<input id="m-pass" type="password"></label></div>
    <div class="modal-btns"><button class="btn ghost" data-act="modal-no">रद्द</button><button class="btn danger-btn" data-act="modal-get">हटवा</button></div>`);
  if (!ok) return;
  try {
    await backend.deleteAccount(ok.pass);
    toast('खाते हटवले');
    go('me');
  } catch (err) { toast(errText(err)); }
}

function render(keepAnim = false) {
  if (!store.get().exam && view !== 'pick') view = 'pick';
  const views = {
    pick: pickView, home: homeView, quiz: () => quizView(!keepAnim), result: resultView, review: reviewView,
    saved: savedView, rank: rankView, me: meView, auth: authView,
  };
  app.innerHTML = (views[view] || homeView)();
  app.dataset.view = view;
}

// ---------- क्लिक ----------
document.addEventListener('submit', (e) => {
  if (e.target.id === 'auth-form') { e.preventDefault(); submitAuth(); }
});

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'modal-yes') return closeModal(true);
  if (act === 'modal-get') {
    const g = (id) => modalRoot.querySelector(id)?.value?.trim() ?? '';
    return closeModal({ name: g('#m-name'), dist: g('#m-dist'), pass: modalRoot.querySelector('#m-pass')?.value || '' });
  }
  if (act === 'modal-no') { if (e.target === el) closeModal(false); return; }
  if (el.classList.contains('disabled')) return;

  switch (act) {
    case 'start': return startQuiz(el.dataset.mode, el.dataset.sid);
    case 'ans': return answer(Number(el.dataset.k));
    case 'next': return next();
    case 'fifty': return useFifty();
    case 'exit':
    case 'back': return back();
    case 'tab':
      if (view === 'result') quiz = null;
      if (el.dataset.v === 'auth') { authMode = 'signup'; authMsg = ''; }
      return go(el.dataset.v);
    case 'pick-exam':
      store.setExam(el.dataset.id);
      rankExam = '';
      syncProgress();
      return go('home');
    case 'review': reviewOnlyWrong = false; return go('review');
    case 'filter': reviewOnlyWrong = el.dataset.v === 'wrong'; return render();
    case 'again': return startQuiz(quiz.mode === 'daily' ? 'mixed' : quiz.mode, quiz.sid);
    case 'save': {
      const on = store.toggleSave(quiz.items[quiz.i].q.id);
      toast(on ? 'प्रश्न जतन केला' : 'जतन यादीतून काढला');
      syncProgress();
      return render(true);
    }
    case 'save-id': store.toggleSave(el.dataset.id); syncProgress(); return render();
    case 'share': return shareScore();
    case 'rank-exam': rankExam = el.dataset.id; render(); return loadRank();
    case 'rank-period': rankPeriod = el.dataset.v; render(); return loadRank();
    case 'rank-refresh': return loadRank(true);
    case 'auth-mode': authMode = el.dataset.v; authMsg = ''; return view === 'auth' ? render() : go('auth');
    case 'edit-profile': return editProfile();
    case 'logout':
      if (await confirmBox('लॉगआउट करायचे? या फोनवरील प्रगती तशीच राहील.', 'लॉगआउट', 'नको')) { await backend.signOut(); toast('लॉगआउट झाले'); }
      return;
    case 'delete-account': return deleteAccount();
    case 'reset':
      if (await confirmBox('या फोनवरील सर्व प्रगती, जतन केलेले प्रश्न आणि सलग दिवस पुसले जातील. नक्की?', 'हो, पुसा', 'नको')) {
        store.reset(); render(); toast('प्रगती पुसली');
      }
  }
});

async function shareScore() {
  const text = `मी ‘${APP.name}’ अ‍ॅपवर ${examById[quiz.exam].name} – ${quiz.title} मध्ये ${mr(quiz.score)}/${mr(quiz.items.length)} गुण मिळवले! 🎯 तुम्हीपण सराव करा आणि रँकिंगमध्ये या.`;
  try {
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, dialogTitle: 'मित्रांना पाठवा' });
    } else if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast('मजकूर कॉपी केला');
    }
  } catch (_) { /* रद्द केले */ }
}

// ---------- सुरुवात ----------
if (Capacitor.isNativePlatform()) {
  import('@capacitor/app').then(({ App }) => App.addListener('backButton', back));
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
go(store.get().exam ? 'home' : 'pick');
initAds();
