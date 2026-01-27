# NAV-TIN - App Store Submission Guide

## Pre-Submission Checklist

### iOS App Store

#### App Information
- [ ] **App Name:** NAV-TIN - Nine Men's Morris
- [ ] **Subtitle:** Master the Ancient Strategy Game
- [ ] **Bundle ID:** com.navtin.ninemensmorris
- [ ] **Version:** 1.0.0
- [ ] **Category:** Games > Board > Strategy
- [ ] **Age Rating:** 4+ (Everyone)
- [ ] **Price:** Free (with In-App Purchases)

#### Build Requirements
- [ ] Xcode 15+ with Swift 5.9+
- [ ] iOS 15.0+ deployment target
- [ ] SwiftUI framework
- [ ] App Tracking Transparency (ATT) implemented
- [ ] Privacy manifest (PrivacyInfo.xcprivacy) included
- [ ] Code signing configured
- [ ] Archive created and validated

#### Privacy & Compliance
- [ ] Privacy Policy URL added
- [ ] App Tracking Transparency prompt configured
- [ ] Data collection disclosure completed
- [ ] Third-party SDK disclosures (Supabase, AdMob)
- [ ] Export compliance information provided
- [ ] Content rights verified

#### Assets
- [ ] App Icon (1024x1024px, no alpha channel)
- [ ] Launch Screen configured
- [ ] Screenshots (all required sizes)
- [ ] App Preview video (optional)
- [ ] Promotional artwork

---

### Google Play Store

#### App Information
- [ ] **App Name:** NAV-TIN - Nine Men's Morris
- [ ] **Short Description:** Master Nine Men's Morris with stunning Cyber Neon graphics
- [ ] **Full Description:** (See STORE_DESCRIPTION.md)
- [ ] **Package Name:** com.navtin.ninemensmorris
- [ ] **Version Code:** 1
- [ ] **Version Name:** 1.0.0
- [ ] **Category:** Board Games
- [ ] **Content Rating:** Everyone
- [ ] **Price:** Free (with In-App Purchases)

#### Build Requirements
- [ ] Android Studio with Kotlin 1.9+
- [ ] Minimum SDK: API 24 (Android 7.0)
- [ ] Target SDK: API 34 (Android 14)
- [ ] Jetpack Compose
- [ ] App Bundle (.aab) generated
- [ ] ProGuard/R8 configured
- [ ] Signing key configured

#### Privacy & Compliance
- [ ] Privacy Policy URL added
- [ ] Data Safety section completed
- [ ] Permissions justified
- [ ] Third-party SDK disclosures
- [ ] Target audience selected
- [ ] Ads declaration completed

#### Assets
- [ ] App Icon (512x512px, 32-bit PNG)
- [ ] Feature Graphic (1024x500px)
- [ ] Screenshots (2-8 images)
- [ ] Promotional video (optional)

---

## Build Process

### iOS Build Steps

```bash
# 1. Clean build folder
cd mobile/ios
xcodebuild clean

# 2. Update version and build number
# Edit Info.plist or use agvtool

# 3. Archive the app
xcodebuild archive \
  -workspace NavTin.xcworkspace \
  -scheme NavTin \
  -archivePath NavTin.xcarchive

# 4. Export for App Store
xcodebuild -exportArchive \
  -archivePath NavTin.xcarchive \
  -exportPath NavTin-AppStore \
  -exportOptionsPlist ExportOptions.plist

# 5. Validate before upload
xcrun altool --validate-app \
  -f NavTin-AppStore/NavTin.ipa \
  -t ios \
  -u YOUR_APPLE_ID \
  -p YOUR_APP_SPECIFIC_PASSWORD

# 6. Upload to App Store Connect
xcrun altool --upload-app \
  -f NavTin-AppStore/NavTin.ipa \
  -t ios \
  -u YOUR_APPLE_ID \
  -p YOUR_APP_SPECIFIC_PASSWORD
```

### Android Build Steps

```bash
# 1. Clean build
cd mobile/android
./gradlew clean

# 2. Update version in build.gradle
# versionCode 1
# versionName "1.0.0"

# 3. Build release bundle
./gradlew bundleRelease

# 4. Sign the bundle (if not auto-signed)
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore navtin-release.keystore \
  app/build/outputs/bundle/release/app-release.aab \
  navtin-key-alias

# 5. Verify bundle
bundletool build-apks \
  --bundle=app/build/outputs/bundle/release/app-release.aab \
  --output=navtin.apks

# 6. Upload to Google Play Console
# Use Google Play Console web interface or:
# fastlane supply --aab app/build/outputs/bundle/release/app-release.aab
```

---

## App Store Connect Configuration

### iOS Submission

1. **Login to App Store Connect**
   - https://appstoreconnect.apple.com

2. **Create New App**
   - My Apps > + > New App
   - Platform: iOS
   - Name: NAV-TIN - Nine Men's Morris
   - Primary Language: English (U.S.)
   - Bundle ID: com.navtin.ninemensmorris
   - SKU: NAVTIN-001

3. **App Information**
   - Subtitle: Master the Ancient Strategy Game
   - Category: Games > Board
   - Secondary Category: Games > Strategy
   - Content Rights: Own or have rights to use

