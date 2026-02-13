#!/usr/bin/env bash
set -euo pipefail

# Install Flutter SDK if not already cached
if [ ! -d "$HOME/.flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable "$HOME/.flutter"
fi
export PATH="$HOME/.flutter/bin:$PATH"

# Show Flutter version (helps diagnose environment)
flutter --version

# We are already in apps/mobile-scanner as Vercel root; build directly
flutter config --enable-web
flutter pub get
flutter build web --release

# Write a build stamp for verification
COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-unknown}"
mkdir -p build/web
echo "{\"sha\":\"$COMMIT_SHA\"}" > build/web/version.json

echo "Flutter web built successfully at build/web (sha: $COMMIT_SHA)"
