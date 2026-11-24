// जाहिराती: Android अ‍ॅपमध्ये AdMob; वेब पूर्वावलोकनात फक्त नमुना जागा.
import { Capacitor } from '@capacitor/core';
import { ADS } from './config.js';

const native = Capacitor.isNativePlatform();
let AdMob = null;
let ready = false;
let bannerShown = false;
let bannerWanted = false;
let lastInterstitial = 0;

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
    let consent = await AdMob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === mod.AdmobConsentStatus.REQUIRED) {
      consent = await AdMob.showConsentForm();
    }
    if (consent.canRequestAds === false) return;
    await AdMob.initialize({ initializeForTesting: ADS.TESTING });
    AdMob.addListener(mod.BannerAdPluginEvents.SizeChanged, (size) => setAdHeight(size.height || 0));
    ready = true;
    if (bannerWanted) showBanner();
  } catch (err) {
    console.warn('AdMob init failed', err);
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
export async function maybeInterstitial(testsDone) {
  if (testsDone % ADS.INTERSTITIAL_EVERY !== 0) return;
  if (Date.now() - lastInterstitial < ADS.INTERSTITIAL_GAP_SEC * 1000) return;
  lastInterstitial = Date.now();
  if (!native) return fakeAd('पूर्ण-स्क्रीन जाहिरात (नमुना)', 1500);
  if (!ready) return;
  try {
    await AdMob.prepareInterstitial({ adId: ADS.INTERSTITIAL, isTesting: ADS.TESTING });
    await AdMob.showInterstitial();
  } catch (err) {
    console.warn('interstitial failed', err);
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
    return !!reward;
  } catch (err) {
    console.warn('rewarded not completed', err);
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
