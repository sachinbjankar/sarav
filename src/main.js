import '@fontsource/mukta/400.css';
import '@fontsource/mukta/600.css';
import '@fontsource/mukta/700.css';
import '@fontsource/mukta/800.css';
import './style.css';

import { Capacitor } from '@capacitor/core';
import { SUBJECTS, QUESTIONS } from './questions.js';
import { store, today } from './store.js';
import { initAds, showBanner, hideBanner, maybeInterstitial, showRewarded } from './ads.js';
import { QUIZ, APP } from './config.js';

// ---------- मदतनीस ----------
const MR = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => MR[d]);
const LETTERS = ['अ', 'ब', 'क', 'ड'];
const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const subj = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

// ---------- प्रश्न निवड ----------
function buildItems(questions, rand = Math.random) {
  return questions.map((q) => {
    const order = shuffle([0, 1, 2, 3], rand);
    return { q, opts: order.map((k) => q.o[k]), correct: order.indexOf(0) };
  });
}

function pickForSubject(sid) {
  const ans = store.get().ans;
  const pool = QUESTIONS.filter((q) => q.s === sid);
  const unseen = shuffle(pool.filter((q) => !ans[q.id]));
  const wrong = shuffle(pool.filter((q) => ans[q.id] && !ans[q.id].last));
  const rest = shuffle(pool.filter((q) => ans[q.id] && ans[q.id].last));
  return [...unseen, ...wrong, ...rest].slice(0, QUIZ.PER_TEST);
}

function dailyQuestions() {
  const rand = rng('daily-' + today());
  // प्रत्येक विषयातून किमान एक, उरलेले यादृच्छिक
  const picked = SUBJECTS.map((s) => {
    const pool = QUESTIONS.filter((q) => q.s === s.id);
    return pool[Math.floor(rand() * pool.length)];
  });
  const rest = shuffle(QUESTIONS.filter((q) => !picked.includes(q)), rand);
  return { items: buildItems(shuffle([...picked, ...rest.slice(0, QUIZ.PER_TEST - picked.length)], rand), rand) };
}

function wrongQuestions() {
  const ans = store.get().ans;
  return QUESTIONS.filter((q) => ans[q.id] && !ans[q.id].last);
}

// ---------- चाचणी ----------
function startQuiz(mode, sid) {
  let items;
  let title;
  if (mode === 'daily') {
    items = dailyQuestions().items;
    title = 'आजची प्रश्नमंजुषा';
  } else if (mode === 'subject') {
    items = buildItems(pickForSubject(sid));
    title = subj[sid].name;
  } else if (mode === 'wrong') {
    items = buildItems(shuffle(wrongQuestions()).slice(0, QUIZ.PER_TEST));
    title = 'चुकलेल्या प्रश्नांचा सराव';
  } else if (mode === 'saved') {
    items = buildItems(shuffle(store.get().saved.map((id) => byId[id]).filter(Boolean)).slice(0, QUIZ.PER_TEST));
    title = 'जतन केलेले प्रश्न';
  } else {
    items = buildItems(shuffle(QUESTIONS).slice(0, QUIZ.PER_TEST));
    title = 'मिश्र सराव चाचणी';
  }
  if (!items.length) return startQuiz('mixed');
  quiz = {
    mode, sid, title, items,
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
function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

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

async function useFifty() {
  if (!quiz || quiz.answers[quiz.i] || quiz.removed[quiz.i].length) return;
  if (quiz.fifty <= 0) {
    const ok = await confirmBox('५०:५० वापरण्यासाठी एक छोटी जाहिरात पहा?', 'जाहिरात पहा', 'नको');
    if (!ok) return;
    stopTimer();
    const got = await showRewarded();
    if (!got) {
      toast('जाहिरात पूर्ण झाली नाही');
      startTimerKeep();
      return;
    }
    quiz.removed[quiz.i] = removeTwo();
    render(true);
    startTimerKeep();
    return;
  }
  quiz.fifty--;
  quiz.removed[quiz.i] = removeTwo();
  render(true);
}

function removeTwo() {
  const it = quiz.items[quiz.i];
  return shuffle([0, 1, 2, 3].filter((k) => k !== it.correct)).slice(0, 2);
}

function startTimerKeep() {
  const keep = quiz.left;
  startTimer();
  quiz.left = keep;
}

async function next() {
  if (quiz.i < quiz.items.length - 1) {
    quiz.i++;
    go('quiz');
  } else {
    finish();
  }
}

async function finish() {
  stopTimer();
  const score = quiz.answers.filter((a) => a && a.ok).length;
  quiz.score = score;
  quiz.secs = Math.round((Date.now() - quiz.started) / 1000);
  const n = store.finishTest({ score, total: quiz.items.length, daily: quiz.mode === 'daily' });
  await maybeInterstitial(n);
  go('result');
}

// ---------- नेव्हिगेशन ----------
function go(v) {
  view = v;
  if (v === 'quiz') hideBanner(); else showBanner();
  render();
  window.scrollTo(0, 0);
  if (v === 'quiz') startTimer();
}

async function back() {
  if (modalRoot.firstChild) return closeModal(false);
  if (view === 'quiz') {
    if (await confirmBox('चाचणी अर्धवट सोडायची?', 'हो, सोडा', 'नाही')) { stopTimer(); quiz = null; go('home'); }
  } else if (view === 'review') go('result');
  else if (view !== 'home') go('home');
  else if (Capacitor.isNativePlatform()) {
    const { App } = await import('@capacitor/app');
    App.exitApp();
  }
}

// ---------- छोटे घटक ----------
let modalResolve = null;
function confirmBox(text, yes, no) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalRoot.innerHTML = `
      <div class="modal-bg" data-act="modal-no">
        <div class="modal" role="dialog">
          <p>${text}</p>
          <div class="modal-btns">
            <button class="btn ghost" data-act="modal-no">${no}</button>
            <button class="btn primary" data-act="modal-yes">${yes}</button>
          </div>
        </div>
      </div>`;
  });
}
function closeModal(val) {
  modalRoot.innerHTML = '';
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(val); }
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function tabbar() {
  const tab = (id, icon, label) =>
    `<button class="tab ${view === id ? 'on' : ''}" data-act="tab" data-v="${id}"><span>${icon}</span>${label}</button>`;
  return `<nav class="tabbar">${tab('home', '🏠', 'मुख्य')}${tab('saved', '⭐', 'जतन केलेले')}${tab('stats', '📊', 'प्रगती')}</nav>`;
}

