# Clear all build artifacts first
Remove-Item -Recurse -Force .dart_tool -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue

# Run in Edge browser for lightweight debugging
$buildDate = Get-Date -Format o
flutter run -d edge --web-port 8080 `
  --dart-define=ENV=dev `
  --dart-define=BUILD_DATE=$buildDate `
  --dart-define=SUPABASE_URL="https://iafjygownkhedereaoxw.supabase.co" `
  --dart-define=SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg"
