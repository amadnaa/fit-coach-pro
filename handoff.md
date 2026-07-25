# Handoff

## DONE

- Phase 1: setup and native link/camera fixes
- Phase 1 verification (post disk-full crash): production build succeeds; Browser/Camera fixes confirmed present in WorkoutView.tsx, ExerciseLibrary.tsx, ProfileView.tsx, ClientDashboard.tsx; VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY resolve from .env at build time; no hardcoded localhost/ngrok/dev URLs in src/.
- Phase 2: store compliance
  - TARGETED_DEVICE_FAMILY set to "1" (iPhone only) in both build configs (ios/App/App.xcodeproj/project.pbxproj).
  - UIRequiredDeviceCapabilities: replaced deprecated `armv7` with `arm64` (ios/App/App/Info.plist).
  - NS\*UsageDescription strings reviewed: all four (camera, photo library, photo library add, microphone) already name specific in-app actions and match real features (profile photos, check-in images, exercise video upload incl. WKWebView "Take Video" option). No changes needed.
  - Added ios/App/App/PrivacyInfo.xcprivacy: tracking=false, UserDefaults required-reason CA92.1, collected data types (email, name, photos/videos, fitness, other user content — all linked, none for tracking). Wired into the Xcode project as a bundle resource via project.pbxproj.
  - ITSAppUsesNonExemptEncryption confirmed present and `false` (HTTPS-only is exempt).
  - Removed accidentally committed .npm-cache/ files from git and added to .gitignore.
- Phase 3: native capability (Guideline 4.2)
  - @capacitor/haptics: medium impact on each logged set, success notification on workout completion (src/pages/client/WorkoutView.tsx, native-only, errors swallowed).
  - @capacitor/share: "Share Workout" button on the workout-complete screen sharing a localized summary (name, sets, reps, duration). New i18n keys workout.shareWorkout / workout.shareText in en + es.
  - @capacitor/preferences: offline cache of the active plan, workout list, and per-workout exercises, keyed per user id (src/lib/workoutCache.ts). WorkoutView falls back to cache only when the Supabase fetch returns an error (offline), never when the plan is genuinely empty.
  - Push notifications NOT wired — see NOT DONE.
  - npx cap sync run for both platforms; all 5 plugins registered on iOS and Android.
- Phase 4: required in-app pages
  - New Help & Support screen (src/pages/Support.tsx) with contact email (PLACEHOLDER — see MANUAL STEPS) and links to Privacy Policy and Terms. Reachable from Profile → "Help & Support". Route /support added additively to App.tsx (no auth/guard logic changed).
  - Privacy Policy and Terms confirmed reachable in-app: Profile menu links to /privacy-policy directly; /terms now linked from the Support screen (it previously had a route but no in-app link).
  - Account deletion flow verified intact: PrivacySecurity.tsx → supabase.functions.invoke('delete-account') → supabase/functions/delete-account/index.ts (verifies JWT, deletes with service role). None of this session's changes touch that path, auth, or the Supabase client.
  - Known limitation (pre-existing): the "Export Data" blob-URL download in PrivacySecurity.tsx is unreliable in WKWebView. Not a store requirement; flagged in TEST list.
- Phase 5: Android parity
  - Machine had no JDK (why the first gradle run silently no-oped). Installed Homebrew openjdk@21 (user-level) and wrote android/local.properties pointing at ~/Library/Android/sdk (gitignored, machine-specific).
  - `./gradlew assembleDebug` BUILDS SUCCESSFULLY (only benign warnings from the Capacitor camera plugin).
  - Fixed Android application ID: was still the Lovable-generated `app.lovable.fef919ec...` while iOS and capacitor.config already used `com.anete.lafuerza`. Updated build.gradle (namespace + applicationId), strings.xml (package_name, custom_url_scheme), and moved MainActivity.java to com/anete/lafuerza/. The Play application ID is permanent after first upload, so this had to happen before submission.
  - Fixed Android app label: strings.xml still said "FitCoach" (rebrand had missed Android) → now "La Fuerza".
  - Merged-manifest permissions verified: exactly INTERNET + VIBRATE (haptics) + one auto-generated system entry. Camera uses intent flow — no CAMERA permission needed, nothing extra to remove.
  - targetSdkVersion = 36, minSdk 24, compileSdk 36 — exceeds Play's current API 35 minimum.
  - Data Safety inputs captured in data-safety.md (Phase 6).

