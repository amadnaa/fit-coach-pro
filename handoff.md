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
