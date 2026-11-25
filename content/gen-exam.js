// परीक्षा-स्वरूप प्रश्न (MPSC पद्धत), फोनवरच क्रमांकावरून तयार होतात:
//  • दोन विधाने (स्तर २)  • कोणत्या जोड्या योग्य? (स्तर ३)  • जोड्या जुळवा (स्तर ३)  • कालक्रम लावा (स्तर ३)
import { rng, mr } from './engine.js';
import { ALL as IT } from './tables/itihas.js';
import { ALL as IT2 } from './tables/itihas2.js';
import { ALL as BH } from './tables/bhugol.js';
import { ALL as BH2 } from './tables/bhugol2.js';
import { ALL as RJ } from './tables/rajyaghatana.js';
import { ALL as AR } from './tables/arthashastra.js';
import { ALL as VI } from './tables/vidnyan.js';
import { ALL as MA } from './tables/marathi.js';
import { ALL as EN } from './tables/english.js';
import { ALL as GX } from './tables/gk-extra.js';
import { ALL as PV } from './tables/paryavaran.js';
import { ALL as SM } from './tables/samanya.js';
import { PANCH as PN, MAHSUL as MH } from './tables/hand2.js';
import { DEEP as DP } from './tables/deep.js';

const Y = (v) => mr(v);
const sp = (t, a, b, label, o = {}) => ({ t, a, b, label, ...o });

