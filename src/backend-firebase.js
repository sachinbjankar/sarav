// खरा backend: Firebase Auth (ईमेल + पासवर्ड) आणि Cloud Firestore (मोफत Spark प्लॅन पुरेसा).
// माहितीची रचना (नियम: firestore.rules):
//   players/{uid}  सार्वजनिक: { name, dist, tot, tests, last, lastExam, t_<exam>, w<week>_<exam> }  ← रँकिंगसाठी
//   nikal/{exam}/entries/{uid}  { score, at }                                             ← निकालापूर्वी निकाल
//   refs/{uid}  { code, at }  ← मित्राच्या आमंत्रण कोडची नोंद (प्रत्येक खात्यासाठी एकदाच)
//   users/{uid}    खासगी:     { progress: {...}, updatedAt }                                       ← फक्त त्या व्यक्तीला दिसते
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile, EmailAuthProvider, reauthenticateWithCredential, deleteUser,
} from 'firebase/auth';
import {
  getFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs,
  getCountFromServer, increment, serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig } from './config.js';
import { scoreField, weekIndex } from './backend-common.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const toUser = (u) => (u ? { uid: u.uid, email: u.email, name: u.displayName || '' } : null);

export const backend = {
  kind: 'firebase',

  onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(toUser(u))),

  async signUp({ name, dist, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name });
    await backend.createPlayer(cred.user.uid, name, dist);
    return toUser(cred.user);
  },

  createPlayer: (uid, name, dist) => setDoc(doc(db, 'players', uid), {
    name, dist, tot: 0, tests: 0, last: serverTimestamp(), lastExam: '',
  }),

  signIn: async (email, password) => toUser((await signInWithEmailAndPassword(auth, email.trim(), password)).user),
  resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
  signOut: () => signOut(auth),

  async deleteAccount(password) {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
    await deleteDoc(doc(db, 'players', u.uid));
    await deleteDoc(doc(db, 'users', u.uid));
    await deleteUser(u);
  },

  async getPlayer(uid) {
    const s = await getDoc(doc(db, 'players', uid));
    return s.exists() ? { uid, ...s.data() } : null;
  },

  async updatePlayer(uid, { name, dist }) {
    await updateDoc(doc(db, 'players', uid), { name, dist });
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
  },

  async loadProgress(uid) {
    const s = await getDoc(doc(db, 'users', uid));
    return s.exists() ? s.data().progress || null : null;
  },

  saveProgress: (uid, progress) => setDoc(doc(db, 'users', uid), { progress, updatedAt: serverTimestamp() }),

  // एका चाचणीचे गुण (कमाल १००) रँकिंगमध्ये जोडा
  addScore(uid, exam, pts) {
    const wk = weekIndex();
    return updateDoc(doc(db, 'players', uid), {
      [scoreField(exam, 'all')]: increment(pts),
      [scoreField(exam, 'week', wk)]: increment(pts),
      tot: increment(pts),
      tests: increment(1),
      last: serverTimestamp(),
      lastExam: exam,
    });
  },

  async leaderboard(exam, period) {
    const f = scoreField(exam, period);
    const snap = await getDocs(query(collection(db, 'players'), orderBy(f, 'desc'), limit(50)));
    return snap.docs.map((d) => ({ uid: d.id, name: d.data().name, dist: d.data().dist, pts: d.data()[f] || 0 }));
  },

  // ---- निकालापूर्वी निकाल: एका परीक्षेसाठी प्रति वापरकर्ता एक नोंद ----
  async referClaim(code) {
    const u = auth.currentUser; if (!u) throw Object.assign(new Error('auth-required'), { code: 'auth-required' });
    const ref = doc(db, 'refs', u.uid);
    if ((await getDoc(ref)).exists()) throw Object.assign(new Error('already'), { code: 'already' });
    await setDoc(ref, { code, at: serverTimestamp() });
  },
  async referCount(code) {
    const snap = await getCountFromServer(query(collection(db, 'refs'), where('code', '==', code)));
    return snap.data().count;
  },
  async nikalSubmit(examId, _entryId, score) {
    const u = auth.currentUser; if (!u) throw Object.assign(new Error('auth-required'), { code: 'auth-required' });
    await setDoc(doc(db, 'nikal', examId, 'entries', u.uid), { score, at: serverTimestamp() });
  },
  async nikalStats(examId, score, maxScore) {
    const col = collection(db, 'nikal', examId, 'entries');
    const [above, total] = await Promise.all([
      getCountFromServer(query(col, where('score', '>', score))),
      getCountFromServer(col),
    ]);
    const bins = 20, w = maxScore / bins;
    const hist = await Promise.all(Array.from({ length: bins }, (_, i) =>
      getCountFromServer(query(col, where('score', '>=', i * w), where('score', '<', i === bins - 1 ? maxScore + 1 : (i + 1) * w))).then((c) => c.data().count)));
    return { rank: above.data().count + 1, total: total.data().count, hist, demo: false };
  },
  async rankOf(exam, period, pts) {
    if (!pts) return null;
    const f = scoreField(exam, period);
    const c = await getCountFromServer(query(collection(db, 'players'), where(f, '>', pts)));
    return c.data().count + 1;
  },
};
