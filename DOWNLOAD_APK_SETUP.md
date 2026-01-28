# Download APK Button - Setup Instructions

## ✅ Button Added Successfully!

The "Download APK" button has been added to the header of your Nav Goti web app.

### **Button Features:**
- ✅ **Always visible** - Shows on all devices
- ✅ **Green Android theme** - Styled with green color (`border-green-500/50`)
- ✅ **Responsive text** - Shows "Download APK" on desktop, "APK" on mobile
- ✅ **Download icon** - Uses Lucide's Download icon
- ✅ **Positioned before PWA button** - APK download comes first

---

## 📱 How to Add Your APK File

### **Step 1: Build Your Android APK**

If you haven't built the APK yet, you have two options:

#### **Option A: Use Capacitor (Recommended)**
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init

# Add Android platform
npx cap add android

# Build web assets
npm run build

# Copy to Android
npx cap copy android

# Open in Android Studio
npx cap open android

# Build APK in Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

#### **Option B: Use React Native or Expo**
Follow the mobile blueprint documentation in `GameApp_Mobile_Blueprint.md`

---

### **Step 2: Copy APK to Public Folder**

Once you have your APK file:

1. **Rename it** to `nav-goti.apk`
2. **Copy it** to the `public` folder:
   ```
   c:\Users\Roshan Talreja\Desktop\nine men game\orchid 2nd update mobile version\public\nav-goti.apk
   ```

---

### **Step 3: Deploy to Vercel**

After adding the APK file:

```bash
# Add the APK to git
git add public/nav-goti.apk

# Commit
git commit -m "feat: Add Android APK for download"

# Push to GitHub
git push origin main
```

Vercel will automatically deploy and the download button will work!

---

## 🎨 Button Styling

### **Desktop View:**
```
┌─────────────────────────────────────────────┐
│ [N] Nav Goti    Play  Learn  [Download APK] │
└─────────────────────────────────────────────┘
```

### **Mobile View:**
```
┌───────────────────────────┐
│ [N] Nav Goti      [APK]   │
└───────────────────────────┘
```

### **Colors:**
- **APK Button**: Green border (`border-green-500/50`)
- **PWA Button**: Blue border (`border-blue-500/50`)
- **Background**: Theme card background
- **Hover**: Green/Blue glow effect

---

## 📋 Button Code

```tsx
{/* Download APK Button - Always visible */}
<a
  href="/nav-goti.apk"
  download="nav-goti.apk"
  className="inline-flex"
>
  <Button
    variant="outline"
    className="flex items-center gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10"
    style={{ backgroundColor: theme.cardBg }}
  >
    <Download className="w-4 h-4" />
    <span className="hidden sm:inline">Download APK</span>
    <span className="sm:hidden">APK</span>
  </Button>
</a>
```

---

## 🔧 Temporary Solution (Until APK is Ready)

If you want to test the button before the APK is ready, you can:

### **Option 1: Link to GitHub Releases**
Change the href to point to your GitHub releases:
```tsx
href="https://github.com/RoshanJT5/Nav-Goti/releases/latest/download/nav-goti.apk"
```

### **Option 2: Link to External Host**
Upload APK to Google Drive, Dropbox, or Firebase Storage:
```tsx
href="https://drive.google.com/uc?export=download&id=YOUR_FILE_ID"
```

### **Option 3: Show "Coming Soon" Message**
Replace the button with a disabled state:
```tsx
<Button
  variant="outline"
  disabled
  className="flex items-center gap-2 border-green-500/50 text-green-500 opacity-50"
  style={{ backgroundColor: theme.cardBg }}
>
  <Download className="w-4 h-4" />
  <span className="hidden sm:inline">APK Coming Soon</span>
  <span className="sm:hidden">Soon</span>
</Button>
```

---

## 📦 APK File Size Recommendations

- **Optimal size**: 10-30 MB
- **Maximum size**: 100 MB (for easy download)
- **Compression**: Use Android App Bundle (.aab) for smaller size
- **Hosting**: GitHub releases support up to 2 GB files

---

## 🚀 Next Steps

1. ✅ **Button added** - Already done!
2. ⏳ **Build APK** - Use Capacitor or follow mobile blueprint
3. ⏳ **Add to public folder** - Copy `nav-goti.apk` to `public/`
4. ⏳ **Commit and push** - Deploy to Vercel
5. ⏳ **Test download** - Verify button works on deployed site

---

## 📱 Alternative: Progressive Web App (PWA)

Your app already supports PWA installation! The "Install App" button appears when:
- User visits on Chrome/Edge
- App meets PWA criteria
- Not already installed

**Benefits of PWA:**
- No APK needed
- Auto-updates
- Works on iOS too
- Smaller download size

**APK Benefits:**
- Works offline immediately
- Available on Google Play Store
- Better Android integration
- No browser required

---

## 🎯 Recommendation

**For now:**
1. Keep the "Download APK" button
2. Build the APK using Capacitor
3. Upload to `public/nav-goti.apk`
4. Deploy to Vercel

**Future:**
1. Publish to Google Play Store
2. Update button to link to Play Store
3. Keep direct APK download as alternative

---

**Implementation Date**: January 28, 2026  
**Button Location**: Header (right side, before profile)  
**Status**: ✅ **Button Added - Awaiting APK File**