// विषयनिहाय तक्ते: {तक्ता, डावा स्तंभ, उजवा स्तंभ, शीर्षक, year: कालक्रमासाठी वर्ष-स्तंभ}
export const SPECS = {
  itihas: [
    sp(IT.ORG, 'org', 'who', 'संस्था — संस्थापक', { year: 'year' }),
    sp(IT.PAPER, 'paper', 'who', 'वृत्तपत्र — संस्थापक', { year: 'year' }),
    sp(IT.BOOK, 'book', 'who', 'ग्रंथ — लेखक'),
    sp(IT.EVENT, 'ev', 'year', 'घटना — वर्ष', { fb: Y, year: 'year' }),
    sp(IT.RULER, 'ev', 'who', 'घटना — गव्हर्नर जनरल/व्हाइसरॉय'),
    sp(IT.TITLE, 'title', 'who', 'उपाधी — व्यक्ती'),
    sp(IT.SLOGAN, 'slogan', 'who', 'घोषणा — व्यक्ती'),
    sp(IT.DYN, 'dyn', 'founder', 'राजवंश — संस्थापक'),
    sp(IT.DYN, 'dyn', 'cap', 'राजवंश — राजधानी'),
    sp(IT.ASHTA, 'post', 'work', 'अष्टप्रधान पद — कार्य'),
    sp(IT.PLACE, 'ev', 'place', 'घटना — ठिकाण'),
    sp(IT2.REFORM, 'who', 'work', 'समाजसुधारक — कार्य'),
    sp(IT2.SESSION, 'sess', 'pres', 'काँग्रेस अधिवेशन — अध्यक्ष'),
    sp(IT2.ACT, 'act', 'year', 'कायदा — वर्ष', { fb: Y, year: 'year' }),
    sp(IT2.ACT, 'act', 'prov', 'कायदा — तरतूद'),
    sp(IT2.REVO, 'ev', 'who', 'क्रांतिकारी घटना — व्यक्ती', { year: 'year' }),
    sp(IT2.SAINTW, 'who', 'work', 'संत — रचना/कार्य'),
    sp(IT2.WOMEN, 'who', 'known', 'व्यक्ती — कार्य'),
    sp(IT2.FIRST, 'what', 'who', 'प्रथम — व्यक्ती'),
    sp(IT2.BORN, 'who', 'b', 'व्यक्ती — जन्मवर्ष', { fb: Y, year: 'b', cl: 'जन्मवर्षानुसार' }),
    sp(IT2.SULTAN, 'who', 'known', 'शासक — वैशिष्ट्य'),
    sp(IT2.MARATHA, 'who', 'known', 'मराठा वीर — पराक्रम'),
  ],
  bhugol: [
    sp(BH.DIV, 'dist', 'div', 'जिल्हा — प्रशासकीय विभाग'),
    sp(BH.ORIGIN, 'river', 'origin', 'नदी — उगम'),
    sp(BH.TRIB, 'trib', 'main', 'उपनदी — मुख्य नदी'),
    sp(BH.DAM, 'dam', 'river', 'धरण — नदी'),
    sp(BH.DAM, 'dam', 'dist', 'धरण — जिल्हा'),
    sp(BH.PARK, 'park', 'dist', 'अभयारण्य/उद्यान — जिल्हा'),
    sp(BH.HILL, 'place', 'dist', 'थंड हवेचे ठिकाण — जिल्हा'),
    sp(BH.FORT, 'fort', 'dist', 'किल्ला — जिल्हा'),
    sp(BH.HOLY, 'place', 'dist', 'तीर्थक्षेत्र — जिल्हा'),
    sp(BH.CAVE, 'cave', 'dist', 'लेणी — जिल्हा'),
    sp(BH.FAME, 'city', 'what', 'शहर — प्रसिद्धी'),
    sp(BH.STATE, 'state', 'cap', 'राज्य — राजधानी'),
    sp(BH.NP, 'park', 'state', 'राष्ट्रीय उद्यान — राज्य'),
    sp(BH.COUNTRY, 'country', 'cap', 'देश — राजधानी'),
    sp(BH.COUNTRY, 'country', 'cur', 'देश — चलन'),
    sp(BH2.POWER, 'p', 'dist', 'वीज प्रकल्प — जिल्हा'),
    sp(BH2.PORT, 'port', 'st', 'बंदर — राज्य'),
    sp(BH2.CITYRIVER, 'city', 'river', 'शहर — नदी'),
    sp(BH2.MINE, 'place', 'what', 'ठिकाण — खनिज/उद्योग'),
    sp(BH2.STRAIT, 'st', 'joins', 'सामुद्रधुनी — जोडते'),
    sp(BH2.WRIVER, 'r', 'cont', 'नदी — खंड'),
    sp(BH2.DESERT, 'd', 'where', 'वाळवंट — प्रदेश'),
    sp(BH2.MOUNT, 'm', 'cont', 'पर्वत — खंड'),
    sp(BH2.WIND, 'w', 'what', 'स्थानिक वारे — स्वरूप'),
    sp(BH2.LAYER, 'l', 'what', 'वातावरणाचा थर — वैशिष्ट्य'),
    sp(BH2.ROCK, 'r', 'type', 'खडक — प्रकार'),
    sp(BH2.TRIBE, 't', 'where', 'जमात — प्रदेश'),
    sp(BH2.CROP, 'c', 'season', 'पीक — हंगाम'),
    sp(BH2.MHCROP, 'c', 'dist', 'पीक — जिल्हा'),
  ],
  rajyaghatana: [
    sp(RJ.ART, 'art', 'sub', 'कलम — विषय', { fa: (v) => `कलम ${mr(v)}` }),
    sp(RJ.SCHED, 'n', 'sub', 'अनुसूची — विषय', { fa: (v) => `${v} अनुसूची` }),
    sp(RJ.AMEND, 'n', 'sub', 'घटनादुरुस्ती — विषय', { fa: (v) => `${mr(v)}वी दुरुस्ती` }),
    sp(RJ.AMEND, 'n', 'year', 'घटनादुरुस्ती — वर्ष', { fa: (v) => `${mr(v)}वी दुरुस्ती`, fb: Y }),
    sp(RJ.SRC, 'feat', 'country', 'वैशिष्ट्य — स्रोत देश'),
    sp(RJ.WRIT, 'en', 'mean', 'रिट — अर्थ'),
    sp(DP.PART, 'p', 'sub', 'राज्यघटनेचा भाग — विषय'),
    sp(DP.CBODY, 'b', 'art', 'घटनात्मक पद/संस्था — कलम'),
    sp(DP.BTYPE, 'b', 'type', 'संस्था — स्वरूप'),
    sp(DP.ARTX, 'art', 'sub', 'कलम — तरतूद'),
  ],
  arthashastra: [
    sp(AR.INST, 'inst', 'hq', 'संस्था — मुख्यालय'),
    sp(AR.INST, 'inst', 'year', 'संस्था — स्थापना वर्ष', { fb: Y, year: 'year' }),
    sp(AR.PLAN, 'plan', 'focus', 'पंचवार्षिक योजना — भर'),
    sp(AR.SCHEME, 'sch', 'aim', 'योजना — उद्देश'),
    sp(AR.SCHEME, 'sch', 'year', 'योजना — वर्ष', { fb: Y, year: 'year' }),
    sp(AR.COMM, 'c', 'area', 'समिती — क्षेत्र'),
    sp(AR.TERM, 'term', 'mean', 'संज्ञा — अर्थ'),
    sp(DP.THINK, 't', 'who', 'सिद्धांत/ग्रंथ — अर्थतज्ज्ञ'),
    sp(DP.ECOYR, 'ev', 'year', 'घटना — वर्ष', { fb: Y, year: 'year' }),
    sp(DP.INDEX, 'i', 'by', 'निर्देशांक/अहवाल — प्रकाशक'),
  ],
  vidnyan: [
    sp(VI.VIT, 'vit', 'dis', 'जीवनसत्त्व — अभावजन्य विकार'),
    sp(VI.DISEASE, 'dis', 'cause', 'रोग — कारक'),
    sp(VI.VECTOR, 'dis', 'vec', 'रोग — वाहक'),
    sp(VI.UNIT, 'qty', 'unit', 'राशी — SI एकक'),
    sp(VI.INSTR, 'inst', 'meas', 'उपकरण — मोजमाप'),
    sp(VI.FORMULA, 'name', 'f', 'पदार्थ — सूत्र'),
    sp(VI.COMMON, 'common', 'chem', 'प्रचलित नाव — रासायनिक नाव'),
    sp(VI.ELEM, 'el', 'sym', 'मूलद्रव्य — संज्ञा'),
    sp(VI.ACID, 'src', 'acid', 'पदार्थ — आम्ल'),
    sp(VI.DISCOVER, 'what', 'who', 'शोध — शास्त्रज्ञ'),
    sp(VI.BODY, 'fact', 'val', 'मानवी शरीर — तथ्य'),
    sp(VI.PLANET, 'fact', 'pl', 'तथ्य — ग्रह'),
    sp(DP.LAWS, 'l', 'who', 'नियम/शोध — शास्त्रज्ञ'),
    sp(DP.PHYLUM, 'a', 'g', 'प्राणी — गट'),
    sp(DP.OLOGY, 'o', 'what', 'शास्त्र — अभ्यासविषय'),
    sp(DP.ENZ, 'e', 'on', 'विकर — पचन'),
  ],
  paryavaran: [
    sp(PV.CONV, 'c', 'aim', 'करार/परिषद — उद्देश'),
    sp(PV.CONV, 'c', 'year', 'करार/परिषद — वर्ष', { fb: Y, year: 'year' }),
    sp(PV.LAW, 'law', 'year', 'कायदा — वर्ष', { fb: Y, year: 'year' }),
    sp(PV.TERM, 'term', 'mean', 'संकल्पना — अर्थ'),
    sp(PV.BIOS, 'b', 'st', 'जीवावरण राखीव क्षेत्र — राज्य'),
    sp(PV.RAMSAR, 'w', 'st', 'रामसर स्थळ — राज्य'),
    sp(PV.MOVE, 'm', 'what', 'आंदोलन — स्वरूप'),
    sp(PV.DAY, 'd', 'date', 'दिन — तारीख'),
    sp(PV.POLL, 'e', 'cause', 'परिणाम — कारण'),
    sp(PV.GHG, 'g', 'src', 'हरितगृह वायू — स्रोत'),
    sp(BH.PARK, 'park', 'dist', 'अभयारण्य/उद्यान — जिल्हा'),
    sp(BH.NP, 'park', 'state', 'राष्ट्रीय उद्यान — राज्य'),
    sp(BH2.LAYER, 'l', 'what', 'वातावरणाचा थर — वैशिष्ट्य'),
  ],
  samanya: [
    sp(SM.CUP, 'c', 'sport', 'चषक — खेळ'),
    sp(SM.PLAYER, 'p', 'sport', 'खेळाडू — खेळ'),
    sp(SM.AWARD, 'a', 'field', 'पुरस्कार — क्षेत्र'),
    sp(SM.UN, 'o', 'hq', 'संघटना — मुख्यालय'),
    sp(SM.NICK, 'n', 'place', 'टोपणनाव — ठिकाण'),
    sp(SM.EBOOK, 'book', 'who', 'ग्रंथ — लेखक'),
    sp(SM.FIRSTP, 'what', 'who', 'प्रथम — व्यक्ती'),
    sp(SM.MUSIC, 'i', 'who', 'वाद्य — वादक'),
    sp(SM.SPACE, 'm', 'year', 'अंतराळ मोहीम — वर्ष', { fb: Y, year: 'year' }),
    sp(SM.MHSYM, 'what', 'val', 'महाराष्ट्राचे प्रतीक'),
    sp(GX.DAYS, 'day', 'date', 'दिनविशेष — तारीख'),
    sp(GX.SYMBOL, 'what', 'val', 'राष्ट्रीय प्रतीक'),
    sp(GX.DANCE, 'dance', 'st', 'नृत्य — राज्य'),
    sp(GX.SAINT, 'saint', 'place', 'संत — ठिकाण'),
    sp(GX.STATEYR, 'st', 'year', 'राज्य — निर्मिती वर्ष', { fb: Y, year: 'year' }),
    sp(GX.NEWDIST, 'd', 'from', 'नवा जिल्हा — मूळ जिल्हा', { year: 'year' }),
    sp(BH2.FEST, 'f', 'st', 'सण — राज्य'),
    sp(BH2.AIRPORT, 'a', 'city', 'विमानतळ — शहर'),
  ],
  marathi: [
    sp(MA.IDIOM, 'ph', 'mean', 'वाक्प्रचार — अर्थ'),
    sp(MA.PROV, 'p', 'mean', 'म्हण — अर्थ'),
    sp(MA.GENDER, 'm', 'f', 'पुल्लिंगी — स्त्रीलिंगी रूप'),
    sp(MA.SAMAS, 'w', 't', 'सामासिक शब्द — समास'),
    sp(MA.ONEWORD, 'ph', 'w', 'शब्दसमूह — एक शब्द'),
    sp(MA.LIT, 'book', 'who', 'साहित्यकृती — लेखक'),
    sp(MA.PEN, 'pen', 'real', 'टोपणनाव — खरे नाव'),
    sp(MA.KAL, 's', 'k', 'वाक्य — काळ'),
  ],
  english: [
    sp(EN.VERB, 'base', 'past', 'Verb — Past tense'),
    sp(EN.VERB, 'base', 'pp', 'Verb — Past participle'),
    sp(EN.PLURAL, 's', 'p', 'Singular — Plural'),
    sp(EN.ONEW, 'def', 'w', 'Description — One word'),
    sp(EN.IDIOMS, 'id', 'mean', 'Idiom — Meaning'),
    sp(EN.GENDER, 'm', 'f', 'Masculine — Feminine'),
  ],
  panchayat: [
    sp(PN.PCOMM, 'c', 'work', 'समिती — शिफारस/कार्य'),
    sp(PN.PCOMM, 'c', 'year', 'समिती — वर्ष', { fb: Y, year: 'year' }),
    sp(PN.ART243, 'art', 'sub', 'कलम — विषय', { fa: (v) => `कलम ${v}` }),
    sp(PN.POFF, 'post', 'who', 'पद — व्यक्ती'),
    sp(PN.PFACT, 'f', 'what', 'तरतूद — विषय'),
    sp(PN.PLAW, 'l', 'year', 'कायदा/घटना — वर्ष', { fb: Y, year: 'year' }),
  ],
  mahsul: [
    sp(MH.MOFF, 'lvl', 'who', 'पातळी — महसूल अधिकारी'),
    sp(MH.MFORM, 'f', 'what', 'गाव नमुना — नोंद'),
    sp(MH.MMEAS, 'u', 'eq', 'एकक — समतुल्य'),
    sp(MH.MSYS, 's', 'who', 'महसूल पद्धत — प्रवर्तक'),
    sp(MH.MLAW, 'l', 'year', 'कायदा — वर्ष', { fb: Y, year: 'year' }),
    sp(PN.POFF, 'post', 'who', 'पद — व्यक्ती'),
  ],
};

