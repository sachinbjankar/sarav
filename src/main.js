import '@fontsource/mukta/400.css';
import '@fontsource/mukta/600.css';
import '@fontsource/mukta/700.css';
import '@fontsource/mukta/800.css';
import './style.css';

import { Capacitor } from '@capacitor/core';
import { SUBJECTS, EXAMS, QUESTIONS, loadBank, full } from './questions.js';
import { store, today } from './store.js';
import { OWL_SVG, greeting, motto, owl, owlLine } from './mascot.js';
import { createNikal } from './nikal.js';
import { createTyping } from './typing.js';
import { loadNotices, noticesFor, nextFor, noticesUpdated, noticeById } from './notices.js';
import { initAds, showBanner, hideBanner, maybeInterstitial, showRewarded } from './ads.js';
import { QUIZ, APP, POINTS_PER_CORRECT } from './config.js';
import { backend } from './backend.js';
import { DISTRICTS, errText, scoreField } from './backend-common.js';

// ---------- मदतनीस ----------
const MR = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => MR[d]);
const LETTERS = ['१', '२', '३', '४'];
let byId = {};
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
const typing = createTyping({ go: (v) => go(v), render: () => render(), toast: (m) => toast(m), confirmBox: (...a) => confirmBox(...a), tabbar: () => tabbar(), ads: () => maybeInterstitial(1, 45) });
const nikal = createNikal({ backend, go: (v) => go(v), render: () => render(), toast: (m) => toast(m), confirmBox: (...a) => confirmBox(...a), exam, tabbar: () => tabbar(), user: () => user, noticeById });

// ---------- विषय व प्रश्नसंच ----------
const baseIds = (sid) => subj[sid].pool || [sid];
const poolCache = new Map();
const poolOf = (sid) => {
  if (!poolCache.has(sid)) { const b = baseIds(sid); poolCache.set(sid, QUESTIONS.filter((q) => b.includes(q.s))); }
  return poolCache.get(sid);
};
const examBase = (e) => [...new Set(e.subjects.flatMap(baseIds))];
const examPool = (e) => {
  const key = `exam:${e.id}`;
  if (!poolCache.has(key)) { const b = examBase(e); poolCache.set(key, QUESTIONS.filter((q) => b.includes(q.s))); }
  return poolCache.get(key);
};

// परीक्षेनुसार काठिण्य: [स्तर १, स्तर २, स्तर ३] चे प्रमाण
const LV_MIX = {
  mpsc: [0.15, 0.3, 0.55],   // राज्यसेवा: विधानांवर आधारित कठीण प्रश्न जास्त
  mpscb: [0.35, 0.35, 0.3],
  police: [0.65, 0.25, 0.1],
  talathi: [0.6, 0.3, 0.1],
  zp: [0.6, 0.3, 0.1],
};
const lvPool = (sid, lv) => {
  const key = `${sid}#${lv}`;
  if (!poolCache.has(key)) poolCache.set(key, poolOf(sid).filter((q) => (q.lv || 1) === lv));
  return poolCache.get(key);
};
function drawLv(e, rand) {
  const w = LV_MIX[e.id] || [0.5, 0.3, 0.2];
  let x = rand() * (w[0] + w[1] + w[2]);
  for (let k = 0; k < 3; k++) { x -= w[k]; if (x <= 0) return k + 1; }
  return 3;
}
// एका विषयातून परीक्षेच्या काठिण्यानुसार एक प्रश्न
function pickOne(e, sid, used, rand, prefer) {
  for (let t = 0; t < 3; t++) {
    const lv = drawLv(e, rand);
    const pool = lvPool(sid, lv).length ? lvPool(sid, lv) : poolOf(sid);
    const cand = prefer ? prioritised(sampleOf(pool, 300, rand), 40) : sampleOf(pool, 40, rand);
    const q = cand.find((x) => !used.has(x.id));
    if (q) return q;
  }
  return null;
}
// मोठ्या यादीतून झटपट नमुना
function sampleOf(pool, n, rand = Math.random) {
  if (pool.length <= n) return shuffle(pool, rand);
  const out = new Set();
  while (out.size < n) out.add(pool[Math.floor(rand() * pool.length)]);
  return [...out];
}

// परीक्षेच्या सर्व विषयांतून समतोल प्रश्न
function balanced(e, n, rand = Math.random, prefer = true) {
  const order = shuffle(e.subjects, rand);
  const used = new Set();
  const out = [];
  for (let i = 0; out.length < n && i < n * 4; i++) {
    const q = pickOne(e, order[i % order.length], used, rand, prefer);
    if (q) { used.add(q.id); out.push(q); }
  }
  return shuffle(out, rand);
}
function fromSubject(e, sid, n, rand = Math.random) {
  const used = new Set();
  const out = [];
  for (let i = 0; out.length < n && i < n * 4; i++) {
    const q = pickOne(e, sid, used, rand, true);
    if (q) { used.add(q.id); out.push(q); }
  }
  return out;
}

// सराव पेपर: प्रत्यक्ष परीक्षेसारखी विषयनिहाय प्रश्नसंख्या (अंदाजे) व एकूण वेळ
const MOCK = {
  mpsc: { mins: 120, neg: 0.25, note: 'सामान्य अध्ययन पेपर १ (२०२३ च्या पेपरनुसार विभागणी)', mix: { itihas: 15, paryavaran: 7, bhugol: 13, vidnyan: 20, arthashastra: 15, rajyaghatana: 15, samanya: 15 } },
  mpscb: { mins: 60, neg: 0.25, note: 'संयुक्त पूर्व परीक्षेसारखा (अंदाजे विभागणी)', mix: { itihas: 13, bhugol: 13, rajyaghatana: 13, arthashastra: 12, vidnyan: 13, samanya: 12, ganit: 12, buddhimatta: 12 } },
  police: { mins: 90, neg: 0, note: 'प्रत्येक विषय २५ प्रश्न', mix: { marathi: 25, ganit: 25, buddhimatta: 25, gk: 25 } },
  talathi: { mins: 120, neg: 0, note: 'मराठी, इंग्रजी, सामान्य ज्ञान, बौद्धिक चाचणी (प्रत्येकी २५)', mix: { marathi: 25, english: 25, gk: 20, mahsul: 5, ganit: 12, buddhimatta: 13 } },
  zp: { mins: 120, neg: 0, note: 'मराठी, इंग्रजी, सामान्य ज्ञान, बौद्धिक चाचणी (प्रत्येकी २५)', mix: { marathi: 25, english: 25, gk: 20, panchayat: 5, ganit: 12, buddhimatta: 13 } },
};

