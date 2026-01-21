# Fast Deploy Script for PayParq
# Usage: ./fast_deploy.ps1

Write-Host "Starting Fast Build & Deploy..." -ForegroundColor Cyan

# Move to app directory
Set-Location "$PSScriptRoot/apps/mobile-scanner"

# Build Web (Optimized)
Write-Host "Building Flutter Web (No-Cache)..." -ForegroundColor Yellow
flutter build web --release --no-tree-shake-icons --pwa-strategy=none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Complete. Deploying to Firebase..." -ForegroundColor Green
    # Deploy to Firebase
    firebase deploy --only hosting --project payparq-d-6rex95
    Write-Host "LIVE AT: https://payparq-d-6rex95.web.app/" -ForegroundColor Green
} else {
    Write-Host "Build Failed. Please check errors." -ForegroundColor Red
}
