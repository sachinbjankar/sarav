// बुद्धिमत्ता चाचणी: उत्तरे कोडने मोजलेली.
import { mr, rng, ri, pick, shuffle, numDistractors } from './engine.js';

const S = 'buddhimatta';
const AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WD = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const MON = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const DIRS = ['उत्तर', 'पूर्व', 'दक्षिण', 'पश्चिम'];

const nq = (q, ans, dis, e) => ({ s: S, q, o: [mr(ans), ...dis.map(mr)], e });
const T = [];

// १. संख्या मालिका (विविध नियम)
T.push((r) => {
  const k = ri(r, 0, 9);
  let seq; let next; let rule;
  const a = ri(r, 1, 20); const d = ri(r, 2, 15);
  if (k === 0) { seq = [0, 1, 2, 3, 4].map((i) => a + i * d); next = a + 5 * d; rule = `प्रत्येक पदात ${mr(d)} मिळवले आहेत`; }
  else if (k === 1) { const m = ri(r, 2, 4); const b = ri(r, 1, 6); seq = [b]; for (let i = 0; i < 4; i++) seq.push(seq[i] * m); next = seq[4] * m; rule = `प्रत्येक पद आधीच्या पदाच्या ${mr(m)} पट आहे`; }
  else if (k === 2) { const s0 = ri(r, 1, 9); seq = [0, 1, 2, 3, 4].map((i) => (s0 + i) ** 2); next = (s0 + 5) ** 2; rule = `क्रमागत संख्यांचे वर्ग: ${mr(s0)}², ${mr(s0 + 1)}², …`; }
  else if (k === 3) { const s0 = ri(r, 1, 6); seq = [0, 1, 2, 3, 4].map((i) => (s0 + i) ** 3); next = (s0 + 5) ** 3; rule = `क्रमागत संख्यांचे घन: ${mr(s0)}³, ${mr(s0 + 1)}³, …`; }
  else if (k === 4) { const st = ri(r, 1, 5); seq = [a]; for (let i = 0; i < 4; i++) seq.push(seq[i] + st * (i + 1)); next = seq[4] + st * 5; rule = `फरक ${[1, 2, 3, 4, 5].map((i) => mr(st * i)).join(', ')} असा वाढतो`; }
  else if (k === 5) { const m = ri(r, 2, 3); const c = ri(r, 1, 3); seq = [ri(r, 1, 5)]; for (let i = 0; i < 4; i++) seq.push(seq[i] * m + c); next = seq[4] * m + c; rule = `प्रत्येक पद = आधीचे पद × ${mr(m)} + ${mr(c)}`; }
  else if (k === 6) { const s0 = ri(r, 1, 8); seq = [0, 1, 2, 3, 4].map((i) => (s0 + i) ** 2 + 1); next = (s0 + 5) ** 2 + 1; rule = `n² + १: ${mr(s0)}² + १, ${mr(s0 + 1)}² + १, …`; }
  else if (k === 7) { const x = ri(r, 1, 5); const y = ri(r, 1, 5); seq = [x, y]; for (let i = 0; i < 4; i++) seq.push(seq[i] + seq[i + 1]); next = seq[5] + seq[4]; seq = seq.slice(0, 6); rule = 'प्रत्येक पद आधीच्या दोन पदांची बेरीज आहे'; }
  else if (k === 8) { const big = ri(r, 80, 200); seq = [big]; for (let i = 0; i < 4; i++) seq.push(seq[i] - d * (i + 1)); next = seq[4] - d * 5; rule = `फरक ${[1, 2, 3, 4, 5].map((i) => mr(d * i)).join(', ')} असा वाढत जातो (वजाबाकी)`; if (next < 0) return null; }
  else { const p = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61]; const st = ri(r, 0, 10); seq = p.slice(st, st + 5); next = p[st + 5]; rule = 'क्रमागत मूळ संख्या'; }
  if (next > 100000) return null;
  return nq(`मालिका पूर्ण करा: ${seq.map(mr).join(', ')}, ?`, next, numDistractors(r, next, { step: Math.max(1, Math.round(Math.abs(next - seq[seq.length - 1]) / 3)) }), `${rule}; म्हणून पुढील पद ${mr(next)}.`);
});

