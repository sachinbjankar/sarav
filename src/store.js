// फोनवर साठवलेली माहिती. खाते असल्यास हीच माहिती Firebase मध्ये पण जतन होते.
const KEY = 'sarav.v1';

const blank = () => ({
  exam: '',         // निवडलेली परीक्षा: mpsc | police | itar
  ans: {},          // प्रश्न id → { r, w, last }
  saved: [],        // जतन केलेले प्रश्न
  streak: { last: '', n: 0 },
  daily: {},        // परीक्षा → { date, score, total }
  hist: [],         // शेवटच्या ६० चाचण्या: { exam, mode, sid, score, total, secs, at }
  pending: [],      // रँकिंगमध्ये अजून न पाठवलेले गुण: { exam, pts }
  tests: 0,
  best: 0,
  xp: 0,            // अनुभव गुण (स्तरासाठी)
  levels: {},       // विषय → { n: पूर्ण स्तर, st: { स्तर क्रमांक: तारे } }
});

let data;
try {
  data = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  if (data.daily && 'date' in data.daily) data.daily = {}; // जुनी रचना
  if (data.exam === 'itar') data.exam = 'talathi'; // जुना विभाग
} catch (_) {
  data = blank();
}

let onChange = null;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { /* storage unavailable */ }
  if (onChange) onChange();
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => ymd(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };

export const store = {
  get: () => data,
  setOnChange: (fn) => { onChange = fn; },

  setExam(id) { data.exam = id; save(); },

  record(qid, correct) {
    const a = data.ans[qid] || { r: 0, w: 0, last: false };
    if (correct) a.r++; else a.w++;
    a.last = correct;
    data.ans[qid] = a;
    save();
  },

  finishTest(result) {
    data.tests++;
    data.testsBy = data.testsBy || {};
    data.testsBy[result.exam] = (data.testsBy[result.exam] || 0) + 1;
    if (result.score > data.best) data.best = result.score;
    const t = today();
    if (data.streak.last !== t) {
      data.streak.n = data.streak.last === yesterday() ? data.streak.n + 1 : 1;
      data.streak.last = t;
    }
    if (result.mode === 'daily' && !result.retry) data.daily[result.exam] = { date: t, score: result.score, total: result.total };
    data.hist.unshift({ ...result, at: Date.now() });
    data.hist = data.hist.slice(0, 60);
    save();
    return data.tests;
  },

  testsFor: (exam) => Math.max((data.testsBy || {})[exam] || 0, data.hist.filter((h) => h.exam === exam).length),

  // ---- Duolingo-सारखे स्तर ----
  pathOf: (sid) => data.levels[sid] || { n: 0, st: {} },
  completeLevel(sid, idx, stars) {
    const p = data.levels[sid] || { n: 0, st: {} };
    const first = !p.st[idx];
    p.st[idx] = Math.max(p.st[idx] || 0, stars);
    if (stars > 0 && idx >= p.n) p.n = idx + 1;
    data.levels[sid] = p;
    save();
    return first;
  },
  addXp(n) { const before = data.xp || 0; data.xp = before + n; save(); return [before, data.xp]; },

  dailyFor: (exam) => data.daily[exam] || { date: '' },

  streak() {
    const s = data.streak;
    return s.last === today() || s.last === yesterday() ? s.n : 0;
  },

  isSaved: (id) => data.saved.includes(id),
  toggleSave(id) {
    if (data.saved.includes(id)) data.saved = data.saved.filter((x) => x !== id);
    else data.saved.unshift(id);
    save();
    return data.saved.includes(id);
  },

  queueScore(exam, pts) { data.pending.push({ exam, pts }); save(); },
  takePending() { return data.pending[0]; },
  dropPending() { data.pending.shift(); save(); },

  // Firebase मध्ये पाठवायचा भाग (गुणांची रांग सोडून)
  cloudCopy() {
    const { pending, ...rest } = data;
    return JSON.parse(JSON.stringify(rest));
  },

  // दुसऱ्या फोनवरून/जुन्या खात्यातून आलेली प्रगती या फोनवरील प्रगतीत मिसळा
  merge(cloud) {
    if (!cloud) return;
    for (const [id, c] of Object.entries(cloud.ans || {})) {
      const l = data.ans[id];
      if (!l || c.r + c.w > l.r + l.w) data.ans[id] = c;
    }
    data.saved = [...new Set([...data.saved, ...(cloud.saved || [])])];
    if ((cloud.streak?.last || '') > data.streak.last) data.streak = cloud.streak;
    for (const [e, d] of Object.entries(cloud.daily || {})) {
      if (!data.daily[e] || (d.date || '') > (data.daily[e].date || '')) data.daily[e] = d;
    }
    const seen = new Set(data.hist.map((h) => h.at));
    data.hist = [...data.hist, ...(cloud.hist || []).filter((h) => !seen.has(h.at))].sort((a, b) => b.at - a.at).slice(0, 60);
    data.tests = Math.max(data.tests, cloud.tests || 0);
    data.testsBy = data.testsBy || {};
    for (const [e, n] of Object.entries(cloud.testsBy || {})) data.testsBy[e] = Math.max(data.testsBy[e] || 0, n);
    data.best = Math.max(data.best, cloud.best || 0);
    data.xp = Math.max(data.xp || 0, cloud.xp || 0);
    for (const [sid, p] of Object.entries(cloud.levels || {})) {
      const l = data.levels[sid] || { n: 0, st: {} };
      const st = { ...p.st };
      for (const [k, v] of Object.entries(l.st)) st[k] = Math.max(st[k] || 0, v);
      data.levels[sid] = { n: Math.max(l.n, p.n || 0), st };
    }
    if (!data.exam) data.exam = cloud.exam || '';
    save();
  },

  reset() {
    const exam = data.exam;
    data = { ...blank(), exam };
    save();
  },
};
