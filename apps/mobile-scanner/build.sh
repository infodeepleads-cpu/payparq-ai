#!/usr/bin/env bash
set -euo pipefail
set -x

echo "=== Starting Vercel Flutter Web build ==="
echo "PWD: $(pwd)"
echo "HOME: ${HOME:-unset}"
echo "Listing current directory:"
ls -la

if [ ! -d "$HOME/.flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable "$HOME/.flutter"
fi
export PATH="$HOME/.flutter/bin:$PATH"

echo "=== Flutter version ==="
flutter --version
echo "=== Flutter doctor (short) ==="
flutter doctor -v || true

echo "=== NUCLEAR: wipe every possible cache ==="
rm -rf build/ .dart_tool/ .flutter-plugins/ .flutter-plugins-dependencies/
echo "=== Enable web support ==="
flutter config --enable-web
echo "=== Cleaning previous build artifacts ==="
flutter clean
echo "=== Fetching pub dependencies ==="
flutter pub get
echo "=== Building Flutter web (release) with verbose output ==="
flutter build web --release --verbose

COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-unknown}"
mkdir -p build/web
echo "{\"sha\":\"$COMMIT_SHA\"}" > build/web/version.json

echo "=== Built Flutter web at build/web (sha: $COMMIT_SHA) ==="
