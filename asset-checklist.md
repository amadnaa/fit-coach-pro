# Asset Checklist — App Store & Google Play

## What already exists in the repo ✅

| Asset | Location | Status |
|---|---|---|
| iOS app icon 1024×1024 | ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png | ✅ (single-size icon; Xcode 14+ generates the rest) |
| Source icon 1024×1024 | assets/icon-only.png | ✅ usable as the master |
| Splash screens 2732×2732 (light + dark) | assets/splash.png, assets/splash-dark.png | ✅ generated into both platforms |
| Android adaptive launcher icons (all densities) | android/app/src/main/res/mipmap-* | ✅ |
| Android splash (drawable-port/land, all densities) | android/app/src/main/res/drawable-* | ✅ |

## Missing — must be created before submission ❌

### App Store Connect
| Asset | Size | Notes |
|---|---|---|
| iPhone 6.9" screenshots | 1320×2868 (or 2868×1320) | **Required.** 3–10 screenshots. Take on iPhone 16 Pro Max simulator or device. |
| iPhone 6.5" screenshots | 1284×2778 | Only needed if the 6.9" set isn't provided for all sizes — upload 6.9" and Apple scales down; verify in ASC. |
| App Preview video | optional | Skip for v1. |

No iPad screenshots needed — the app is iPhone-only (TARGETED_DEVICE_FAMILY=1).

### Google Play Console
| Asset | Size | Notes |
|---|---|---|
| Hi-res icon | 512×512 PNG, ≤1 MB | **Required.** Downscale assets/icon-only.png (1024→512). |
| Feature graphic | 1024×500 PNG/JPG | **Required.** Simple: logo on brand-color background. |
| Phone screenshots | ≥2, each side 320–3840 px, 16:9–9:16 | **Required.** The same screens captured for iOS work if within bounds. |
| 7"/10" tablet screenshots | — | Skip; don't opt into tablet form factor. |

## Suggested screenshot set (same 5 for both stores)
1. Client dashboard (today's workout)
2. Workout in progress (set logging)
3. Progress view (charts)
4. Nutrition view
5. Exercise with video demo

Capture with the demo client account (populated data), in English; add a Spanish set later if desired.

## Quick commands
```bash
# 512×512 Play icon from the master:
sips -Z 512 assets/icon-only.png --out play-icon-512.png
```
Screenshots: run the app in Xcode's iPhone 16 Pro Max simulator → Cmd+S saves at full resolution.
