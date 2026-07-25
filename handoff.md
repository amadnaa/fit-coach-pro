# Handoff

## DONE

- Phase 1: setup and native link/camera fixes
- Phase 1 verification (post disk-full crash): production build succeeds; Browser/Camera fixes confirmed present in WorkoutView.tsx, ExerciseLibrary.tsx, ProfileView.tsx, ClientDashboard.tsx; VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY resolve from .env at build time; no hardcoded localhost/ngrok/dev URLs in src/.
- Phase 2: store compliance
  - TARGETED_DEVICE_FAMILY set to "1" (iPhone only) in both build configs (ios/App/App.xcodeproj/project.pbxproj).
  - UIRequiredDeviceCapabilities: replaced deprecated `armv7` with `arm64` (ios/App/App/Info.plist).
  - NS*UsageDescription strings reviewed: all four (camera, photo library, photo library add, microphone) already name specific in-app actions and match real features (profile photos, check-in images, exercise video upload incl. WKWebView "Take Video" option). No changes needed.
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

## DECISIONS

- Used `@capacitor/browser` for external links on native and kept browser fallback for web.
- Replaced profile photo upload with Capacitor Camera on native while preserving web file input fallback.
- Replaced YouTube `iframe` embeds with external browser on native to avoid WKWebView playback risk.

## MANUAL STEPS

- Review and upload provisioning profile / App Store Connect settings.
- Confirm privacy policy URL and metadata entries.
- Confirm Play Console target SDK and privacy form entries.
- Confirm any required icons/screenshots in the asset checklist.

## NOT DONE

- Android build pending after Phase 5.
- In-app support/contact screen pending.

## TEST BEFORE SUBMITTING

- External video links open in native browser on iOS.
- Profile photo upload works via Capacitor Camera on iOS.
- Exercise video upload remains functional in native mode.
- Account deletion flow still works after code changes.
