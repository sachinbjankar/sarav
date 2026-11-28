// ---------- 🏆 निकालापूर्वी निकाल ----------
// परीक्षेनंतर विद्यार्थी आपल्या प्रश्नपत्रिकेवर दिलेली उत्तरे (OMR सारखी) भरतात →
// उत्तरतालिकेनुसार गुण (ऋण गुणांसह) → सर्व सराव वापरकर्त्यांमधील रँक व टक्केवारी.
// नवीन परीक्षा जोडणे: content/nikal_build.py

const D = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => D[d]);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const OPT = ['१', '२', '३', '४'];
const fmt = (x) => mr((Math.round(x * 100) / 100).toString());

const REMOTE = 'https://raw.githubusercontent.com/sachinbjankar/sarav/main/public/';
const MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const dateMr = (t) => { const d = new Date(t); return `${mr(d.getDate())} ${MONTHS[d.getMonth()]} ${mr(d.getFullYear())}`; };
const dayStart = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
const DAY = 86400000;

export function createNikal({ backend, go, render, toast, confirmBox, exam, tabbar, user, noticeById }) {
  let index = [];
  let cur = null;      // { meta, data, series, ans: [], showQ, qs }
  let result = null;   // { score, max, right, wrong, blank, stats, wrongList }

  const draftKey = (id) => `sarav.nikal.${id}`;
  const loadDraft = (id) => { try { return JSON.parse(localStorage.getItem(draftKey(id))) || null; } catch (_) { return null; } };
  const saveDraft = () => { try { localStorage.setItem(draftKey(cur.meta.id), JSON.stringify({ series: cur.series, ans: cur.ans, submitted: cur.submitted || false, info: cur.info })); } catch (_) { /* ignore */ } };

  // वेळापत्रक: अ‍ॅपमधील प्रत, मग GitHub वरील ताजी प्रत (नवीन पेपर अ‍ॅप अपडेटशिवाय)
  async function loadIndex() {
    try { index = await (await fetch('nikal/index.json')).json(); } catch (_) { index = []; }
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(`${REMOTE}nikal/index.json?t=${Math.floor(Date.now() / 600000)}`, { signal: ctl.signal });
      if (r.ok) { const remote = await r.json(); if (Array.isArray(remote) && remote.length) index = remote.map((x) => ({ ...x, remote: true })); }
    } catch (_) { /* ऑफलाइन */ }
  }
  const fileUrl = (x) => (x.remote ? REMOTE + x.file : x.file);

  // प्रत्येक परीक्षेची सध्याची स्थिती
  function stateOf(x) {
    if (x.sample) return { k: 'open', status: x.status };
    const n = x.notice ? noticeById(x.notice) : null;
    if (x.file) return { k: 'open', status: x.status, date: n?.date ? dayStart(n.date) : null };
    if (!n?.date) return { k: 'tba', note: n?.note || 'तारीख अजून जाहीर झालेली नाही.' };
    const examAt = dayStart(n.date), openAt = examAt + (x.openAfterDays ?? 2) * DAY, now = Date.now();
    if (now < examAt) return { k: 'upcoming', examAt, openAt };
    if (now < examAt + DAY) return { k: 'today', examAt, openAt };
    if (now < openAt) return { k: 'waiting', examAt, openAt };
    return { k: 'soon', examAt, openAt };
  }
  const cdBox = (to) => `<div class="cd" data-cd="${to}">${['दिवस', 'तास', 'मिनिटे', 'सेकंद'].map((l) => `<span><b>००</b><small>${l}</small></span>`).join('')}</div>`;
  function tick() {
    document.querySelectorAll('[data-cd]').forEach((el) => {
      let ms = Math.max(0, Number(el.dataset.cd) - Date.now());
      const p = [Math.floor(ms / DAY), Math.floor(ms / 3600000) % 24, Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60];
      el.querySelectorAll('b').forEach((b, i) => { b.textContent = mr(String(p[i]).padStart(2, '0')); });
    });
    document.querySelectorAll('[data-cdmini]').forEach((el) => {
      const ms = Math.max(0, Number(el.dataset.cdmini) - Date.now());
      const d = Math.floor(ms / DAY), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
      el.textContent = d > 0 ? `${mr(d)} दिवस ${mr(h)} तास` : `${mr(h)} तास ${mr(m)} मिनिटे`;
    });
  }
  setInterval(tick, 1000);
  const scheduled = () => index.filter((x) => !x.sample);
  const sortFor = (eid) => (a, b) => {
    const sa = stateOf(a), sb = stateOf(b);
    const rel = (x) => (x.exams.includes(eid) ? 0 : 1);
    const t = (s2) => (s2.k === 'open' ? 0 : s2.examAt ? 1 : 2);
    return rel(a) - rel(b) || t(sa) - t(sb) || (sa.examAt || 9e15) - (sb.examAt || 9e15);
  };

  function homeCard() {
    const e = exam();
    const list = scheduled().sort(sortFor(e.id));
    const top = list.find((x) => ['open', 'today', 'waiting', 'soon', 'upcoming'].includes(stateOf(x).k));
    let sub = 'परीक्षेनंतर तुमचे गुण व रँक लगेच जाणून घ्या';
    let right = '<span class="arrow">›</span>';
    if (top) {
      const st = stateOf(top);
      if (st.k === 'open') { sub = `${esc(top.short)} • उत्तरे भरा व रँक पाहा`; right = '<span class="nk-live">LIVE</span>'; }
      else if (st.k === 'today') sub = `${esc(top.short)} • आज परीक्षा! शुभेच्छा 💪`;
      else if (st.k === 'waiting' || st.k === 'soon') sub = `${esc(top.short)} • रँक तपासणी लवकरच`;
      else { sub = `${esc(top.short)} • परीक्षेला`; right = `<span class="nk-mini" data-cdmini="${st.examAt}"></span>`; }
    }
    setTimeout(tick, 0);
    return `<button class="nikal-card" data-act="tab" data-v="nikal">
      <span class="nk-trophy">🏆</span>
      <span class="grow"><b>निकालापूर्वी निकाल</b><small>${sub}</small></span>${right}</button>`;
  }

  function examCard(x) {
    const st = stateOf(x);
    const sharable = st.examAt ? `<button class="btn ghost sm" data-act="nk-tell" data-id="${x.id}">📤 मित्रांना सांगा</button>` : '';
    let body = '';
    if (st.k === 'upcoming') body = `<small class="nk-lbl">परीक्षेला उरलेला वेळ</small>${cdBox(st.examAt)}
      <p class="nk-when">📅 परीक्षा: <b>${dateMr(st.examAt)}</b><br>📝 उत्तरे भरणे सुरू: <b>${dateMr(st.openAt)}</b> (परीक्षेनंतर ${mr(x.openAfterDays ?? 2)} दिवसांनी)</p>
      <button class="btn disabled">🔒 परीक्षेनंतर उघडेल</button>${sharable}`;
    else if (st.k === 'today') body = `<p class="nk-today">आज परीक्षा! सर्वांना शुभेच्छा 💪</p><small class="nk-lbl">उत्तरे भरणे सुरू होण्यास</small>${cdBox(st.openAt)}
      <p class="nk-when">पेपर झाल्यावर तुमची उत्तरे लक्षात ठेवा / प्रश्नपत्रिका जपून ठेवा 📄</p>${sharable}`;
    else if (st.k === 'waiting') body = `<small class="nk-lbl">प्रश्नपत्रिका व उत्तरतालिका तयार होत आहे… उत्तरे भरणे सुरू होण्यास</small>${cdBox(st.openAt)}${sharable}`;
    else if (st.k === 'soon') body = '<p class="nk-when">⏳ प्रश्नपत्रिका थोड्याच वेळात उपलब्ध होईल. पुन्हा तपासा.</p>';
    else if (st.k === 'tba') body = `<p class="nk-when">🗓️ ${esc(st.note)}<br>तारीख जाहीर झाल्यावर येथे काउंटडाउन सुरू होईल.</p>`;
    else {
      const d = loadDraft(x.id);
      body = `<p class="nk-when">${st.status === 'final' ? '✅ आयोगाची अंतिम उत्तरतालिका' : '🟠 तात्पुरती उत्तरतालिका — अंतिम आल्यावर गुण आपोआप अपडेट'}</p>
        <button class="btn primary" data-act="nk-open" data-id="${x.id}">${d?.submitted ? '🏆 माझा निकाल पाहा' : d ? '✏️ उत्तरे भरणे सुरू ठेवा' : '📝 उत्तरे भरा व रँक पाहा'}</button>`;
    }
    const badge = { open: '<span class="nb hot">LIVE</span>', today: '<span class="nb warn">आज</span>', upcoming: '<span class="nb ok">आगामी</span>', waiting: '<span class="nb warn">लवकरच</span>', soon: '<span class="nb warn">लवकरच</span>', tba: '<span class="nb">तारीख अनिश्चित</span>' }[st.k];
    return `<section class="nk-exam ${st.k}"><div class="nk-exam-top">${badge}</div><b class="nk-title">${esc(x.title)}</b>${body}</section>`;
  }

  function listView() {
    const e = exam();
    const list = scheduled().sort(sortFor(e.id));
    const sample = index.find((x) => x.sample);
    setTimeout(tick, 0);
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>🏆 निकालापूर्वी निकाल</h1></header>
    <main class="wrap">
      <section class="nk-hero">
        <b>परीक्षा दिली? निकालाची वाट कशाला पाहायची!</b>
        <ol><li>परीक्षेनंतर २ दिवसांत येथे प्रश्नपत्रिका उपलब्ध होईल</li><li>तुम्ही परीक्षेत दिलेली उत्तरे भरा (५ मिनिटे)</li><li>तुमचे गुण व सर्व विद्यार्थ्यांमधील रँक लगेच पाहा</li></ol>
      </section>
      ${list.map(examCard).join('') || '<p class="muted">आगामी परीक्षा लवकरच येथे दिसतील.</p>'}
      ${sample ? `<button class="nk-sample" data-act="nk-open" data-id="${sample.id}">👀 हे कसे काम करते? नमुना पाहा (${esc(sample.short.replace('नमुना: ', ''))})</button>` : ''}
      <p class="muted small n-disc">हा फक्त अंदाज आहे. रँक ‘सराव’ वापरणाऱ्या विद्यार्थ्यांमधील आहे; अधिकृत निकाल व कट-ऑफ आयोगच जाहीर करेल. परीक्षांच्या तारखा आयोगाच्या सूचनांनुसार.</p>
    </main>${tabbar()}`;
  }

  async function tell(id) {
    const x = index.find((y) => y.id === id); if (!x) return;
    const st = stateOf(x);
    const text = `📢 ${x.title}\n📅 परीक्षा: ${dateMr(st.examAt)}\n\nपरीक्षेनंतर ‘सराव’ अ‍ॅपवर ‘निकालापूर्वी निकाल’ मध्ये तुमची उत्तरे भरा आणि निकालाआधीच तुमचे गुण व रँक जाणून घ्या 🏆\nhttps://play.google.com/store/apps/details?id=in.sachivapps.sarav`;
    try {
      if (globalThis.Capacitor?.isNativePlatform?.()) { const { Share } = await import('@capacitor/share'); await Share.share({ text }); }
      else if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast('मजकूर कॉपी झाला — WhatsApp मध्ये पेस्ट करा'); }
    } catch (_) { /* रद्द */ }
  }

  async function open(id) {
    const meta = index.find((x) => x.id === id);
    if (!meta) return;
    let data;
    try { data = await (await fetch(fileUrl(meta))).json(); } catch (_) { return toast('माहिती उघडता आली नाही'); }
    const d = loadDraft(id);
    cur = { meta, data, series: (d?.series && data.series[d.series]) ? d.series : Object.keys(data.series)[0], ans: d?.ans || Array(data.count).fill(null), showQ: false, qs: null, submitted: d?.submitted, info: d?.info || { name: user()?.name || '', seat: '' } };
    if (cur.submitted) return showResult();
    go('nikal-entry');
  }

  async function toggleQ() {
    cur.showQ = !cur.showQ;
    if (cur.showQ && !cur.qs && cur.data.qfile) {
      try { const p = await (await fetch(cur.meta.remote ? REMOTE + cur.data.qfile : cur.data.qfile)).json(); cur.qs = Object.fromEntries(p.q.map((q) => [q.n, q])); } catch (_) { cur.qs = {}; }
    }
    render();
  }

  // ---- ⌨️ झटपट टाइप: प्रश्न १ पासून क्रमाने अंक; १–४ = पर्याय, ० = सोडला; जागा/स्वल्पविराम चालतात ----
  const DEV = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  const ansToStr = () => {
    let out = '';
    for (const a of cur.ans) { if (a === null) break; out += a === -1 ? '0' : String(a + 1); }
    return out.replace(/(.{5})/g, '$1 ').trim();
  };
  function parseType(v) {
    const digits = [...v].map((c) => DEV[c] ?? c).filter((c) => /[0-9]/.test(c));
    let bad = 0;
    const ans = Array(cur.data.count).fill(null);
    digits.slice(0, cur.data.count).forEach((d, i) => { const n = Number(d); if (n === 0) ans[i] = -1; else if (n <= 4) ans[i] = n - 1; else bad++; });
    return { ans, typed: Math.min(digits.length, cur.data.count), bad, extra: Math.max(0, digits.length - cur.data.count) };
  }
  function gridCells(key) {
    return cur.ans.map((a, i) => `<i class="${key[i] === null ? 'cx' : a === null ? '' : a === -1 ? 'sk' : 'ok'}" title="${i + 1}">${a === null || a === -1 ? '' : OPT[a]}</i>`).join('');
  }
  function typeBox(key) {
    return `<section class="nk-type">
      <p class="nk-type-help"><b>प्रश्न १ पासून क्रमाने</b> तुमचे पर्याय टाइप करा: <b>१–४</b> = पर्याय, <b>०</b> = सोडला.<br>उदा. <code>24130 31214</code> (जागा सोडली तरी चालते)</p>
      <textarea id="nk-type" inputmode="numeric" autocomplete="off" spellcheck="false" rows="4" placeholder="उदा. 24130 31214 4…">${ansToStr()}</textarea>
      <p class="nk-type-msg" id="nk-type-msg"></p>
      <div class="nk-grid" id="nk-grid">${gridCells(key)}</div>
      <small class="muted">रद्द प्रश्नांसाठीही (राखाडी) तुम्ही पेपरवर दिलेला अंक टाइप करा — क्रम चुकू नये म्हणून. त्यांचे गुण धरले जात नाहीत.</small>
    </section>`;
  }
  function onType(v) {
    const key = cur.data.series[cur.series].key;
    const r = parseType(v);
    cur.ans = r.ans; saveDraft();
    const g = document.getElementById('nk-grid'); if (g) g.innerHTML = gridCells(key);
    const m = document.getElementById('nk-type-msg');
    if (m) m.innerHTML = r.bad ? `⚠️ ${mr(r.bad)} चुकीचे अंक (५–९) — फक्त ०–४ वापरा` : r.extra ? `⚠️ ${mr(r.extra)} अंक जास्त आहेत — फक्त पहिले ${mr(cur.data.count)} धरले` : `✅ ${mr(r.typed)}/${mr(cur.data.count)} प्रश्न भरले`;
    const bar = document.querySelector('.nk-bar b'); if (bar) bar.textContent = mr(r.ans.filter((a) => a !== null).length);
  }
  document.addEventListener('input', (e) => {
    if (!cur) return;
    if (e.target?.id === 'nk-type') onType(e.target.value);
    else if (e.target?.id === 'nk-name' || e.target?.id === 'nk-seat') { cur.info = { ...cur.info, [e.target.id === 'nk-name' ? 'name' : 'seat']: e.target.value.trim() }; saveDraft(); }
  });
  let mode = 'tap';
  let filter = 'all';

  function entryView() {
    const { meta, data, ans, series } = cur;
    if (mode === 'type') setTimeout(() => { const t = document.getElementById('nk-type'); if (t) onType(t.value); }, 0);
    const key = data.series[series].key;
    const filled = ans.filter((a) => a !== null).length;
    const rows = ans.map((a, i) => {
      const n = i + 1;
      const cancelled = key[i] === null;
      const q = cur.showQ && cur.qs?.[n];
      return `<div class="omr-row ${cancelled ? 'cx' : ''}" id="nq${n}">
        ${q ? `<p class="omr-q">${esc(q.q)}<br>${q.o.map((o, k) => `<span>(${OPT[k]}) ${esc(o)}</span>`).join(' ')}</p>` : ''}
        <span class="qn">${mr(n)}</span>
        ${cancelled ? '<span class="cx-tag">रद्द प्रश्न</span>' : `
        ${OPT.map((o, k) => `<button class="bub ${a === k ? 'on' : ''}" data-act="nk-ans" data-i="${i}" data-k="${k}">${o}</button>`).join('')}
        <button class="bub skip ${a === -1 ? 'on' : ''}" data-act="nk-ans" data-i="${i}" data-k="-1">सोडला</button>`}
      </div>`;
    }).join('');
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>उत्तरे भरा</h1></header>
    <main class="wrap nk-wrap">
      <section class="nk-head">
        <b>${esc(meta.title)}</b>
        <div class="nk-series">प्रश्नपत्रिका संच:
          ${['A', 'B', 'C', 'D'].map((s) => `<button class="nk-chip ${s === series ? 'on' : ''} ${data.series[s] ? '' : 'disabled'}" data-act="nk-series" data-s="${s}">${s}</button>`).join('')}
        </div>
        ${Object.keys(data.series).length < 4 ? '<small class="muted">या पेपरसाठी सध्या फक्त संच ' + Object.keys(data.series).join(', ') + ' उपलब्ध</small>' : ''}
        <div class="nk-info">
          <label>नाव <input id="nk-name" type="text" maxlength="40" placeholder="उमेदवाराचे नाव (ऐच्छिक)" value="${esc(cur.info?.name || '')}"></label>
          <label>बैठक क्रमांक <input id="nk-seat" type="text" inputmode="text" maxlength="20" placeholder="Seat No. (ऐच्छिक)" value="${esc(cur.info?.seat || '')}"></label>
          <small class="muted">🔒 ही माहिती फक्त तुमच्या गुणपत्रकावर दिसते; फोनवरच राहते.</small>
        </div>
        <div class="nk-modes">
          <button class="${mode === 'tap' ? 'on' : ''}" data-act="nk-mode" data-m="tap">👆 टॅप करा</button>
          <button class="${mode === 'type' ? 'on' : ''}" data-act="nk-mode" data-m="type">⌨️ झटपट टाइप</button>
          <button class="soon" data-act="nk-mode" data-m="scan">📷 स्कॅन <small>लवकरच</small></button>
        </div>
        ${mode === 'tap' ? `<label class="nk-toggle"><input type="checkbox" data-act="nk-showq" ${cur.showQ ? 'checked' : ''}> प्रश्नही दाखवा</label>
        <small class="muted">प्रत्येक प्रश्नासाठी तुम्ही परीक्षेत निवडलेला पर्याय दाबा. उत्तर दिले नसल्यास ‘सोडला’.</small>` : ''}
      </section>
      ${mode === 'type' ? typeBox(key) : rows}
    </main>
    <div class="nk-bar"><span><b>${mr(filled)}</b>/${mr(data.count)} भरले</span><button class="btn primary" data-act="nk-submit">निकाल पाहा 🏆</button></div>`;
  }

  function setAns(i, k) {
    cur.ans[i] = cur.ans[i] === k ? null : k;
    saveDraft();
    const row = document.getElementById(`nq${i + 1}`);
    if (row) {
      row.querySelectorAll('.bub').forEach((b) => b.classList.toggle('on', Number(b.dataset.k) === cur.ans[i]));
      const filled = cur.ans.filter((a) => a !== null).length;
      const bar = document.querySelector('.nk-bar b'); if (bar) bar.textContent = mr(filled);
    } else render();
  }

  function score() {
    const { data, ans, series } = cur;
    const key = data.series[series].key;
    let s = 0, right = 0, wrong = 0, blank = 0, max = 0; const wrongList = [], rows = [];
    key.forEach((k, i) => {
      if (k === null) { rows.push({ n: i + 1, a: ans[i], k: null, r: 'cx' }); return; }
      max += data.marks;
      const a = ans[i];
      if (a === null || a === -1) { blank++; rows.push({ n: i + 1, a, k, r: 'sk' }); }
      else if (a === k) { right++; s += data.marks; rows.push({ n: i + 1, a, k, r: 'ok' }); }
      else { wrong++; s -= data.marks * data.neg; wrongList.push({ n: i + 1, a, k }); rows.push({ n: i + 1, a, k, r: 'bad' }); }
    });
    return { score: Math.round(s * 100) / 100, max, right, wrong, blank, wrongList, rows, gross: right * data.marks, minus: wrong * data.marks * data.neg };
  }

  async function submit() {
    const filled = cur.ans.filter((a) => a !== null).length;
    if (filled < cur.data.count * 0.5) {
      const ok = await confirmBox(`फक्त ${mr(filled)} प्रश्नांची उत्तरे भरली आहेत. उरलेले ‘सोडला’ म्हणून धरले जातील. पुढे जायचे?`, 'हो, निकाल पाहा', 'आणखी भरतो');
      if (!ok) return;
    }
    if (backend.kind !== 'mock' && !user()) {
      const ok = await confirmBox('रँक नोंदवण्यासाठी (प्रत्येकाची एकच नोंद राहावी म्हणून) खात्यात लॉगिन करा.', 'लॉगिन करा', 'नंतर');
      if (ok) go('auth');
      return;
    }
    cur.submitted = true; saveDraft();
    showResult(true);
  }

  async function showResult(save = false) {
    filter = 'all';
    result = { ...score(), stats: null };
    go('nikal-result');
    try {
      if (save) await backend.nikalSubmit(cur.meta.id, user()?.uid || 'me', result.score);
      result.stats = await backend.nikalStats(cur.meta.id, result.score, result.max);
    } catch (_) { result.stats = { err: true }; }
    render();
  }

  function resultView() {
    const r = result, { meta, data } = cur;
    const st = r.stats;
    const pct = Math.max(0, r.score) / r.max;
    let rankBox = '<div class="nk-rank loading">रँक मोजत आहे…</div>';
    if (st?.err) rankBox = '<div class="nk-rank">रँक सध्या मिळू शकला नाही. इंटरनेट तपासून पुन्हा उघडा.</div>';
    else if (st) {
      const perc = st.total > 1 ? Math.round((1 - (st.rank - 1) / st.total) * 1000) / 10 : 100;
      const mx = Math.max(...st.hist, 1);
      const myBin = Math.min(st.hist.length - 1, Math.max(0, Math.floor(pct * st.hist.length)));
      rankBox = `<div class="nk-rank">
        ${st.demo ? '<span class="nb warn">डेमो आकडेवारी</span>' : ''}
        <div class="nk-rank-row"><div><b>${mr(st.rank.toLocaleString('en-IN'))}</b><span>तुमचा रँक</span></div>
        <div><b>${mr(st.total.toLocaleString('en-IN'))}</b><span>एकूण विद्यार्थी</span></div>
        <div><b>${fmt(perc)}%</b><span>पर्सेंटाइल</span></div></div>
        <div class="nk-hist">${st.hist.map((h, i) => `<i class="${i === myBin ? 'me' : ''}" style="height:${Math.max(3, (h / mx) * 100)}%"></i>`).join('')}</div>
        <div class="nk-hist-lbl"><span>०</span><span>गुणांचे वितरण • 🟧 तुम्ही इथे</span><span>${mr(r.max)}</span></div>
        ${st.demo ? '<small class="muted">ॲप सर्वांसाठी सुरू झाल्यावर येथे खऱ्या विद्यार्थ्यांमधील रँक दिसेल.</small>' : ''}
      </div>`;
    }
    const info = cur.info || {};
    const fl = filter;
    const shown = r.rows.filter((x) => fl === 'all' || x.r === fl);
    const cell = (x) => `<tr class="${x.r}"><td>${mr(x.n)}</td><td>${x.a === null || x.a === undefined ? '—' : x.a === -1 ? 'सोडला' : `(${OPT[x.a]})`}</td><td>${x.k === null ? 'रद्द' : `(${OPT[x.k]})`}</td><td>${{ ok: '✔', bad: '✘', sk: '–', cx: '—' }[x.r]}</td></tr>`;
    const half = Math.ceil(shown.length / 2);
    const tbl = (list) => `<table class="ms-tbl"><thead><tr><th>प्र.क्र.</th><th>तुमचे उत्तर</th><th>योग्य उत्तर</th><th>निकाल</th></tr></thead><tbody>${list.map(cell).join('')}</tbody></table>`;
    const today = new Date();
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>🏆 अंदाजित गुणपत्रक</h1></header>
    <main class="wrap">
      <section class="ms">
        <div class="ms-head">
          <div class="ms-logo">स</div>
          <div><b>निकालापूर्वी निकाल</b><small>अंदाजित उत्तरपत्रिका व गुणपत्रक</small></div>
        </div>
        <div class="ms-exam">${esc(meta.title)}</div>
        <table class="ms-info">
          <tr><th>उमेदवाराचे नाव</th><td>${esc(info.name) || '—'}</td></tr>
          <tr><th>बैठक क्रमांक</th><td>${esc(info.seat) || '—'}</td></tr>
          <tr><th>प्रश्नपत्रिका संच</th><td>${esc(cur.series)}</td></tr>
          <tr><th>उत्तरतालिका</th><td>${data.status === 'final' ? 'आयोगाची अंतिम' : 'तात्पुरती'}</td></tr>
        </table>
        <div class="ms-total"><span>एकूण गुण</span><b>${fmt(r.score)}</b><span>/ ${mr(r.max)}</span></div>
        <table class="ms-sum">
          <tr><th>बरोबर</th><th>चूक</th><th>सोडलेले</th><th>रद्द</th></tr>
          <tr><td class="ok">${mr(r.right)}</td><td class="bad">${mr(r.wrong)}</td><td>${mr(r.blank)}</td><td>${mr(r.rows.filter((x) => x.r === 'cx').length)}</td></tr>
          <tr><th colspan="2">मिळालेले गुण (+)</th><th colspan="2">ऋण गुण (−)</th></tr>
          <tr><td colspan="2" class="ok">${fmt(r.gross)}</td><td colspan="2" class="bad">${fmt(r.minus)}</td></tr>
        </table>
        <p class="ms-note">प्रत्येक बरोबर उत्तरास ${fmt(data.marks)} गुण • चुकीच्या उत्तरास ${fmt(data.marks * data.neg)} गुण वजा • रद्द प्रश्नांचे गुण धरलेले नाहीत</p>
      </section>
      ${rankBox}
      <h3 class="sec">📋 प्रश्ननिहाय उत्तरपत्रिका</h3>
      <div class="ms-filter">${[['all', 'सर्व', r.rows.length], ['ok', '✔ बरोबर', r.right], ['bad', '✘ चूक', r.wrong], ['sk', 'सोडलेले', r.blank]].map(([k, l, c]) => `<button class="${fl === k ? 'on' : ''}" data-act="nk-filter" data-f="${k}">${l} <small>${mr(c)}</small></button>`).join('')}</div>
      <div class="ms-cols">${shown.length > 12 ? tbl(shown.slice(0, half)) + tbl(shown.slice(half)) : tbl(shown)}</div>
      <div class="row2">
        <button class="btn ghost" data-act="nk-edit">✏️ उत्तरे बदला</button>
        <button class="btn primary" data-act="nk-share">📤 मित्रांना पाठवा</button>
      </div>
      <p class="muted small n-disc">दिनांक: ${mr(today.getDate())}/${mr(today.getMonth() + 1)}/${mr(today.getFullYear())} • हे गुणपत्रक अंदाजित आहे — विद्यार्थ्याने भरलेल्या उत्तरांवर आधारित. रँक ‘सराव’ वापरणाऱ्या विद्यार्थ्यांमधील आहे; अधिकृत निकाल व कट-ऑफ आयोगच जाहीर करेल.</p>
    </main>${tabbar()}`;
  }

  async function share() {
    const r = result;
    const text = `मी ‘सराव’ अ‍ॅपवर ${cur.meta.short} चा निकालापूर्वी निकाल पाहिला 🏆\nमाझे अंदाजित गुण: ${fmt(r.score)}/${mr(r.max)}\nतुम्हीही तुमचे गुण व रँक आत्ताच तपासा 👇\nhttps://play.google.com/store/apps/details?id=in.sachivapps.sarav`;
    try {
      if (globalThis.Capacitor?.isNativePlatform?.()) { const { Share } = await import('@capacitor/share'); await Share.share({ text }); }
      else if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast('मजकूर कॉपी झाला — WhatsApp मध्ये पेस्ट करा'); }
    } catch (_) { /* रद्द */ }
  }

  // क्लिक हाताळणी: true परत केल्यास हाताळले
  async function click(act, el) {
    switch (act) {
      case 'nk-open': await open(el.dataset.id); return true;
      case 'nk-ans': setAns(Number(el.dataset.i), Number(el.dataset.k)); return true;
      case 'nk-series': if (cur.data.series[el.dataset.s]) { cur.series = el.dataset.s; saveDraft(); render(); } return true;
      case 'nk-showq': await toggleQ(); return true;
      case 'nk-submit': await submit(); return true;
      case 'nk-edit': cur.submitted = false; saveDraft(); go('nikal-entry'); return true;
      case 'nk-share': await share(); return true;
      case 'nk-tell': await tell(el.dataset.id); return true;
      case 'nk-filter': filter = el.dataset.f; render(); return true;
      case 'nk-mode':
        if (el.dataset.m === 'scan') { toast('📷 OMR प्रत स्कॅन करण्याची सुविधा लवकरच येत आहे'); return true; }
        mode = el.dataset.m; render(); return true;
      default: return false;
    }
  }
  const backTarget = (view) => (view === 'nikal-entry' || view === 'nikal-result' ? 'nikal' : view === 'nikal' ? 'home' : null);

  return { loadIndex, homeCard, listView, entryView, resultView, click, backTarget, hasIndex: () => index.length > 0 };
}
