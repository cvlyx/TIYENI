# Build APK Using Android Studio (Easiest Method)

Since Gradle download is timing out, let's use Android Studio directly:

## Steps (5 minutes):

### 1. Open Project in Android Studio
1. Open Android Studio
2. Click **"Open"**
3. Navigate to: `C:\Users\EXRA ORDINARY\Documents\Malawi-Connect\artifacts\tiyeni\android`
4. Click **"OK"**

### 2. Wait for Gradle Sync
- Android Studio will automatically download Gradle
- Wait for "Gradle sync finished" message (bottom right)
- This takes 2-5 minutes first time

### 3. Build APK
1. Click **"Build"** menu → **"Build Bundle(s) / APK(s)"** → **"Build APK(s)"**
2. Wait for build to complete (~5 minutes)
3. Click **"locate"** in the notification that appears

### 4. Find Your APK
Location: `artifacts\tiyeni\android\app\build\outputs\apk\release\app-release.apk`

## ✅ Done!
Transfer the APK to your phone and install!

---

## Alternative: Command Line (if Android Studio method works)

Once Android Studio has downloaded Gradle, you can use command line:

```powershell
cd artifacts\tiyeni\android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleRelease
```

The APK will be at: `app\build\outputs\apk\release\app-release.apk`