4. **Pricing and Availability**
   - Price: Free
   - Availability: All territories
   - Pre-order: No

5. **App Privacy**
   - Privacy Policy URL: https://navtin.game/privacy
   - Data Types Collected:
     - User ID
     - Device ID
     - Usage Data
     - Advertising Data
   - Data Use: Analytics, Advertising, App Functionality

6. **App Review Information**
   - Contact: support@navtin.game
   - Phone: +1-XXX-XXX-XXXX
   - Demo Account: Not required (guest login available)
   - Notes: "App supports guest login. No account required to test."

7. **Version Information**
   - Version: 1.0.0
   - Copyright: 2026 NAV-TIN
   - Description: (See STORE_DESCRIPTION.md)
   - Keywords: nine mens morris, mill game, strategy, board game, multiplayer
   - Support URL: https://navtin.game/support
   - Marketing URL: https://navtin.game

8. **Build**
   - Select uploaded build
   - Export Compliance: No encryption

9. **Screenshots**
   - Upload all required sizes
   - Add captions

10. **Submit for Review**

---

### Google Play Console Configuration

1. **Login to Google Play Console**
   - https://play.google.com/console

2. **Create New App**
   - Create app
   - App name: NAV-TIN - Nine Men's Morris
   - Default language: English (United States)
   - App or game: Game
   - Free or paid: Free

3. **Store Listing**
   - Short description: (160 characters max)
   - Full description: (See STORE_DESCRIPTION.md)
   - App icon: Upload 512x512px PNG
   - Feature graphic: Upload 1024x500px
   - Screenshots: Upload 2-8 images
   - Video: (Optional) YouTube URL

4. **Store Settings**
   - App category: Board
   - Tags: Strategy, Multiplayer, Classic
   - Contact details:
     - Email: support@navtin.game
     - Website: https://navtin.game
     - Phone: +1-XXX-XXX-XXXX

5. **Main Store Listing**
   - Privacy policy: https://navtin.game/privacy

6. **Data Safety**
   - Data collection and security
   - Data types:
     - Personal info: User ID
     - App activity: In-app actions
     - Device or other IDs: Advertising ID
   - Data usage: Analytics, Advertising, App functionality
   - Data sharing: With third parties (AdMob, Supabase)

7. **App Content**
   - Target audience: Everyone
   - Content rating: ESRB Everyone, PEGI 3
   - Ads: Yes, contains ads
   - In-app purchases: No (or Yes if implementing)

8. **Release**
   - Countries: All available
   - Production track
   - Upload AAB
   - Release name: 1.0.0 - Initial Release
   - Release notes: "Welcome to NAV-TIN! Experience Nine Men's Morris with stunning Cyber Neon graphics, AI opponents, and online multiplayer."

9. **Review and Publish**

---

## Testing Before Submission

### iOS TestFlight
```bash
# Upload to TestFlight
# 1. Archive and upload as described above
# 2. In App Store Connect:
#    - Select build
#    - Add to TestFlight
#    - Add internal/external testers
#    - Distribute
```

### Android Internal Testing
```bash
# Upload to Internal Testing track
# 1. In Google Play Console:
#    - Release > Testing > Internal testing
#    - Create new release
#    - Upload AAB
#    - Add testers (email addresses)
#    - Review and roll out
```

---

## Post-Submission Monitoring

### iOS
- [ ] Monitor App Store Connect for review status
- [ ] Respond to any review feedback within 24 hours
- [ ] Check crash reports in Xcode Organizer
- [ ] Monitor user reviews and ratings
- [ ] Prepare for potential rejection reasons:
  - Missing ATT prompt
  - Privacy policy issues
  - Misleading screenshots
  - App crashes

### Android
- [ ] Monitor Google Play Console for review status
- [ ] Check pre-launch report
- [ ] Review crash analytics
- [ ] Monitor user reviews and ratings
- [ ] Prepare for potential rejection reasons:
  - Missing privacy policy
  - Data safety issues
  - Inappropriate content
  - App crashes

---

## Common Rejection Reasons & Solutions

### iOS
1. **Missing ATT Prompt**
   - Solution: Ensure NSUserTrackingUsageDescription in Info.plist

2. **Privacy Policy Issues**
   - Solution: Host privacy policy on accessible URL

3. **Misleading Metadata**
   - Solution: Ensure screenshots match actual app

4. **App Crashes**
   - Solution: Test thoroughly on all supported devices

### Android
1. **Missing Privacy Policy**
   - Solution: Add URL in Store Listing

2. **Data Safety Incomplete**
   - Solution: Fill out all required sections

3. **Target SDK Too Low**
   - Solution: Update to latest target SDK (API 34)

4. **Permissions Not Justified**
   - Solution: Remove unused permissions or add justification

---

## Support & Resources

### Apple
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect Help: https://help.apple.com/app-store-connect/
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

### Google
- Google Play Policies: https://play.google.com/about/developer-content-policy/
- Play Console Help: https://support.google.com/googleplay/android-developer/
- Material Design: https://material.io/design

---

## Timeline Estimate

- **iOS Review:** 1-3 days (typically 24-48 hours)
- **Android Review:** 1-7 days (typically 2-3 days)
- **Total Time to Launch:** 1-2 weeks (including preparation)

---

**Good luck with your submission! 🚀**