// २. अक्षर मालिका
T.push((r) => {
  const st = ri(r, 0, 10); const k = ri(r, 1, 4); const back = r() < 0.3;
  const idx = [0, 1, 2, 3, 4].map((i) => (back ? 25 - st - i * k : st + i * k));
  if (idx.some((i) => i < 0 || i > 25)) return null;
  const seq = idx.slice(0, 4).map((i) => AB[i]);
  const ans = AB[idx[4]];
  const wrong = [idx[4] + 1, idx[4] - 1, idx[4] + (back ? -k : k)].filter((i) => i >= 0 && i <= 25 && i !== idx[4]).map((i) => AB[i]);
  const o = [...new Set(wrong)];
  while (o.length < 3) { const c = AB[ri(r, 0, 25)]; if (c !== ans && !o.includes(c)) o.push(c); }
  return { s: S, q: `अक्षरमालिका पूर्ण करा: ${seq.join(', ')}, ?`, o: [ans, ...o.slice(0, 3)], e: `${back ? 'उलट्या क्रमाने' : 'वर्णमालेत'} प्रत्येक वेळी ${mr(k)} स्थाने ${back ? 'मागे' : 'पुढे'} जाते; म्हणून ${ans}.` };
});

// ३. सांकेतिक भाषा (अक्षर सरकवणे)
const WORDS = ['BOOK', 'PEN', 'CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BIRD', 'FISH', 'LAMP', 'DESK', 'ROAD', 'RAIN', 'GOLD', 'MILK', 'SALT', 'KING', 'LION', 'BOAT', 'CAKE', 'FARM', 'HAND', 'JUMP', 'KITE', 'LAKE', 'NEST', 'PARK', 'ROSE', 'SHIP', 'TAXI', 'WIND', 'BELL', 'COIN', 'DRUM', 'FIRE', 'GATE', 'HILL', 'IRON', 'JOKE', 'MAP', 'NOTE', 'OPEN', 'PLAY', 'QUIZ', 'RICE', 'SEED', 'TIME', 'WALL', 'YARD'];
const shift = (w, k) => w.split('').map((c) => AB[(AB.indexOf(c) + k + 26) % 26]).join('');
T.push((r) => {
  const k = pick(r, [1, 2, 3, -1, -2]);
  const w1 = pick(r, WORDS); const w2 = pick(r, WORDS);
  if (w1 === w2) return null;
  const ans = shift(w2, k);
  const o = [...new Set([shift(w2, k + 1), shift(w2, -k), shift(w2, k).split('').reverse().join(''), shift(w2, k === 1 ? 2 : 1)])].filter((x) => x !== ans).slice(0, 3);
  if (o.length < 3) return null;
  return { s: S, q: `एका सांकेतिक भाषेत ${w1} हा शब्द ${shift(w1, k)} असा लिहितात, तर त्याच भाषेत ${w2} कसा लिहाल?`, o: [ans, ...o], e: `प्रत्येक अक्षर वर्णमालेत ${mr(Math.abs(k))} स्थान ${k > 0 ? 'पुढे' : 'मागे'} सरकवले आहे: ${w2} → ${ans}.` };
});

// ४. अक्षर-क्रमांक बेरीज
T.push((r) => {
  const w1 = pick(r, WORDS); const w2 = pick(r, WORDS);
  if (w1 === w2) return null;
  const sum = (w) => w.split('').reduce((a, c) => a + AB.indexOf(c) + 1, 0);
  const ans = sum(w2);
  return nq(`जर ${w1} = ${mr(sum(w1))} (अक्षरांच्या क्रमांकांची बेरीज), तर ${w2} = ?`, ans, numDistractors(r, ans, { step: 2, min: 3 }),
    `${w2.split('').map((c) => `${c}=${mr(AB.indexOf(c) + 1)}`).join(', ')}; बेरीज = ${mr(ans)}.`);
});

