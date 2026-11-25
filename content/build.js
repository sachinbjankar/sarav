// सर्व प्रश्न तयार करून public/qbank/ मध्ये JSON म्हणून लिहा.
// चालवा: node content/build.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validate, finalize, rng, shuffle } from './engine.js';
import { ganitAt } from './gen-ganit.js';
import { buddhiAt } from './gen-buddhi.js';
import { genItihas } from './tables/itihas.js';
import { genBhugol } from './tables/bhugol.js';
import { genRajya } from './tables/rajyaghatana.js';
import { genArtha } from './tables/arthashastra.js';
import { genVidnyan } from './tables/vidnyan.js';
import { genMarathi } from './tables/marathi.js';
import { genEnglish } from './tables/english.js';
import { genPanchayat, genMahsul } from './tables/hand.js';
import { genGkExtra } from './tables/gk-extra.js';
import { genItihas2 } from './tables/itihas2.js';
import { genBhugol2 } from './tables/bhugol2.js';
import { genPairs } from './tables/pairs-all.js';
import { genParyavaran } from './tables/paryavaran.js';
import { genSamanya } from './tables/samanya.js';
import { genHand2 } from './tables/hand2.js';
import { genDeep } from './tables/deep.js';
import { examAt, SPECS } from './gen-exam.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'public', 'qbank');
fs.mkdirSync(out, { recursive: true });

const parts = [
  ...genItihas(), ...genBhugol(), ...genRajya(), ...genArtha(), ...genVidnyan(),
  ...genMarathi(), ...genEnglish(), ...genPanchayat(), ...genMahsul(), ...genGkExtra(), ...genItihas2(), ...genBhugol2(), ...genPairs(),
  ...genParyavaran(), ...genSamanya(), ...genHand2(), ...genDeep(),
];

// अवैध प्रश्न (एकसारखे पर्याय इ.) वगळा
const bad = new Set(validate(parts).map((m) => m.split(' ').slice(2).join(' ')));
const good = parts.filter((x) => x.o.length === 4 && new Set(x.o.map(String)).size === 4 && !/undefined|NaN/.test(x.q + x.e + x.o.join('')));
const final = finalize(good);

const bySub = {};
for (const row of final) (bySub[row[1]] ||= []).push(row);
const manifest = {};
for (const [s, rows] of Object.entries(bySub)) {
  fs.writeFileSync(path.join(out, `${s}.json`), JSON.stringify(rows));
  manifest[s] = rows.length;
}
// गणित व बुद्धिमत्ता: प्रश्न ॲपमध्येच तयार होतात; येथे फक्त वैध क्रमांकांची यादी (सोप्यापासून कठीणकडे)
const difficulty = (q) => {
  const digits = (q.q.match(/[०-९0-9]/g) || []).length;
  const optLen = q.o.reduce((a, o) => a + String(o).length, 0) / 4;
  return digits * 1.2 + q.q.length / 30 + optLen / 12;
};
for (const [s, f, target] of [['ganit', ganitAt, Number(process.env.GANIT || 8375)], ['buddhimatta', buddhiAt, Number(process.env.BUDDHI || 8375)]]) {
  const seen = new Set();
  const list = [];
  for (let i = 0; list.length < target; i++) {
    const x = f(i);
    if (!x || seen.has(x.q) || /undefined|NaN/.test(x.q + x.e + x.o.join(''))) continue;
    seen.add(x.q);
    list.push([i, difficulty(x)]);
  }
  list.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  // सोपे → कठीण क्रम राखून, प्रत्येक ४०० च्या गटात प्रश्नप्रकार मिसळा (एका स्तरात एकाच प्रकारचे १० प्रश्न नकोत)
  const r = rng(`band-${s}`);
  const ordered = [];
  for (let k = 0; k < list.length; k += 400) ordered.push(...shuffle(r, list.slice(k, k + 400)));
  fs.writeFileSync(path.join(out, `${s}.idx.json`), JSON.stringify(ordered.map((x) => x[0])));
  try { fs.unlinkSync(path.join(out, `${s}.json`)); } catch (_) { /* नव्हती */ }
  manifest[s] = list.length;
}
// परीक्षा-स्वरूप प्रश्न: प्रत्येक विभाग साधारण समान (TARGET) होईपर्यंत
const TARGET = Number(process.env.TARGET || 8400);
const HALF = new Set(['panchayat', 'mahsul']); // दोन्ही मिळून एक विभाग
const RAWN = { itihas: 25, bhugol: 25, rajyaghatana: 25, arthashastra: 25, vidnyan: 25, marathi: 25, english: 25 };
const cxInfo = {};
for (const s of Object.keys(SPECS)) {
  const goal = (HALF.has(s) ? Math.round(TARGET / 2) : TARGET) - (manifest[s] || 0) - (RAWN[s] || 0);
  const seen = new Set();
  const lv = { 2: [], 3: [] };
  let n = 0;
  for (let i = 0; n < goal && i < goal * 12; i++) {
    const x = examAt(s, i);
    if (!x || /undefined|NaN/.test(x.q + x.e + x.o.join('')) || new Set(x.o).size !== 4) continue;
    const k = `${x.q}|${x.o[0]}`;
    if (seen.has(k)) continue;
    seen.add(k);
    lv[x.lv].push(i);
    n++;
  }
  fs.writeFileSync(path.join(out, `${s}.cx.json`), JSON.stringify(lv));
  cxInfo[s] = { base: manifest[s] || 0, cx: n, goal: Math.max(goal, 0), l2: lv[2].length, l3: lv[3].length };
  manifest[`${s}:cx`] = n;
}
console.table(cxInfo);
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));
const total = Object.values(manifest).reduce((a, b) => a + b, 0);
console.log('with generated:', manifest, 'total', total);
console.log(manifest, 'total', final.length, 'dropped', parts.length - final.length, bad.size ? '' : '');
