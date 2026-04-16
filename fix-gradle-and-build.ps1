# Fix Gradle Download and Build APK
Write-Host "🔧 Fixing Gradle and Building APK`n" -ForegroundColor Cyan

# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "✓ JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "✓ ANDROID_HOME: $env:ANDROID_HOME`n" -ForegroundColor Green

# Navigate to android directory
Set-Location "artifacts\tiyeni\android"

# Download Gradle manually
$gradleVersion = "8.14.3"
$gradleUrl = "https://services.gradle.org/distributions/gradle-$gradleVersion-bin.zip"
$gradleZip = "$env:TEMP\gradle-$gradleVersion-bin.zip"
$gradleHome = "$env:USERPROFILE\.gradle\wrapper\dists\gradle-$gradleVersion-bin"

Write-Host "📥 Downloading Gradle $gradleVersion..." -ForegroundColor Yellow
Write-Host "This may take a few minutes (150MB download)...`n" -ForegroundColor Yellow

try {
    # Download with progress
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $gradleUrl -OutFile $gradleZip -TimeoutSec 300
    Write-Host "✓ Downloaded Gradle`n" -ForegroundColor Green
    
    # Extract
    Write-Host "📦 Extracting Gradle..." -ForegroundColor Yellow
    if (-not (Test-Path $gradleHome)) {
        New-Item -ItemType Directory -Path $gradleHome -Force | Out-Null
    }
    Expand-Archive -Path $gradleZip -DestinationPath $gradleHome -Force
    Write-Host "✓ Extracted Gradle`n" -ForegroundColor Green
    
    # Clean up
    Remove-Item $gradleZip -Force
    
} catch {
    Write-Host "❌ Failed to download Gradle: $_" -ForegroundColor Red
    Write-Host "`nTry downloading manually from:" -ForegroundColor Yellow
    Write-Host $gradleUrl -ForegroundColor Cyan
    exit 1
}

# Now build
Write-Host "🚀 Building APK (this will take 5-10 minutes)...`n" -ForegroundColor Yellow
.\gradlew.bat assembleRelease --no-daemon

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ APK Built Successfully!" -ForegroundColor Green
    Write-Host "📱 Location: app\build\outputs\apk\release\app-release.apk`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed" -ForegroundColor Red
}
