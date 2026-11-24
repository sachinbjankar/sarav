# सराव – MPSC व पोलीस भरती प्रश्नमंजुषा

A free Marathi quiz app for MPSC, Police Bharti and other state exams. It earns money from AdMob ads.

**Exam sections (5):** MPSC राज्यसेवा, MPSC गट-ब/गट-क, पोलीस भरती, तलाठी भरती, जिल्हा परिषद/ग्रामसेवक. Each has its own subjects, exam pattern note, daily quiz and leaderboard. Daily and mixed tests draw evenly from every subject of the exam.

**Question bank (~10,000):**
- `src/questions.js` holds 225 hand-written questions.
- `content/` generates the rest into `public/qbank/*.json` (run `npm run questions`):
  - `gen-ganit.js` and `gen-buddhi.js`: maths and reasoning, with answers computed by code (about 6,300).
  - `tables/*.js`: fact tables for history, geography, polity, economics, science, Marathi and English, turned into questions (about 3,400). A fact checked once becomes several questions.
  - `tables/hand.js`: Panchayat Raj and land revenue questions.
- **Before launch, have a subject expert review the tables in `content/tables/`.** Each table row is a fact; fixing one row fixes every question built from it.
- Add new facts as rows at the end of a table. Question IDs come from the question text, so editing a question's wording resets users' progress on that question only.

**Features:** a daily quiz per exam, practice by subject (225 questions in 9 base subjects; सामान्य ज्ञान and CSAT draw on several of them), a mixed test, practice of wrong answers, saved questions, a 45-second timer, a 50:50 lifeline, explanations, results with review, and score sharing.

**Accounts (optional):** sign up with name, district, email and password. The test history, progress chart, subject accuracy and saved questions are kept online, so they move to a new phone. Users can delete their account in the app (Play Store requires this).

**Ranking:** 10 points per correct answer in the daily quiz (first try), subject tests and mixed tests. Each exam shows the top 50 for this week (restarting Monday) and for all time, plus the user's own rank. The server accepts at most 100 points per test and one test every 30 seconds, which limits cheating.

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
0. **Firebase (for accounts and ranking):** go to console.firebase.google.com and create a project named `sarav`, on the free Spark plan.
   - Build → Authentication → Get started → turn on **Email/Password**.
   - Build → Firestore Database → Create database (production mode, region `asia-south1` Mumbai). Then open **Rules**, paste in `firestore.rules`, and click Publish.
   - Project settings → Your apps → Web (`</>`) → register the app, then copy the `firebaseConfig` values into `src/config.js`.
   - Until this is done, accounts and ranking run in demo mode, on that one phone only.
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
The listing text and the 512 px icon are in `store/`. The privacy policy URL is `https://sachinbjankar.github.io/sarav/privacy.html`, and the account deletion URL is `https://sachinbjankar.github.io/sarav/delete-account.html`.

## Free-plan limits
The Firebase Spark plan allows 50,000 reads and 20,000 writes a day. Each leaderboard view costs about 52 reads and is cached for 5 minutes. Each finished test costs about 2 writes. That covers roughly 500–800 active users a day. Beyond that, move to the Blaze plan, which is pay-as-you-go and costs very little at that size.
