// प्रश्ननिर्मितीसाठी समान साधने.
// प्रत्येक प्रश्न: { s: विषय, q: प्रश्न, o: [बरोबर, चूक, चूक, चूक], e: स्पष्टीकरण }
// id प्रश्नाच्या मजकुरावरून तयार होतो, त्यामुळे पुन्हा build केल्यावरही तोच राहतो.

const DIG = '०१२३४५६७८९';
export const mr = (x) => String(x).replace(/\d/g, (d) => DIG[d]);

export function rng(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) + 0x9e3779b9) | 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => (a / gcd(a, b)) * b;

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// संख्यात्मक उत्तरासाठी पटणारे चुकीचे पर्याय
export function numDistractors(r, ans, { step, extra = [], min = 0, integer = true } = {}) {
  const out = new Set();
  const s = step || Math.max(1, Math.round(Math.abs(ans) * 0.1));
  for (const x of extra) if (x !== ans && x >= min && Number.isFinite(x)) out.add(x);
  let guard = 0;
  while (out.size < 3 && guard++ < 200) {
    const k = pick(r, [-3, -2, -1, 1, 2, 3]);
    let v = ans + k * s;
    if (integer) v = Math.round(v); else v = Math.round(v * 100) / 100;
    if (v !== ans && v >= min) out.add(v);
  }
  return [...out].slice(0, 3);
}

// एका तक्त्यातून (fact table) प्रश्न: कॉलम `from` दिला की `to` विचारायचा.
// distractors फक्त अशा ओळींमधून ज्यांचे `to` उत्तर या प्रश्नासाठीही बरोबर ठरू शकत नाही.
export function fromTable(subject, rows, { from, to, q, e, filter, minPool = 4, seed = '', near = false, fmt = (v) => v }) {
  const r = rng(`${subject}-${seed}-${from}-${to}`);
  const valid = new Map(); // from value → set of valid answers
  for (const row of rows) {
    if (row[from] == null || row[to] == null || row[from] === '' || row[to] === '') continue;
    if (!valid.has(row[from])) valid.set(row[from], new Set());
    valid.get(row[from]).add(row[to]);
  }
  const allTo = [...new Set(rows.map((x) => x[to]).filter((v) => v != null && v !== ''))];
  if (allTo.length < minPool) return [];
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    if (filter && !filter(row)) continue;
    const a = row[from];
    const b = row[to];
    if (a == null || b == null || a === '' || b === '') continue;
    if (seen.has(a)) continue; // एका प्रश्नाचे एकच रूप
    seen.add(a);
    const ok = valid.get(a);
    let pool;
    if (near) {
      const n = Number(b);
      const c = new Set();
      let g = 0;
      while (c.size < 3 && g++ < 100) {
        const v = n + pick(r, [-1, 1]) * ri(r, 1, n > 1000 ? 12 : Math.max(2, Math.round(n * 0.2)));
        if (v > 0 && !(n > 1000 && v > 2026) && !ok.has(String(v)) && !ok.has(v) && v !== n) c.add(v);
      }
      pool = [...c];
    } else pool = shuffle(r, allTo.filter((v) => !ok.has(v)));
    if (pool.length < 3) continue;
    out.push({ s: subject, q: q(row), o: [b, ...pool.slice(0, 3)].map(fmt), e: e(row) });
  }
  return out;
}

export function validate(list) {
  const errs = [];
  const seenQ = new Map();
  for (const x of list) {
    const tag = `${x.s}: ${x.q}`;
    if (!x.q || !x.e || !Array.isArray(x.o) || x.o.length !== 4) errs.push(`shape ${tag}`);
    else if (new Set(x.o.map(String)).size !== 4) errs.push(`dup option ${tag} ${JSON.stringify(x.o)}`);
    if (x.o && x.o.some((v) => v === undefined || v === null || String(v).trim() === '' || String(v).includes('NaN') || String(v).includes('undefined'))) errs.push(`bad option ${tag}`);
    if (/undefined|NaN/.test(x.q + x.e)) errs.push(`bad text ${tag}`);
    const key = `${x.s}|${x.q}|${x.o[0]}`;
    if (seenQ.has(key)) x.dup = true; else seenQ.set(key, true);
  }
  return errs;
}

// एकसारखे प्रश्न काढून id द्या
export function finalize(list) {
  const out = [];
  const keys = new Set();
  for (const x of list) {
    const key = `${x.s}|${x.q}|${x.o[0]}`;
    const qkey = `${x.s}|${x.q}`;
    if (keys.has(key) || keys.has(qkey)) continue;
    keys.add(key); keys.add(qkey);
    out.push([`g${hash(key)}`, x.s, x.q, x.o.map(String), x.e]);
  }
  return out;
}

// '|' ने वेगळे केलेले तक्ते वाचणे
export function tbl(text, cols) {
  return text.trim().split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const parts = l.split('|').map((x) => x.trim());
    const o = {};
    cols.forEach((c, i) => { o[c] = parts[i] ?? ''; });
    return o;
  });
}

// थेट लिहिलेले प्रश्न: [प्रश्न, बरोबर, चूक१, चूक२, चूक३, स्पष्टीकरण]
export const qa = (subject, list) => list.map(([q, a, d1, d2, d3, e]) => ({ s: subject, q, o: [a, d1, d2, d3], e }));