function buildItems(questions, rand = Math.random) {
  return questions.map(full).map((q) => {
    const order = shuffle([0, 1, 2, 3], rand);
    return { q, opts: order.map((k) => q.o[k]), correct: order.indexOf(0) };
  });
}

// ---------- स्तर (Duolingo-सारखा मार्ग) ----------
const UNIT_NAMES = ['सुरुवात', 'पाया पक्का', 'सराव वाढवा', 'आत्मविश्वास', 'वेग व अचूकता', 'परीक्षा तयारी', 'तज्ज्ञ'];
const PER_UNIT = 8;
const levelCache = new Map();
// सोप्या प्रश्नांपासून कठीण प्रश्नांकडे: लहान संख्या व छोटे प्रश्न आधी
function difficulty(q) {
  const digits = (q.q.match(/[०-९0-9]/g) || []).length;
  const optLen = q.o.reduce((a, o) => a + String(o).length, 0) / 4;
  return digits * 1.2 + q.q.length / 30 + optLen / 12;
}
function levelPool(sid) {
  if (!levelCache.has(sid)) {
    const groups = {};
    for (const q of poolOf(sid)) (groups[q.s] ||= []).push(q);
    const lists = Object.entries(groups).map(([s, list]) => {
      const out = [];
      // स्तर १ → २ → ३: सोप्याकडून परीक्षा-स्वरूप कठीण प्रश्नांकडे
      for (const lv of [1, 2, 3]) {
        const part = list.filter((q) => (q.lv || 1) === lv);
        const gen = part.filter((q) => q.v);
        const fixed = part.filter((q) => !q.v).sort((a, b) => difficulty(a) - difficulty(b) || (a.id < b.id ? -1 : 1));
        const r = rng(`band-${s}-${lv}`);
        const banded = [];
        for (let k = 0; k < fixed.length; k += 40) banded.push(...shuffle(fixed.slice(k, k + 40), r));
        const genMix = gen.length > 400 && gen[0].g === 'cx' ? shuffle(gen, r) : gen;
        for (let k = 0; k < Math.max(genMix.length, banded.length); k++) { if (k < banded.length) out.push(banded[k]); if (k < genMix.length) out.push(genMix[k]); }
      }
      return out;
    });
    const p = [];
    const total = lists.reduce((a, l) => a + l.length, 0);
    for (let k = 0; p.length < total; k++) for (const l of lists) if (k < l.length) p.push(l[k]);
    levelCache.set(sid, p);
  }
  return levelCache.get(sid);
}
const levelCount = (sid) => Math.floor(levelPool(sid).length / QUIZ.PER_TEST);
const isChest = (idx) => idx % 4 === 3;
const unitName = (u) => (u < UNIT_NAMES.length ? UNIT_NAMES[u] : `${UNIT_NAMES[UNIT_NAMES.length - 1]} ${mr(u - UNIT_NAMES.length + 2)}`);
const starsFor = (score, total) => { const p = score / total; return p >= 1 ? 3 : p >= 0.8 ? 2 : p >= 0.6 ? 1 : 0; };

// एकूण स्तर (XP वरून): स्तर L साठी लागणारे XP = ५० × L × (L − १) / २
const xpFor = (L) => (50 * L * (L - 1)) / 2;
function userLevel(xp = store.get().xp || 0) {
  let L = 1;
  while (xpFor(L + 1) <= xp) L++;
  return { L, cur: xp - xpFor(L), need: xpFor(L + 1) - xpFor(L) };
}

function prioritised(pool, n = QUIZ.PER_TEST) {
  const ans = store.get().ans;
  const unseen = shuffle(pool.filter((q) => !ans[q.id]));
  if (unseen.length >= n) return unseen.slice(0, n);
  const wrong = shuffle(pool.filter((q) => ans[q.id] && !ans[q.id].last));
  const rest = shuffle(pool.filter((q) => ans[q.id] && ans[q.id].last));
  return [...unseen, ...wrong, ...rest].slice(0, n);
}

function dailyQuestions(e) {
  const rand = rng(`daily-${e.id}-${today()}`);
  return buildItems(balanced(e, QUIZ.PER_TEST, rand, false), rand);
}

const wrongQuestions = (e) => {
  const ans = store.get().ans;
  return examPool(e).filter((q) => ans[q.id] && !ans[q.id].last);
};

