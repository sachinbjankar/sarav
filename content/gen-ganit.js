// अंकगणित: प्रत्येक प्रश्नाचे उत्तर कोडने मोजले जाते, म्हणून उत्तर नेहमी बरोबर.
import { mr, rng, ri, pick, numDistractors, gcd, lcm, shuffle } from './engine.js';

const S = 'ganit';
const rs = (n) => `${mr(n)} रु.`;
const fmt = (n) => mr(Number.isInteger(n) ? n : Math.round(n * 100) / 100);

function mk(q, ans, dis, e, unit = '') {
  const u = (v) => (unit ? `${fmt(v)} ${unit}` : fmt(v));
  return { s: S, q, o: [u(ans), ...dis.map(u)], e };
}

const T = [];

// १. टक्केवारी: x चे p%
T.push((r) => {
  const p = pick(r, [5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 120, 125, 150]);
  const base = ri(r, 2, 60) * (100 / gcd(p, 100));
  const ans = (base * p) / 100;
  return mk(`${mr(base)} चे ${mr(p)}% किती?`, ans, numDistractors(r, ans, { extra: [(base * p) / 10, ans + p, base - ans] }),
    `${mr(base)} × ${mr(p)} ÷ १०० = ${fmt(ans)}.`);
});

// २. टक्केवारीवरून संख्या
T.push((r) => {
  const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
  const n = ri(r, 2, 50) * (100 / gcd(p, 100));
  const part = (n * p) / 100;
  return mk(`एका संख्येचे ${mr(p)}% म्हणजे ${fmt(part)} आहे, तर ती संख्या कोणती?`, n, numDistractors(r, n, { extra: [(part * p) / 100, part * 10, n / 2] }),
    `संख्या = ${fmt(part)} × १०० ÷ ${mr(p)} = ${fmt(n)}.`);
});

// ३. टक्के वाढ / घट
T.push((r) => {
  const up = r() < 0.5;
  const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 50]);
  const base = ri(r, 2, 40) * (100 / gcd(p, 100)) * pick(r, [1, 10]);
  const ans = up ? base + (base * p) / 100 : base - (base * p) / 100;
  const word = pick(r, [['एका गावाची लोकसंख्या', ''], ['एका वस्तूची किंमत', ' रु.'], ['एका शाळेतील विद्यार्थीसंख्या', '']]);
  return mk(`${word[0]} ${fmt(base)}${word[1]} आहे. त्यात ${mr(p)}% ${up ? 'वाढ' : 'घट'} झाली, तर नवी ${word[0].includes('किंमत') ? 'किंमत' : 'संख्या'} किती?`,
    ans, numDistractors(r, ans, { extra: [up ? base - (base * p) / 100 : base + (base * p) / 100, base + p, (base * p) / 100] }),
    `${mr(p)}% ${up ? 'वाढ' : 'घट'} = ${fmt((base * p) / 100)}; नवी ${word[0].includes('किंमत') ? 'किंमत' : 'संख्या'} = ${fmt(base)} ${up ? '+' : '−'} ${fmt((base * p) / 100)} = ${fmt(ans)}.`);
});

// ४. नफा/तोटा टक्के
T.push((r) => {
  const cp = ri(r, 4, 80) * 25;
  const p = pick(r, [4, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50]);
  const profit = r() < 0.6;
  const amt = (cp * p) / 100;
  if (!Number.isInteger(amt)) return null;
  const sp = profit ? cp + amt : cp - amt;
  return mk(`एक वस्तू ${rs(cp)} ला खरेदी करून ${rs(sp)} ला विकली, तर ${profit ? 'नफा' : 'तोटा'} किती टक्के?`, p,
    numDistractors(r, p, { step: pick(r, [2, 5]), extra: [Math.round((amt / sp) * 1000) / 10, amt === p ? p + 5 : amt] , min: 1, integer: false }),
    `${profit ? 'नफा' : 'तोटा'} = ${mr(Math.abs(sp - cp))} रु.; टक्के = ${mr(Math.abs(sp - cp))} ÷ ${mr(cp)} × १०० = ${mr(p)}% (टक्केवारी नेहमी खरेदी किमतीवर).`, '%');
});

// ५. विक्री किंमत
T.push((r) => {
  const cp = ri(r, 4, 80) * 50;
  const p = pick(r, [10, 12, 15, 20, 25, 30]);
  const profit = r() < 0.6;
  if ((cp * p) % 100) return null;
  const sp = profit ? cp + (cp * p) / 100 : cp - (cp * p) / 100;
  return mk(`${rs(cp)} ला घेतलेली वस्तू ${mr(p)}% ${profit ? 'नफ्याने' : 'तोट्याने'} विकायची असेल तर विक्री किंमत किती?`, sp,
    numDistractors(r, sp, { extra: [profit ? cp - (cp * p) / 100 : cp + (cp * p) / 100, cp + p, (cp * p) / 100] }),
    `${mr(p)}% = ${fmt((cp * p) / 100)} रु.; विक्री किंमत = ${mr(cp)} ${profit ? '+' : '−'} ${fmt((cp * p) / 100)} = ${fmt(sp)} रु.`, 'रु.');
});

// ६. सूट
T.push((r) => {
  const mp = ri(r, 4, 60) * 50;
  const d = pick(r, [5, 10, 15, 20, 25, 30, 40]);
  const sp = mp - (mp * d) / 100;
  if (r() < 0.5) {
    return mk(`छापील किंमत ${rs(mp)} असलेल्या वस्तूवर ${mr(d)}% सूट दिली, तर विक्री किंमत किती?`, sp,
      numDistractors(r, sp, { extra: [(mp * d) / 100, mp + (mp * d) / 100] }),
      `सूट = ${mr(mp)} × ${mr(d)} ÷ १०० = ${fmt((mp * d) / 100)} रु.; विक्री किंमत = ${fmt(sp)} रु.`, 'रु.');
  }
  return mk(`${mr(d)}% सूट दिल्यानंतर वस्तूची किंमत ${rs(sp)} झाली, तर छापील किंमत किती?`, mp,
    numDistractors(r, mp, { extra: [sp + (sp * d) / 100] }),
    `छापील किंमतीच्या ${mr(100 - d)}% = ${fmt(sp)}; छापील किंमत = ${fmt(sp)} × १०० ÷ ${mr(100 - d)} = ${fmt(mp)} रु.`, 'रु.');
});

