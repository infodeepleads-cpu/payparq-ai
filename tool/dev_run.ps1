if (!(Test-Path ".dart_tool\package_config.json")) {
  flutter pub get
}

$buildDate = Get-Date -Format o
flutter run -d web-server --web-hostname localhost --web-port 8086 `
  --no-web-resources-cdn `
  --no-pub `
  --dart-define=ENV=dev `
  --dart-define=BUILD_DATE=$buildDate `
  --dart-define=SUPABASE_URL="https://iafjygownkhedereaoxw.supabase.co" `
  --dart-define=SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg"