// ---------- चाचणी ----------
function startQuiz(mode, sid, lvl) {
  const e = exam();
  let items;
  let title;
  let retry = false;
  if (mode === 'level') {
    const idx = Number(lvl);
    const rand = rng(`${sid}-L${idx}-${Date.now()}`);
    items = buildItems(levelPool(sid).slice(idx * QUIZ.PER_TEST, (idx + 1) * QUIZ.PER_TEST), rand);
    title = `${subj[sid].name} • स्तर ${mr(idx + 1)}`;
    retry = !!store.pathOf(sid).st[idx];
  } else if (mode === 'daily') {
    items = dailyQuestions(e);
    title = 'आजची प्रश्नमंजुषा';
    retry = store.dailyFor(e.id).date === today();
  } else if (mode === 'subject') {
    items = buildItems(fromSubject(e, sid, QUIZ.PER_TEST));
    title = subj[sid].name;
  } else if (mode === 'mock') {
    const m = MOCK[e.id];
    const used = new Set();
    const qs = [];
    for (const [s2, n] of Object.entries(m.mix)) {
      for (const q of fromSubject(e, s2, n)) if (!used.has(q.id)) { used.add(q.id); qs.push(q); }
    }
    items = buildItems(qs);
    title = `${e.short} सराव पेपर`;
  } else if (mode === 'wrong') {
    items = buildItems(shuffle(wrongQuestions(e)).slice(0, QUIZ.PER_TEST));
    title = 'चुकलेल्या प्रश्नांचा सराव';
  } else if (mode === 'saved') {
    items = buildItems(shuffle(store.get().saved.map((id) => byId[id]).filter(Boolean)).slice(0, QUIZ.PER_TEST));
    title = 'जतन केलेले प्रश्न';
  } else {
    items = buildItems(balanced(e, QUIZ.PER_TEST));
    title = 'मिश्र सराव चाचणी';
  }
  if (!items.length) return startQuiz('mixed');
  // रँकिंगचे गुण: आजची प्रश्नमंजुषा (पहिल्यांदा), विषय चाचणी व मिश्र चाचणी
  const ranked = (mode === 'daily' && !retry) || (mode === 'level' && !retry) || mode === 'subject' || mode === 'mixed';
  const mock = mode === 'mock' ? MOCK[e.id] : null;
  quiz = {
    mode, sid, title, items, retry, ranked, exam: e.id, lvl: Number(lvl), mock,
    deadline: mock ? Date.now() + mock.mins * 60000 : 0,
    i: 0,
    answers: items.map(() => null),
    removed: items.map(() => []),
    fifty: QUIZ.FREE_FIFTY_FIFTY,
    left: QUIZ.SECONDS_PER_Q,
    started: Date.now(),
  };
  go('quiz');
}

