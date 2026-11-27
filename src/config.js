// AdMob सेटिंग्ज.
// खरे AdMob IDs (Sachiv Apps). App ID: android/app/src/main/res/values/strings.xml मधील admob_app_id.
// TESTING = true केल्यास फक्त नमुना जाहिराती दिसतात.

export const ADS = {
  TESTING: false,
  BANNER: 'ca-app-pub-4684655036811137/7823367193',
  INTERSTITIAL: 'ca-app-pub-4684655036811137/7631795507',
  REWARDED: 'ca-app-pub-4684655036811137/1066387158',
  // पूर्ण झालेल्या किती चाचण्यांनंतर एक पूर्ण-स्क्रीन जाहिरात दाखवायची
  INTERSTITIAL_EVERY: 1,
  // दोन पूर्ण-स्क्रीन जाहिरातींमध्ये किमान अंतर (सेकंद)
  INTERSTITIAL_GAP_SEC: 60,
};

export const QUIZ = {
  PER_TEST: 10,
  SECONDS_PER_Q: 45,
  FREE_FIFTY_FIFTY: 1,
};

export const APP = {
  name: 'सराव',
  privacyUrl: 'https://sachinbjankar.github.io/sarav/privacy.html',
};

// Firebase (खाते व रँकिंगसाठी). console.firebase.google.com → प्रकल्प "Sarav" → Web app ची config येथे टाका.
// apiKey रिकामी असेल तर अ‍ॅप "डेमो" मोडमध्ये चालते (खाती व रँकिंग फक्त त्याच फोनवर).
// या values गुप्त पासवर्ड नाहीत; माहितीचे संरक्षण firestore.rules करतात.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// रँकिंग: प्रत्येक बरोबर उत्तराला किती गुण
export const POINTS_PER_CORRECT = 10;