// ५. गटात न बसणारी संख्या
T.push((r) => {
  const k = ri(r, 0, 4);
  let good; let odd; let rule;
  if (k === 0) { const pr = shuffle(r, [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]).slice(0, 3); good = pr; odd = pick(r, [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93]); rule = `${mr(odd)} वगळता सर्व मूळ संख्या आहेत`; }
  else if (k === 1) { good = shuffle(r, [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196]).slice(0, 3); odd = pick(r, [18, 24, 32, 45, 50, 72, 90, 110, 125]); rule = `${mr(odd)} वगळता सर्व पूर्ण वर्ग संख्या आहेत`; }
  else if (k === 2) { const m = pick(r, [6, 7, 8, 9, 11, 12, 13]); good = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9].map((x) => x * m)).slice(0, 3); odd = m * ri(r, 3, 8) + ri(r, 1, m - 1); rule = `${mr(odd)} वगळता सर्व संख्या ${mr(m)} च्या पटीत आहेत`; }
  else if (k === 3) { good = shuffle(r, [8, 27, 64, 125, 216, 343, 512, 729]).slice(0, 3); odd = pick(r, [36, 81, 100, 144, 200, 256, 400]); rule = `${mr(odd)} वगळता सर्व घन संख्या आहेत`; }
  else { good = shuffle(r, [13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35]).slice(0, 3); odd = 2 * ri(r, 7, 18); rule = `${mr(odd)} वगळता सर्व विषम संख्या आहेत`; }
  if (good.includes(odd)) return null;
  return { s: S, q: `गटात न बसणारी संख्या ओळखा: ${shuffle(r, [...good, odd]).map(mr).join(', ')}`, o: [mr(odd), ...good.map(mr)], e: `${rule}.` };
});

// ६. दिशा
const PY = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [15, 20, 25], [7, 24, 25], [20, 21, 29]];
T.push((r) => {
  const k = ri(r, 0, 1);
  if (k === 0) {
    let dir = ri(r, 0, 3); const start = DIRS[dir];
    const turns = Array.from({ length: ri(r, 2, 4) }, () => (r() < 0.5 ? 'R' : 'L'));
    for (const t of turns) dir = (dir + (t === 'R' ? 1 : 3)) % 4;
    const words = turns.map((t) => (t === 'R' ? 'उजवीकडे' : 'डावीकडे')).join(', नंतर ');
    const ans = DIRS[dir];
    return { s: S, q: `एक व्यक्ती ${start}ेकडे तोंड करून उभी आहे. ती ${words} वळली. आता तिचे तोंड कोणत्या दिशेला आहे?`, o: [ans, ...DIRS.filter((x) => x !== ans)], e: `उजवीकडे वळणे = घड्याळाच्या दिशेने ९०°; डावीकडे = उलट ९०°. ${start} पासून सुरुवात करून शेवटी ${ans}.` };
  }
  const [a, b, c] = pick(r, PY);
  const m = ri(r, 1, 3);
  const n1 = pick(r, ['राहुल', 'सुमित', 'अमोल', 'किरण', 'संदीप']);
  const d1 = pick(r, ['उत्तरेकडे', 'पूर्वेकडे', 'दक्षिणेकडे', 'पश्चिमेकडे']);
  const perp = { 'उत्तरेकडे': 'पूर्वेकडे', 'पूर्वेकडे': 'दक्षिणेकडे', 'दक्षिणेकडे': 'पश्चिमेकडे', 'पश्चिमेकडे': 'उत्तरेकडे' }[d1];
  return nq(`${n1} घरातून ${d1} ${mr(a * m)} किमी चालत गेला, नंतर ${perp} ${mr(b * m)} किमी गेला. आता तो घरापासून सरळ रेषेत किती किमी दूर आहे?`, c * m,
    [(a + b) * m, (b - a) * m || (c + 1) * m, (c + 2) * m].filter((x) => x !== c * m).slice(0, 3),
    `काटकोन त्रिकोण: √(${mr(a * m)}² + ${mr(b * m)}²) = ${mr(c * m)} किमी.`);
});

