# App Store Submission Audit: la-fuerza

## Phase 1 — Orientation

- **App summary:** This is a React/Vite fitness coaching app wrapped with Capacitor. The code supports coach and client roles, workout planning, nutrition tracking, progress/history, notifications, profile management, and privacy/security controls.
- **Native wrapper:** Capacitor
  - `@capacitor/core` 8.4.0
  - `@capacitor/ios` 8.4.1
  - `@capacitor/android` 8.4.0
  - Evidence: `package.json` lines 16-19
- **iOS project:** `ios/App/App`
  - Info.plist: `ios/App/App/Info.plist`
  - AppDelegate: `ios/App/App/AppDelegate.swift`
  - Launch screen storyboard: `ios/App/App/Base.lproj/LaunchScreen.storyboard`
  - SwiftPM wrapper: `ios/App/CapApp-SPM/Package.swift`
- **Build config:**
  - Deployment target: iOS 15.0
    - Evidence: `ios/App/App.xcodeproj/project.pbxproj` line 233
  - Bundle ID: `com.anete.lafuerza`
    - Evidence: `ios/App/App.xcodeproj/project.pbxproj` line 308
  - App version: `1.0`
    - Evidence: `ios/App/App.xcodeproj/project.pbxproj` line 306
  - Build number: `1`
    - Evidence: `ios/App/App.xcodeproj/project.pbxproj` line 299
- **Third-party SDKs / native plugins:**
  - Native: Capacitor core / Cordova via SwiftPM (`ios/App/CapApp-SPM/Package.swift`)
  - JavaScript: `@supabase/supabase-js`, `@tanstack/react-query`, `i18next`, `react-i18next`, `framer-motion`, `recharts`, `lucide-react`, `react-hook-form`, `zod`, `sonner`, and Radix UI packages.
  - No explicit StoreKit / payment SDKs, no Apple/Google/Facebook social login dependencies.

## Phase 2 — Detailed audit

### 1. Guideline 4.2 — Minimum Functionality

- **Verdict:** Risk
- **What’s wrong:** The app is a Capacitor-wrapped web app with minimal explicit native integration in JS.
- **Evidence:** `src/App.tsx` lines 118-121 use `BrowserRouter`; grep over `src/**` found no `@capacitor/*` plugin imports; external content is embedded via HTML anchors and `iframe`.
- **Specific evidence:**
  - `src/pages/client/ClientDashboard.tsx` line 592 contains an `<iframe>` embed.
  - `src/pages/client/WorkoutView.tsx` line 402 uses `<a href={ex.videoUrl} target="_blank" ...>` external video links.
  - `src/pages/coach/ExerciseLibrary.tsx` line 202 uses `<a href={url} target="_blank" ...>`.
- **Fix:** Add or document native-specific capabilities clearly, or implement stronger native integrations for iOS. Ensure external links open in the system browser / SFSafariViewController instead of being treated like a browser shell.
- **Effort:** Medium

### 2. Guideline 2.1 — App Completeness

