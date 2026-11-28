// ---------- ⌨️ टायपिंग सराव (GCC-TBC गती उतारे) ----------
// डेटा: public/typing/<lang>-<speed>.json  (content/typing/ मधील स्क्रिप्टने तयार)
// परीक्षेसारखे: ७ मिनिटे, उतारा पाहून टाइप करा → निव्वळ गती (WPM), अचूकता, चुकीचे शब्द.

const D = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => D[d]);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const dateMr = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${mr(d)} ${MONTHS[m - 1]} ${mr(y)}`; };
const KEY = 'sarav.typing';
const DURS = [7, 3, 1];

// तुलना करताना छोटे फरक दुर्लक्षित: अदृश्य जोडअक्षरे, अवतरण चिन्हांचे प्रकार, विसर्ग/कोलन
const norm = (w) => w.normalize('NFC').replace(/[‌‍]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/ः/g, ':').replace(/[–—]/g, '-');

// शब्द-स्तरावरील तुलना (LCS) → प्रत्येक अपेक्षित शब्दाची स्थिती
function compare(exp, typed) {
  const n = exp.length, m = typed.length;
  const E = exp.map(norm), T = typed.map(norm);
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = E[i] === T[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const rows = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (E[i] === T[j]) { rows.push({ e: exp[i], r: 'ok' }); i++; j++; }
    else if (dp[i + 1][j + 1] >= dp[i + 1][j] && dp[i + 1][j + 1] >= dp[i][j + 1]) { rows.push({ e: exp[i], t: typed[j], r: 'bad' }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ e: exp[i], r: 'miss' }); i++; }
    else { rows.push({ t: typed[j], r: 'extra' }); j++; }
  }
  while (j < m) { rows.push({ t: typed[j], r: 'extra' }); j++; }
  return { rows, reached: i };
}

export function createTyping({ go, render, toast, confirmBox, tabbar, ads }) {
  let index = null;
  const groups = {};      // key -> data
  let sel = { lang: 'mr', speed: 30, dur: 7 };
  let run = null;         // { key, p, words, typed, start, end, timer }
  let res = null;

  const st = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const saveBest = (id, r) => {
    const s = st(); const c = s[id] || { best: 0, n: 0 };
    s[id] = { best: Math.max(c.best, r.net), acc: r.acc, n: c.n + 1, last: r.net, at: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { /* ignore */ }
  };

  async function loadIndex() {
    if (index) return index;
    try { index = await (await fetch('typing/index.json')).json(); } catch (_) { index = { groups: [] }; }
    return index;
  }
  async function loadGroup(key) {
    if (groups[key]) return groups[key];
    try { groups[key] = await (await fetch(`typing/${key}.json`)).json(); } catch (_) { groups[key] = null; }
    return groups[key];
  }
  const curKey = () => `${sel.lang}-${sel.speed}`;
  const total = () => (index?.groups || []).reduce((a, g) => a + g.count, 0);

  function homeCard() {
    const n = total();
    return `
    <button class="mock-strip ty-strip" data-act="ty-home">
      <span class="ex-ico">⌨️</span><span class="grow"><b>टायपिंग सराव — GCC गती उतारे</b><small>${n ? `${mr(n)} खरे उतारे • मराठी ३०/४० • इंग्रजी ३०/४०/५०` : 'मराठी व इंग्रजी • परीक्षेसारखी ७ मिनिटे'}</small></span><span class="arrow">›</span>
    </button>`;
  }

  function listView() {
    const g = groups[curKey()];
    const s = st();
    const speeds = (index?.groups || []).filter((x) => x.lang === sel.lang);
    let body = '<p class="muted">उतारे लोड होत आहेत…</p>';
    if (g === null) body = '<p class="muted">उतारे लोड झाले नाहीत. पुन्हा प्रयत्न करा.</p>';
    else if (g) {
      const byYear = {};
      g.passages.forEach((p) => { (byYear[p.year] = byYear[p.year] || []).push(p); });
      body = Object.keys(byYear).sort((a, b) => b - a).map((y) => `
        <h3 class="sec">${mr(y)} <small class="muted">• ${mr(byYear[y].length)} उतारे</small></h3>
        <div class="ty-list">${byYear[y].map((p) => {
          const b = s[p.id];
          const done = b && b.best >= sel.speed;
          return `<button class="ty-item ${b ? (done ? 'done' : 'tried') : ''}" data-act="ty-open" data-id="${p.id}">
            <span class="ty-code">${mr(p.code)}</span>
            <span class="grow"><b>${esc(p.text.split(/\s+/).slice(0, 6).join(' '))}…</b><small>${dateMr(p.date)} • ${mr(p.words)} शब्द</small></span>
            <span class="ty-best">${b ? `${done ? '✅' : '🕒'} ${mr(b.best)}<small>WPM</small>` : '›'}</span>
          </button>`;
        }).join('')}</div>`).join('');
    }
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>⌨️ टायपिंग सराव</h1></header>
    <main class="wrap">
      <section class="ty-hero">
        <b>शासकीय वाणिज्य प्रमाणपत्र (GCC-TBC) परीक्षेचे खरे गती उतारे</b>
        <small>उतारा निवडा → ७ मिनिटांत टाइप करा → गती (WPM), अचूकता व चुकीचे शब्द लगेच पाहा</small>
      </section>
      <div class="ty-tabs">
        <button class="${sel.lang === 'mr' ? 'on' : ''}" data-act="ty-lang" data-v="mr">मराठी</button>
        <button class="${sel.lang === 'en' ? 'on' : ''}" data-act="ty-lang" data-v="en">English</button>
      </div>
      <div class="ty-chips">${speeds.map((x) => `<button class="${x.speed === sel.speed ? 'on' : ''}" data-act="ty-speed" data-v="${x.speed}">${mr(x.speed)} WPM <small>(${mr(x.count)})</small></button>`).join('')}</div>
      ${sel.lang === 'mr' ? '<p class="ty-note">📱 मोबाईलवर मराठी टाइप करण्यासाठी Gboard मध्ये “मराठी” कीबोर्ड सुरू करा. परीक्षेत संगणकावर ISM/इनस्क्रिप्ट कीबोर्ड असतो — हा सराव शब्द, शुद्धलेखन व गतीसाठी आहे.</p>' : ''}
      ${body}
      <p class="muted small n-disc">स्रोत: ${esc(index?.source || 'महाराष्ट्र राज्य परीक्षा परिषद, पुणे')}. मूळ उताऱ्यांतील शब्द व चुका जशाच्या तशा ठेवल्या आहेत. ${sel.lang === 'mr' ? 'मराठी उतारे PDF वरून OCR ने तयार केले आहेत; एखादा शब्द चुकीचा दिसल्यास Instagram @sarav.mpsc.police वर कळवा.' : ''}</p>
    </main>
    ${tabbar()}`;
  }

  function findP(id) {
    for (const k of Object.keys(groups)) { const p = groups[k]?.passages.find((x) => x.id === id); if (p) return { key: k, p }; }
    return null;
  }

  function openRun(id) {
    const f = findP(id); if (!f) return;
    run = { key: f.key, p: f.p, words: f.p.text.split(/\s+/), typed: '', start: 0, end: 0, timer: null, dur: sel.dur };
    go('typing-run');
  }

  function passageHtml() {
    let k = 0;
    return run.p.text.split('\n').map((para) => `<p>${para.split(/\s+/).map((w) => `<span data-w="${k++}">${esc(w)}</span>`).join(' ')}</p>`).join('');
  }

  function runView() {
    if (!run) return listView();
    const g = groups[run.key];
    setTimeout(bindRun, 0);
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>${g.lang === 'mr' ? 'मराठी' : 'English'} ${mr(g.speed)} WPM • ${mr(run.p.code)}</h1></header>
    <main class="wrap ty-run">
      <div class="ty-bar">
        <span class="ty-time" id="ty-time">${mr(run.dur)}:००</span>
        <span id="ty-live" class="ty-live">टाइप करायला सुरुवात करताच वेळ सुरू होईल</span>
        <div class="ty-durs">${DURS.map((d) => `<button class="${d === run.dur ? 'on' : ''}" data-act="ty-dur" data-v="${d}" ${run.start ? 'disabled' : ''}>${mr(d)} मि.</button>`).join('')}</div>
      </div>
      <div class="ty-passage" id="ty-pass" lang="${g.lang === 'mr' ? 'mr' : 'en'}">${passageHtml()}</div>
      <textarea id="ty-input" class="ty-input" lang="${g.lang === 'mr' ? 'mr' : 'en'}" placeholder="${g.lang === 'mr' ? 'येथे उतारा टाइप करा…' : 'Type the passage here…'}"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
      <div class="ty-actions">
        <button class="btn ghost" data-act="ty-restart">↺ पुन्हा</button>
        <button class="btn" data-act="ty-finish">पूर्ण करा ✓</button>
      </div>
    </main>`;
  }

  function bindRun() {
    const ta = document.getElementById('ty-input'); if (!ta || !run) return;
    ta.value = run.typed;
    ['paste', 'drop'].forEach((ev) => ta.addEventListener(ev, (e) => { e.preventDefault(); toast('कॉपी-पेस्ट चालणार नाही 🙂'); }));
    ta.addEventListener('input', () => {
      if (!run) return;
      if (!run.start) {
        run.start = Date.now(); run.end = run.start + run.dur * 60000;
        document.querySelectorAll('.ty-durs button').forEach((b) => { b.disabled = true; });
        run.timer = setInterval(tick, 250);
      }
      run.typed = ta.value;
      paint();
      if (ta.value.trim().split(/\s+/).length >= run.words.length && /\s$/.test(ta.value)) finish();
    });
    ta.focus();
  }

  function paint() {
    const n = run.typed.trim() ? run.typed.trim().split(/\s+/).length : 0;
    const cur = /\s$/.test(run.typed) || !n ? n : n - 1;
    const box = document.getElementById('ty-pass'); if (!box) return;
    box.querySelector('.cur')?.classList.remove('cur');
    box.querySelectorAll('.done').forEach((x) => { if (+x.dataset.w >= cur) x.classList.remove('done'); });
    for (let k = Math.max(0, cur - 3); k < cur; k++) box.querySelector(`[data-w="${k}"]`)?.classList.add('done');
    const c = box.querySelector(`[data-w="${cur}"]`);
    if (c) { c.classList.add('cur'); const top = c.offsetTop - box.offsetTop; if (top > box.scrollTop + box.clientHeight - 40 || top < box.scrollTop) box.scrollTop = top - 30; }
  }

  function tick() {
    if (!run?.start) return;
    const left = Math.max(0, run.end - Date.now());
    const el = document.getElementById('ty-time');
    if (el) { const s = Math.ceil(left / 1000); el.textContent = `${mr(Math.floor(s / 60))}:${mr(String(s % 60).padStart(2, '0'))}`; el.classList.toggle('low', s <= 30); }
    const mins = (Date.now() - run.start) / 60000;
    const n = run.typed.trim() ? run.typed.trim().split(/\s+/).length : 0;
    const live = document.getElementById('ty-live');
    if (live && mins > 0.05) live.textContent = `${mr(n)} शब्द • ${mr(Math.round(n / mins))} WPM`;
    if (left <= 0) finish();
  }

  function finish() {
    if (!run) return;
    clearInterval(run.timer);
    const typed = run.typed.trim() ? run.typed.trim().split(/\s+/) : [];
    if (!typed.length) { toast('आधी थोडे टाइप करा'); return; }
    const mins = run.start ? Math.min(run.dur, Math.max((Math.min(Date.now(), run.end) - run.start) / 60000, 0.1)) : run.dur;
    const { rows, reached } = compare(run.words.slice(0, Math.min(run.words.length, typed.length + 15)), typed);
    // शेवटचे न पोचलेले "miss" शब्द चुका म्हणून धरू नका
    let k = rows.length - 1; while (k >= 0 && rows[k].r === 'miss') k--;
    const used = rows.slice(0, k + 1);
    const ok = used.filter((r) => r.r === 'ok').length;
    const bad = used.filter((r) => r.r === 'bad').length;
    const miss = used.filter((r) => r.r === 'miss').length;
    const extra = used.filter((r) => r.r === 'extra').length;
    const errors = bad + miss + extra;
    const gross = Math.round(typed.length / mins);
    const net = Math.max(0, Math.round((typed.length - errors) / mins));
    const acc = Math.round((ok / Math.max(1, ok + errors)) * 100);
    res = { id: run.p.id, key: run.key, p: run.p, rows: used, reached, ok, bad, miss, extra, errors, gross, net, acc, mins, typedN: typed.length };
    saveBest(run.p.id, res);
    run = null;
    go('typing-result');
  }

  function resultView() {
    if (!res) return listView();
    const g = groups[res.key];
    const pass = res.net >= g.speed && res.acc >= 90;
    const rest = res.p.text.split(/\s+/).slice(res.reached);
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>⌨️ निकाल • ${mr(res.p.code)}</h1></header>
    <main class="wrap">
      <section class="ty-res ${pass ? 'pass' : ''}">
        <div class="ty-big"><b>${mr(res.net)}</b><span>निव्वळ गती (WPM)</span></div>
        <div class="ty-goal">लक्ष्य: ${mr(g.speed)} WPM • ${pass ? '✅ लक्ष्य गाठले!' : res.net >= g.speed ? 'गती गाठली — अचूकता ९०% पेक्षा जास्त हवी' : `आणखी ${mr(g.speed - res.net)} WPM हवी`}</div>
        <div class="ty-grid">
          <div><b>${mr(res.acc)}%</b><span>अचूकता</span></div>
          <div><b>${mr(res.gross)}</b><span>एकूण गती</span></div>
          <div><b>${mr(res.typedN)}</b><span>टाइप केलेले शब्द</span></div>
          <div><b>${mr(res.errors)}</b><span>चुका</span></div>
        </div>
        <small class="muted">वेळ ${mr(Math.round(res.mins * 10) / 10)} मि. • चुकीचे ${mr(res.bad)} • सुटलेले ${mr(res.miss)} • जास्तीचे ${mr(res.extra)} • निव्वळ गती = (टाइप केलेले शब्द − चुका) ÷ मिनिटे</small>
      </section>
      <h3 class="sec">📋 शब्दनिहाय तपासणी</h3>
      <p class="muted small">हिरवे = बरोबर • <s>लाल</s> = चुकीचा (खाली तुम्ही टाइप केलेला) • पिवळा = सुटलेला • जांभळा = जास्तीचा</p>
      <div class="ty-check" lang="${g.lang === 'mr' ? 'mr' : 'en'}">${res.rows.map((r) => r.r === 'ok' ? `<span class="ok">${esc(r.e)}</span>`
        : r.r === 'bad' ? `<span class="bad"><s>${esc(r.e)}</s><i>${esc(r.t)}</i></span>`
        : r.r === 'miss' ? `<span class="miss">${esc(r.e)}</span>` : `<span class="extra">+${esc(r.t)}</span>`).join(' ')}
        ${rest.length ? `<span class="rest">${esc(rest.join(' '))}</span>` : ''}</div>
      <div class="ty-actions">
        <button class="btn ghost" data-act="ty-open" data-id="${res.id}">↺ हाच उतारा पुन्हा</button>
        <button class="btn" data-act="ty-next">पुढचा उतारा ›</button>
      </div>
      <p class="muted small n-disc">ही गणना सरावासाठी आहे; परीक्षा परिषदेची अधिकृत गुणपद्धती वेगळी असू शकते.</p>
    </main>`;
  }

  async function click(act, el) {
    switch (act) {
      case 'ty-home': await loadIndex(); go('typing'); loadGroup(curKey()).then(() => render()); return true;
      case 'ty-lang': sel.lang = el.dataset.v; sel.speed = 30; render(); loadGroup(curKey()).then(() => render()); return true;
      case 'ty-speed': sel.speed = +el.dataset.v; render(); loadGroup(curKey()).then(() => render()); return true;
      case 'ty-open': {
        const f = findP(el.dataset.id); if (!f) return true;
        if (ads) await ads();
        openRun(el.dataset.id); return true;
      }
      case 'ty-dur': if (run && !run.start) { run.dur = sel.dur = +el.dataset.v; render(); } return true;
      case 'ty-restart': if (run) { const id = run.p.id; clearInterval(run.timer); openRun(id); } return true;
      case 'ty-finish': finish(); return true;
      case 'ty-next': {
        const list = groups[res.key].passages; const i = list.findIndex((x) => x.id === res.id);
        openRun(list[(i + 1) % list.length].id); return true;
      }
      default: return false;
    }
  }

  async function backTarget(view) {
    if (view === 'typing-run') {
      if (run?.start && !(await confirmBox('टायपिंग अर्धवट सोडायचे?', 'हो, सोडा', 'नाही'))) return null;
      if (run) clearInterval(run.timer); run = null; return 'typing';
    }
    if (view === 'typing-result') return 'typing';
    if (view === 'typing') return 'home';
    return null;
  }

  return { loadIndex, homeCard, listView, runView, resultView, click, backTarget, isTyping: (v) => v.startsWith('typing') };
}