// ७. दिनदर्शिका: n दिवसांनी वार
T.push((r) => {
  const d = ri(r, 0, 6); const n = ri(r, 8, 400);
  const ans = WD[(d + n) % 7];
  return { s: S, q: `आज ${WD[d]} आहे, तर आजपासून ${mr(n)} दिवसांनी कोणता वार असेल?`, o: [ans, ...shuffle(r, WD.filter((x) => x !== ans)).slice(0, 3)], e: `${mr(n)} ÷ ७ ची बाकी ${mr(n % 7)}; ${WD[d]}पासून ${mr(n % 7)} दिवस पुढे = ${ans}.` };
});

// ८. दिनदर्शिका: तारखेचा वार (JS Date ने मोजलेला)
T.push((r) => {
  const y = ri(r, 2001, 2030); const m = ri(r, 0, 11); const dd = ri(r, 1, 28);
  const dt = new Date(Date.UTC(y, m, dd));
  const ans = WD[dt.getUTCDay()];
  const ref = new Date(Date.UTC(y, 0, 1));
  return { s: S, q: `${mr(dd)} ${MON[m]} ${mr(y)} रोजी कोणता वार होता/असेल? (संकेत: १ जानेवारी ${mr(y)} रोजी ${WD[ref.getUTCDay()]} होता/असेल.)`, o: [ans, ...shuffle(r, WD.filter((x) => x !== ans)).slice(0, 3)],
    e: `१ जानेवारीपासून ${mr(Math.round((dt - ref) / 86400000))} दिवस; ७ ने भागून बाकी ${mr(Math.round((dt - ref) / 86400000) % 7)}; म्हणून ${ans}.` };
});

// ९. घड्याळातील कोन
T.push((r) => {
  const h = ri(r, 1, 12); const m = pick(r, [0, 10, 15, 20, 30, 40, 45, 50]);
  let ang = Math.abs(30 * (h % 12) - 5.5 * m);
  if (ang > 180) ang = 360 - ang;
  const f = (x) => `${mr(x)}°`;
  const o = [...new Set([ang + 30, Math.abs(ang - 15), 360 - ang, ang + 15].filter((x) => x !== ang && x >= 0))].slice(0, 3);
  if (o.length < 3) return null;
  return { s: S, q: `घड्याळात ${mr(h)}:${mr(String(m).padStart(2, '0'))} वाजता तास काटा व मिनिट काटा यांच्यातील (लहान) कोन किती?`, o: [f(ang), ...o.map(f)], e: `कोन = |३० × तास − ५.५ × मिनिटे| = |${mr(30 * (h % 12))} − ${mr(5.5 * m)}| = ${f(ang)}.` };
});

// १०. रांगेतील क्रमांक
T.push((r) => {
  const f = ri(r, 3, 40); const b = ri(r, 3, 40);
  const n = pick(r, ['सुरेश', 'प्रिया', 'अमित', 'स्नेहा', 'रोहन']);
  if (r() < 0.6) return nq(`एका रांगेत ${n} पुढून ${mr(f)} वा/वी व मागून ${mr(b)} वा/वी आहे, तर रांगेत एकूण किती जण आहेत?`, f + b - 1, [f + b, f + b + 1, f + b - 2], `एकूण = ${mr(f)} + ${mr(b)} − १ = ${mr(f + b - 1)}.`);
  const tot = f + b - 1;
  return nq(`${mr(tot)} विद्यार्थ्यांच्या रांगेत ${n} पुढून ${mr(f)} वा/वी आहे, तर मागून तो/ती कितवा/कितवी?`, b, [b + 1, b - 1 || b + 2, tot - f], `मागून क्रमांक = ${mr(tot)} − ${mr(f)} + १ = ${mr(b)}.`);
});