// ७. सरळव्याज
T.push((r) => {
  const P = ri(r, 2, 50) * 500;
  const R = pick(r, [4, 5, 6, 8, 9, 10, 12, 15]);
  const N = ri(r, 2, 6);
  const I = (P * R * N) / 100;
  const v = ri(r, 0, 2);
  if (v === 0) {
    return mk(`${rs(P)} वर द.सा.द.शे. ${mr(R)} दराने ${mr(N)} वर्षांचे सरळव्याज किती?`, I,
      numDistractors(r, I, { extra: [(P * R) / 100, P + I, (P * R * (N + 1)) / 100] }),
      `सरळव्याज = मुद्दल × दर × वर्षे ÷ १०० = ${mr(P)} × ${mr(R)} × ${mr(N)} ÷ १०० = ${fmt(I)} रु.`, 'रु.');
  }
  if (v === 1) {
    return mk(`${rs(P)} वर द.सा.द.शे. ${mr(R)} दराने ${mr(N)} वर्षांनी सरळव्याजाने एकूण रास किती होईल?`, P + I,
      numDistractors(r, P + I, { extra: [I, P + (P * R) / 100] }),
      `व्याज = ${mr(P)} × ${mr(R)} × ${mr(N)} ÷ १०० = ${fmt(I)}; रास = मुद्दल + व्याज = ${fmt(P + I)} रु.`, 'रु.');
  }
  return mk(`${rs(P)} मुद्दलावर ${mr(N)} वर्षांत ${rs(I)} सरळव्याज मिळाले, तर व्याजाचा दर किती?`, R,
    numDistractors(r, R, { step: 1, min: 1, extra: [R * 2, N] }),
    `दर = व्याज × १०० ÷ (मुद्दल × वर्षे) = ${fmt(I)} × १०० ÷ (${mr(P)} × ${mr(N)}) = ${mr(R)}%.`, '%');
});

// ८. चक्रवाढ व्याज (२ वर्षे)
T.push((r) => {
  const P = ri(r, 1, 40) * 1000;
  const R = pick(r, [5, 10, 20]);
  const A = P * (1 + R / 100) ** 2;
  const CI = Math.round(A - P);
  const SI = (P * R * 2) / 100;
  if (r() < 0.5) {
    return mk(`${rs(P)} वर द.सा.द.शे. ${mr(R)} दराने २ वर्षांचे चक्रवाढ व्याज किती?`, CI,
      numDistractors(r, CI, { extra: [SI, Math.round(A), CI + (P * R) / 100] }),
      `रास = ${mr(P)} × (१ + ${mr(R)}/१००)² = ${fmt(Math.round(A))}; चक्रवाढ व्याज = ${fmt(Math.round(A))} − ${mr(P)} = ${fmt(CI)} रु.`, 'रु.');
  }
  return mk(`${rs(P)} वर द.सा.द.शे. ${mr(R)} दराने २ वर्षांच्या चक्रवाढ व्याज व सरळव्याज यांतील फरक किती?`, CI - SI,
    numDistractors(r, CI - SI, { extra: [SI, CI, (P * R) / 100] }),
    `फरक = मुद्दल × (दर/१००)² = ${mr(P)} × (${mr(R)}/१००)² = ${fmt(CI - SI)} रु.`, 'रु.');
});

// ९. काम व वेळ
T.push((r) => {
  const pairs = [[10, 15], [12, 24], [20, 30], [6, 12], [15, 30], [10, 40], [12, 36], [18, 36], [20, 60], [24, 40], [30, 60], [8, 24], [9, 18], [21, 42], [14, 21], [16, 48], [28, 84], [36, 45], [40, 60], [45, 90]];
  const [a, b] = pick(r, pairs);
  const t = (a * b) / (a + b);
  if (!Number.isInteger(t)) return null;
  const n1 = pick(r, ['अ', 'राम', 'अजय', 'रमेश']);
  const n2 = pick(r, ['ब', 'श्याम', 'विजय', 'सुरेश']);
  return mk(`${n1} एक काम ${mr(a)} दिवसांत व ${n2} तेच काम ${mr(b)} दिवसांत पूर्ण करतो. दोघे मिळून ते काम किती दिवसांत पूर्ण करतील?`, t,
    numDistractors(r, t, { step: 2, min: 1, extra: [(a + b) / 2, b - a] }),
    `एका दिवसाचे काम = १/${mr(a)} + १/${mr(b)} = १/${mr(t)}; म्हणून दोघांना ${mr(t)} दिवस लागतील. (सूत्र: ${mr(a)} × ${mr(b)} ÷ (${mr(a)} + ${mr(b)}))`, 'दिवस');
});

// १०. मनुष्यदिवस
T.push((r) => {
  const m1 = pick(r, [4, 5, 6, 8, 10, 12, 15, 16, 20, 24]);
  const d1 = pick(r, [6, 8, 10, 12, 15, 18, 20, 24, 30]);
  const m2 = pick(r, [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40].filter((x) => x !== m1 && (m1 * d1) % x === 0));
  if (!m2) return null;
  const d2 = (m1 * d1) / m2;
  return mk(`${mr(m1)} मजूर एक काम ${mr(d1)} दिवसांत करतात. तेच काम ${mr(m2)} मजूर किती दिवसांत करतील?`, d2,
    numDistractors(r, d2, { step: 2, min: 1, extra: [(m2 * d1) / m1] }),
    `एकूण काम = ${mr(m1)} × ${mr(d1)} = ${mr(m1 * d1)} मनुष्यदिवस; ${mr(m1 * d1)} ÷ ${mr(m2)} = ${mr(d2)} दिवस.`, 'दिवस');
});

