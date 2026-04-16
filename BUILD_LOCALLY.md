# 🏗️ Build Tiyeni APK Locally (Free)

Since GitHub Actions and EAS are blocked, let's build on your computer!

## Prerequisites (One-time setup)

### 1. Install Android Studio
1. Download: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio
4. Go to: Tools → SDK Manager
5. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### 2. Set Environment Variables
**Windows PowerShell (Run as Administrator):**
```powershell
# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')

# Add to PATH
$path = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPath = "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\tools;$env:LOCALAPPDATA\Android\Sdk\tools\bin"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')

# Restart PowerShell after this
```

## Build Steps (5-10 minutes)

### Step 1: Clean Install
```powershell
cd artifacts/tiyeni
npm install --legacy-peer-deps
```

### Step 2: Run Prebuild
```powershell
npx expo prebuild --platform android --clean
```

### Step 3: Build APK
```powershell
cd android
.\gradlew assembleRelease
```

### Step 4: Find Your APK
```
artifacts/tiyeni/android/app/build/outputs/apk/release/app-release.apk
```

## 🎯 Quick Build Script

Save this as `build-apk.ps1`:
```powershell
# Build Tiyeni APK
Write-Host "🏗️ Building Tiyeni APK..." -ForegroundColor Green

# Navigate to project
Set-Location "artifacts/tiyeni"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# Prebuild
Write-Host "🔧 Running Expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean

# Build APK
Write-Host "🚀 Building APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease

# Success
Write-Host "✅ APK built successfully!" -ForegroundColor Green
Write-Host "📱 Location: android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor Cyan
```

Run it:
```powershell
.\build-apk.ps1
```

## 🐛 Troubleshooting

### "gradlew: command not found"
```powershell
# Make sure you're in the android directory
cd artifacts/tiyeni/android
# Try with full path
.\gradlew.bat assembleRelease
```

### "ANDROID_HOME not set"
```powershell
# Check if set
echo $env:ANDROID_HOME
# Should show: C:\Users\YOUR_NAME\AppData\Local\Android\Sdk

# If not, set it:
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### "SDK not found"
1. Open Android Studio
2. Tools → SDK Manager
3. Install Android 34 (API Level 34)
4. Click Apply

### Build fails with memory error
```powershell
# Increase Gradle memory
cd artifacts/tiyeni/android
# Edit gradle.properties, add:
# org.gradle.jvmargs=-Xmx4096m
```

## ⚡ Even Faster: Use Expo Development Build

Instead of building APK every time, build once and use hot reload:

### One-time: Build Development APK
```powershell
cd artifacts/tiyeni
npx expo prebuild --platform android
cd android
.\gradlew assembleDebug
```

### Then: Use Hot Reload
```powershell
cd artifacts/tiyeni
npx expo start --dev-client
```

Install the debug APK once, then all changes reload instantly!

## 📊 Build Times

- **First build**: 10-15 minutes (downloads dependencies)
- **Subsequent builds**: 3-5 minutes
- **With hot reload**: Instant updates!

## 💡 Pro Tips

1. **Use Debug builds for testing**: Faster, no signing needed
2. **Use Release builds for distribution**: Optimized, signed
3. **Keep Android Studio open**: Helps with SDK issues
4. **Use hot reload for development**: Build once, update instantly

## 🎉 Success!

Once built, your APK will be at:
```
artifacts/tiyeni/android/app/build/outputs/apk/release/app-release.apk
```

Transfer to your phone and install!