// ११. संख्या संबंध (analogy)
T.push((r) => {
  const k = ri(r, 0, 3);
  const a = ri(r, 3, 15); const b = ri(r, 3, 15);
  if (a === b) return null;
  const fns = [[(x) => x * x, 'वर्ग'], [(x) => x ** 3, 'घन'], [(x) => x * x + 1, 'वर्ग + १'], [(x) => x * (x + 1), 'x × (x + १)']];
  const [fn, name] = fns[k];
  if (fn(a) > 4000 || fn(b) > 4000) return null;
  return nq(`${mr(a)} : ${mr(fn(a))} :: ${mr(b)} : ?`, fn(b), numDistractors(r, fn(b), { step: Math.max(2, b), extra: [fns[(k + 1) % 4][0](b)] }), `नियम: संख्येचा ${name}. ${mr(b)} → ${mr(fn(b))}.`);
});

// १२. चिन्ह बदल
T.push((r) => {
  const a = ri(r, 2, 20); const b = ri(r, 2, 9); const c = ri(r, 2, 9); const d = ri(r, 1, 15);
  const k = ri(r, 0, 1);
  let q; let ans; let e;
  if (k === 0) { ans = a * b + c - d; if (ans < 0) return null; q = `जर ‘+’ म्हणजे ‘×’, ‘−’ म्हणजे ‘+’ आणि ‘×’ म्हणजे ‘−’, तर ${mr(a)} + ${mr(b)} − ${mr(c)} × ${mr(d)} = ?`; e = `चिन्हे बदलून: ${mr(a)} × ${mr(b)} + ${mr(c)} − ${mr(d)} = ${mr(ans)}.`; }
  else { const x = b * c; ans = a + x / b - d; if (ans < 0) return null; q = `जर ‘×’ म्हणजे ‘+’, ‘÷’ म्हणजे ‘−’ आणि ‘+’ म्हणजे ‘÷’, तर ${mr(a)} × ${mr(x)} + ${mr(b)} ÷ ${mr(d)} = ?`; e = `चिन्हे बदलून: ${mr(a)} + ${mr(x)} ÷ ${mr(b)} − ${mr(d)} = ${mr(a)} + ${mr(c)} − ${mr(d)} = ${mr(ans)}.`; }
  return nq(q, ans, numDistractors(r, ans, { step: 3 }), e);
});

// १३. अंक मोजणी
T.push((r) => {
  const dgt = ri(r, 1, 9); const hi = pick(r, [50, 100, 200]);
  let c = 0; for (let i = 1; i <= hi; i++) c += String(i).split('').filter((x) => Number(x) === dgt).length;
  return nq(`१ ते ${mr(hi)} पर्यंतच्या संख्या लिहिताना ${mr(dgt)} हा अंक एकूण किती वेळा येतो?`, c, [c - 1, c + 1, c - 10 > 0 ? c - 10 : c + 10], `एकक स्थानी व दशक स्थानी येणारे ${mr(dgt)} मोजून एकूण ${mr(c)} वेळा.`);
});

// १४. वर्णमाला स्थान
T.push((r) => {
  const k = ri(r, 0, 2);
  if (k === 0) { const n = ri(r, 1, 26); const ans = AB[n - 1]; return { s: S, q: `इंग्रजी वर्णमालेतील डावीकडून ${mr(n)} वे अक्षर कोणते?`, o: [ans, ...shuffle(r, AB.split('').filter((x) => x !== ans && Math.abs(AB.indexOf(x) - (n - 1)) < 4)).slice(0, 3)], e: `A=१, B=२, … म्हणून ${mr(n)} वे अक्षर ${ans}.` }; }
  if (k === 1) { const n = ri(r, 1, 26); const ans = AB[26 - n]; return { s: S, q: `इंग्रजी वर्णमालेतील उजवीकडून ${mr(n)} वे अक्षर कोणते?`, o: [ans, ...shuffle(r, AB.split('').filter((x) => x !== ans && Math.abs(AB.indexOf(x) - (26 - n)) < 4)).slice(0, 3)], e: `उजवीकडून n वे = डावीकडून (२७ − n) वे = ${mr(27 - n)} वे = ${ans}.` }; }
  const c = ri(r, 0, 25); const ans = AB[25 - c];
  return { s: S, q: `वर्णमाला उलट्या क्रमाने (Z ते A) लिहिली तर ${AB[c]} च्या जागी कोणते अक्षर येईल?`, o: [ans, ...shuffle(r, AB.split('').filter((x) => x !== ans && x !== AB[c])).slice(0, 3)], e: `उलट जोडी: A↔Z, B↔Y, … म्हणून ${AB[c]} ↔ ${ans}.` };
});