- Post-phase follow-up (review credentials)
  - review-notes.md is now gitignored and untracked (it will hold live demo credentials); committed template lives in review-notes.example.md.
  - New scripts/seed-review-accounts.ts (run with `npx tsx`, needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env): creates demo coach + client mirroring the create-client edge function (user_roles, coach_clients, trigger-created profiles), with must_change_password explicitly OFF and onboarding pre-completed; seeds an active 2-day plan (6 exercises), 3 completed past workouts with per-set logs, food logs, bodyweight/steps, and a weekly check-in. Idempotent; prints credentials at the end. NOT yet run — she runs it against production tomorrow (MANUAL STEPS item 3).

## DECISIONS

- Used `@capacitor/browser` for external links on native and kept browser fallback for web.
- Replaced profile photo upload with Capacitor Camera on native while preserving web file input fallback.
- Replaced YouTube `iframe` embeds with external browser on native to avoid WKWebView playback risk.

## MANUAL STEPS (in order, for tomorrow)

1. **Set the support email.** Replace `REPLACE-ME@example.com` in src/pages/Support.tsx, then `npm run build && npx cap sync`. The same address goes in privacy-policy.md and both store listings.
2. **Host the privacy policy.** Fill in the [brackets] in privacy-policy.md and publish it at a public URL (coach's website / GitHub Pages / Notion). Both stores require the URL; Play also wants it as the account-deletion info URL.
3. **Create demo reviewer accounts** (coach + client) in production Supabase, populate the client with a plan and some logs, and paste the credentials into review-notes.md → then into both consoles.
4. **Generate missing store graphics** per asset-checklist.md: iPhone 6.9" screenshots, Play 512×512 icon (`sips -Z 512 assets/icon-only.png --out play-icon-512.png`), Play 1024×500 feature graphic, ≥2 Play screenshots.
5. **Xcode (her Mac, her Apple Developer account):** open ios/App/App.xcworkspace → set Team/signing for com.anete.lafuerza → confirm PrivacyInfo.xcprivacy appears in the App target's Copy Bundle Resources → Archive → upload to App Store Connect.
6. **App Store Connect:** create the app (bundle ID com.anete.lafuerza), paste store-listing.md fields, privacy questionnaire (data-safety.md maps 1:1 to Apple's categories), review notes from review-notes.md, attach screenshots, submit.
7. **Play Console:** create the app (application ID com.anete.lafuerza — now correct in the repo), build a signed AAB (`cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew bundleRelease` after configuring signing in Play App Signing / a keystore), fill Data Safety form from data-safety.md, App access credentials from review-notes.md, upload listing assets, submit.
8. **Android release signing** needs a keystore or Play App Signing enrollment — Play Console guides this on first upload; nothing in the repo blocks it.

## NOT DONE

- **Push notifications** (Phase 3 item 4). Left out cleanly — nothing half-wired, no plugin installed, no permission prompt. NotificationCentre remains in-app only. To add later: (1) APNs key in the Apple Developer portal + FCM setup for Android, (2) a new Supabase table for device tokens (schema change — was out of bounds this session), (3) an edge function to send pushes, (4) @capacitor/push-notifications wiring. Roughly a day of work including testing.
- **iPad layout** — intentionally dropped (TARGETED_DEVICE_FAMILY=1) per instructions.
- **Report/block features** — intentionally not built; the moderation blocker was downgraded because coach–client pairing is closed.
- **Pre-existing cosmetic toggles:** the 2FA switch and permission switches in PrivacySecurity.tsx only show toasts (no real function). Low rejection risk but a reviewer could notice; consider hiding the 2FA toggle before submission if in doubt (5-minute change, wasn't in scope).
- **Bundle size:** the JS bundle is ~1.5 MB minified (Vite warning). Works fine; code-splitting is a later optimization.

## TEST BEFORE SUBMITTING (on a physical iPhone)

1. **Exercise video links** open in the system browser (WorkoutView + ExerciseLibrary + ClientDashboard video buttons) — the Phase 1 fix.
2. **Profile photo** via camera AND via photo library (Camera plugin, permission prompts should show the new usage strings).
3. **Exercise video upload** (coach account) through the file input — including the "Take Video" option, which exercises the mic permission.
4. **Haptics** fire on logging a set and finishing a workout.
5. **Share Workout** on the completion screen opens the iOS share sheet.
6. **Offline:** open the app with data once, enable Airplane Mode, force-quit, reopen → today's workout should load from cache in WorkoutView.
7. **Account deletion end-to-end with a throwaway client account:** delete → confirm you land at login → confirm the login no longer works. (Hard 5.1.1(v) requirement.)
8. **Export Data** button — known WKWebView limitation with blob downloads; if it does nothing on device, that's expected (not a store blocker, deletion is what's required). Note it for a future fix.
9. **Forced password change** flow for a fresh coach-created client still works (untouched, but it gates first login).
10. On **Android**: install app-debug.apk, confirm app name shows "La Fuerza", spot-check items 1–6.
