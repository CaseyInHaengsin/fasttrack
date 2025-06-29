# FastTrack Android App

Convert your FastTrack web application into a native Android app using Capacitor.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Android Studio** with Android SDK
3. **Java Development Kit (JDK)** 8 or higher

### Setup Environment

```bash
# Run the setup script
./build-android.sh setup

# Or manually install dependencies
npm install
npm install -g @capacitor/cli
```

### Environment Variables

Set the following environment variables:

```bash
# Android SDK path (usually ~/Android/Sdk on macOS/Linux)
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## 📱 Building the App

### Development Build

```bash
# Build and run on connected device/emulator
./build-android.sh dev

# Or manually
npm run build
npx cap sync android
npx cap run android
```

### Production Build

```bash
# Build for production
./build-android.sh prod

# Or manually
npm run build
npx cap sync android
npx cap open android
```

## 🔧 Configuration

### App Configuration

Edit `capacitor.config.ts` to customize:

- App ID: `com.fasttrack.app`
- App Name: `FastTrack`
- Icon and splash screen
- Permissions and plugins

### Android-Specific Settings

Edit `android/app/src/main/AndroidManifest.xml` for:

- Permissions
- App theme
- Launch configuration

## 📦 Features Added for Mobile

### Native Capabilities

- **Local Storage**: Persistent data storage using Capacitor Preferences
- **File System**: Save and share export files
- **Share API**: Native sharing of data exports
- **Status Bar**: Customized status bar styling
- **Splash Screen**: Custom splash screen with app branding
- **Keyboard Handling**: Automatic layout adjustments
- **Back Button**: Android back button handling

### Mobile Optimizations

- **Touch-friendly UI**: Larger touch targets (44px minimum)
- **Responsive Design**: Optimized for mobile screens
- **Safe Area Support**: Handles notched devices
- **Haptic Feedback**: Visual feedback for interactions
- **Offline Support**: Works without internet connection
- **Performance**: Optimized for mobile performance

### Storage Strategy

- **Primary**: Local device storage using Capacitor Preferences
- **Backup**: File system for larger data exports
- **Sync**: Optional API sync when online (web version)

## 🎨 Customization

### App Icon

Replace icons in `android/app/src/main/res/`:

- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

### Splash Screen

Edit `android/app/src/main/res/drawable/splash.xml` and add your splash image.

### App Colors

Modify `android/app/src/main/res/values/colors.xml`:

```xml
<color name="colorPrimary">#3B82F6</color>
<color name="colorPrimaryDark">#2563EB</color>
<color name="colorAccent">#60A5FA</color>
```

## 🔐 Signing and Release

### Generate Keystore

```bash
keytool -genkey -v -keystore fasttrack-release-key.keystore -alias fasttrack -keyalg RSA -keysize 2048 -validity 10000
```

### Build Signed APK

1. Open Android Studio: `npx cap open android`
2. Go to **Build > Generate Signed Bundle / APK**
3. Choose **APK**
4. Select your keystore file
5. Build release APK

### Alternative: Command Line Build

```bash
cd android
./gradlew assembleRelease
```

## 📱 Testing

### On Device

```bash
# Enable USB debugging on your Android device
# Connect device via USB
npx cap run android --target=device
```

### On Emulator

```bash
# Start Android emulator from Android Studio
# Or use command line
emulator -avd YOUR_AVD_NAME

# Run app
npx cap run android --target=emulator
```

## 🐛 Troubleshooting

### Common Issues

1. **ANDROID_HOME not set**
   ```bash
   export ANDROID_HOME=/path/to/android/sdk
   ```

2. **Gradle build fails**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

3. **App crashes on startup**
   - Check Android logs: `adb logcat`
   - Verify all required permissions in AndroidManifest.xml

4. **White screen on launch**
   - Ensure web build is successful: `npm run build`
   - Sync Capacitor: `npx cap sync android`

### Debug Mode

```bash
# Enable debug mode
npx cap run android --debug

# View logs
adb logcat | grep Capacitor
```

## 📊 Performance Tips

### Optimize Bundle Size

```bash
# Analyze bundle
npm run build -- --analyze

# Use production build
NODE_ENV=production npm run build
```

### Memory Management

- Use lazy loading for components
- Implement virtual scrolling for large lists
- Optimize images and assets

## 🔄 Updates

### Update Capacitor

```bash
npm update @capacitor/core @capacitor/cli @capacitor/android
npx cap sync android
```

### Update App

1. Update version in `package.json`
2. Build new APK
3. Upload to Google Play Store

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)

## 🎯 Next Steps

1. **Test thoroughly** on different devices and Android versions
2. **Optimize performance** for mobile devices
3. **Add app store assets** (screenshots, descriptions)
4. **Submit to Google Play Store**
5. **Set up CI/CD** for automated builds

---

**FastTrack Android App** - Your Personal Fasting Companion on Mobile 📱