// १५. गटात न बसणारी अक्षरजोडी
T.push((r) => {
  const g = ri(r, 1, 4);
  const starts = shuffle(r, [...Array(20).keys()]).slice(0, 4);
  const pairs = starts.slice(0, 3).map((s) => AB[s] + AB[s + g]);
  const bad = starts[3]; const bg = g + pick(r, [1, 2]);
  if (bad + bg > 25) return null;
  const odd = AB[bad] + AB[bad + bg];
  return { s: S, q: `गटात न बसणारा पर्याय ओळखा: ${shuffle(r, [...pairs, odd]).join(', ')}`, o: [odd, ...pairs], e: `इतर जोड्यांमध्ये दोन अक्षरांत ${mr(g - 1)} अक्षरांचे अंतर आहे; ${odd} मध्ये ${mr(bg - 1)} अक्षरांचे अंतर आहे.` };
});

// १६. वयाचे तर्क / वर्षे
T.push((r) => {
  const y = ri(r, 2001, 2030); const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const ans = leap ? 366 : 365;
  return nq(`${mr(y)} या वर्षात एकूण किती दिवस आहेत?`, ans, [leap ? 365 : 366, 364, 360], `${mr(y)} ${leap ? 'हे ४ ने विभाज्य असल्याने लीप वर्ष आहे' : 'लीप वर्ष नाही'}; म्हणून ${mr(ans)} दिवस.`);
});