// ११. वेग-अंतर-वेळ
T.push((r) => {
  const v = pick(r, [20, 24, 30, 36, 40, 45, 48, 50, 54, 60, 72, 75, 80, 90]);
  const t = pick(r, [1.5, 2, 2.5, 3, 4, 5, 6]);
  const d = v * t;
  if (!Number.isInteger(d)) return null;
  const k = ri(r, 0, 2);
  if (k === 0) return mk(`ताशी ${mr(v)} किमी वेगाने ${mr(d)} किमी अंतर जाण्यास किती वेळ लागेल?`, t,
    numDistractors(r, t, { step: 0.5, min: 0.5, integer: false }), `वेळ = अंतर ÷ वेग = ${mr(d)} ÷ ${mr(v)} = ${fmt(t)} तास.`, 'तास');
  if (k === 1) return mk(`एक वाहन ${fmt(t)} तासांत ${mr(d)} किमी अंतर जाते, तर त्याचा वेग ताशी किती किमी?`, v,
    numDistractors(r, v, { step: 5, min: 5, extra: [d - v] }), `वेग = अंतर ÷ वेळ = ${mr(d)} ÷ ${fmt(t)} = ताशी ${mr(v)} किमी.`, 'किमी/तास');
  return mk(`ताशी ${mr(v)} किमी वेगाने ${fmt(t)} तासांत किती अंतर कापले जाईल?`, d,
    numDistractors(r, d, { step: 10, min: 5, extra: [v + t] }), `अंतर = वेग × वेळ = ${mr(v)} × ${fmt(t)} = ${mr(d)} किमी.`, 'किमी');
});

// १२. किमी/तास → मी/से
T.push((r) => {
  const ms = ri(r, 1, 40);
  const kmh = (ms * 18) / 5;
  if (!Number.isInteger(kmh)) return null;
  if (r() < 0.5) return mk(`ताशी ${mr(kmh)} किमी वेग म्हणजे सेकंदाला किती मीटर?`, ms,
    numDistractors(r, ms, { step: 2, min: 1, extra: [Math.round((kmh * 18) / 5)] }), `किमी/तास × ५/१८ = मी/से; ${mr(kmh)} × ५/१८ = ${mr(ms)} मी/से.`, 'मी/से');
  return mk(`सेकंदाला ${mr(ms)} मीटर वेग म्हणजे ताशी किती किमी?`, kmh,
    numDistractors(r, kmh, { step: 4, min: 1 }), `मी/से × १८/५ = किमी/तास; ${mr(ms)} × १८/५ = ${mr(kmh)} किमी/तास.`, 'किमी/तास');
});

// १३. आगगाडी
T.push((r) => {
  const kmh = pick(r, [36, 45, 54, 60, 72, 90, 108]);
  const ms = (kmh * 5) / 18;
  if (!Number.isInteger(ms)) return null;
  const len = ri(r, 4, 30) * 10;
  const plat = r() < 0.5 ? 0 : ri(r, 5, 40) * 10;
  const tot = len + plat;
  if (tot % ms) return null;
  const t = tot / ms;
  return mk(plat
    ? `${mr(len)} मीटर लांबीची आगगाडी ताशी ${mr(kmh)} किमी वेगाने ${mr(plat)} मीटर लांबीचा फलाट किती सेकंदांत ओलांडेल?`
    : `${mr(len)} मीटर लांबीची आगगाडी ताशी ${mr(kmh)} किमी वेगाने एक खांब किती सेकंदांत ओलांडेल?`, t,
  numDistractors(r, t, { step: 2, min: 1, extra: plat ? [len / ms] : [] }),
  `${mr(kmh)} किमी/तास = ${mr(ms)} मी/से; ${plat ? `एकूण अंतर = ${mr(len)} + ${mr(plat)} = ${mr(tot)} मी; ` : ''}वेळ = ${mr(tot)} ÷ ${mr(ms)} = ${mr(t)} सेकंद.`, 'सेकंद');
});

// १४. सरासरी
T.push((r) => {
  const n = ri(r, 4, 7);
  const avg = ri(r, 10, 90);
  const nums = Array.from({ length: n - 1 }, () => avg + ri(r, -9, 9));
  const last = avg * n - nums.reduce((a, b) => a + b, 0);
  if (last <= 0) return null;
  const all = shuffle(r, [...nums, last]);
  return mk(`${all.map(mr).join(', ')} यांची सरासरी किती?`, avg,
    numDistractors(r, avg, { step: 1, extra: [avg + 1, avg - 2] }), `बेरीज ${mr(avg * n)} ÷ ${mr(n)} = ${mr(avg)}.`);
});

// १५. सरासरीत नवी संख्या
T.push((r) => {
  const n = ri(r, 5, 30);
  const a = ri(r, 20, 60);
  const add = ri(r, 1, 5);
  const newAvg = a + add;
  const x = newAvg * (n + 1) - a * n;
  return mk(`${mr(n)} विद्यार्थ्यांचे सरासरी वय ${mr(a)} वर्षे आहे. शिक्षकाचे वय मिळवल्यास सरासरी ${mr(add)} ने वाढते. तर शिक्षकाचे वय किती?`, x,
    numDistractors(r, x, { step: 3, extra: [a + add * n, newAvg] }),
    `नवी बेरीज = ${mr(newAvg)} × ${mr(n + 1)} = ${mr(newAvg * (n + 1))}; जुनी बेरीज = ${mr(a)} × ${mr(n)} = ${mr(a * n)}; शिक्षकाचे वय = ${mr(x)} वर्षे.`, 'वर्षे');
});

// १६. गुणोत्तर विभागणी
T.push((r) => {
  const a = ri(r, 1, 9);
  const b = ri(r, 1, 9);
  if (a === b || gcd(a, b) !== 1) return null;
  const k = ri(r, 2, 60);
  const tot = (a + b) * k;
  const big = r() < 0.5;
  const ans = (big ? Math.max(a, b) : Math.min(a, b)) * k;
  return mk(`${mr(tot)} रुपये ${mr(a)} : ${mr(b)} या प्रमाणात दोघांत वाटले, तर ${big ? 'मोठा' : 'लहान'} भाग किती?`, ans,
    numDistractors(r, ans, { extra: [(big ? Math.min(a, b) : Math.max(a, b)) * k, tot / 2] }),
    `एकूण भाग ${mr(a + b)}; एक भाग = ${mr(tot)} ÷ ${mr(a + b)} = ${mr(k)}; ${big ? 'मोठा' : 'लहान'} भाग = ${mr(ans / k)} × ${mr(k)} = ${mr(ans)} रु.`, 'रु.');
});

