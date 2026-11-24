// फोनवरच साठवलेली माहिती (प्रगती, जतन केलेले प्रश्न, सलग दिवस)
const KEY = 'sarav.v1';

const blank = () => ({
  ans: {},          // प्रश्न id → { r: बरोबर किती वेळा, w: चूक किती वेळा, last: शेवटचे उत्तर बरोबर? }
  saved: [],        // जतन केलेले प्रश्न
  streak: { last: '', n: 0 },
  daily: { date: '', score: null, total: 0 },
  tests: 0,
  best: 0,
});

let data;
try {
  data = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
} catch (_) {
  data = blank();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { /* storage unavailable */ }
}

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const store = {
  get: () => data,

  record(qid, correct) {
    const a = data.ans[qid] || { r: 0, w: 0, last: false };
    if (correct) a.r++; else a.w++;
    a.last = correct;
    data.ans[qid] = a;
    save();
  },

  finishTest({ score, total, daily }) {
    data.tests++;
    if (score > data.best) data.best = score;
    const t = today();
    if (data.streak.last !== t) {
      data.streak.n = data.streak.last === yesterday() ? data.streak.n + 1 : 1;
      data.streak.last = t;
    }
    if (daily) data.daily = { date: t, score, total };
    save();
    return data.tests;
  },

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

  reset() {
    data = blank();
    save();
  },
};
