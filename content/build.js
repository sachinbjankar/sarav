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

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'public', 'qbank');
fs.mkdirSync(out, { recursive: true });

const parts = [
  ...genItihas(), ...genBhugol(), ...genRajya(), ...genArtha(), ...genVidnyan(),
  ...genMarathi(), ...genEnglish(), ...genPanchayat(), ...genMahsul(), ...genGkExtra(),
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
for (const [s, f, target] of [['ganit', ganitAt, Number(process.env.GANIT || 50000)], ['buddhimatta', buddhiAt, Number(process.env.BUDDHI || 47000)]]) {
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
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));
const total = Object.values(manifest).reduce((a, b) => a + b, 0);
console.log('with generated:', manifest, 'total', total);
console.log(manifest, 'total', final.length, 'dropped', parts.length - final.length, bad.size ? '' : '');
