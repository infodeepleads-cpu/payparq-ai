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
flutter build web --release --verbose \
  --pwa-strategy=none \
  --dart-define=ENV="${ENV:-prod}" \
  --dart-define=PROD_GUARD="${PROD_GUARD:-1}" \
  --dart-define=BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --dart-define=SUPABASE_URL="${SUPABASE_URL:-}" \
  --dart-define=SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}" \
  --dart-define=SUPABASE_FUNCTIONS_URL="${SUPABASE_FUNCTIONS_URL:-}" \
  --dart-define=SUPABASE_REDIRECT_URL="${SUPABASE_REDIRECT_URL:-https://mobile-scanner.vercel.app}"

COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-${CF_PAGES_COMMIT_SHA:-unknown}}"
mkdir -p build/web
echo "{\"sha\":\"$COMMIT_SHA\"}" > build/web/version.json
cat > build/web/_headers <<'EOF'
/
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/index.html
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/version.json
  Cache-Control: no-cache
/*.js
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/*.map
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
EOF

echo "=== Built Flutter web at build/web (sha: $COMMIT_SHA) ==="
