# How to run Nav Goti on Android Emulator

I have configured the project to support Android using **Capacitor**. This allows you to run your Next.js application as a native Android app.

## Prerequisites
- Android Studio installed.
- Android SDK installed (you mentioned you have API 34).

## Steps to Run in Android Studio

1. **Open Android Studio**.
2. Click on **Open** (or File > Open).
3. Navigate to and select the `android` folder in the project root:
   `c:\Users\Roshan Talreja\Desktop\nine men game\orchid 2nd update mobile version\android`
4. **Wait for Gradle to sync**. This might take a few minutes the first time.
5. Once synced, select your emulator (the one you started) from the device dropdown at the top.
6. Click the **green Play button (Run 'app')**.

---

## Technical Changes Made
To make this work, I have:
1. **Installed Capacitor**: Added `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
2. **Updated `next.config.ts`**: Enabled static export (`output: 'export'`) and disabled image optimization, as mobile apps run from static files.
3. **Initialized Capacitor**: Created `capacitor.config.ts` pointing to the `out` folder.
4. **Generated Android Project**: Created the `android` folder in your project root which contains all native files.
5. **Built the App**: Ran `npm run build` to generate the web assets for the mobile app.

---

## How to Update the App
If you change your code in `src/` and want to see the changes in the emulator:

1. **Build the web project**:
   ```bash
   npm run build
   ```
2. **Sync with Android**:
   ```bash
   npx cap sync android
   ```
3. **Run in Android Studio**:
   Click the **Play** button again.

---

## Troubleshooting
- **Gradle Sync Errors**: If you see errors during Gradle sync, make sure you have an internet connection and the correct Android SDK versions installed.
- **App not showing up**: Ensure you opened the `android` folder specifically, NOT the root project folder in Android Studio.
- **Icon/Splash Screen**: Currently it uses default Capacitor icons. You can change these later using `@capacitor/assets`.