- **Verdict:** Risk
- **What’s wrong:** The app requires login to access anything, and the repo contains no demo credentials or test account information.
- **Evidence:** `src/App.tsx` lines 35-55 redirect unauthenticated users to `/login` and protect all main routes behind auth.
- **What’s wrong:** The app depends on runtime environment variables for Supabase and a backend.
- **Evidence:** `src/integrations/supabase/client.ts` lines 5-6 use `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **What’s wrong:** Some functionality is gated by backend feature flags.
- **Evidence:** `src/hooks/useFeatureFlags.ts` and `src/pages/client/ClientDashboard.tsx` line 384 conditionally render features based on flags.
- **Fix:** Provide reviewer credentials and confirm staging/back-end env settings for review. Ensure feature flags are enabled for the review build.
- **Effort:** Low

### 3. Guideline 5.1.1 — Privacy

- **Verdict:** Pass with risk
- **What’s right:** App includes an in-app account deletion flow and privacy/security pages.
- **Evidence:** `src/pages/PrivacySecurity.tsx` lines 87-99 implement `handleDeleteAccount` that invokes `supabase.functions.invoke('delete-account', ...)`.
- **Evidence:** `supabase/functions/delete-account/index.ts` implements deletion of user data and auth removal.
- **What’s right:** Info.plist declares usage descriptions for camera, photo library, photo add, and microphone.
- **Evidence:** `ios/App/App/Info.plist` lines 50-58.
- **Risk:** No PrivacyInfo.xcprivacy manifest in repo, though no required third-party SDK manifest is present.
- **Evidence:** Search for `.xcprivacy` returned no results.
- **Risk:** The app uses file upload controls in web UI instead of explicit Capacitor camera/plugin APIs.
- **Evidence:** `src/pages/ProfileView.tsx` line 127 uses `<input type="file" accept="image/*" ...>` and `src/pages/coach/ExerciseLibrary.tsx` line 323 uses `<input type="file" accept="video/*" ...>`.
- **Fix:** Confirm and document the actual permission usage path in the reviewer notes, and add a privacy manifest if Apple requires one for the production package.
- **Effort:** Low

### 4. Guideline 3.1.1 — Payments

- **Verdict:** Pass
- **What’s right:** No evidence of in-app purchase or external payment SDKs.
- **Evidence:** grep over `src/**` found no `StoreKit`, `IAP`, `purchase`, `stripe`, `paddle`, `lemon`, or `billing` references.
- **Fix:** None required.
- **Effort:** N/A

### 5. Guideline 4.8 / 5.1.2 — Sign in

- **Verdict:** Pass
- **What’s right:** Only email/password auth is present; no third-party social auth to require Sign in with Apple.
- **Evidence:** `src/pages/Login.tsx` is a standard email/password form; no Apple/Google/Facebook auth library is present.
- **Fix:** None required unless social login is added later.
- **Effort:** N/A

### 6. Guidelines 1.1 / 1.2 — User-generated content and safety

- **Verdict:** Risk
- **What’s wrong:** The app allows user-uploaded content and coach-client messaging-style notifications, but lacks explicit abuse/reporting controls.
- **Evidence:** `src/pages/ProfileView.tsx` line 127 supports avatar upload.
- **Evidence:** `src/pages/coach/ExerciseLibrary.tsx` line 323 supports exercise video upload.
- **Evidence:** `src/pages/NotificationCentre.tsx` lines 104-111 allow a coach to send notifications/messages.
- **Risk:** No report/block functionality found in repo search.
- **Fix:** Add content reporting or moderation controls, or document how abuse moderation is handled on the backend and include it in App Review notes.
- **Effort:** Medium

### 7. Design, layout, and platform fit

- **Verdict:** Pass / Minor risk
- **What’s right:** Safe area CSS is implemented.
- **Evidence:** `src/index.css` lines 125-128 use `env(safe-area-inset-bottom, 16px)` and `env(safe-area-inset-top, 0px)`.
- **What’s right:** Launch screen storyboard is configured.
- **Evidence:** `ios/App/App/Info.plist` line 20 references `LaunchScreen`.
- **Risk:** The app appears primarily mobile-web UI and does not include explicit iPad-specific layout adaptation, while iPad support is declared in Info.plist.
- **Fix:** Validate iPad layout or limit device family if the app is only intended for iPhone.
- **Effort:** Medium

### 8. Metadata and store-listing consistency

- **Verdict:** Risk
- **What’s wrong:** The app is gated behind login and coach onboarding, so reviewers will need test credentials.
- **Evidence:** `src/App.tsx` routes all core features behind auth.
- **What’s wrong:** There is no in-app support/contact page visible in the repo.
- **Evidence:** App routes include terms/privacy but not support/help.
- **Fix:** Provide review account credentials and a live support URL/contact if required by metadata.
- **Effort:** Low

### 9. Technical / build blockers

- **Verdict:** Pass with a small risk
- **What’s right:** iOS target 15.0 is acceptable and `ITSAppUsesNonExemptEncryption` is explicitly `false`.
- **Evidence:** `ios/App/App/Info.plist` line 58.
- **What’s right:** No ATS exceptions in Info.plist.
- **Risk:** There is no `.entitlements` file in repo, which is fine if no special capabilities are used, but should be confirmed with the provisioning profile.
- **Evidence:** search for `*.entitlements` returned none.
- **Risk:** `UIRequiredDeviceCapabilities` includes `armv7` though the deployment target is iOS 15 and modern devices; this is odd but not an immediate rejection.
- **Evidence:** `ios/App/App/Info.plist` line 18.
- **Fix:** Confirm provisioning and capability settings match the defined app entitlements and device support.
- **Effort:** Low

## BLOCKERS

1. **Guideline 2.1 | No reviewer account/demo credentials | `src/App.tsx` 35-55 | Provide App Review credentials and ensure the review build has a working backend and feature flags. | 1h**
2. **Guideline 1.1 / 1.2 | No content reporting/moderation controls for uploads/messages | grep search `report|block` empty | Add an abuse report/block mechanism or document moderation workflow for review. | 2-4h**
3. **Guideline 4.2 | App feels web-shell, minimal native API usage | `src/App.tsx` 118-121, no `@capacitor/*` plugin imports in `src/**` | Implement clearer native iOS integrations or document native-only behavior in review notes. | 4-6h\*\*

## RISKS

1. **Guideline 5.1.1 | PrivacyInfo.xcprivacy absent | repo search no `.xcprivacy` | Add privacy manifest if required by Apple for third-party SDK disclosure. | 1h**
2. **Guideline 5.1.1 | Permission declarations may not match actual native API usage | `ios/App/App/Info.plist` 50-58 vs only file input in JS | Confirm camera/photo access flow and make permission statements precise. | 1h**
3. **Guideline 2.1 | Backend/env required at runtime | `src/integrations/supabase/client.ts` 5-6 | Ensure production build has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` correctly configured. | 1h**
4. **Guideline 7 | iPad support declared but UI likely mobile-only | `ios/App/App/Info.plist` iPad orientations + mobile page layout | Validate iPad layout or restrict to iPhone if not tested. | 2h**
5. **Guideline 8 | No in-app support/contact flow | route list lacks support page | Add a visible support/contact link or document support URL. | 1h**

## POLISH

1. **Guideline 4.2 | External embedded content in iframe** | `src/pages/client/ClientDashboard.tsx` 592 | Avoid iframe embeds where possible or ensure they are review-safe. | 1h\*\*
2. **Guideline 5.1.1 | Remote font import over HTTPS** | `src/index.css` line 1 | Consider bundling fonts or limiting remote font calls for startup reliability. | 1h\*\*
3. **Guideline 9 | Unnecessary `armv7` device requirement** | `ios/App/App/Info.plist` line 18 | Remove `armv7` if not required. | 30m\*\*

## NEEDS MY INPUT

1. What reviewer/test account credentials should be used for App Review? Provide email/password or a staging account.
2. Is the production review build going to be connected to a live Supabase backend with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`? If not, please provide the intended environment values.
3. Does the app intend to support push notifications via APNS, or are notifications only in-app/realtime messages? (No push token plugin is present in JS.)
4. Is there an existing App Store support URL or contact email to include in metadata? If so, provide it.

## REVIEW NOTES DRAFT

La Fuerza is a fitness coaching app that requires login to access coach and client workflows.

- Reviewer login: [provide email/password here]
- App purpose: trainer-client workout, nutrition, progress tracking, messaging, and profile management.
- Account deletion: available in Privacy & Security and uses the app's Supabase `delete-account` backend function.
- Permissions: Camera/photo access is used for profile and exercise media upload; microphone is used for video recording.
- Backend note: the review build requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to be configured.

If the reviewer needs to see coach-side features, please use the provided coach test account.
