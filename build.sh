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
echo "=== Configuring web platform ==="
flutter create . --platforms web || true
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
  --dart-define=SUPABASE_URL="https://iafjygownkhedereaoxw.supabase.co" \
  --dart-define=SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg" \
  --dart-define=SUPABASE_FUNCTIONS_URL="${SUPABASE_FUNCTIONS_URL:-}" \
  --dart-define=SUPABASE_REDIRECT_URL="${SUPABASE_REDIRECT_URL:-https://mobile-scanner-flax-static.vercel.app}"

COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-${CF_PAGES_COMMIT_SHA:-unknown}}"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DEPLOY_ID="$(date +%s)-${COMMIT_SHA:0:7}"
mkdir -p build/web
echo "{\"sha\":\"$COMMIT_SHA\",\"timestamp\":\"$BUILD_TIMESTAMP\",\"deployId\":\"$DEPLOY_ID\",\"version\":\"1.0.5+6\"}" > build/web/version.json
echo "=== Build metadata: SHA=$COMMIT_SHA, Timestamp=$BUILD_TIMESTAMP, DeployID=$DEPLOY_ID ==="
cat > build/web/_headers <<'EOF'
/
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/index.html
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/version.json
  Cache-Control: no-cache
/manifest.json
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/favicon.png
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/icons/*
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/*.js
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/*.map
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/flutter_service_worker.js
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
EOF

# Add cache-busting query parameters to manifest and favicon in index.html
if [ -f build/web/index.html ]; then
  # Add version query parameter to manifest.json and favicon
  sed -i.bak "s|href=\"manifest.json\"|href=\"manifest.json?v=${DEPLOY_ID}\"|g" build/web/index.html
  sed -i.bak "s|href=\"favicon.png\"|href=\"favicon.png?v=${DEPLOY_ID}\"|g" build/web/index.html
  sed -i.bak "s|href=\"icons/Icon-192.png\"|href=\"icons/Icon-192.png?v=${DEPLOY_ID}\"|g" build/web/index.html
  rm -f build/web/index.html.bak
fi

echo "=== Built Flutter web at build/web (sha: $COMMIT_SHA) ==="
