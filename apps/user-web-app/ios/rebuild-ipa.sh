#!/bin/bash
set -e

echo "🔄 Cleaning Xcode build cache..."
rm -rf ~/Library/Developer/Xcode/DerivedData/

echo "🔄 Syncing Capacitor with iOS project..."
cd "$(dirname "$0")/.." || exit
npx capacitor sync ios

echo "🔄 Cleaning Xcode build folder..."
cd ios/App
xcodebuild clean -scheme App -configuration Release

echo "✅ Clean build ready!"
echo "Next steps:"
echo "1. Open ios/App/App.xcworkspace (NOT .xcodeproj)"
echo "2. Select Product → Clean Build Folder (Cmd+Shift+K)"
echo "3. Build for iOS App Store"
echo "4. Create IPA via Xcode Organizer"
echo ""
echo "Icon will be bundled automatically from Assets.xcassets/AppIcon.appiconset"
