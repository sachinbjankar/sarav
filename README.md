# सराव – MPSC व पोलीस भरती प्रश्नमंजुषा

A free Marathi quiz app for MPSC, Police Bharti and other state exams. It earns money from AdMob ads.

**Features:** a daily quiz (10 new questions every day), practice by subject (8 subjects, 200 questions), a mixed test, practice of wrong answers, saved questions, a 45-second timer per question, a 50:50 lifeline (1 free per test, more unlocked by a rewarded ad), explanations, results with review, progress by subject, a daily streak, and score sharing. Everything is stored on the phone, so there is no server and no running cost.

**Ads:**
- A banner on the home, result, saved and progress screens. It never shows during questions.
- A full-screen ad after every 2nd completed test, with at least 2 minutes between them.
- A rewarded ad to unlock an extra 50:50.

Settings are in `src/config.js`.

## How it is built
- A web app (Vite, plain JavaScript) wrapped as an Android app with Capacitor 8.
- `@capacitor-community/admob` for ads.
- GitHub Actions builds `Sarav.apk` on every push to `main` and attaches it to a Release. When the upload-key secrets are set, it also builds `Sarav-playstore.aab`. The privacy policy is published on GitHub Pages.

## One-time setup
1. **GitHub:** push this folder to the `sarav` repository. Then go to Settings → Pages → Source: **GitHub Actions**.
2. **Play Store bundle:** go to Settings → Secrets and variables → Actions → New repository secret, and add:
   - `UPLOAD_KEYSTORE_BASE64`: the contents of `UPLOAD_KEYSTORE_BASE64.txt`
   - `UPLOAD_KEYSTORE_PASSWORD`: the contents of `UPLOAD_KEYSTORE_PASSWORD.txt`

   Keep `sarav-upload.jks` and the password safe. Every future update must be signed with them.
3. **AdMob:** go to admob.google.com → Apps → Add app (Android, not yet on Play). Create 3 ad units: Banner, Interstitial and Rewarded. Then:
   - Put the **App ID** (`ca-app-pub-…~…`) in `android/app/src/main/res/values/strings.xml` → `admob_app_id`.
   - Put the 3 **ad unit IDs** (`ca-app-pub-…/…`) in `src/config.js`, and set `TESTING: false`.
   - Until then, the app shows Google's test ads. Never click your own real ads, because AdMob bans accounts for it.

## Adding questions
Edit `src/questions.js`. Put the correct answer **first** in each option list, because the app shuffles the options itself. Add new questions at the **end** of a subject's list, so that users' saved questions and progress stay linked to the right questions.

## Play Store listing
The listing text and the 512 px icon are in `store/`. The privacy policy URL is `https://sachinbjankar.github.io/sarav/privacy.html`.
