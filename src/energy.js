// ---------- ⚡ ऊर्जा (Duolingo सारखी) + 🎁 मित्राला आमंत्रण ----------
// नियम:
//  • सराव प्रश्नाचे उत्तर दिले की १⚡ खर्च; बरोबर उत्तराला १⚡ परत (+१) → फक्त चुकीची उत्तरे ऊर्जा कमी करतात
//  • जास्तीत जास्त २५⚡; दर ३० मिनिटांनी आपोआप +१
//  • भरण्याचे मार्ग: रोज एकदा मोफत +५, जाहिरात पाहून +५ (दिवसाला ५ वेळा), मित्राला आमंत्रण +२५ (दोघांनाही)
//  • मोफत राहील: आजची प्रश्नमंजुषा, मागील प्रश्नपत्रिका/सराव पेपर, निकालापूर्वी निकाल, टायपिंग
// ऊर्जा फोनवर (localStorage) राहते; आमंत्रणाची नोंद Firebase सुरू झाल्यावर सर्व्हरवर.

import { ENERGY } from './config.js';

const D = '०१२३४५६७८९';
const mr = (n) => String(n).replace(/\d/g, (d) => D[d]);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'sarav.energy';
const ymd = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randCode = () => Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

export function createEnergy({ backend, user, go, render, toast, confirmBox, showRewarded, tabbar }) {
  const MAX = ENERGY.MAX, REFILL = ENERGY.REFILL_MIN * 60000;
  let s = load();

  function load() {
    let x = null;
    try { x = JSON.parse(localStorage.getItem(KEY)); } catch (_) { /* ignore */ }
    x = x || {};
    if (typeof x.e !== 'number') x.e = MAX;
    x.t ||= Date.now();
    x.code ||= randCode();
    x.earned ||= 0; x.spent ||= 0; x.refN ||= 0;
    return x;
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { /* ignore */ } };

  // आपोआप भरणे (फक्त कमाल मर्यादेपर्यंत)
  function regen() {
    if (s.e >= MAX) { s.t = Date.now(); return; }
    const n = Math.floor((Date.now() - s.t) / REFILL);
    if (n > 0) { s.e = Math.min(MAX, s.e + n); s.t += n * REFILL; if (s.e >= MAX) s.t = Date.now(); save(); }
  }
  const get = () => { regen(); return s.e; };
  const nextIn = () => { regen(); if (s.e >= MAX) return 0; return Math.max(0, s.t + REFILL - Date.now()); };
  const fmtWait = (ms) => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${mr(Math.floor(m / 60))} तास ${mr(m % 60)} मि.` : `${mr(m)} मि.`; };
  const fullIn = () => { regen(); return s.e >= MAX ? 0 : nextIn() + (MAX - s.e - 1) * REFILL; };

  function add(n, why) {
    regen();
    const wasFull = s.e >= MAX;
    s.e = Math.min(ENERGY.BANK_MAX, s.e + n);
    if (wasFull) s.t = Date.now();
    s.earned += n; save();
    if (why) toast(`+${mr(n)} ⚡ ${why}`);
    pulse();
  }
  // उत्तर दिल्यावर: −१, बरोबर असल्यास +१ परत
  function onAnswer(ok) {
    regen();
    if (s.e >= MAX && ok) { s.earned++; save(); pulse(true); return; }
    if (s.e >= MAX) s.t = Date.now();
    s.e = Math.max(0, s.e - 1); s.spent++;
    if (ok) { s.e += 1; s.earned++; }
    save(); pulse(ok);
  }
  function pulse(plus) {
    document.querySelectorAll('[data-energy]').forEach((el) => {
      el.textContent = mr(s.e);
      const p = el.closest('.en-pill'); if (!p) return;
      p.classList.remove('bump', 'plus'); void p.offsetWidth; p.classList.add(plus ? 'plus' : 'bump');
      p.classList.toggle('empty', s.e === 0);
    });
  }

  const freeLeft = () => s.freeDay !== ymd();
  const adsLeft = () => (s.adDay === ymd() ? Math.max(0, ENERGY.ADS_PER_DAY - (s.adN || 0)) : ENERGY.ADS_PER_DAY);

  // ---------- दृश्ये ----------
  const pill = (cls = '') => `<button class="en-pill ${cls} ${get() === 0 ? 'empty' : ''}" data-act="en-open" title="ऊर्जा">⚡ <b data-energy>${mr(get())}</b></button>`;

  function bar() {
    const e = get(); const pct = Math.min(100, (e / MAX) * 100);
    const w = nextIn();
    return `<div class="en-bar"><div class="en-fill" style="width:${pct}%"></div><b>${mr(e)} / ${mr(MAX)}</b><span class="en-bolt">⚡</span></div>
      <p class="en-sub">${e >= MAX ? (e > MAX ? `बोनससह ${mr(e)}⚡ — कमाल ${mr(MAX)} पेक्षा जास्त!` : 'ऊर्जा पूर्ण भरलेली आहे 💪') : `पुढील +१⚡ ${fmtWait(w)} मध्ये • पूर्ण भरण्यास ${fmtWait(fullIn())}`}</p>`;
  }

  function options(compact) {
    const full = get() >= MAX;
    const al = adsLeft();
    return `
      <div class="en-opt pro"><span class="en-tag">PRO</span><span class="en-ico inf">∞</span><span class="grow"><b>अमर्याद ऊर्जा</b><small>सराव Pro • जाहिरातीशिवाय</small></span><span class="en-r soon">लवकरच</span></div>
      <button class="en-opt" data-act="en-free" ${!freeLeft() || full ? 'disabled' : ''}><span class="en-ico">५</span><span class="grow"><b>+५ ऊर्जा</b><small>${freeLeft() ? 'रोज एकदा मोफत' : 'उद्या पुन्हा मिळेल'}</small></span><span class="en-r">${freeLeft() ? 'मोफत' : '✓'}</span></button>
      <button class="en-opt" data-act="en-ad" ${!al || full ? 'disabled' : ''}><span class="en-ico">५</span><span class="grow"><b>+५ ऊर्जा</b><small>${al ? `आज आणखी ${mr(al)} वेळा` : 'आजची मर्यादा संपली'}</small></span><span class="en-r">▶ जाहिरात</span></button>
      <button class="en-opt ref" data-act="en-refer"><span class="en-ico">🎁</span><span class="grow"><b>+${mr(ENERGY.REFER_BONUS)} ऊर्जा प्रत्येक मित्रामागे</b><small>मित्राला आमंत्रण पाठवा — त्यालाही +${mr(ENERGY.REFER_BONUS)}⚡</small></span><span class="en-r">आमंत्रण</span></button>
      ${compact ? '' : `<p class="muted small en-rules">⚡ प्रत्येक सराव प्रश्नाला १ ऊर्जा लागते आणि <b>बरोबर उत्तराला १ ऊर्जा परत</b> मिळते — म्हणजे फक्त चुकीची उत्तरे ऊर्जा कमी करतात. दर ${mr(ENERGY.REFILL_MIN)} मिनिटांनी +१ आपोआप.<br>🆓 आजची प्रश्नमंजुषा, मागील प्रश्नपत्रिका, सराव पेपर, निकालापूर्वी निकाल व टायपिंगला ऊर्जा लागत नाही.</p>`}`;
  }

  function pageView() {
    setTimeout(startTick, 0);
    return `
    <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>⚡ ऊर्जा</h1></header>
    <main class="wrap en-page">
      ${bar()}
      ${options(false)}
      ${referCard()}
    </main>
    ${tabbar()}`;
  }

  function referCard() {
    return `
    <section class="ref-card" id="refer">
      <div class="ref-h"><span>🎁</span><div><b>मित्राला आमंत्रण द्या</b><small>मित्राने तुमचा कोड टाकला की <b>दोघांनाही +${mr(ENERGY.REFER_BONUS)}⚡</b></small></div></div>
      <div class="ref-code"><span>तुमचा कोड</span><b>${esc(s.code)}</b><button class="btn light" data-act="en-copy">कॉपी</button></div>
      <button class="btn primary wide" data-act="en-share">📲 WhatsApp वर आमंत्रण पाठवा</button>
      <div class="ref-stats"><div><b>${mr(s.refN)}</b><span>मित्र जोडले</span></div><div><b>${mr(s.refN * ENERGY.REFER_BONUS)}</b><span>⚡ मिळाली</span></div></div>
      ${s.used ? `<p class="ref-used">✅ तुम्ही मित्राचा कोड <b>${esc(s.used)}</b> वापरला आहे</p>` : `
      <div class="ref-enter"><input id="ref-in" maxlength="8" placeholder="मित्राचा कोड टाका" autocapitalize="characters" autocomplete="off"><button class="btn" data-act="en-redeem">वापरा</button></div>`}
      ${backend.kind === 'mock' ? '<p class="muted small">मित्राने कोड वापरल्यावर तुम्हाला मिळणारी ऊर्जा सर्वांचे खाते (सर्व्हर) सुरू झाल्यावर आपोआप जमा होईल.</p>' : ''}
    </section>`;
  }

  // ‘मी’ विभागातील कार्ड
  function meCard() {
    return `
    <h3 class="sec">⚡ ऊर्जा व बक्षिसे</h3>
    <section class="en-card">
      ${bar()}
      <div class="en-mini"><div><b>${mr(s.earned)}</b><span>⚡ कमावली</span></div><div><b>${mr(s.spent)}</b><span>प्रश्न सोडवले</span></div><div><b>${mr(s.refN)}</b><span>मित्र आमंत्रित</span></div></div>
      <button class="btn light wide" data-act="en-open">ऊर्जा भरा / बक्षिसे ›</button>
    </section>
    ${referCard()}`;
  }

  let tickT = null;
  function startTick() {
    clearInterval(tickT);
    tickT = setInterval(() => {
      if (!document.querySelector('.en-bar')) { clearInterval(tickT); return; }
      const before = s.e; regen(); if (s.e !== before) render();
      const sub = document.querySelector('.en-sub');
      if (sub && s.e < MAX) sub.textContent = `पुढील +१⚡ ${fmtWait(nextIn())} मध्ये • पूर्ण भरण्यास ${fmtWait(fullIn())}`;
    }, 20000);
  }

  // ऊर्जा संपल्यावर चाचणीत दिसणारी खिडकी: true = पुढे चालू ठेवता येईल
  async function outOfEnergy() {
    return new Promise((resolve) => {
      const root = document.createElement('div');
      root.className = 'en-sheet-wrap';
      const draw = () => {
        root.innerHTML = `<div class="en-sheet">
          <div class="en-empty-ico">🪫</div>
          <h2>ऊर्जा संपली!</h2>
          <p class="muted">पुढचा प्रश्न सोडवण्यासाठी ऊर्जा भरा</p>
          ${bar()}
          ${options(true)}
          <button class="btn ghost wide" data-act="en-sheet-close">${get() > 0 ? 'पुढे चला ›' : 'नंतर'}</button>
        </div>`;
      };
      draw();
      root.addEventListener('click', async (ev) => {
        const b = ev.target.closest('[data-act]'); if (!b) return;
        ev.stopPropagation();
        const a = b.dataset.act;
        if (a === 'en-sheet-close') { root.remove(); resolve(get() > 0); return; }
        await click(a, b);
        draw();
        if (get() > 0 && (a === 'en-free' || a === 'en-ad')) { setTimeout(() => { root.remove(); resolve(true); }, 600); }
      }, true);
      document.body.appendChild(root);
    });
  }

  function shareText() {
    return `मी MPSC, तलाठी व पोलीस भरतीची तयारी ‘सराव’ अ‍ॅपवर करतोय — रोज प्रश्नमंजुषा, मागील प्रश्नपत्रिका, निकालापूर्वी निकाल, सगळे मोफत! 📚\n\nमाझा कोड *${s.code}* टाका आणि लगेच +${ENERGY.REFER_BONUS}⚡ ऊर्जा मिळवा 🎁\n\n👉 ${ENERGY.PLAY_URL}&referrer=${encodeURIComponent('ref_' + s.code)}`;
  }

  async function refreshRefs() {
    if (!backend.referCount) return;
    try {
      const n = await backend.referCount(s.code);
      if (n > s.refN) { const k = n - s.refN; s.refN = n; save(); add(k * ENERGY.REFER_BONUS, `— ${mr(k)} मित्र जोडले! 🎉`); render(); }
    } catch (_) { /* नंतर पुन्हा */ }
  }

  async function click(act) {
    switch (act) {
      case 'en-open': go('energy'); return true;
      case 'en-free':
        if (!freeLeft()) return true;
        s.freeDay = ymd(); save(); add(5, '— आजची मोफत ऊर्जा'); render(); return true;
      case 'en-ad': {
        if (!adsLeft()) { toast('आजची जाहिरात मर्यादा संपली'); return true; }
        const got = await showRewarded();
        if (!got) { toast('जाहिरात पूर्ण झाली नाही'); return true; }
        if (s.adDay !== ymd()) { s.adDay = ymd(); s.adN = 0; }
        s.adN++; save(); add(5, '— धन्यवाद!'); render(); return true;
      }
      case 'en-refer':
        if (document.getElementById('refer')) document.getElementById('refer').scrollIntoView({ behavior: 'smooth' });
        else { document.querySelector('.en-sheet-wrap')?.remove(); go('energy'); setTimeout(() => document.getElementById('refer')?.scrollIntoView(), 50); }
        return true;
      case 'en-copy':
        try { await navigator.clipboard.writeText(s.code); toast('कोड कॉपी झाला'); } catch (_) { toast(`तुमचा कोड: ${s.code}`); }
        return true;
      case 'en-share': {
        const text = shareText();
        try {
          if (globalThis.Capacitor?.isNativePlatform?.()) { const { Share } = await import('@capacitor/share'); await Share.share({ text }); }
          else if (navigator.share) await navigator.share({ text });
          else { await navigator.clipboard.writeText(text); toast('संदेश कॉपी झाला — WhatsApp वर पेस्ट करा'); }
        } catch (_) { /* रद्द */ }
        return true;
      }
      case 'en-redeem': {
        const code = (document.getElementById('ref-in')?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (s.used) return true;
        if (code.length < 6) { toast('योग्य कोड टाका (६ अक्षरे)'); return true; }
        if (code === s.code) { toast('स्वतःचा कोड वापरता येत नाही 🙂'); return true; }
        try { if (backend.referClaim) await backend.referClaim(code, user()?.uid); }
        catch (err) {
          if (err?.code === 'auth-required') { toast('कोड वापरण्यासाठी आधी खाते तयार करा'); go('auth'); return true; }
          if (err?.code === 'bad-code') { toast('हा कोड सापडला नाही'); return true; }
          if (err?.code === 'already') { toast('या खात्यावर आधीच कोड वापरला आहे'); return true; }
          toast('इंटरनेट तपासा व पुन्हा प्रयत्न करा'); return true;
        }
        s.used = code; save(); add(ENERGY.REFER_BONUS, '— मित्राच्या आमंत्रणाचे बक्षीस 🎁'); render(); return true;
      }
      default: return false;
    }
  }

  return { get, add, onAnswer, pill, pageView, meCard, outOfEnergy, click, refreshRefs, code: () => s.code };
}
