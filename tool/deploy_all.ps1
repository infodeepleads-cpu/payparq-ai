# Universal deployment script - works for Firebase, Cloudflare, Vercel, and localhost
# This builds a fresh production build that matches your debug state

param(
    [string]$Platform = "all",  # Options: firebase, cloudflare, vercel, local, all
    [string]$RedirectUrl = ""     # Override redirect URL if needed
)

Write-Host "=== NUCLEAR CLEAN - Removing ALL build artifacts ===" -ForegroundColor Red
Remove-Item -Recurse -Force .dart_tool -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .flutter-plugins -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .flutter-plugins-dependencies -ErrorAction SilentlyContinue

Write-Host "=== FLUTTER CLEAN ===" -ForegroundColor Yellow
flutter clean

Write-Host "=== ENABLING WEB SUPPORT ===" -ForegroundColor Yellow
flutter config --enable-web

Write-Host "=== GETTING DEPENDENCIES ===" -ForegroundColor Yellow
flutter pub get

Write-Host "=== BUILDING FRESH PRODUCTION BUILD ===" -ForegroundColor Green
$buildDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$commitSha = git rev-parse --short HEAD
$deployId = "$(Get-Date -UFormat %s)-$commitSha"

# Determine redirect URL based on platform
if ($RedirectUrl -ne "") {
    $redirectUrl = $RedirectUrl
} elseif ($Platform -eq "local") {
    $redirectUrl = "http://localhost:8080"
} else {
    $redirectUrl = "https://mobile-scanner-flax-static.vercel.app"
}

Write-Host "Using redirect URL: $redirectUrl" -ForegroundColor Cyan

flutter build web --release `
  --pwa-strategy=none `
  --dart-define=ENV=prod `
  --dart-define=PROD_GUARD=1 `
  --dart-define=BUILD_DATE=$buildDate `
  --dart-define=SUPABASE_URL="https://iafjygownkhedereaoxw.supabase.co" `
  --dart-define=SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg" `
  --dart-define=SUPABASE_REDIRECT_URL=$redirectUrl

# Create version.json with deployment info
$versionJson = @{
    sha = $commitSha
    timestamp = $buildDate
    deployId = $deployId
    version = "1.0.5+6"
    redirectUrl = $redirectUrl
} | ConvertTo-Json

New-Item -ItemType Directory -Force -Path "build/web" | Out-Null
$versionJson | Out-File -FilePath "build/web/version.json" -Encoding utf8

Write-Host ""
Write-Host "=== BUILD COMPLETE ===" -ForegroundColor Green
Write-Host "Build output: build/web" -ForegroundColor Cyan
Write-Host "Version: 1.0.5+6" -ForegroundColor Cyan
Write-Host "Deploy ID: $deployId" -ForegroundColor Cyan
Write-Host "Redirect URL: $redirectUrl" -ForegroundColor Cyan
Write-Host ""

# Deploy based on platform
if ($Platform -eq "firebase" -or $Platform -eq "all") {
    Write-Host "=== DEPLOYING TO FIREBASE ===" -ForegroundColor Yellow
    firebase deploy --only hosting --project payparq-d-6rex95
    Write-Host "Firebase: https://payparq-d-6rex95.web.app/" -ForegroundColor Green
}

if ($Platform -eq "local" -or $Platform -eq "all") {
    Write-Host ""
    Write-Host "=== STARTING LOCAL SERVER ===" -ForegroundColor Yellow
    Write-Host "To test locally, run:" -ForegroundColor Cyan
    Write-Host "  cd build/web" -ForegroundColor White
    Write-Host "  python -m http.server 8080" -ForegroundColor White
    Write-Host "Then open: http://localhost:8080" -ForegroundColor White
}

if ($Platform -eq "cloudflare" -or $Platform -eq "all") {
    Write-Host ""
    Write-Host "=== CLOUDFLARE DEPLOYMENT ===" -ForegroundColor Yellow
    Write-Host "For Cloudflare Pages:" -ForegroundColor Cyan
    Write-Host "  1. Push to git (git push)" -ForegroundColor White
    Write-Host "  2. Cloudflare will auto-deploy from build/web" -ForegroundColor White
}

if ($Platform -eq "vercel" -or $Platform -eq "all") {
    Write-Host ""
    Write-Host "=== VERCEL DEPLOYMENT ===" -ForegroundColor Yellow
    Write-Host "For Vercel:" -ForegroundColor Cyan
    Write-Host "  1. Push to git (git push)" -ForegroundColor White
    Write-Host "  2. Vercel will auto-deploy using build.sh" -ForegroundColor White
    Write-Host "  3. URL: https://mobile-scanner-flax-static.vercel.app" -ForegroundColor White
}

Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Yellow
Write-Host "After deployment, check /version.json to verify:" -ForegroundColor Cyan
Write-Host "  - version: 1.0.5+6" -ForegroundColor White
Write-Host "  - redirectUrl: $redirectUrl" -ForegroundColor White
Write-Host "  - Recent timestamp" -ForegroundColor White