// १७. वय
T.push((r) => {
  const son = ri(r, 4, 20);
  const m = ri(r, 2, 5);
  const fa = son * m;
  if (r() < 0.5) {
    return mk(`वडिलांचे वय मुलाच्या वयाच्या ${mr(m)} पट आहे. दोघांच्या वयांची बेरीज ${mr(son + fa)} वर्षे आहे, तर मुलाचे वय किती?`, son,
      numDistractors(r, son, { step: 2, min: 1, extra: [fa] }),
      `मुलाचे वय x; x + ${mr(m)}x = ${mr(son + fa)}; ${mr(m + 1)}x = ${mr(son + fa)}; x = ${mr(son)} वर्षे.`, 'वर्षे');
  }
  const y = ri(r, 2, 10);
  return mk(`आज वडिलांचे वय ${mr(fa)} वर्षे व मुलाचे ${mr(son)} वर्षे आहे. ${mr(y)} वर्षांनी दोघांच्या वयांची बेरीज किती असेल?`, fa + son + 2 * y,
    numDistractors(r, fa + son + 2 * y, { step: 2, extra: [fa + son + y] }),
    `आजची बेरीज ${mr(fa + son)}; दोघांचेही वय ${mr(y)} ने वाढेल: ${mr(fa + son)} + ${mr(2 * y)} = ${mr(fa + son + 2 * y)} वर्षे.`, 'वर्षे');
});

// १८. लसावि / मसावि
T.push((r) => {
  const a = ri(r, 4, 60);
  const b = ri(r, 4, 60);
  if (a === b) return null;
  if (r() < 0.5) {
    const L = lcm(a, b);
    if (L > 900) return null;
    return mk(`${mr(a)} आणि ${mr(b)} यांचा लसावि किती?`, L, numDistractors(r, L, { extra: [a * b, gcd(a, b), L * 2].filter((x) => x !== L) }),
      `लसावि = (${mr(a)} × ${mr(b)}) ÷ मसावि ${mr(gcd(a, b))} = ${mr(L)}.`);
  }
  const g = ri(r, 2, 15);
  const x = g * ri(r, 2, 9);
  const y = g * ri(r, 2, 9);
  if (x === y) return null;
  const G = gcd(x, y);
  return mk(`${mr(x)} आणि ${mr(y)} यांचा मसावि किती?`, G, numDistractors(r, G, { step: 1, min: 1, extra: [G * 2, lcm(x, y)].filter((v) => v !== G) }),
    `${mr(x)} व ${mr(y)} या दोघांना पूर्ण भाग जाणारी सर्वात मोठी संख्या ${mr(G)} आहे.`);
});

// १९. वर्ग / वर्गमूळ / घन
T.push((r) => {
  const n = ri(r, 11, 40);
  const k = ri(r, 0, 2);
  if (k === 0) return mk(`${mr(n * n)} चे वर्गमूळ किती?`, n, numDistractors(r, n, { step: 1, min: 1 }), `${mr(n)} × ${mr(n)} = ${mr(n * n)}.`);
  if (k === 1) return mk(`${mr(n)} चा वर्ग किती?`, n * n, numDistractors(r, n * n, { step: n, extra: [n * 2, n * n + 1] }), `${mr(n)} × ${mr(n)} = ${mr(n * n)}.`);
  const c = ri(r, 2, 15);
  return mk(`${mr(c * c * c)} चे घनमूळ किती?`, c, numDistractors(r, c, { step: 1, min: 1 }), `${mr(c)} × ${mr(c)} × ${mr(c)} = ${mr(c * c * c)}.`);
});

// २०. सरळरूप (BODMAS)
T.push((r) => {
  const a = ri(r, 2, 30); const b = ri(r, 2, 12); const c = ri(r, 2, 12); const d = ri(r, 1, 20);
  const form = ri(r, 0, 3);
  let q; let ans; let e;
  if (form === 0) { ans = a + b * c - d; q = `${mr(a)} + ${mr(b)} × ${mr(c)} − ${mr(d)}`; e = `आधी गुणाकार: ${mr(b)} × ${mr(c)} = ${mr(b * c)}; ${mr(a)} + ${mr(b * c)} − ${mr(d)} = ${mr(ans)}.`; }
  else if (form === 1) { ans = (a + b) * c; q = `(${mr(a)} + ${mr(b)}) × ${mr(c)}`; e = `कंसातील आधी: ${mr(a + b)} × ${mr(c)} = ${mr(ans)}.`; }
  else if (form === 2) { const x = b * c; ans = a + x / b; q = `${mr(a)} + ${mr(x)} ÷ ${mr(b)}`; e = `आधी भागाकार: ${mr(x)} ÷ ${mr(b)} = ${mr(c)}; ${mr(a)} + ${mr(c)} = ${mr(ans)}.`; }
  else { ans = a * b - c * d; q = `${mr(a)} × ${mr(b)} − ${mr(c)} × ${mr(d)}`; e = `${mr(a * b)} − ${mr(c * d)} = ${mr(ans)}.`; }
  if (ans < 0) return null;
  const wrong = form === 0 ? (a + b) * c - d : form === 1 ? a + b * c : form === 2 ? (a + b * c) / b : a * (b - c) * d;
  return mk(`सरळरूप द्या: ${q} = ?`, ans, numDistractors(r, ans, { step: 3, extra: [wrong].filter((w) => Number.isInteger(w) && w >= 0) }), e);
});

