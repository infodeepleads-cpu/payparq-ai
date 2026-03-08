if (!(Test-Path ".dart_tool\package_config.json")) {
  flutter pub get
}

$buildDate = Get-Date -Format o
$supabaseUrl = if ($env:SUPABASE_URL) { $env:SUPABASE_URL } else { "https://iafjygownkhedereaoxw.supabase.co" }
$supabaseAnonKey = if ($env:SUPABASE_ANON_KEY) { $env:SUPABASE_ANON_KEY } else { "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg" }
$supabaseFunctionsUrl = if ($env:SUPABASE_FUNCTIONS_URL) { $env:SUPABASE_FUNCTIONS_URL } else { "" }
$supabaseRedirectUrl = if ($env:SUPABASE_REDIRECT_URL) { $env:SUPABASE_REDIRECT_URL } else { "https://mobile-scanner-ruddy.vercel.app/reset-password" }

flutter build web --release --no-wasm-dry-run --pwa-strategy=none --no-pub `
  --dart-define=ENV=prod `
  --dart-define=PROD_GUARD=1 `
  --dart-define=BUILD_DATE=$buildDate `
  --dart-define=SUPABASE_URL=$supabaseUrl `
  --dart-define=SUPABASE_ANON_KEY=$supabaseAnonKey `
  --dart-define=SUPABASE_FUNCTIONS_URL=$supabaseFunctionsUrl `
  --dart-define=SUPABASE_REDIRECT_URL=$supabaseRedirectUrl
