#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting Vercel Flutter Web build ==="

# Force move home to /tmp to avoid /vercel/.flutter conflict
export HOME="/tmp/flutter_build_$(date +%s)"
mkdir -p "$HOME"
export FLUTTER_SUPPRESS_ANALYTICS=true
export CI=true
export PUB_CACHE="${HOME}/.pub-cache"

# Ensure we have a writable directory for flutter settings
mkdir -p "$HOME/.flutter"
touch "$HOME/.flutter" 2>/dev/null || true

FLUTTER_SDK_DIR="${HOME}/flutter-sdk"
if [ ! -d "$FLUTTER_SDK_DIR" ]; then
  git clone --depth 1 https://github.com/flutter/flutter.git -b stable "$FLUTTER_SDK_DIR"
fi
export PATH="$FLUTTER_SDK_DIR/bin:$PATH"

# Set ALL analytics suppression flags BEFORE any flutter command
export FLUTTER_SUPPRESS_ANALYTICS=true
export FLUTTER_NO_ANALYTICS=1
export NO_ANALYTICS=1

# Disable analytics first thing
flutter config --no-analytics >/dev/null 2>&1 || true

echo "=== Flutter version ==="
flutter --version
flutter config --enable-web
echo "=== Fetching dependencies ==="
flutter clean
flutter pub get
SUPABASE_URL_VALUE="${SUPABASE_URL:-${CF_SUPABASE_URL:-https://iafjygownkhedereaoxw.supabase.co}}"
SUPABASE_ANON_KEY_VALUE="${SUPABASE_ANON_KEY:-${CF_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg}}"
SUPABASE_FUNCTIONS_URL_VALUE="${SUPABASE_FUNCTIONS_URL:-${CF_SUPABASE_FUNCTIONS_URL:-}}"
DEFAULT_REDIRECT_HOST="${VERCEL_URL:-mobile-scanner-ruddy.vercel.app}"
SUPABASE_REDIRECT_URL_VALUE="${SUPABASE_REDIRECT_URL:-https://${DEFAULT_REDIRECT_HOST}/reset-password}"
APK_DOWNLOAD_URL_VALUE="${APK_DOWNLOAD_URL:-https://github.com/kzamic-prog/payparq.ai/releases/download/apk-latest/app-release.apk}"

echo "=== Resolved runtime config ==="
echo "ENV=${ENV:-prod}"
echo "PROD_GUARD=${PROD_GUARD:-1}"
echo "SUPABASE_URL=${SUPABASE_URL_VALUE}"
echo "SUPABASE_ANON_KEY_LENGTH=${#SUPABASE_ANON_KEY_VALUE}"
echo "SUPABASE_FUNCTIONS_URL=${SUPABASE_FUNCTIONS_URL_VALUE:-<empty>}"
echo "SUPABASE_REDIRECT_URL=${SUPABASE_REDIRECT_URL_VALUE}"
echo "APK_DOWNLOAD_URL=${APK_DOWNLOAD_URL_VALUE}"

echo "=== Building Flutter web (release) ==="
flutter build web --release --no-wasm-dry-run \
  --pwa-strategy=none \
  --dart-define=ENV="${ENV:-prod}" \
  --dart-define=PROD_GUARD="${PROD_GUARD:-1}" \
  --dart-define=BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --dart-define=SUPABASE_URL="${SUPABASE_URL_VALUE}" \
  --dart-define=SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY_VALUE}" \
  --dart-define=SUPABASE_FUNCTIONS_URL="${SUPABASE_FUNCTIONS_URL_VALUE}" \
  --dart-define=SUPABASE_REDIRECT_URL="${SUPABASE_REDIRECT_URL_VALUE}"

COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-${CF_PAGES_COMMIT_SHA:-unknown}}"
mkdir -p build/web
if [ -f web/app-release.apk ]; then
  cp web/app-release.apk build/web/app-release.apk
else
  curl -fL --retry 3 --retry-delay 2 "${APK_DOWNLOAD_URL_VALUE}" -o build/web/app-release.apk || true
fi
echo "{\"sha\":\"$COMMIT_SHA\"}" > build/web/version.json
cat > build/web/_headers <<'EOF'
/
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/index.html
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/version.json
  Cache-Control: no-cache
/*.js
  Cache-Control: public, max-age=0, must-revalidate
/*.map
  Cache-Control: public, max-age=0, must-revalidate
/*.wasm
  Cache-Control: public, max-age=0, must-revalidate
EOF

echo "=== Built Flutter web at build/web (sha: $COMMIT_SHA) ==="
