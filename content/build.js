// सर्व प्रश्न तयार करून public/qbank/ मध्ये JSON म्हणून लिहा.
// चालवा: node content/build.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validate, finalize } from './engine.js';
import { genGanit } from './gen-ganit.js';
import { genBuddhi } from './gen-buddhi.js';
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
  ...genGanit(Number(process.env.GANIT || 3700)),
  ...genBuddhi(Number(process.env.BUDDHI || 3300)),
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
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));
console.log(manifest, 'total', final.length, 'dropped', parts.length - final.length, bad.size ? '' : '');