// २१. अपूर्णांक बेरीज
T.push((r) => {
  const d1 = pick(r, [2, 3, 4, 5, 6, 8]); const d2 = pick(r, [2, 3, 4, 5, 6, 8, 10, 12]);
  const n1 = ri(r, 1, d1 - 1); const n2 = ri(r, 1, d2 - 1);
  const L = lcm(d1, d2);
  let num = n1 * (L / d1) + n2 * (L / d2); let den = L;
  const g = gcd(num, den); num /= g; den /= g;
  const f = (a, b) => (b === 1 ? mr(a) : `${mr(a)}/${mr(b)}`);
  const ans = f(num, den);
  const wrongs = [f(n1 + n2, d1 + d2), f(num + 1, den), f(n1 * n2, d1 * d2), f(num, den + 1)].filter((x) => x !== ans);
  const o = [...new Set(wrongs)].slice(0, 3);
  if (o.length < 3) return null;
  return { s: S, q: `${f(n1, d1)} + ${f(n2, d2)} = ?`, o: [ans, ...o], e: `छेद समान (${mr(L)}) करून: ${mr(n1 * (L / d1))}/${mr(L)} + ${mr(n2 * (L / d2))}/${mr(L)} = ${ans}.` };
});

// २२. क्षेत्रफळ / परिमिती
T.push((r) => {
  const k = ri(r, 0, 4);
  if (k === 0) { const l = ri(r, 5, 40); const b = ri(r, 3, l); return mk(`आयताची लांबी ${mr(l)} सेमी व रुंदी ${mr(b)} सेमी आहे, तर क्षेत्रफळ किती?`, l * b, numDistractors(r, l * b, { extra: [2 * (l + b)] }), `क्षेत्रफळ = लांबी × रुंदी = ${mr(l)} × ${mr(b)} = ${mr(l * b)} चौ.सेमी.`, 'चौ.सेमी'); }
  if (k === 1) { const l = ri(r, 5, 40); const b = ri(r, 3, l); return mk(`आयताची लांबी ${mr(l)} मी व रुंदी ${mr(b)} मी आहे, तर परिमिती किती?`, 2 * (l + b), numDistractors(r, 2 * (l + b), { step: 2, extra: [l * b, l + b] }), `परिमिती = २ × (लांबी + रुंदी) = २ × ${mr(l + b)} = ${mr(2 * (l + b))} मी.`, 'मी'); }
  if (k === 2) { const a = ri(r, 3, 30); return mk(`${mr(4 * a)} सेमी परिमिती असलेल्या चौरसाचे क्षेत्रफळ किती?`, a * a, numDistractors(r, a * a, { extra: [4 * a, 16 * a] }), `बाजू = ${mr(4 * a)} ÷ ४ = ${mr(a)}; क्षेत्रफळ = ${mr(a)}² = ${mr(a * a)} चौ.सेमी.`, 'चौ.सेमी'); }
  if (k === 3) { const rr = 7 * ri(r, 1, 6); const area = (22 / 7) * rr * rr; return mk(`${mr(rr)} सेमी त्रिज्या असलेल्या वर्तुळाचे क्षेत्रफळ किती? (π = २२/७)`, area, numDistractors(r, area, { extra: [2 * (22 / 7) * rr] }), `क्षेत्रफळ = πr² = २२/७ × ${mr(rr)} × ${mr(rr)} = ${mr(area)} चौ.सेमी.`, 'चौ.सेमी'); }
  const rr = 7 * ri(r, 1, 8); const c = 2 * (22 / 7) * rr;
  return mk(`${mr(rr)} सेमी त्रिज्या असलेल्या वर्तुळाचा परीघ किती? (π = २२/७)`, c, numDistractors(r, c, { extra: [(22 / 7) * rr * rr, (22 / 7) * rr] }), `परीघ = २πr = २ × २२/७ × ${mr(rr)} = ${mr(c)} सेमी.`, 'सेमी');
});

// २३. त्रिकोण क्षेत्रफळ / घनफळ
T.push((r) => {
  const k = ri(r, 0, 2);
  if (k === 0) { const b = 2 * ri(r, 2, 20); const h = ri(r, 3, 25); const A = (b * h) / 2; return mk(`त्रिकोणाचा पाया ${mr(b)} सेमी व उंची ${mr(h)} सेमी असल्यास क्षेत्रफळ किती?`, A, numDistractors(r, A, { extra: [b * h] }), `क्षेत्रफळ = ½ × पाया × उंची = ½ × ${mr(b)} × ${mr(h)} = ${mr(A)} चौ.सेमी.`, 'चौ.सेमी'); }
  if (k === 1) { const a = ri(r, 2, 15); return mk(`${mr(a)} सेमी बाजू असलेल्या घनाचे घनफळ किती?`, a ** 3, numDistractors(r, a ** 3, { extra: [6 * a * a, a * a] }), `घनफळ = बाजू³ = ${mr(a)}³ = ${mr(a ** 3)} घ.सेमी.`, 'घ.सेमी'); }
  const l = ri(r, 3, 20); const b = ri(r, 2, 12); const h = ri(r, 2, 10);
  return mk(`लांबी ${mr(l)} सेमी, रुंदी ${mr(b)} सेमी व उंची ${mr(h)} सेमी असलेल्या इष्टिकाचितीचे घनफळ किती?`, l * b * h, numDistractors(r, l * b * h, { extra: [2 * (l * b + b * h + h * l)] }), `घनफळ = ${mr(l)} × ${mr(b)} × ${mr(h)} = ${mr(l * b * h)} घ.सेमी.`, 'घ.सेमी');
});

// २४. एकक पद्धत
T.push((r) => {
  const items = [['पेन', 'पेनांची'], ['वह्या', 'वह्यांची'], ['केळी', 'केळ्यांची'], ['पुस्तके', 'पुस्तकांची'], ['खुर्च्या', 'खुर्च्यांची']];
  const [it, gen] = pick(r, items);
  const p = ri(r, 3, 60);
  const n1 = ri(r, 2, 12); const n2 = ri(r, 2, 20);
  if (n1 === n2) return null;
  return mk(`${mr(n1)} ${it} ${rs(n1 * p)} ला मिळतात, तर ${mr(n2)} ${gen} किंमत किती?`, n2 * p, numDistractors(r, n2 * p, { step: p, extra: [n1 * p + n2] }),
    `एकाची किंमत = ${mr(n1 * p)} ÷ ${mr(n1)} = ${mr(p)} रु.; ${mr(n2)} × ${mr(p)} = ${mr(n2 * p)} रु.`, 'रु.');
});

