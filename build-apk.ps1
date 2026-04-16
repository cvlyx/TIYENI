# Tiyeni APK Builder
# Builds Android APK locally

Write-Host "`n🏗️  Tiyeni APK Builder" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Android SDK is installed
if (-not $env:ANDROID_HOME) {
    Write-Host "❌ ANDROID_HOME not set!" -ForegroundColor Red
    Write-Host "Please install Android Studio and set ANDROID_HOME" -ForegroundColor Yellow
    Write-Host "See BUILD_LOCALLY.md for instructions`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Android SDK found: $env:ANDROID_HOME`n" -ForegroundColor Green

# Navigate to project
$projectPath = "artifacts/tiyeni"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Project not found at $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "📂 Working directory: $(Get-Location)`n" -ForegroundColor Cyan

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed`n" -ForegroundColor Green

# Run prebuild
Write-Host "🔧 Running Expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prebuild complete`n" -ForegroundColor Green

# Build APK
Write-Host "🚀 Building APK (this may take 5-10 minutes)..." -ForegroundColor Yellow
Set-Location android

if (Test-Path ".\gradlew.bat") {
    .\gradlew.bat assembleRelease
} elseif (Test-Path ".\gradlew") {
    .\gradlew assembleRelease
} else {
    Write-Host "❌ Gradle wrapper not found" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host "`n✅ APK built successfully!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

$apkPath = "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $fullPath = Resolve-Path $apkPath
    Write-Host "📱 APK Location:" -ForegroundColor Cyan
    Write-Host "   $fullPath`n" -ForegroundColor White
    
    $size = (Get-Item $apkPath).Length / 1MB
    Write-Host "📊 APK Size: $([math]::Round($size, 2)) MB`n" -ForegroundColor Cyan
    
    Write-Host "🎉 Ready to install on your device!" -ForegroundColor Green
} else {
    Write-Host "⚠️  APK file not found at expected location" -ForegroundColor Yellow
    Write-Host "Check: android/app/build/outputs/apk/release/" -ForegroundColor Yellow
}
