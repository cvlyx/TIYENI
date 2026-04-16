# Quick APK Build Script
Write-Host "🏗️ Building Tiyeni APK...`n" -ForegroundColor Cyan

# Set Android Home
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
Write-Host "✓ ANDROID_HOME: $env:ANDROID_HOME`n" -ForegroundColor Green

# Navigate to project
Set-Location "artifacts\tiyeni"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# Prebuild
Write-Host "`n🔧 Running Expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean

# Build
Write-Host "`n🚀 Building APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease

Write-Host "`n✅ Done! APK at: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Green