const clock = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(t / 3600); const m = Math.floor((t % 3600) / 60); const sec = t % 60; return `${h ? `${mr(h)}:` : ''}${mr(String(m).padStart(h ? 2 : 1, '0'))}:${mr(String(sec).padStart(2, '0'))}`; };
function startTimer() {
  if (quiz && quiz.mock) {
    if (timer) return;
    timer = setInterval(() => {
      if (!quiz || !quiz.mock) return stopTimer();
      const left = quiz.deadline - Date.now();
      const el = document.getElementById('timer');
      if (el) el.textContent = clock(left);
      if (left <= 0) { stopTimer(); toast('वेळ संपली — पेपर जमा केला'); finish(); }
    }, 1000);
    return;
  }
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
  if (quiz && quiz.mock) {
    const it = quiz.items[quiz.i];
    quiz.answers[quiz.i] = { choice, ok: choice === it.correct };
    render(true);
    return;
  }
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

async function next() {
  if (quiz.i < quiz.items.length - 1) { quiz.i++; go('quiz'); return; }
  if (quiz.mock) {
    const left = quiz.answers.filter((a) => !a).length;
    if (!(await confirmBox(left ? `${mr(left)} प्रश्न अजून सोडवायचे आहेत. पेपर जमा करायचा?` : 'पेपर जमा करायचा?', 'हो, जमा करा', 'नाही'))) return;
  }
  finish();
}
function prev() { if (quiz && quiz.i > 0) { quiz.i--; go('quiz'); } }

async function finish() {
  stopTimer();
  if (quiz.mock) {
    if (!quiz.pyq) quiz.items.forEach((it, k) => { const a = quiz.answers[k]; if (a) store.record(it.q.id, a.ok); });
    const wrongN = quiz.answers.filter((a) => a && !a.ok).length;
    quiz.net = Math.round((quiz.answers.filter((a) => a && a.ok).length - wrongN * quiz.mock.neg) * 100) / 100;
  }
  const score = quiz.answers.filter((a) => a && a.ok).length;
  quiz.score = score;
  if (quiz.pyq) {
    const st = pyqStats();
    const cur = st[quiz.pyq] || { best: 0, n: 0 };
    st[quiz.pyq] = { best: Math.max(cur.best, score), n: cur.n + 1, last: score, at: Date.now() };
    try { localStorage.setItem(PYQ_KEY, JSON.stringify(st)); } catch (_) { /* ignore */ }
  }
  quiz.secs = Math.round((Date.now() - quiz.started) / 1000);
  quiz.pts = quiz.ranked ? score * POINTS_PER_CORRECT : 0;
  let xp = score * POINTS_PER_CORRECT;
  if (quiz.mode === 'level') {
    quiz.stars = starsFor(score, quiz.items.length);
    const before = store.pathOf(quiz.sid).st[quiz.lvl] || 0;
    if (quiz.stars > 0) store.completeLevel(quiz.sid, quiz.lvl, quiz.stars);
    if (quiz.stars > before) xp += 20 + (isChest(quiz.lvl) && !before ? 30 : 0);
    quiz.chest = isChest(quiz.lvl) && quiz.stars > 0 && !before;
  }
  const [x0, x1] = store.addXp(xp);
  quiz.xp = xp;
  quiz.levelUp = userLevel(x1).L > userLevel(x0).L ? userLevel(x1).L : 0;
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
  if (v === 'quiz' || v === 'pick' || v === 'auth' || v === 'typing-run') hideBanner(); else showBanner();
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
  else if (view === 'result' && quiz?.mode === 'level') { pathSid = quiz.sid; quiz = null; go('path'); scrollToCurrent(); }
  else if (view === 'auth') go('me');
  else if (nikal.backTarget(view)) go(nikal.backTarget(view));
  else if (typing.isTyping(view)) { const t = await typing.backTarget(view); if (t) go(t); }
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
    <p class="muted">प्रत्येक परीक्षेचे विषय, आजची प्रश्नमंजुषा व रँकिंग वेगळे आहे. नंतर कधीही बदलता येईल. (परीक्षेचे स्वरूप अधिकृत जाहिरातीनुसार बदलू शकते.)</p>
    ${EXAMS.map((e) => `
      <button class="exam-card ${store.get().exam === e.id ? 'on' : ''}" style="--c:${e.color}" data-act="pick-exam" data-id="${e.id}">
        <span class="ico">${e.icon}</span>
        <span class="grow"><b>${e.name}</b><small>${e.full}</small>
          <em>${e.subjects.map((s) => subj[s].name).join(' • ')}</em>
          <em class="pat">📝 ${e.pattern}</em></span>
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
    <div class="pills">
      <button class="lvl-pill" data-act="tab" data-v="me" title="तुमचा स्तर">${levelBadge()}</button>
      <div class="streak" title="सलग दिवस">🔥 ${mr(store.streak())}</div>
    </div>
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

    ${nikal.homeCard()}
    ${examStrip(e)}

    ${user ? '' : `
    <button class="join-strip" data-act="tab" data-v="auth">
      <span>🏆</span><span class="grow"><b>${backend.kind === 'mock' ? 'तुमचे नाव जोडा' : 'रँकिंगमध्ये नाव झळकवा'}</b><small>${backend.kind === 'mock' ? 'सर्वांची एकत्र रँकिंग लवकरच सुरू होईल' : 'मोफत खाते तयार करा • प्रगती कायमची जतन'}</small></span><span class="arrow">›</span>
    </button>`}

    <section class="mini-stats">
      <div><b>${mr(store.testsFor(e.id))}</b><span>चाचण्या पूर्ण</span></div>
      <div><b>${mr(st.seen)}</b><span>प्रश्न सोडवले</span></div>
      <div><b>${mr(st.acc)}%</b><span>अचूकता</span></div>
    </section>

    <div class="row2">
      <button class="card action" data-act="start" data-mode="mixed">
        <span class="big">🎯</span><b>मिश्र सराव</b><small>${e.name} चे सर्व विषय • ${mr(QUIZ.PER_TEST)} प्रश्न</small>
      </button>
      <button class="card action ${wrongN ? '' : 'disabled'}" data-act="start" data-mode="wrong">
        <span class="big">🔁</span><b>चुकलेले प्रश्न</b><small>${wrongN ? `${mr(wrongN)} प्रश्न पुन्हा सोडवा` : 'अजून एकही नाही'}</small>
      </button>
    </div>

    <button class="mock-strip" data-act="tab" data-v="pyq">
      <span class="ex-ico">📜</span><span class="grow"><b>मागील प्रश्नपत्रिका</b><small>${pyqFor(e.id).length ? `${mr(pyqFor(e.id).length)} पेपर • खऱ्या परीक्षेसारखी वेळ व गुणपद्धती` : 'MPSC चे खरे पेपर • परीक्षा मोडमध्ये सोडवा'}</small></span><span class="arrow">›</span>
    </button>
    ${typing.homeCard()}

    <h3 class="sec">${e.name} • विषयानुसार सराव</h3>
    <section class="subjects">
      ${e.subjects.map((sid) => {
        const s = subj[sid];
        const ss = subjectStats(sid);
        return `
        <button class="subject" style="--c:${s.color}" data-act="path" data-sid="${s.id}">
          <span class="ico">${s.icon}</span>
          <b>${s.name}</b>
          <small>स्तर ${mr(store.pathOf(s.id).n + 1)}${ss.seen ? ` • ${mr(ss.acc)}% बरोबर` : ''}</small>
          <i class="bar"><i style="width:${((store.pathOf(s.id).n % PER_UNIT) / PER_UNIT) * 100}%"></i></i>
        </button>`;
      }).join('')}
    </section>
    <p class="foot">नवीन प्रश्न नियमितपणे जोडले जातील.</p>
  </main>
  ${tabbar()}`;
}

function mockView(animate) {
  const it = quiz.items[quiz.i];
  const a = quiz.answers[quiz.i];
  const s = subj[it.q.s];
  const done = quiz.answers.filter(Boolean).length;
  const last = quiz.i === quiz.items.length - 1;
  return `
  <header class="qtop">
    <button class="icon-btn" data-act="exit" aria-label="बाहेर">✕</button>
    <div class="qprog"><i style="width:${(done / quiz.items.length) * 100}%"></i></div>
    <div class="mock-clock">⏱ <span id="timer">${clock(quiz.deadline - Date.now())}</span></div>
  </header>
  <main class="wrap quiz ${animate ? 'enter' : ''}">
    <div class="qmeta">
      <span class="tag" style="--c:${s.color}">${s.icon} ${s.name}</span>
      <span>प्रश्न ${mr(quiz.i + 1)}/${mr(quiz.items.length)} • सोडवले ${mr(done)}</span>
    </div>
    <h2 class="qtext">${esc(it.q.q)}</h2>
    ${it.q.img ? `<img class="qimg" src="${esc(it.q.img)}" alt="आकृती">` : ''}
    <div class="opts">
      ${it.opts.map((o, k) => `<button class="opt ${a && a.choice === k ? 'picked' : ''}" data-act="ans" data-k="${k}">
          <span class="l">${LETTERS[k]}</span><span class="t">${esc(o)}</span></button>`).join('')}
    </div>
    <div class="qactions three">
      <button class="btn ghost" data-act="prev" ${quiz.i ? '' : 'disabled'}>← मागील</button>
      ${quiz.pyq ? '<span></span>' : `<button class="btn ghost" data-act="save" aria-label="जतन करा">${store.isSaved(it.q.id) ? '⭐' : '☆'}</button>`}
      <button class="btn primary" data-act="next">${last ? 'पेपर जमा करा' : a ? 'पुढील →' : 'सोडा →'}</button>
    </div>
    ${quiz.mock.neg ? `<p class="muted small center">चुकीच्या उत्तराला ${mr(quiz.mock.neg)} गुण वजा • उत्तर बदलता येते</p>` : '<p class="muted small center">उत्तर बदलता येते • निकाल शेवटी</p>'}
  </main>`;
}

function quizView(animate = true) {
  if (quiz.mock) return mockView(animate);
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
        <div class="ex-head">${owl(a.ok ? 'correct' : 'wrong')}<b>${a.ok ? '✅ बरोबर!' : a.choice === -1 ? '⏰ वेळ संपली' : '❌ चूक'}</b></div>
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
  const skipped = quiz.answers.filter((a) => !a || a.choice === -1).length;
  const pct = Math.round((quiz.score / total) * 100);
  const msg = pct >= 80 ? 'उत्कृष्ट! असाच सराव सुरू ठेवा 💪' : pct >= 50 ? 'छान! थोडा अजून सराव करा.' : 'हरकत नाही, चुकलेले प्रश्न पुन्हा सोडवा.';
  const min = Math.floor(quiz.secs / 60);
  const sec = quiz.secs % 60;
  let ptsLine = '';
  if (quiz.pts > 0) {
    ptsLine = user
      ? `<div class="pts-note ok">🏆 <b>+${mr(quiz.pts)} गुण</b> ${examById[quiz.exam].name} रँकिंगमध्ये जोडले</div>`
      : `<button class="pts-note" data-act="tab" data-v="auth">🏆 <b>+${mr(quiz.pts)} गुण</b> मिळाले! खाते तयार करा आणि रँकिंगमध्ये या ›</button>`;
  } else if (quiz.ranked === false && quiz.mode !== 'level') {
    ptsLine = '<div class="pts-note muted">ही सराव चाचणी होती; रँकिंगचे गुण आजची प्रश्नमंजुषा, स्तर व मिश्र चाचणीला मिळतात.</div>';
  }
  const isLvl = quiz.mode === 'level';
  const nextIdx = quiz.lvl + 1;
  const hasNext = isLvl && quiz.stars > 0 && nextIdx < levelCount(quiz.sid);
  const lvlBox = isLvl ? `
      <div class="lvl-stars">${[1, 2, 3].map((k) => `<span class="${k <= quiz.stars ? 'on' : ''}">★</span>`).join('')}</div>
      <p class="lvl-msg">${quiz.stars ? `स्तर ${mr(quiz.lvl + 1)} पूर्ण!${quiz.chest ? ' 🎁 खजिना उघडला: +३० XP' : ''}` : 'स्तर पार करण्यासाठी किमान ६ प्रश्न बरोबर हवेत. पुन्हा प्रयत्न करा!'}</p>` : '';
  const say = owlLine(pct, isLvl ? quiz.stars > 0 : undefined);
  const owlBox = `<div class="owl-say">${owl(say.mood)}<div class="bubble">${say.line}</div></div>`;
  const xpLine = `<div class="xp-note">⚡ +${mr(quiz.xp)} XP${quiz.levelUp ? ` • 🎉 तुम्ही स्तर ${mr(quiz.levelUp)} गाठला!` : ''}</div>`;
  return `
  <header class="top slim"><h1>${isLvl ? 'स्तर निकाल' : 'निकाल'}</h1></header>
  <main class="wrap">
    <section class="result">
      ${owlBox}
      ${lvlBox}
      <div class="score-ring" style="--p:${quiz.score / total}">
        <div><b>${mr(quiz.score)}</b><span>/${mr(total)}</span></div>
      </div>
      <h2>${quiz.title}</h2>
      <p>${msg}</p>
      <div class="mini-stats in">
        <div><b class="g">${mr(quiz.score)}</b><span>बरोबर</span></div>
        <div><b class="r">${mr(wrong)}</b><span>चूक</span></div>
        <div><b>${mr(skipped)}</b><span>${quiz.mock ? 'सोडलेले' : 'वेळ संपली'}</span></div>
        <div><b>${mr(min)}:${mr(String(sec).padStart(2, '0'))}</b><span>वेळ</span></div>
      </div>
      ${quiz.mock ? `<div class="xp-note">📝 ${quiz.mock.neg ? `ऋण गुणांसह निव्वळ गुण: <b>${mr(quiz.net)}</b>/${mr(total)}` : `गुण: <b>${mr(quiz.score)}</b>/${mr(total)}`}</div>` : ''}
      ${xpLine}
      ${ptsLine}
    </section>
    <div class="stack">
      ${hasNext ? `<button class="btn go" data-act="start" data-mode="level" data-sid="${quiz.sid}" data-lvl="${nextIdx}">पुढील स्तर ${mr(nextIdx + 1)} →</button>` : ''}
      ${isLvl && !quiz.stars ? `<button class="btn go" data-act="start" data-mode="level" data-sid="${quiz.sid}" data-lvl="${quiz.lvl}">पुन्हा प्रयत्न करा</button>` : ''}
      <button class="btn primary" data-act="review">उत्तरे व स्पष्टीकरण पहा</button>
      ${isLvl ? `<button class="btn ghost" data-act="path" data-sid="${quiz.sid}">मार्गावर परत जा</button>` : '<button class="btn ghost" data-act="again">पुन्हा नवीन चाचणी</button>'}
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
    ${q.img ? `<img class="qimg" src="${esc(q.img)}" alt="आकृती">` : ''}
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
      ${ids.slice(0, 100).map((id) => { const it = buildItems([byId[id]], rng(id))[0]; return reviewCard(it.q, it.opts, it.correct, -2); }).join('')}`
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
      ${EXAMS.map((x) => `<button class="${x.id === e.id ? 'on' : ''}" data-act="rank-exam" data-id="${x.id}">${x.icon} ${x.short}</button>`).join('')}
    </div>
    <div class="seg">
      <button class="${rankPeriod === 'week' ? 'on' : ''}" data-act="rank-period" data-v="week">या आठवड्यात</button>
      <button class="${rankPeriod === 'all' ? 'on' : ''}" data-act="rank-period" data-v="all">सर्वकाळ</button>
    </div>
    ${backend.kind === 'mock' ? (globalThis.Capacitor?.isNativePlatform?.() ? '<p class="demo-note">सर्व विद्यार्थ्यांची एकत्र रँकिंग लवकरच सुरू होईल. सध्या तुमचे गुण या फोनवर जतन होतात.</p>' : '<p class="demo-note">डेमो: इतर नावे नमुना आहेत.</p>') : ''}
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
      <div><b>${mr(player?.[scoreField(e.id, 'all')] || 0)}</b><span>${e.short} गुण</span></div>
      <div><b>${mr(player?.[scoreField(e.id, 'week')] || 0)}</b><span>या आठवड्यात</span></div>
      <div><b>${mr(player?.tot || 0)}</b><span>एकूण गुण</span></div>
    </section>` : `
    <section class="auth-card">
      ${backend.kind === 'mock' ? `<h2>तुमचे नाव जोडा</h2>
      <ul><li>📈 तुमची प्रगती या फोनवर जतन होते</li><li>🏆 सर्वांची एकत्र रँकिंग — लवकरच</li><li>☁️ फोन बदलला तरी प्रगती तशीच — लवकरच</li></ul>` : `<h2>तुमची प्रगती सुरक्षित ठेवा</h2>
      <ul><li>🏆 रँकिंगमध्ये नाव व क्रमांक</li><li>📈 सर्व चाचण्यांचे निकाल कायमचे जतन</li><li>📱 फोन बदलला तरी प्रगती तशीच</li></ul>`}
      <div class="row2"><button class="btn primary" data-act="auth-mode" data-v="signup">खाते तयार करा</button><button class="btn ghost" data-act="auth-mode" data-v="login">लॉगिन</button></div>
    </section>`;

  return `
  <header class="top slim"><h1>${user ? 'माझे प्रोफाइल' : 'माझी प्रगती'}</h1></header>
  <main class="wrap">
    ${head}
    ${(() => { const u = userLevel(); return `<section class="lvl-card"><span class="lv-ring big" style="--p:${u.cur / u.need}"><b>${mr(u.L)}</b></span><div class="grow"><b>स्तर ${mr(u.L)}</b><small>पुढील स्तरासाठी ${mr(u.need - u.cur)} XP बाकी • एकूण ${mr(store.get().xp || 0)} XP</small><i class="bar" style="--c:var(--saffron)"><i style="width:${(u.cur / u.need) * 100}%"></i></i></div></section>`; })()}
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
            <small>${mr(ss.seen)} प्रश्न सोडवले</small></div>
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

    <p class="muted small" style="margin:20px 4px 4px;line-height:1.5">‘सराव’ हे खाजगी शैक्षणिक अ‍ॅप आहे. हे MPSC, महाराष्ट्र शासन किंवा कोणत्याही सरकारी संस्थेशी संलग्न नाही. मागील प्रश्नपत्रिका व परीक्षांच्या तारखा अधिकृत संकेतस्थळ mpsc.gov.in वरून घेतल्या आहेत; अधिकृत माहितीसाठी ते संकेतस्थळ पाहा.</p>
    <div class="stack" style="padding-bottom:120px">
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

function levelBadge() {
  const u = userLevel();
  return `<span class="lv-ring" style="--p:${u.cur / u.need}"><b>${mr(u.L)}</b></span><span>स्तर</span>`;
}

let pathSid = '';
function pathView() {
  const s = subj[pathSid];
  const p = store.pathOf(pathSid);
  const total = levelCount(pathSid);
  const cur = Math.min(p.n, total - 1);
  const units = Math.min(Math.floor(cur / PER_UNIT) + 2, Math.ceil(total / PER_UNIT));
  const offs = [0, 46, 78, 46, 0, -46, -78, -46];
  let html = '';
  for (let u = 0; u < units; u++) {
    const locked = u * PER_UNIT > cur;
    html += `<div class="unit ${locked ? 'locked' : ''}" style="--c:${s.color}"><small>टप्पा ${mr(u + 1)}</small><b>${unitName(u)}</b></div><div class="trail">`;
    for (let k = 0; k < PER_UNIT; k++) {
      const idx = u * PER_UNIT + k;
      if (idx >= total) break;
      const st = p.st[idx] || 0;
      const state = idx < p.n || st ? 'done' : idx === cur ? 'current' : 'locked';
      const icon = state === 'locked' ? (isChest(idx) ? '🎁' : '🔒') : isChest(idx) ? (st ? '🏆' : '🎁') : st ? '✓' : '★';
      html += `
        <div class="node-wrap" style="--x:${offs[k % offs.length]}px">
          ${state === 'current' ? `<div class="bubble">${st ? 'पुन्हा' : 'सुरू करा'}</div>` : ''}
          <button class="node ${state} ${isChest(idx) ? 'chest' : ''}" style="--c:${s.color}" ${state === 'locked' ? 'disabled' : `data-act="start" data-mode="level" data-sid="${pathSid}" data-lvl="${idx}"`} aria-label="स्तर ${idx + 1}">
            <span>${icon}</span>
          </button>
          <div class="node-meta">${state === 'done' ? `<span class="mini-stars">${[1, 2, 3].map((x) => (x <= st ? '★' : '☆')).join('')}</span>` : `स्तर ${mr(idx + 1)}`}</div>
        </div>`;
    }
    html += '</div>';
  }
  return `
  <header class="top slim path-top" style="background:${s.color}">
    <button class="icon-btn" data-act="tab" data-v="home" aria-label="मागे">←</button>
    <div class="grow"><h1>${s.icon} ${s.name}</h1><p>स्तर ${mr(cur + 1)} • ${mr(Object.values(p.st).reduce((a, b) => a + b, 0))} ★ मिळवले</p></div>
  </header>
  <main class="wrap path">
    ${html}
    <p class="foot">प्रत्येक स्तरात ${mr(QUIZ.PER_TEST)} प्रश्न • किमान ६ बरोबर = पुढचा स्तर उघडतो • प्रत्येक चौथ्या स्तरावर 🎁 खजिना</p>
  </main>
  ${tabbar()}`;
}



// ---------- मागील प्रश्नपत्रिका ----------
let pyqIndex = [];
const pyqCache = new Map();
let pyqAll = false;
const PYQ_KEY = 'sarav.pyq';
const pyqStats = () => { try { return JSON.parse(localStorage.getItem(PYQ_KEY) || '{}'); } catch (_) { return {}; } };
function loadPyqIndex() {
  return fetch('pyq/index.json').then((r) => (r.ok ? r.json() : [])).then((x) => { pyqIndex = x; }).catch(() => {});
}
const pyqFor = (eid) => pyqIndex.filter((p) => !eid || p.exams.includes(eid));
const yearOf = (iso) => mr(iso.slice(0, 4));
function pyqView() {
  const e = exam();
  const mine = pyqFor(e.id);
  const list = pyqAll || !mine.length ? pyqIndex : mine;
  const st = pyqStats();
  return `
  <header class="top slim"><h1>📜 मागील प्रश्नपत्रिका</h1></header>
  <main class="wrap">
    <div class="seg">
      <button class="${pyqAll ? '' : 'on'}" data-act="pyq-scope" data-all="0">${esc(e.name)}</button>
      <button class="${pyqAll ? 'on' : ''}" data-act="pyq-scope" data-all="1">सर्व परीक्षा</button>
    </div>
    ${!pyqAll && !mine.length ? `<p class="muted">${esc(e.name)} च्या प्रश्नपत्रिका लवकरच जोडल्या जातील. तोपर्यंत इतर परीक्षांचे पेपर सोडवू शकता:</p>` : ''}
    ${list.map((p) => {
      const s2 = st[p.id];
      return `<button class="pyq-card" data-act="pyq-start" data-id="${p.id}">
        <span class="pyq-yr">${yearOf(p.date)}</span>
        <span class="grow"><b>${esc(p.title)}</b>
          <small>${mr(p.count)} प्रश्न • ${mr(p.mins)} मिनिटे${p.neg ? ` • चुकीला ${mr(p.neg)} वजा` : ''}</small>
          ${s2 ? `<small class="pyq-best">सर्वोत्तम: ${mr(s2.best)}/${mr(p.count)} • ${mr(s2.n)} वेळा सोडवला</small>` : ''}
        </span><span class="arrow">›</span>
      </button>`;
    }).join('')}
    <p class="muted small n-disc">प्रश्न MPSC च्या प्रश्नपत्रिकांवरून टाइप केले असून उत्तरे आयोगाच्या अंतिम उत्तरतालिकेनुसार आहेत. रद्द केलेले व उताऱ्यावर आधारित प्रश्न वगळले आहेत. नवीन पेपर नियमितपणे जोडले जातील.</p>
  </main>
  ${tabbar()}`;
}
async function startPyq(id) {
  const meta = pyqIndex.find((p) => p.id === id);
  if (!meta) return;
  let paper = pyqCache.get(id);
  if (!paper) {
    try { paper = await (await fetch(meta.file)).json(); pyqCache.set(id, paper); } catch (_) { toast('पेपर उघडता आला नाही'); return; }
  }
  // पेपर सुरू होण्यापूर्वी एक पूर्ण-स्क्रीन जाहिरात (मागील जाहिरात ४५ सेकंदांपूर्वीची असल्यास); टायमर जाहिरातीनंतरच सुरू होतो
  await maybeInterstitial(1, 45);
  const L = ['१', '२', '३', '४'];
  const items = paper.q.map((x) => ({
    q: { id: `pyq:${id}:${x.n}`, s: x.s, q: `प्र. ${mr(x.n)}. ${x.q}`, o: x.o, img: x.img, e: `योग्य उत्तर: (${L[x.a]}) ${x.o[x.a]}\n(आयोगाची अंतिम उत्तरतालिका)` },
    opts: x.o, correct: x.a,
  }));
  quiz = {
    mode: 'pyq', pyq: id, title: paper.short || paper.title, items, retry: false, ranked: false, exam: exam().id, lvl: 0,
    mock: { mins: paper.mins, neg: paper.neg, note: paper.note },
    deadline: Date.now() + paper.mins * 60000,
    i: 0, answers: items.map(() => null), removed: items.map(() => []), fifty: 0, left: 0, started: Date.now(),
  };
  go('quiz');
}

// ---------- परीक्षा व सूचना ----------
const isoMr = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${mr(d)} ${MONTHS[m - 1]} ${mr(y)}`; };
const leftMr = (n) => (n === 0 ? 'आज!' : n === 1 ? 'उद्या' : `${mr(n)} दिवस बाकी`);
function examStrip(e) {
  const n = nextFor(e.id);
  const sub = n ? `${esc(n.title)}` : 'आगामी परीक्षा, बदललेल्या तारखा व सूचना';
  const right = n ? `<span class="ex-left ${n.left <= 7 ? 'soon' : ''}">${leftMr(n.left)}</span>` : '<span class="arrow">›</span>';
  return `<button class="exam-strip" data-act="tab" data-v="exams">
    <span class="ex-ico">📅</span><span class="grow"><b>परीक्षा व सूचना</b><small>${sub}</small></span>${right}
  </button>`;
}
function noticeCard(x) {
  const badge = x.status === 'postponed' ? '<span class="nb warn">पुढे ढकलली</span>'
    : x.status === 'tba' ? '<span class="nb">तारीख जाहीर नाही</span>'
    : x.kind === 'deadline' ? '<span class="nb hot">शेवटची तारीख</span>' : '<span class="nb ok">तारीख निश्चित</span>';
  const when = x.date ? `<div class="n-date">🗓️ ${isoMr(x.date)}${x.left !== null && x.left >= 0 ? ` • <b>${leftMr(x.left)}</b>` : x.left < 0 ? ' • झाली' : ''}</div>` : '';
  return `<article class="notice ${x.left !== null && x.left >= 0 && x.left <= 7 ? 'urgent' : ''}">
    <div class="n-top">${badge}</div>
    <h3>${esc(x.title)}</h3>${when}
    <p>${esc(x.note || '')}</p>
    ${x.link ? `<a class="n-link" href="${esc(x.link)}" target="_blank" rel="noopener">अधिकृत संकेतस्थळ ↗</a>` : ''}
  </article>`;
}
let examsAll = false;
function examsView() {
  const e = exam();
  const { upcoming, tba, past } = noticesFor(examsAll ? null : e.id);
  const upd = noticesUpdated();
  return `
  <header class="top slim"><h1>📅 परीक्षा व सूचना</h1></header>
  <main class="wrap">
    <div class="seg">
      <button class="${examsAll ? '' : 'on'}" data-act="exams-scope" data-all="0">${esc(e.name)}</button>
      <button class="${examsAll ? 'on' : ''}" data-act="exams-scope" data-all="1">सर्व परीक्षा</button>
    </div>
    ${upcoming.length ? `<h2 class="sec">आगामी</h2>${upcoming.map(noticeCard).join('')}` : ''}
    ${tba.length ? `<h2 class="sec">पुढे ढकललेल्या / जाहीर होणाऱ्या</h2>${tba.map(noticeCard).join('')}` : ''}
    ${past.length ? `<h2 class="sec">झालेल्या</h2>${past.map(noticeCard).join('')}` : ''}
    ${!upcoming.length && !tba.length && !past.length ? '<p class="muted">या परीक्षेसाठी सध्या कोणतीही सूचना नाही.</p>' : ''}
    <p class="muted small n-disc">⚠️ तारखा आयोगाच्या सूचनांनुसार बदलू शकतात. अर्ज करण्यापूर्वी अधिकृत संकेतस्थळावर (mpsc.gov.in, mahapolice.gov.in) खात्री करा. सराव हे स्वतंत्र अ‍ॅप आहे; कोणत्याही शासकीय संस्थेशी संबंधित नाही.${upd ? `<br>शेवटचे अद्ययावत: ${isoMr(upd)}` : ''}</p>
  </main>
  ${tabbar()}`;
}

let booted = false;
function render(keepAnim = false) {
  if (!booted) return;
  if (!store.get().exam && view !== 'pick') view = 'pick';
  const views = {
    pick: pickView, home: homeView, path: pathView, quiz: () => quizView(!keepAnim), result: resultView, review: reviewView,
    saved: savedView, rank: rankView, me: meView, auth: authView, exams: examsView, pyq: pyqView,
    nikal: nikal.listView, 'nikal-entry': nikal.entryView, 'nikal-result': nikal.resultView,
    typing: typing.listView, 'typing-run': typing.runView, 'typing-result': typing.resultView,
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
  if (act.startsWith('nk-') && await nikal.click(act, el)) return;
  if (act.startsWith('ty-') && await typing.click(act, el)) return;

  switch (act) {
    case 'mock-info': {
      const m = MOCK[exam().id];
      const ok = await confirmBox(`${exam().name} सराव पेपर\n\n• १०० प्रश्न, ${mr(m.mins)} मिनिटे\n• ${m.note}\n${m.neg ? `• चुकीच्या उत्तराला ${mr(m.neg)} गुण वजा\n` : ''}• निकाल व स्पष्टीकरण शेवटी`, 'पेपर सुरू करा', 'नंतर');
      if (ok) startQuiz('mock');
      return;
    }
    case 'start': return startQuiz(el.dataset.mode, el.dataset.sid, el.dataset.lvl);
    case 'path': pathSid = el.dataset.sid; quiz = view === 'result' ? null : quiz; go('path'); return scrollToCurrent();
    case 'ans': return answer(Number(el.dataset.k));
    case 'next': return next();
    case 'prev': return prev();
    case 'fifty': return useFifty();
    case 'exit':
    case 'back': return back();
    case 'pyq-scope':
      pyqAll = el.dataset.all === '1';
      render();
      break;
    case 'pyq-start': {
      const p = pyqIndex.find((x) => x.id === el.dataset.id);
      if (!p) return;
      const ok = await confirmBox(`${p.title}\n\n• ${mr(p.count)} प्रश्न, ${mr(p.mins)} मिनिटे\n${p.neg ? `• चुकीच्या उत्तराला ${mr(p.neg)} गुण वजा\n` : ''}• उत्तर बदलता येते; निकाल व योग्य उत्तरे शेवटी`, 'पेपर सुरू करा', 'नंतर');
      if (ok) startPyq(p.id);
      return;
    }
    case 'exams-scope':
      examsAll = el.dataset.all === '1';
      render();
      break;
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
    case 'again': if (quiz.mode === 'pyq') return startPyq(quiz.pyq); return startQuiz(quiz.mode === 'daily' ? 'mixed' : quiz.mode, quiz.sid, quiz.lvl);
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

function scrollToCurrent() {
  const el = document.querySelector('.node.current');
  if (el) el.scrollIntoView({ block: 'center' });
}

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
app.innerHTML = `<div class="splash">${OWL_SVG}<h1 class="splash-hi">${greeting()}</h1><p class="splash-motto">${motto()}</p><div class="splash-dots"><i></i><i></i><i></i></div></div>`;
const minSplash = new Promise((r) => setTimeout(r, 1800));
Promise.all([loadBank(), minSplash]).then(() => {
  booted = true;
  loadNotices(() => { if (view === 'home' || view === 'exams' || view === 'nikal') render(); });
  typing.loadIndex().then(() => { if (view === 'home') render(); });
  loadPyqIndex().then(() => { if (view === 'home' || view === 'pyq') render(); });
  nikal.loadIndex().then(() => { if (view === 'home' || view === 'nikal') render(); });
  byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  poolCache.clear();
  go(store.get().exam ? 'home' : 'pick');
  initAds();
});
