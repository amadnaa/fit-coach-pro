# Handoff

## DONE

- Phase 1: setup and native link/camera fixes

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
