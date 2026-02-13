#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "$HOME/.flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable "$HOME/.flutter"
fi
export PATH="$HOME/.flutter/bin:$PATH"

flutter --version

flutter config --enable-web
flutter pub get
flutter build web --release

COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-unknown}"
mkdir -p build/web
echo "{\"sha\":\"$COMMIT_SHA\"}" > build/web/version.json

echo "Built Flutter web at build/web (sha: $COMMIT_SHA)"
