// जाहिराती: Android अ‍ॅपमध्ये AdMob; वेब पूर्वावलोकनात फक्त नमुना जागा.
import { Capacitor } from '@capacitor/core';
import { ADS } from './config.js';

const native = Capacitor.isNativePlatform();
let AdMob = null;
let ready = false;
let bannerShown = false;
let bannerWanted = false;
let lastInterstitial = 0;
const log = {};
const note = (k, v) => { log[k] = v; };
// "मी" पानावर दिसणारी जाहिरात-स्थिती (तपासणीसाठी)
export function adStatus() {
  if (!native) return 'web';
  return ['init', 'banner', 'full', 'reward'].filter((k) => log[k]).map((k) => `${k}: ${log[k]}`).join(' | ') || 'init: सुरू…';
}
const errText = (e) => (e && (e.code !== undefined ? `code ${e.code} ` : '') + (e && (e.message || e.errorMessage) || String(e))).slice(0, 90);

function setAdHeight(px) {
  document.documentElement.style.setProperty('--ad-h', `${px}px`);
}

export async function initAds() {
  if (native) document.documentElement.classList.add('native');
  if (!native) {
    setAdHeight(56);
    return;
  }
  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    // संमती (युरोपसाठी). AdMob मध्ये संमती फॉर्म नसेल तर ही पायरी अयशस्वी होते; तरीही जाहिराती सुरू ठेवा.
    let consentNote = '';
    try {
      let consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === mod.AdmobConsentStatus.REQUIRED) {
        consent = await AdMob.showConsentForm();
      }
      if (consent.canRequestAds === false) { note('init', 'consent नाही'); return; }
    } catch (e) {
      consentNote = ' (consent फॉर्म नाही)';
    }
    await AdMob.initialize({ initializeForTesting: ADS.TESTING });
    AdMob.addListener(mod.BannerAdPluginEvents.SizeChanged, (size) => setAdHeight(size.height || 0));
    AdMob.addListener(mod.BannerAdPluginEvents.Loaded, () => note('banner', 'दिसली ✓'));
    AdMob.addListener(mod.BannerAdPluginEvents.FailedToLoad, (e) => { note('banner', 'नाही: ' + errText(e)); bannerShown = false; });
    ready = true;
    note('init', 'ok' + consentNote);
    if (bannerWanted) showBanner();
  } catch (err) {
    console.warn('AdMob init failed', err);
    note('init', 'अयशस्वी: ' + errText(err));
  }
}

export async function showBanner() {
  bannerWanted = true;
  document.body.classList.add('has-banner');
  if (!native) {
    setAdHeight(56);
    return;
  }
  if (!ready) return;
  try {
    if (bannerShown) {
      await AdMob.resumeBanner();
    } else {
      const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
      await AdMob.showBanner({
        adId: ADS.BANNER,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: ADS.TESTING,
      });
      bannerShown = true;
    }
  } catch (err) {
    console.warn('banner failed', err);
    note('banner', 'नाही: ' + errText(err));
  }
}

export async function hideBanner() {
  bannerWanted = false;
  document.body.classList.remove('has-banner');
  setAdHeight(0);
  if (native && ready && bannerShown) {
    try { await AdMob.hideBanner(); } catch (_) { /* ignore */ }
  }
}

// चाचणी पूर्ण झाल्यावर: ठराविक अंतराने पूर्ण-स्क्रीन जाहिरात
export async function maybeInterstitial(testsDone, minGapSec = ADS.INTERSTITIAL_GAP_SEC) {
  if (testsDone % ADS.INTERSTITIAL_EVERY !== 0) return;
  if (Date.now() - lastInterstitial < minGapSec * 1000) return;
  lastInterstitial = Date.now();
  if (!native) return fakeAd('पूर्ण-स्क्रीन जाहिरात (नमुना)', 1500);
  if (!ready) return;
  try {
    await AdMob.prepareInterstitial({ adId: ADS.INTERSTITIAL, isTesting: ADS.TESTING });
    await AdMob.showInterstitial();
    note('full', 'दिसली ✓');
  } catch (err) {
    console.warn('interstitial failed', err);
    note('full', 'नाही: ' + errText(err));
  }
}

// बक्षीस जाहिरात: पूर्ण पाहिल्यास true
export async function showRewarded() {
  if (!native) {
    await fakeAd('बक्षीस जाहिरात (नमुना)', 2000);
    return true;
  }
  if (!ready) return false;
  try {
    await AdMob.prepareRewardVideoAd({ adId: ADS.REWARDED, isTesting: ADS.TESTING });
    const reward = await AdMob.showRewardVideoAd();
    note('reward', 'दिसली ✓');
    return !!reward;
  } catch (err) {
    console.warn('rewarded not completed', err);
    note('reward', 'नाही: ' + errText(err));
    return false;
  }
}

function fakeAd(label, ms) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'fake-ad';
    el.innerHTML = `<div><b>${label}</b><span>Android अ‍ॅपमध्ये येथे खरी जाहिरात दिसेल</span></div>`;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); resolve(); }, ms);
  });
}

export const isNative = native;
