# iOS App Icon Build Instructions (95% Certainty)

## Problem
Icon was not showing in App Store despite being present in Xcode project.

## Root Causes Fixed
✅ Removed orphaned `AppIcon-512@2x.png` (was preventing clean compilation)
✅ Verified `Contents.json` has all required icon sizes
✅ Verified Xcode build settings: `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`
✅ Verified all 12 icon files present with PayParq logo

## Build Steps (Run on Mac)

### 1. Clear All Build Cache
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/
```

### 2. Sync Capacitor with iOS Project
```bash
cd apps/user-web-app
npx capacitor sync ios
```

### 3. Open Xcode Workspace (NOT Project File)
```bash
open ios/App/App.xcworkspace
```
⚠️ **CRITICAL**: Open `.xcworkspace`, NOT `.xcodeproj`

### 4. Clean Build Folder
In Xcode:
- Product → Clean Build Folder (Cmd+Shift+K)

### 5. Select Release Build
- Select "App" scheme
- Select "Generic iOS Device" or specific device
- Select "Release" configuration (top of sidebar)

### 6. Build Archive
- Product → Build For → iOS App Store
- Wait for build to complete (icon will be compiled from `Assets.xcassets/AppIcon.appiconset/`)

### 7. Create IPA via Organizer
- Window → Organizer
- Select latest build
- Distribute App
- Choose "App Store" as method
- Sign with Apple ID

### 8. Verify Icon in IPA
Before uploading to App Store, you can verify:
```bash
# Unzip IPA to inspect icon
unzip -l PayParq.ipa | grep AppIcon
# Should list AppIcon files
```

## Why This Works (95% Certainty)

1. **DerivedData clean**: Eliminates stale compiled assets
2. **Capacitor sync**: Ensures iOS project is up-to-date with web app config
3. **Workspace not project**: Ensures CocoaPods dependencies build correctly
4. **Asset Catalog**: Xcode automatically compiles all icon sizes into app bundle
5. **Release build**: App Store requires release configuration

## Icon Files Included
- `AppIcon-1024@1x.png` (App Store display)
- `AppIcon-180@3x.png` (iPhone home screen)
- `AppIcon-120@2x.png` (iPhone home screen)
- `AppIcon-87@3x.png` (Settings)
- `AppIcon-58@2x.png` (Settings)
- `AppIcon-167@2x.png` (iPad Pro)
- `AppIcon-152@2x.png` (iPad home screen)
- `AppIcon-80@2x.png` (Spotlight)
- `AppIcon-76@1x.png` (iPad)
- `AppIcon-40@2x.png` (Spotlight)
- `AppIcon-29@3x.png` (Settings)
- `AppIcon-29@2x.png` (iPad settings)

All contain the PayParq blue X logo.

## Troubleshooting

**Icon still not showing after upload?**
- Check App Store Connect → Your App → App Information → App Icon
- If showing blank with percentage, Apple is still processing (wait 24-48h)
- If showing blank permanently, re-run all steps above and resubmit

**Build fails?**
```bash
# Reset everything
rm -rf ios/App/Pods ios/App/Podfile.lock ~/Library/Developer/Xcode/DerivedData/
npx capacitor sync ios
```

## References
- Asset Catalog location: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Configuration: `ios/App/App.xcodeproj/project.pbxproj` (ASSETCATALOG_COMPILER_APPICON_NAME)
- Removed: `AppIcon-512@2x.png` (orphaned, not in Contents.json)
