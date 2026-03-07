#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting Vercel Flutter Web build ==="

if [ -n "${VERCEL:-}" ] || [ -d "/vercel" ]; then
  export HOME="/tmp"
fi
mkdir -p "$HOME"

export CI=true
export FLUTTER_SUPPRESS_ANALYTICS=true
export PUB_CACHE="${HOME}/.pub-cache"

FLUTTER_SDK_DIR="${HOME}/flutter-sdk"
if [ ! -d "$FLUTTER_SDK_DIR" ]; then
  git clone --depth 1 https://github.com/flutter/flutter.git -b stable "$FLUTTER_SDK_DIR"
fi
export PATH="$FLUTTER_SDK_DIR/bin:$PATH"

echo "=== Flutter version ==="
flutter --version
flutter config --enable-web
flutter config --no-analytics >/dev/null 2>&1 || true
echo "=== Fetching dependencies ==="
flutter pub get
SUPABASE_URL_VALUE="${SUPABASE_URL:-${CF_SUPABASE_URL:-https://iafjygownkhedereaoxw.supabase.co}}"
SUPABASE_ANON_KEY_VALUE="${SUPABASE_ANON_KEY:-${CF_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg}}"
SUPABASE_FUNCTIONS_URL_VALUE="${SUPABASE_FUNCTIONS_URL:-${CF_SUPABASE_FUNCTIONS_URL:-}}"
DEFAULT_REDIRECT_HOST="${VERCEL_URL:-mobile-scanner-flax-static.vercel.app}"
SUPABASE_REDIRECT_URL_VALUE="${SUPABASE_REDIRECT_URL:-https://${DEFAULT_REDIRECT_HOST}}"

echo "=== Resolved runtime config ==="
echo "ENV=${ENV:-prod}"
echo "PROD_GUARD=${PROD_GUARD:-1}"
echo "SUPABASE_URL=${SUPABASE_URL_VALUE}"
echo "SUPABASE_ANON_KEY_LENGTH=${#SUPABASE_ANON_KEY_VALUE}"
echo "SUPABASE_FUNCTIONS_URL=${SUPABASE_FUNCTIONS_URL_VALUE:-<empty>}"
echo "SUPABASE_REDIRECT_URL=${SUPABASE_REDIRECT_URL_VALUE}"

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

echo "=== Hard-disable service worker and wipe browser caches ==="
cat > build/web/flutter_service_worker.js <<'EOF'
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
    const clientsList = await self.clients.matchAll({type: 'window'});
    for (const client of clientsList) {
      client.navigate(client.url);
    }
  })());
});
EOF

cat > build/web/sw-killer.js <<'EOF'
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  });
}
EOF

if [ -f build/web/index.html ] && ! grep -q "sw-killer.js" build/web/index.html; then
  sed -i 's#</body>#  <script src="sw-killer.js"></script>\n</body>#' build/web/index.html
fi

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