// २५. नळ व टाकी
T.push((r) => {
  const pairs = [[10, 15], [12, 24], [20, 30], [6, 12], [15, 30], [10, 40], [12, 36], [18, 36], [20, 60], [24, 40], [30, 60], [8, 24], [9, 18]];
  const [a, b] = pick(r, pairs);
  if (r() < 0.5) {
    const t = (a * b) / (a + b);
    return mk(`एक नळ टाकी ${mr(a)} तासांत व दुसरा नळ ${mr(b)} तासांत भरतो. दोन्ही नळ एकाच वेळी सुरू केल्यास टाकी किती तासांत भरेल?`, t, numDistractors(r, t, { step: 2, min: 1, extra: [(a + b) / 2] }),
      `एका तासात = १/${mr(a)} + १/${mr(b)}; वेळ = ${mr(a * b)} ÷ ${mr(a + b)} = ${mr(t)} तास.`, 'तास');
  }
  const t = (a * b) / (b - a);
  if (!Number.isInteger(t)) return null;
  return mk(`एक नळ टाकी ${mr(a)} तासांत भरतो व दुसरा नळ भरलेली टाकी ${mr(b)} तासांत रिकामी करतो. दोन्ही सुरू ठेवल्यास रिकामी टाकी किती तासांत भरेल?`, t, numDistractors(r, t, { step: 3, min: 1, extra: [(a * b) / (a + b)] }),
    `एका तासात भरते = १/${mr(a)} − १/${mr(b)} = ${mr(b - a)}/${mr(a * b)}; वेळ = ${mr(t)} तास.`, 'तास');
});

// २६. गुण टक्केवारी
T.push((r) => {
  const tot = pick(r, [50, 80, 100, 150, 200, 250, 300, 400, 500, 600, 800]);
  const p = pick(r, [40, 45, 50, 55, 60, 64, 65, 70, 72, 75, 80, 85, 90, 95]);
  const got = (tot * p) / 100;
  if (!Number.isInteger(got)) return null;
  return mk(`एका विद्यार्थ्याला ${mr(tot)} पैकी ${mr(got)} गुण मिळाले, तर त्याला किती टक्के गुण मिळाले?`, p, numDistractors(r, p, { step: 5, min: 1 }),
    `${mr(got)} ÷ ${mr(tot)} × १०० = ${mr(p)}%.`, '%');
});

// २७. भागीदारी
T.push((r) => {
  const a = ri(r, 1, 9) * 1000; const b = ri(r, 1, 9) * 1000;
  if (a === b) return null;
  const g = gcd(a, b);
  const pa = a / g; const pb = b / g;
  const k = ri(r, 1, 20) * 100;
  const P = (pa + pb) * k;
  return mk(`अ ने ${rs(a)} व ब ने ${rs(b)} गुंतवून व्यवसाय केला. वर्षअखेरीस ${rs(P)} नफा झाला, तर अ चा वाटा किती?`, pa * k, numDistractors(r, pa * k, { extra: [pb * k, P / 2] }),
    `गुंतवणुकीचे प्रमाण ${mr(pa)} : ${mr(pb)}; अ चा वाटा = ${mr(P)} × ${mr(pa)}/${mr(pa + pb)} = ${mr(pa * k)} रु.`, 'रु.');
});

// २८. स्थानिक किंमत / दर्शनी किंमत
T.push((r) => {
  const n = ri(r, 10000, 99999);
  const s = String(n);
  const pos = ri(r, 0, 4);
  const d = Number(s[pos]);
  if (d === 0) return null;
  const place = 10 ** (4 - pos);
  const names = ['दशहजार', 'हजार', 'शतक', 'दशक', 'एकक'];
  if (r() < 0.6) {
    return mk(`${mr(n)} या संख्येत ${names[pos]} स्थानी असलेल्या ${mr(d)} ची स्थानिक किंमत किती?`, d * place,
      [...new Set([d, d * place * 10, place, d * place * 100, (d * place) / 10])].filter((x) => Number.isInteger(x) && x !== d * place).slice(0, 3),
      `${names[pos]} स्थानी असल्याने ${mr(d)} × ${mr(place)} = ${mr(d * place)}. (दर्शनी किंमत ${mr(d)} च राहते.)`);
  }
  return null;
});

// २९. भागाकार बाकी
T.push((r) => {
  const dv = ri(r, 3, 19); const qt = ri(r, 10, 99); const rem = ri(r, 0, dv - 1);
  const n = dv * qt + rem;
  return mk(`${mr(n)} ला ${mr(dv)} ने भागल्यास बाकी किती उरते?`, rem, numDistractors(r, rem, { step: 1, min: 0, extra: [dv - rem, rem + 1].filter((x) => x < dv) }),
    `${mr(dv)} × ${mr(qt)} = ${mr(dv * qt)}; ${mr(n)} − ${mr(dv * qt)} = ${mr(rem)}.`);
});

// ३०. क्रमागत संख्यांची बेरीज
T.push((r) => {
  const n = pick(r, [10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100]);
  const k = ri(r, 0, 1);
  if (k === 0) return mk(`१ ते ${mr(n)} पर्यंतच्या सर्व नैसर्गिक संख्यांची बेरीज किती?`, (n * (n + 1)) / 2, numDistractors(r, (n * (n + 1)) / 2, { extra: [n * n, (n * (n - 1)) / 2] }), `बेरीज = n(n+१)/२ = ${mr(n)} × ${mr(n + 1)} ÷ २ = ${mr((n * (n + 1)) / 2)}.`);
  return mk(`पहिल्या ${mr(n)} विषम संख्यांची बेरीज किती?`, n * n, numDistractors(r, n * n, { extra: [(n * (n + 1)) / 2, n * (n + 1)] }), `पहिल्या n विषम संख्यांची बेरीज = n² = ${mr(n)}² = ${mr(n * n)}.`);
});

