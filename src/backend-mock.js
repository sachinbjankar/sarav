// डेमो backend: Firebase जोडले नसताना (वेब पूर्वावलोकन) सर्व काही याच ब्राउझरमध्ये चालते.
// रँकिंगमधील इतर नावे काल्पनिक नमुना आहेत; खऱ्या अ‍ॅपमध्ये ती दिसत नाहीत.
import { scoreField, weekIndex } from './backend-common.js';

const K = 'sarav.mock';
const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (_) { return {}; } };
const db = load();
db.users ||= {};      // email → { uid, name, password }
db.players ||= {};    // uid → player
db.progress ||= {};
db.session ||= null;
const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (_) { /* ignore */ } };

const SAMPLE = [
  ['प्रिया पाटील', 'पुणे'], ['अमोल जाधव', 'सातारा'], ['स्नेहा कुलकर्णी', 'नाशिक'], ['रोहित पवार', 'सोलापूर'],
  ['पूजा शिंदे', 'कोल्हापूर'], ['गणेश मोरे', 'अहिल्यानगर'], ['अश्विनी देशमुख', 'अमरावती'], ['सागर गायकवाड', 'लातूर'],
  ['मयुरी चव्हाण', 'सांगली'], ['विशाल राठोड', 'यवतमाळ'], ['कोमल भोसले', 'ठाणे'], ['अक्षय वाघ', 'जळगाव'],
  ['प्राजक्ता साळुंखे', 'बीड'], ['तुषार कदम', 'नांदेड'], ['रुपाली माने', 'नागपूर'], ['निलेश ढोले', 'परभणी'],
];
const sample = (exam, period) => SAMPLE.map(([name, dist], i) => {
  const seed = (exam.length * 31 + i * 17 + (period === 'week' ? 7 : 0)) % 13;
  const base = period === 'week' ? 620 - i * 34 : 4200 - i * 230;
  return { uid: `demo${i}`, name, dist, pts: Math.max(10, base + seed * 10), demo: true };
});

let cb = null;
const me = () => (db.session ? { uid: db.session, email: Object.keys(db.users).find((e) => db.users[e].uid === db.session), name: db.players[db.session]?.name || '' } : null);
const fire = () => cb && cb(me());
const fail = (code) => { const e = new Error(code); e.code = code; throw e; };
const wait = () => new Promise((r) => setTimeout(r, 250));

export const backend = {
  kind: 'mock',
  onAuth(fn) { cb = fn; setTimeout(fire, 0); return () => { cb = null; }; },

  async signUp({ name, dist, email, password }) {
    await wait();
    email = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) fail('auth/invalid-email');
    if (!password || password.length < 6) fail('auth/weak-password');
    if (db.users[email]) fail('auth/email-already-in-use');
    const uid = 'u' + Date.now();
    db.users[email] = { uid, password };
    db.players[uid] = { name, dist, tot: 0, tests: 0, lastExam: '' };
    db.session = uid; save(); fire();
    return me();
  },
  async signIn(email, password) {
    await wait();
    const u = db.users[email.trim().toLowerCase()];
    if (!u || u.password !== password) fail('auth/invalid-credential');
    db.session = u.uid; save(); fire();
    return me();
  },
  async resetPassword(email) { await wait(); if (!db.users[email.trim().toLowerCase()]) fail('auth/user-not-found'); },
  async signOut() { db.session = null; save(); fire(); },
  async deleteAccount(password) {
    const email = me().email;
    if (db.users[email].password !== password) fail('auth/wrong-password');
    delete db.players[db.session]; delete db.progress[db.session]; delete db.users[email];
    db.session = null; save(); fire();
  },

  async createPlayer(uid, name, dist) { db.players[uid] = { name, dist, tot: 0, tests: 0, lastExam: '' }; save(); },
  async getPlayer(uid) { return db.players[uid] ? { uid, ...db.players[uid] } : null; },
  async updatePlayer(uid, { name, dist }) { Object.assign(db.players[uid], { name, dist }); save(); fire(); },
  async loadProgress(uid) { return db.progress[uid] || null; },
  async saveProgress(uid, p) { db.progress[uid] = p; save(); },

  async addScore(uid, exam, pts) {
    const p = db.players[uid];
    const t = scoreField(exam, 'all'); const w = scoreField(exam, 'week', weekIndex());
    p[t] = (p[t] || 0) + pts; p[w] = (p[w] || 0) + pts; p.tot += pts; p.tests += 1; p.lastExam = exam;
    save();
  },

  async leaderboard(exam, period) {
    await wait();
    const f = scoreField(exam, period);
    const real = Object.entries(db.players).filter(([, p]) => p[f]).map(([uid, p]) => ({ uid, name: p.name, dist: p.dist, pts: p[f] }));
    return [...real, ...sample(exam, period)].sort((a, b) => b.pts - a.pts).slice(0, 50);
  },
  async rankOf(exam, period, pts) {
    if (!pts) return null;
    const list = await this.leaderboard(exam, period);
    return list.filter((x) => x.pts > pts).length + 1;
  },
};