const LET = ['अ', 'ब', 'क', 'ड'];
const ROM = ['i', 'ii', 'iii', 'iv'];

function shuf(r, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
const listMr = (xs) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} व ${xs[xs.length - 1]}`);

// तक्त्याची तयारी (एकदाच)
const prep = new WeakMap();
function info(spec) {
  if (prep.has(spec)) return prep.get(spec);
  const rows = spec.t.filter((x) => x[spec.a] && x[spec.b]);
  const valid = new Map();
  for (const x of rows) { if (!valid.has(x[spec.a])) valid.set(x[spec.a], new Set()); valid.get(x[spec.a]).add(x[spec.b]); }
  const bs = [...new Set(rows.map((x) => x[spec.b]))];
  const v = { rows, valid, bs, fa: spec.fa || ((s) => s), fb: spec.fb || ((s) => s) };
  prep.set(spec, v);
  return v;
}

// एकमेकांशी गोंधळ न होणाऱ्या k ओळी: डावे स्तंभ वेगळे, उजवे स्तंभ वेगळे व परस्पर अवैध
function pickRows(r, I, k) {
  const pool = shuf(r, I.rows);
  const out = [];
  for (const x of pool) {
    if (out.some((y) => y._a === x._a)) continue;
    const okRow = out.every((y) => !I.valid.get(x._a).has(y._b) && !I.valid.get(y._a).has(x._b) && x._b !== y._b && x._a !== y._a);
    if (okRow) out.push(x);
    if (out.length === k) break;
  }
  return out.length === k ? out : null;
}

function rowsOf(spec) {
  const I = info(spec);
  if (!I.mapped) {
    I.mapped = I.rows.map((x) => ({ _a: x[spec.a], _b: x[spec.b], _y: spec.year ? Number(x[spec.year]) : null }));
    I.rows = I.mapped;
  }
  return I;
}

function wrongFor(r, I, row, avoid) {
  const c = shuf(r, I.bs.filter((v) => !I.valid.get(row._a).has(v) && !avoid.has(v)));
  return c[0];
}

const TYPES = ['two', 'which', 'match', 'chrono'];
export const typeLevel = { two: 2, which: 3, match: 3, chrono: 3 };

// विषय s मधील i क्रमांकाचा प्रश्न (null = हा क्रमांक वैध नाही)
export function examAt(s, i) {
  const specs = SPECS[s];
  if (!specs) return null;
  const r = rng(`cx:${s}:${i}`);
  let type = TYPES[i % 4];
  const dated = specs.filter((x) => x.year);
  if (type === 'chrono' && !dated.length) type = 'which';
  const from = type === 'chrono' ? dated : specs;
  const spec = from[Math.floor(r() * from.length)];
  const I = rowsOf(spec);
  if (I.rows.length < 5 || I.bs.length < 4) return null;
  const P = (x, b = x._b) => `${I.fa(x._a)} — ${I.fb(b)}`;
  const lbl = spec.label;

  if (type === 'two') {
    const rows = pickRows(r, I, 2);
    if (!rows) return null;
    const truth = [r() < 0.5, r() < 0.5];
    const shown = rows.map((x, k) => (truth[k] ? x._b : wrongFor(r, I, x, new Set(rows.map((y) => y._b)))));
    if (shown.some((v) => v == null)) return null;
    const opts = ['फक्त विधान १ बरोबर', 'फक्त विधान २ बरोबर', 'दोन्ही विधाने बरोबर', 'दोन्ही विधाने चूक'];
    const ci = truth[0] && truth[1] ? 2 : truth[0] ? 0 : truth[1] ? 1 : 3;
    const o = [opts[ci], ...opts.filter((_, k) => k !== ci)];
    return {
      s, lv: 2, t: 'two',
      q: `खालील विधाने विचारात घ्या (${lbl}):\n१. ${P(rows[0], shown[0])}\n२. ${P(rows[1], shown[1])}`,
      o,
      e: rows.map((x, k) => `${mr(k + 1)}. ${truth[k] ? 'बरोबर' : `चूक — योग्य: ${P(x)}`}`).join('\n'),
    };
  }

  if (type === 'which') {
    const rows = pickRows(r, I, 4);
    if (!rows) return null;
    let truth = rows.map(() => r() < 0.55);
    if (!truth.some(Boolean)) truth[Math.floor(r() * 4)] = true;
    const used = new Set(rows.map((x) => x._b));
    const shown = rows.map((x, k) => {
      if (truth[k]) return x._b;
      const w = wrongFor(r, I, x, used);
      if (w != null) used.add(w);
      return w;
    });
    if (shown.some((v) => v == null)) return null;
    const code = (set) => {
      const ls = LET.filter((_, k) => set[k]);
      return ls.length === 4 ? 'अ, ब, क व ड — सर्व' : `फक्त ${listMr(ls)}`;
    };
    const key = (set) => set.map((v) => (v ? 1 : 0)).join('');
    const right = code(truth);
    const seen = new Set([key(truth)]);
    const others = [];
    for (let t = 0; others.length < 3 && t < 60; t++) {
      const alt = truth.map((v) => (r() < 0.35 ? !v : v));
      if (!alt.some(Boolean) || seen.has(key(alt))) continue;
      seen.add(key(alt));
      others.push(code(alt));
    }
    if (others.length < 3) return null;
    return {
      s, lv: 3, t: 'which',
      q: `खालीलपैकी कोणत्या जोड्या योग्य आहेत? (${lbl})\n${rows.map((x, k) => `${LET[k]}. ${P(x, shown[k])}`).join('\n')}`,
      o: [right, ...others],
      e: rows.map((x, k) => `${LET[k]}. ${truth[k] ? 'योग्य' : `अयोग्य — बरोबर: ${P(x)}`}`).join('\n'),
    };
  }

  if (type === 'match') {
    const rows = pickRows(r, I, 4);
    if (!rows) return null;
    const right = shuf(r, [0, 1, 2, 3]); // स्तंभ ब मधील क्रम
    const pos = rows.map((_, k) => right.indexOf(k)); // अ-k → ROM[pos]
    const fmt = (p) => LET.map((L, k) => `${L}-${ROM[p[k]]}`).join(', ');
    const seen = new Set([pos.join()]);
    const others = [];
    for (let t = 0; others.length < 3 && t < 60; t++) {
      const alt = pos.slice();
      const a = Math.floor(r() * 4); let b = Math.floor(r() * 4); if (a === b) b = (b + 1) % 4;
      [alt[a], alt[b]] = [alt[b], alt[a]];
      if (r() < 0.4) { const c = Math.floor(r() * 4); const d = (c + 1 + Math.floor(r() * 3)) % 4; [alt[c], alt[d]] = [alt[d], alt[c]]; }
      if (seen.has(alt.join())) continue;
      seen.add(alt.join());
      others.push(fmt(alt));
    }
    if (others.length < 3) return null;
    return {
      s, lv: 3, t: 'match',
      q: `जोड्या जुळवा (${lbl}):\n${rows.map((x, k) => `${LET[k]}. ${I.fa(x._a)}`).join('\n')}\n—\n${right.map((k, p) => `${ROM[p]}. ${I.fb(rows[k]._b)}`).join('\n')}`,
      o: [fmt(pos), ...others],
      e: rows.map((x) => P(x)).join('\n'),
    };
  }

  // कालक्रम
  const rows = pickRows(r, I, 4);
  if (!rows || rows.some((x) => !Number.isFinite(x._y))) return null;
  if (new Set(rows.map((x) => x._y)).size < 4) return null;
  const order = rows.map((_, k) => k).sort((a, b) => rows[a]._y - rows[b]._y);
  const fmt = (ord) => ord.map((k) => LET[k]).join(', ');
  const seen = new Set([order.join()]);
  const others = [];
  for (let t = 0; others.length < 3 && t < 60; t++) {
    const alt = order.slice();
    const a = Math.floor(r() * 4); let b = Math.floor(r() * 4); if (a === b) b = (b + 1) % 4;
    [alt[a], alt[b]] = [alt[b], alt[a]];
    if (seen.has(alt.join())) continue;
    seen.add(alt.join());
    others.push(fmt(alt));
  }
  if (others.length < 3) return null;
  const nameOf = (x) => (spec.b === spec.year ? I.fa(x._a) : `${I.fa(x._a)} (${I.fb(x._b)})`);
  return {
    s, lv: 3, t: 'chrono',
    q: `खालील बाबी कालक्रमानुसार (जुन्याकडून नव्याकडे) लावा (${spec.cl || lbl.split(' — ')[0]}):\n${rows.map((x, k) => `${LET[k]}. ${nameOf(x)}`).join('\n')}`,
    o: [fmt(order), ...others],
    e: order.map((k) => `${LET[k]}. ${I.fa(rows[k]._a)} — ${mr(rows[k]._y)}`).join('\n'),
  };
}
