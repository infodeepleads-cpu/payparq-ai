# Build fresh production web build with all cache clearing
# This ensures the build matches what you see in debug mode

Write-Host "=== CLEARING ALL CACHES ===" -ForegroundColor Yellow
Remove-Item -Recurse -Force .dart_tool -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .flutter-plugins -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .flutter-plugins-dependencies -ErrorAction SilentlyContinue

Write-Host "=== FLUTTER CLEAN ===" -ForegroundColor Yellow
flutter clean

Write-Host "=== GETTING DEPENDENCIES ===" -ForegroundColor Yellow
flutter pub get

Write-Host "=== BUILDING PRODUCTION WEB BUILD ===" -ForegroundColor Green
$buildDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$timestamp = Get-Date -Format "o"

flutter build web --release `
  --pwa-strategy=none `
  --dart-define=ENV=prod `
  --dart-define=PROD_GUARD=1 `
  --dart-define=BUILD_DATE=$buildDate `
  --dart-define=SUPABASE_URL="https://iafjygownkhedereaoxw.supabase.co" `
  --dart-define=SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg" `
  --dart-define=SUPABASE_REDIRECT_URL="https://mobile-scanner-flax-static.vercel.app"

# Create version.json with deployment info
$commitSha = git rev-parse --short HEAD
$deployId = "$(Get-Date -UFormat %s)-$commitSha"
$versionJson = @{
    sha = $commitSha
    timestamp = $buildDate
    deployId = $deployId
    version = "1.0.5+6"
} | ConvertTo-Json

New-Item -ItemType Directory -Force -Path "build/web" | Out-Null
$versionJson | Out-File -FilePath "build/web/version.json" -Encoding utf8

Write-Host "=== BUILD COMPLETE ===" -ForegroundColor Green
Write-Host "Build output: build/web" -ForegroundColor Cyan
Write-Host "Version: 1.0.5+6" -ForegroundColor Cyan
Write-Host "Deploy ID: $deployId" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test locally:" -ForegroundColor Yellow
Write-Host "  cd build/web" -ForegroundColor White
Write-Host "  python -m http.server 8080" -ForegroundColor White