// ३१. लागोपाठ सूट
T.push((r) => {
  const d1 = pick(r, [10, 20, 25, 30]); const d2 = pick(r, [10, 20, 25]);
  const eff = d1 + d2 - (d1 * d2) / 100;
  if (!Number.isInteger(eff * 10)) return null;
  return mk(`${mr(d1)}% व त्यानंतर ${mr(d2)}% अशा लागोपाठ दोन सुटी म्हणजे एकूण किती टक्के सूट?`, eff, numDistractors(r, eff, { step: 2, integer: false, extra: [d1 + d2] }),
    `एकूण सूट = ${mr(d1)} + ${mr(d2)} − (${mr(d1)} × ${mr(d2)})/१०० = ${fmt(eff)}%.`, '%');
});

// ३२. विभाज्यता
T.push((r) => {
  const by = pick(r, [3, 4, 6, 8, 9, 11]);
  const good = by * ri(r, 1000, 9999);
  const bads = [];
  while (bads.length < 3) { const x = ri(r, 10000, 99999); if (x % by && !bads.includes(x)) bads.push(x); }
  const rule = { 3: 'अंकांची बेरीज ३ ने विभाज्य', 4: 'शेवटच्या दोन अंकांची संख्या ४ ने विभाज्य', 6: '२ व ३ दोन्हीने विभाज्य', 8: 'शेवटच्या तीन अंकांची संख्या ८ ने विभाज्य', 9: 'अंकांची बेरीज ९ ने विभाज्य', 11: 'विषम व सम स्थानांवरील अंकांच्या बेरजेचा फरक ० किंवा ११ च्या पटीत' }[by];
  return { s: S, q: `खालीलपैकी कोणत्या संख्येला ${mr(by)} ने नि:शेष भाग जातो?`, o: [mr(good), ...bads.map(mr)], e: `नियम: ${rule}. ${mr(good)} = ${mr(by)} × ${mr(good / by)}.` };
});

// ३३. घड्याळी वेळ/कालावधी
T.push((r) => {
  const h1 = ri(r, 6, 11); const m1 = pick(r, [0, 10, 15, 20, 30, 40, 45]);
  const dur = ri(r, 35, 400);
  const tot = h1 * 60 + m1 + dur;
  const h2 = Math.floor(tot / 60); const m2 = tot % 60;
  const t = (h, m) => `${mr(h > 12 ? h - 12 : h)}:${mr(String(m).padStart(2, '0'))}`;
  const ans = t(h2, m2);
  const o = [...new Set([t(h2, (m2 + 10) % 60), t(h2 + 1, m2), t(h2 - 1 || 12, m2), t(h2, (m2 + 50) % 60)])].filter((x) => x !== ans).slice(0, 3);
  if (o.length < 3) return null;
  return { s: S, q: `एक बस सकाळी ${t(h1, m1)} वाजता सुटली व ${mr(Math.floor(dur / 60))} तास ${mr(dur % 60)} मिनिटांनी पोहोचली. ती किती वाजता पोहोचली?`, o: [ans, ...o], e: `${t(h1, m1)} + ${mr(Math.floor(dur / 60))} तास ${mr(dur % 60)} मिनिटे = ${ans}.` };
});

// ३४. एकक रूपांतर
T.push((r) => {
  const k = ri(r, 0, 3);
  if (k === 0) { const x = ri(r, 2, 90) / pick(r, [1, 2, 4]); if (!Number.isInteger(x * 1000)) return null; return mk(`${fmt(x)} किलोमीटर म्हणजे किती मीटर?`, x * 1000, numDistractors(r, x * 1000, { extra: [x * 100, x * 10000] }), `१ किमी = १००० मी; ${fmt(x)} × १००० = ${fmt(x * 1000)} मी.`, 'मी'); }
  if (k === 1) { const h = ri(r, 1, 9); const m = pick(r, [15, 20, 30, 45]); return mk(`${mr(h)} तास ${mr(m)} मिनिटे म्हणजे किती मिनिटे?`, h * 60 + m, numDistractors(r, h * 60 + m, { step: 10, extra: [h * 100 + m] }), `${mr(h)} × ६० + ${mr(m)} = ${mr(h * 60 + m)} मिनिटे.`, 'मिनिटे'); }
  if (k === 2) { const kg = ri(r, 2, 40) / pick(r, [1, 2, 4]); return mk(`${fmt(kg)} किलोग्रॅम म्हणजे किती ग्रॅम?`, kg * 1000, numDistractors(r, kg * 1000, { extra: [kg * 100] }), `१ किग्रॅ = १००० ग्रॅम; ${fmt(kg * 1000)} ग्रॅम.`, 'ग्रॅम'); }
  const l = ri(r, 2, 50) / 2; return mk(`${fmt(l)} लीटर म्हणजे किती मिलिलीटर?`, l * 1000, numDistractors(r, l * 1000, { extra: [l * 100] }), `१ लीटर = १००० मिली; ${fmt(l * 1000)} मिली.`, 'मिली');
});


