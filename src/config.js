// AdMob सेटिंग्ज.
// आत्ता Google चे "test" IDs आहेत: अ‍ॅप तपासताना फक्त नमुना जाहिराती दिसतात.
// AdMob खाते तयार झाल्यावर खालील IDs बदला आणि TESTING = false करा.
// (App ID बदलण्यासाठी android/app/src/main/res/values/strings.xml मधील admob_app_id सुद्धा बदला.)

export const ADS = {
  TESTING: true,
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  // पूर्ण झालेल्या किती चाचण्यांनंतर एक पूर्ण-स्क्रीन जाहिरात दाखवायची
  INTERSTITIAL_EVERY: 2,
  // दोन पूर्ण-स्क्रीन जाहिरातींमध्ये किमान अंतर (सेकंद)
  INTERSTITIAL_GAP_SEC: 120,
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