function subjectStats(sid) {
  const ans = store.get().ans;
  const pool = QUESTIONS.filter((q) => q.s === sid);
  const seen = pool.filter((q) => ans[q.id]);
  const right = seen.filter((q) => ans[q.id].last).length;
  return { total: pool.length, seen: seen.length, acc: seen.length ? Math.round((right / seen.length) * 100) : null };
}

function overall() {
  const ans = store.get().ans;
  const ids = Object.keys(ans);
  const right = ids.filter((id) => ans[id].last).length;
  return { seen: ids.length, acc: ids.length ? Math.round((right / ids.length) * 100) : 0 };
}

// ---------- पाने ----------
function homeView() {
  const d = store.get();
  const o = overall();
  const doneToday = d.daily.date === today();
  const wrongN = wrongQuestions().length;
  return `
  <header class="top">
    <div class="brand">
      <div class="logo">स</div>
      <div><h1>${APP.name}</h1><p>MPSC • पोलीस भरती • सरळसेवा</p></div>
    </div>
    <div class="streak" title="सलग दिवस">🔥 ${mr(store.streak())}</div>
  </header>

  <main class="wrap">
    <section class="daily ${doneToday ? 'done' : ''}">
      <div>
        <span class="chip">रोज नवीन</span>
        <h2>आजची प्रश्नमंजुषा</h2>
        <p>${doneToday
          ? `आजचे गुण: <b>${mr(d.daily.score)}/${mr(d.daily.total)}</b> • उद्या नवीन प्रश्न`
          : `${mr(QUIZ.PER_TEST)} प्रश्न • सर्व विषय • प्रत्येकी ${mr(QUIZ.SECONDS_PER_Q)} सेकंद`}</p>
      </div>
      <button class="btn light" data-act="start" data-mode="daily">${doneToday ? 'पुन्हा सोडवा' : 'सुरू करा'}</button>
    </section>

    <section class="mini-stats">
      <div><b>${mr(o.seen)}</b><span>सोडवलेले प्रश्न</span></div>
      <div><b>${mr(o.acc)}%</b><span>अचूकता</span></div>
      <div><b>${mr(d.tests)}</b><span>चाचण्या</span></div>
    </section>

    <div class="row2">
      <button class="card action" data-act="start" data-mode="mixed">
        <span class="big">🎯</span><b>मिश्र सराव</b><small>सर्व विषयांतून ${mr(QUIZ.PER_TEST)} प्रश्न</small>
      </button>
      <button class="card action ${wrongN ? '' : 'disabled'}" data-act="start" data-mode="wrong">
        <span class="big">🔁</span><b>चुकलेले प्रश्न</b><small>${wrongN ? `${mr(wrongN)} प्रश्न पुन्हा सोडवा` : 'अजून एकही नाही'}</small>
      </button>
    </div>

    <h3 class="sec">विषयानुसार सराव</h3>
    <section class="subjects">
      ${SUBJECTS.map((s) => {
        const st = subjectStats(s.id);
        const pct = Math.round((st.seen / st.total) * 100);
        return `
        <button class="subject" style="--c:${s.color}" data-act="start" data-mode="subject" data-sid="${s.id}">
          <span class="ico">${s.icon}</span>
          <b>${s.name}</b>
          <small>${mr(st.seen)}/${mr(st.total)} सोडवले${st.acc !== null ? ` • ${mr(st.acc)}% बरोबर` : ''}</small>
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
        if (a) {
          if (k === it.correct) cls = 'right';
          else if (k === a.choice) cls = 'wrong';
          else cls = 'dim';
        } else if (removed.includes(k)) cls = 'gone';
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
        <button class="btn ghost" data-act="save">${saved ? '⭐' : '☆'}</button>
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
      <button class="star" data-act="save-id" data-id="${q.id}">${saved ? '⭐' : '☆'}</button>
    </div>
    <h4>${esc(q.q)}</h4>
    <ul>
      ${opts.map((o, k) => `<li class="${k === correct ? 'right' : k === choice ? 'wrong' : ''}"><span>${LETTERS[k]}</span>${esc(o)}</li>`).join('')}
    </ul>
    <p class="ex">💡 ${esc(q.e)}</p>
  </article>`;
}

function reviewView() {
  const list = quiz.items
    .map((it, i) => ({ it, a: quiz.answers[i], i }))
    .filter((x) => !reviewOnlyWrong || !x.a || !x.a.ok);
  return `
  <header class="top slim"><button class="icon-btn" data-act="back">←</button><h1>उत्तरे</h1></header>
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
      : `<div class="empty"><span>☆</span><p>चाचणी देताना ☆ दाबून महत्त्वाचे प्रश्न येथे जतन करा.</p></div>`}
  </main>
  ${tabbar()}`;
}

function statsView() {
  const d = store.get();
  const o = overall();
  return `
  <header class="top slim"><h1>माझी प्रगती</h1></header>
  <main class="wrap">
    <section class="mini-stats">
      <div><b>🔥 ${mr(store.streak())}</b><span>सलग दिवस</span></div>
      <div><b>${mr(d.tests)}</b><span>चाचण्या</span></div>
      <div><b>${mr(d.best)}/${mr(QUIZ.PER_TEST)}</b><span>सर्वोत्तम</span></div>
    </section>
    <section class="mini-stats">
      <div><b>${mr(o.seen)}/${mr(QUESTIONS.length)}</b><span>प्रश्न सोडवले</span></div>
      <div><b>${mr(o.acc)}%</b><span>एकूण अचूकता</span></div>
    </section>
    <h3 class="sec">विषयानुसार</h3>
    <section class="statlist">
      ${SUBJECTS.map((s) => {
        const st = subjectStats(s.id);
        return `<div class="srow">
          <span class="ico">${s.icon}</span>
          <div class="grow"><b>${s.name}</b>
            <i class="bar" style="--c:${s.color}"><i style="width:${st.acc ?? 0}%"></i></i>
            <small>${mr(st.seen)}/${mr(st.total)} सोडवले</small></div>
          <b class="pct">${st.acc === null ? '–' : mr(st.acc) + '%'}</b>
        </div>`;
      }).join('')}
    </section>
    <div class="stack">
      <a class="btn link" href="${APP.privacyUrl}" target="_blank" rel="noopener">गोपनीयता धोरण</a>
      <button class="btn link danger" data-act="reset">सर्व प्रगती पुसून टाका</button>
    </div>
  </main>
  ${tabbar()}`;
}

function render(keepAnim = false) {
  const views = { home: homeView, quiz: () => quizView(!keepAnim), result: resultView, review: reviewView, saved: savedView, stats: statsView };
  app.innerHTML = (views[view] || homeView)();
  app.dataset.view = view;
}

// ---------- क्लिक ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'modal-yes') return closeModal(true);
  if (act === 'modal-no') { if (e.target === el) closeModal(false); return; }
  if (el.classList.contains('disabled')) return;

  switch (act) {
    case 'start': return startQuiz(el.dataset.mode, el.dataset.sid);
    case 'ans': return answer(Number(el.dataset.k));
    case 'next': return next();
    case 'fifty': return useFifty();
    case 'exit': return back();
    case 'back': return back();
    case 'tab': quiz = view === 'result' ? null : quiz; return go(el.dataset.v);
    case 'review': reviewOnlyWrong = false; return go('review');
    case 'filter': reviewOnlyWrong = el.dataset.v === 'wrong'; return render();
    case 'again': return startQuiz(quiz.mode === 'daily' ? 'mixed' : quiz.mode, quiz.sid);
    case 'save': {
      const on = store.toggleSave(quiz.items[quiz.i].q.id);
      toast(on ? 'प्रश्न जतन केला' : 'जतन यादीतून काढला');
      return render(true);
    }
    case 'save-id': store.toggleSave(el.dataset.id); return render();
    case 'share': return shareScore();
    case 'reset':
      if (await confirmBox('सर्व प्रगती, जतन केलेले प्रश्न आणि सलग दिवस पुसले जातील. नक्की?', 'हो, पुसा', 'नको')) {
        store.reset(); render(); toast('प्रगती पुसली');
      }
  }
});

async function shareScore() {
  const text = `मी ‘${APP.name}’ अ‍ॅपवर ${quiz.title} मध्ये ${mr(quiz.score)}/${mr(quiz.items.length)} गुण मिळवले! 🎯 तुम्हीपण MPSC व पोलीस भरतीचा सराव करा.`;
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
  } catch (_) { /* वापरकर्त्याने रद्द केले */ }
}

// ---------- सुरुवात ----------
if (Capacitor.isNativePlatform()) {
  import('@capacitor/app').then(({ App }) => App.addListener('backButton', back));
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
go('home');
initAds();