// १७. शब्दकोश क्रम
const DICT = ['apple', 'apron', 'april', 'arrow', 'basket', 'banana', 'battle', 'bottle', 'candle', 'castle', 'cattle', 'circle', 'danger', 'dancer', 'doctor', 'dollar', 'eagle', 'earth', 'easy', 'empty', 'father', 'feather', 'fellow', 'finger', 'garden', 'garlic', 'gather', 'giant', 'hammer', 'happy', 'harbor', 'honey', 'island', 'income', 'insect', 'iron', 'jacket', 'jelly', 'jewel', 'jungle', 'kettle', 'kidney', 'kitten', 'knife', 'ladder', 'lemon', 'letter', 'lizard', 'market', 'marble', 'mirror', 'monkey', 'needle', 'nephew', 'number', 'nurse', 'orange', 'orbit', 'organ', 'oyster', 'paper', 'parrot', 'pencil', 'pepper', 'rabbit', 'radio', 'river', 'rocket', 'saddle', 'salad', 'silver', 'sister', 'table', 'tablet', 'teacher', 'tiger', 'valley', 'velvet', 'visit', 'voice', 'water', 'window', 'winter', 'wonder'];
T.push((r) => {
  const words = shuffle(r, DICT.filter((w) => w[0] === pick(r, DICT)[0])).slice(0, 4);
  if (words.length < 4) return null;
  const sorted = [...words].sort();
  const k = ri(r, 0, 1);
  const ans = k ? sorted[0] : sorted[3];
  return { s: S, q: `इंग्रजी शब्दकोशाच्या क्रमानुसार लावल्यास ${k ? 'पहिला' : 'शेवटचा'} शब्द कोणता? ${words.join(', ')}`, o: [ans, ...words.filter((w) => w !== ans)], e: `शब्दकोश क्रम: ${sorted.join(', ')}.` };
});
// १८. उलट्या क्रमाने अक्षर
T.push((r) => {
  const w = pick(r, WORDS.filter((x) => x.length >= 4));
  const rev = w.split('').reverse().join('');
  const k = ri(r, 1, w.length);
  const ans = rev[k - 1];
  const o = [...new Set(w.split('').filter((c) => c !== ans))].slice(0, 3);
  while (o.length < 3) { const c = AB[ri(r, 0, 25)]; if (c !== ans && !o.includes(c)) o.push(c); }
  return { s: S, q: `${w} या शब्दातील अक्षरे उलट्या क्रमाने लिहिल्यास डावीकडून ${mr(k)} वे अक्षर कोणते?`, o: [ans, ...o], e: `उलट क्रम: ${rev}; ${mr(k)} वे अक्षर ${ans}.` };
});
// १९. अक्षर → अंक सांकेतिक
T.push((r) => {
  const pool = 'ABCDEFGHI';
  const mk2 = () => Array.from({ length: 3 }, () => pool[ri(r, 0, 8)]).join('');
  const w1 = mk2(); const w2 = mk2();
  if (w1 === w2) return null;
  const code = (w) => w.split('').map((c) => pool.indexOf(c) + 1).join('');
  const ans = code(w2);
  const o = [...new Set([code(w2).split('').reverse().join(''), w2.split('').map((c) => pool.indexOf(c) + 2).join(''), w2.split('').map((c) => pool.indexOf(c)).join('')])].filter((x) => x !== ans).slice(0, 3);
  if (o.length < 3) return null;
  return { s: S, q: `एका सांकेतिक भाषेत ${w1} = ${mr(code(w1))} असे लिहितात, तर ${w2} = ?`, o: [mr(ans), ...o.map(mr)], e: `प्रत्येक अक्षराच्या जागी त्याचा वर्णमालेतील क्रमांक: ${w2} → ${mr(ans)}.` };
});
// २०. विसंगत जोडी
T.push((r) => {
  const k = ri(r, 0, 1);
  const base = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]).slice(0, 4);
  const fn = k ? (x) => x * x : (x) => x * x * x;
  const good = base.slice(0, 3).map((x) => `(${mr(x)}, ${mr(fn(x))})`);
  const bx = base[3]; const bad = `(${mr(bx)}, ${mr(fn(bx) + pick(r, [1, 2, -1]))})`;
  return { s: S, q: `गटात न बसणारी जोडी ओळखा: ${shuffle(r, [...good, bad]).join(', ')}`, o: [bad, ...good], e: `इतर जोड्यांत दुसरी संख्या पहिल्या संख्येचा ${k ? 'वर्ग' : 'घन'} आहे; ${bad} मध्ये तसे नाही.` };
});
// २१. दिवसांपूर्वी
T.push((r) => {
  const d = ri(r, 0, 6); const n = ri(r, 8, 200);
  const ans = WD[(((d - n) % 7) + 7) % 7];
  return { s: S, q: `आज ${WD[d]} आहे, तर ${mr(n)} दिवसांपूर्वी कोणता वार होता?`, o: [ans, ...shuffle(r, WD.filter((x) => x !== ans)).slice(0, 3)], e: `${mr(n)} ÷ ७ ची बाकी ${mr(n % 7)}; ${WD[d]}पासून ${mr(n % 7)} दिवस मागे = ${ans}.` };
});

export function genBuddhi(target = 2000) {
  const r = rng('buddhi-v1');
  const out = [];
  const keys = new Set();
  const weights = [4, 2, 2, 1.5, 1.5, 1.5, 1, 1, 1, 1, 1, 1, 0.7, 1, 1, 0.2, 1, 1, 1, 0.8, 0.8];
  const tot = weights.reduce((a, b) => a + b, 0);
  T.forEach((t, i) => {
    const per = Math.round((target * weights[i]) / tot);
    let made = 0; let tries = 0;
    while (made < per && tries++ < per * 60) {
      const x = t(r);
      if (!x || keys.has(x.q) || new Set(x.o).size !== 4) continue;
      keys.add(x.q);
      out.push(x); made++;
    }
  });
  return out;
}

export function buddhiAt(i) {
  const x = T[i % T.length](rng(`buddhi:${i}`));
  return x && new Set(x.o).size === 4 ? x : null;
}