// ३५. बेरीज व फरक
T.push((r) => {
  const a = ri(r, 20, 200); const b = ri(r, 5, a - 1);
  return mk(`दोन संख्यांची बेरीज ${mr(a + b)} व फरक ${mr(a - b)} आहे, तर मोठी संख्या कोणती?`, a, numDistractors(r, a, { step: 3, extra: [b, (a + b) / 2] }), `मोठी संख्या = (बेरीज + फरक) ÷ २ = (${mr(a + b)} + ${mr(a - b)}) ÷ २ = ${mr(a)}.`);
});
// ३६. क्रमागत संख्या
T.push((r) => {
  const n = ri(r, 5, 300); const k = pick(r, [3, 4, 5]);
  const sum = Array.from({ length: k }, (_, i) => n + i).reduce((x, y) => x + y, 0);
  return mk(`${mr(k)} क्रमागत नैसर्गिक संख्यांची बेरीज ${mr(sum)} आहे, तर त्यांपैकी सर्वात मोठी संख्या कोणती?`, n + k - 1, numDistractors(r, n + k - 1, { step: 1, extra: [n] }), `संख्या: ${Array.from({ length: k }, (_, i) => mr(n + i)).join(', ')}; सर्वात मोठी ${mr(n + k - 1)}.`);
});
// ३७. सरासरी वेग
T.push((r) => {
  const pairs = [[40, 60], [30, 60], [20, 30], [60, 90], [36, 45], [40, 120], [30, 70], [45, 90], [48, 72], [60, 40]];
  const [x, y] = pick(r, pairs);
  const v = (2 * x * y) / (x + y);
  if (!Number.isInteger(v)) return null;
  return mk(`एक व्यक्ती ताशी ${mr(x)} किमी वेगाने एका ठिकाणी जाते व ताशी ${mr(y)} किमी वेगाने परत येते. संपूर्ण प्रवासाचा सरासरी वेग किती?`, v, numDistractors(r, v, { step: 2, extra: [(x + y) / 2] }), `समान अंतरासाठी सरासरी वेग = २xy/(x+y) = २ × ${mr(x)} × ${mr(y)} ÷ ${mr(x + y)} = ${mr(v)} किमी/तास.`, 'किमी/तास');
});
// ३८. नाव व प्रवाह
T.push((r) => {
  const b = ri(r, 6, 30); const c = ri(r, 1, b - 2);
  if (r() < 0.5) return mk(`एका नावेचा प्रवाहाच्या दिशेने वेग ताशी ${mr(b + c)} किमी व प्रवाहाविरुद्ध ताशी ${mr(b - c)} किमी आहे. स्थिर पाण्यातील नावेचा वेग किती?`, b, numDistractors(r, b, { step: 1, min: 1, extra: [c] }), `स्थिर पाण्यातील वेग = (${mr(b + c)} + ${mr(b - c)}) ÷ २ = ${mr(b)} किमी/तास.`, 'किमी/तास');
  return mk(`एका नावेचा प्रवाहाच्या दिशेने वेग ताशी ${mr(b + c)} किमी व प्रवाहाविरुद्ध ताशी ${mr(b - c)} किमी आहे. प्रवाहाचा वेग किती?`, c, numDistractors(r, c, { step: 1, min: 1, extra: [b] }), `प्रवाहाचा वेग = (${mr(b + c)} − ${mr(b - c)}) ÷ २ = ${mr(c)} किमी/तास.`, 'किमी/तास');
});
// ३९. टक्क्याचे टक्के
T.push((r) => {
  const p = pick(r, [10, 20, 25, 50]); const q = pick(r, [10, 20, 40, 50]); const n = ri(r, 1, 40) * 100;
  const ans = (n * p * q) / 10000;
  if (!Number.isInteger(ans)) return null;
  return mk(`${mr(n)} च्या ${mr(q)}% चे ${mr(p)}% किती?`, ans, numDistractors(r, ans, { extra: [(n * (p + q)) / 100] }), `${mr(n)} × ${mr(q)}/१०० = ${mr((n * q) / 100)}; त्याचे ${mr(p)}% = ${mr(ans)}.`);
});
// ४०. आधी वाढ मग तेवढीच घट
T.push((r) => {
  const p = pick(r, [10, 20, 30, 40, 50]);
  const net = (p * p) / 100;
  return mk(`एका वस्तूची किंमत आधी ${mr(p)}% वाढवली व नंतर ${mr(p)}% कमी केली. मूळ किमतीच्या तुलनेत एकूण किती टक्के घट झाली?`, net, numDistractors(r, net, { step: 1, integer: false, extra: [0, p / 2].filter((x) => x !== net) }), `निव्वळ बदल = −(p²/१००) = −(${mr(p)}²/१००) = ${fmt(net)}% घट.`, '%');
});
// ४१. सोपे समीकरण
T.push((r) => {
  const a = ri(r, 2, 9); const x = ri(r, 2, 30); const b = ri(r, 1, 40);
  return mk(`${mr(a)}x + ${mr(b)} = ${mr(a * x + b)} असल्यास x ची किंमत किती?`, x, numDistractors(r, x, { step: 1, min: 1, extra: [x + b] }), `${mr(a)}x = ${mr(a * x + b)} − ${mr(b)} = ${mr(a * x)}; x = ${mr(a * x)} ÷ ${mr(a)} = ${mr(x)}.`);
});
// ४२. गुणोत्तर साखळी
T.push((r) => {
  const a = ri(r, 1, 9); const b = ri(r, 1, 9); const c = ri(r, 1, 9);
  if (gcd(a, b) !== 1 || gcd(b, c) !== 1 || a === b || b === c) return null;
  const A = a * b; const C = b * c;
  const g = gcd(a * b, b * c);
  const ans = `${mr(A / g)} : ${mr(C / g)}`;
  const o = [...new Set([`${mr(a)} : ${mr(c)}`, `${mr(C / g)} : ${mr(A / g)}`, `${mr(a)} : ${mr(b * c)}`, `${mr(a * c)} : ${mr(b)}`])].filter((x) => x !== ans).slice(0, 3);
  if (o.length < 3) return null;
  return { s: S, q: `अ : ब = ${mr(a)} : ${mr(b)} आणि ब : क = ${mr(b)} : ${mr(c)} असल्यास अ : क किती?`, o: [ans, ...o], e: `अ : क = ${mr(a)} : ${mr(c)} (ब दोन्हीकडे समान असल्याने) = ${ans}.` };
});

export function genGanit(target = 2000) {
  const r = rng('ganit-v1');
  const out = [];
  const keys = new Set();
  const per = Math.ceil(target / T.length) + 5;
  for (const t of T) {
    let made = 0; let tries = 0;
    while (made < per && tries++ < per * 40) {
      const x = t(r);
      if (!x) continue;
      const key = x.q + '|' + x.o[0];
      if (keys.has(x.q) || new Set(x.o).size !== 4) continue;
      keys.add(x.q); keys.add(key);
      out.push(x); made++;
    }
  }
  return out;
}

// एका क्रमांकावरून नेहमी तोच प्रश्न (ॲपमध्ये मागणीनुसार तयार करण्यासाठी)
export const GANIT_TEMPLATES = () => T.length;
export function ganitAt(i) {
  const x = T[i % T.length](rng(`ganit:${i}`));
  return x && new Set(x.o).size === 4 ? x : null;
}
