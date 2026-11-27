// ---------- 🏆 निकालापूर्वी निकाल ----------
// परीक्षेनंतर विद्यार्थी आपल्या प्रश्नपत्रिकेवर दिलेली उत्तरे (OMR सारखी) भरतात →
// उत्तरतालिकेनुसार गुण (ऋण गुणांसह) → सर्व सराव वापरकर्त्यांमधील रँक व टक्केवारी.
// नवीन परीक्षा जोडणे: content/nikal_build.py

const D = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => D[d]);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const OPT = ['१', '२', '३', '४'];
const fmt = (x) => mr((Math.round(x * 100) / 100).toString());

export function createNikal({ backend, go, render, toast, confirmBox, exam, tabbar, user }) {
  let index = [];
  let cur = null;      // { meta, data, series, ans: [], showQ, qs }
  let result = null;   // { score, max, right, wrong, blank, stats, wrongList }

  const draftKey = (id) => `sarav.nikal.${id}`;
  const loadDraft = (id) => { try { return JSON.parse(localStorage.getItem(draftKey(id))) || null; } catch (_) { return null; } };
  const saveDraft = () => { try { localStorage.setItem(draftKey(cur.meta.id), JSON.stringify({ series: cur.series, ans: cur.ans, submitted: cur.submitted || false })); } catch (_) { /* ignore */ } };

  async function loadIndex() {
    try { index = await (await fetch('nikal/index.json')).json(); } catch (_) { index = []; }
  }

  function homeCard() {
    const e = exam();
    const mine = index.filter((x) => x.exams.includes(e.id));
    const latest = (mine[0] || index[0]);
    if (!latest) return '';
    return `<button class="nikal-card" data-act="tab" data-v="nikal">
      <span class="nk-trophy">🏆</span>
      <span class="grow"><b>निकालापूर्वी निकाल</b><small>${esc(latest.short)} • तुमचे गुण व रँक आत्ताच जाणून घ्या</small></span>
      <span class="arrow">›</span></button>`;
  }

  function listView() {
    const e = exam();
    const list = [...index].sort((a, b) => (b.exams.includes(e.id) - a.exams.includes(e.id)));
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>🏆 निकालापूर्वी निकाल</h1></header>
    <main class="wrap">
      <section class="nk-hero">
        <b>परीक्षा दिली? निकालाची वाट कशाला पाहायची!</b>
        <ol><li>तुमची परीक्षा व प्रश्नपत्रिकेचा संच निवडा</li><li>तुम्ही दिलेली उत्तरे भरा (५ मिनिटे)</li><li>तुमचे गुण व सर्व विद्यार्थ्यांमधील रँक लगेच पाहा</li></ol>
      </section>
      ${list.map((x) => {
        const d = loadDraft(x.id);
        return `<button class="pyq-card" data-act="nk-open" data-id="${x.id}">
          <span class="pyq-yr">${mr(x.date.slice(0, 4))}</span>
          <span class="grow"><b>${esc(x.title)}</b>
            <small>${mr(x.count)} प्रश्न • ${x.status === 'final' ? 'आयोगाची अंतिम उत्तरतालिका' : 'तात्पुरती उत्तरतालिका'}${x.demo ? ' • डेमो' : ''}</small>
            ${d?.submitted ? '<small class="pyq-best">✅ उत्तरे भरली — निकाल पाहा</small>' : d ? '<small class="pyq-best">✏️ अर्धवट भरलेले</small>' : ''}
          </span><span class="arrow">›</span></button>`;
      }).join('') || '<p class="muted">पुढील परीक्षेनंतर लगेच येथे पेपर उपलब्ध होईल.</p>'}
      <p class="muted small n-disc">हा फक्त अंदाज आहे. रँक ‘सराव’ वापरणाऱ्या विद्यार्थ्यांमधील आहे; अधिकृत निकाल व कट-ऑफ आयोगच जाहीर करेल.</p>
    </main>${tabbar()}`;
  }

  async function open(id) {
    const meta = index.find((x) => x.id === id);
    if (!meta) return;
    let data;
    try { data = await (await fetch(meta.file)).json(); } catch (_) { return toast('माहिती उघडता आली नाही'); }
    const d = loadDraft(id);
    cur = { meta, data, series: d?.series || meta.series[0], ans: d?.ans || Array(data.count).fill(null), showQ: false, qs: null, submitted: d?.submitted };
    if (cur.submitted) return showResult();
    go('nikal-entry');
  }

  async function toggleQ() {
    cur.showQ = !cur.showQ;
    if (cur.showQ && !cur.qs && cur.data.qfile) {
      try { const p = await (await fetch(cur.data.qfile)).json(); cur.qs = Object.fromEntries(p.q.map((q) => [q.n, q])); } catch (_) { cur.qs = {}; }
    }
    render();
  }

  function entryView() {
    const { meta, data, ans, series } = cur;
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
        <label class="nk-toggle"><input type="checkbox" data-act="nk-showq" ${cur.showQ ? 'checked' : ''}> प्रश्नही दाखवा</label>
        <small class="muted">प्रत्येक प्रश्नासाठी तुम्ही परीक्षेत निवडलेला पर्याय दाबा. उत्तर दिले नसल्यास ‘सोडला’.</small>
      </section>
      ${rows}
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
    let s = 0, right = 0, wrong = 0, blank = 0, max = 0; const wrongList = [];
    key.forEach((k, i) => {
      if (k === null) return;
      max += data.marks;
      const a = ans[i];
      if (a === null || a === -1) blank++;
      else if (a === k) { right++; s += data.marks; }
      else { wrong++; s -= data.marks * data.neg; wrongList.push({ n: i + 1, a, k }); }
    });
    return { score: Math.round(s * 100) / 100, max, right, wrong, blank, wrongList };
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
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>🏆 तुमचा अंदाजित निकाल</h1></header>
    <main class="wrap">
      <section class="nk-score">
        <small>${esc(meta.short)} • संच ${esc(cur.series)}</small>
        <div class="nk-big"><b>${fmt(r.score)}</b><span>/ ${mr(r.max)} गुण</span></div>
        <div class="nk-split"><span class="ok">✅ ${mr(r.right)} बरोबर</span><span class="bad">❌ ${mr(r.wrong)} चूक</span><span>⚪ ${mr(r.blank)} सोडले</span></div>
        <small class="muted">${data.status === 'final' ? 'आयोगाच्या अंतिम उत्तरतालिकेनुसार' : 'तात्पुरत्या उत्तरतालिकेनुसार — अंतिम तालिका आल्यावर गुण आपोआप बदलतील'} • चुकीला ${fmt(data.marks * data.neg)} गुण वजा</small>
      </section>
      ${rankBox}
      <div class="row2">
        <button class="btn ghost" data-act="nk-edit">✏️ उत्तरे बदला</button>
        <button class="btn primary" data-act="nk-share">📤 मित्रांना पाठवा</button>
      </div>
      ${r.wrongList.length ? `<h3 class="sec">❌ चुकलेले प्रश्न (${mr(r.wrongList.length)})</h3>
        <div class="nk-wrong">${r.wrongList.map((w) => `<span>प्र. ${mr(w.n)}: तुमचे (${OPT[w.a]}) → योग्य <b>(${OPT[w.k]})</b></span>`).join('')}</div>` : ''}
      <p class="muted small n-disc">हा फक्त अंदाज आहे. रँक ‘सराव’ वापरणाऱ्या विद्यार्थ्यांमधील आहे; अधिकृत निकाल व कट-ऑफ आयोगच जाहीर करेल.</p>
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
      default: return false;
    }
  }
  const backTarget = (view) => (view === 'nikal-entry' || view === 'nikal-result' ? 'nikal' : view === 'nikal' ? 'home' : null);

  return { loadIndex, homeCard, listView, entryView, resultView, click, backTarget, hasIndex: () => index.length > 0 };
}
