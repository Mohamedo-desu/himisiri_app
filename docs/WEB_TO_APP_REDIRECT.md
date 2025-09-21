# Web-to-App Redirect Implementation

## Overview

This implementation ensures that when users click web links from shared content, they are automatically redirected to the app if installed, or given options to download the app if not installed.

## How It Works

### 1. Universal Links (iOS) & App Links (Android)

**iOS Universal Links:**

- Configuration: `public/.well-known/apple-app-site-association`
- When a user clicks `https://himisiri.expo.app/main/post/123`, iOS checks if the app is installed
- If installed: Opens the app directly with the deep link
- If not installed: Opens the web page with smart app banner

**Android App Links:**

- Configuration: `public/.well-known/assetlinks.json`
- When a user clicks a web link, Android checks for the app
- If installed: Opens the app with intent
- If not installed: Opens in browser with redirect logic

### 2. Smart Web Redirect

**Auto-Detection and Redirect:**

```javascript
// Detects mobile devices
if (
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
) {
  // Attempts to open app automatically
  attemptAppOpen();
}
```

**Platform-Specific Handling:**

**iOS:**

1. Tries Universal Link first (preferred)
2. Falls back to custom scheme `himisiri://`
3. Shows smart app banner if app not installed

**Android:**

1. Uses Android Intent URLs
2. Falls back to custom scheme
3. Shows manual open button if needed

### 3. User Experience Flow

1. **User clicks shared link** → `https://himisiri.expo.app/main/post/123`

2. **If app is installed:**
   - iOS: Opens app directly via Universal Links
   - Android: Opens app via App Links/Intent
   - User lands on the specific post with highlighting

3. **If app is not installed:**
   - Shows smart app banner (iOS)
   - Shows "Open in App" button (all platforms)
   - Provides download links to App Store/Play Store

### 4. Configuration Files

#### `apple-app-site-association`

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAM_ID.com.mohamedodesu.himisiri"],
        "components": [{ "/": "/main/post/*" }, { "/": "/main/user/*" }]
      }
    ]
  }
}
```

#### `assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.mohamedodesu.himisiri",
      "sha256_cert_fingerprints": ["..."]
    }
  }
]
```

#### App Configuration (`app.config.ts`)

```typescript
ios: {
  associatedDomains: ["applinks:himisiri.expo.app"]
},
android: {
  intentFilters: [
    {
      action: "VIEW",
      autoVerify: true,
      data: [{ scheme: "https", host: "himisiri.expo.app" }],
      category: ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

## Features

### ✅ **Automatic Redirection**

- No user action required
- Works on both iOS and Android
- Preserves deep link parameters

### ✅ **Fallback Options**

- Manual "Open in App" button
- App Store/Play Store download links
- Desktop-friendly messaging

### ✅ **Smart Detection**

- Detects if app is installed
- Platform-specific handling
- Graceful fallbacks

### ✅ **SEO & Social Friendly**

- Open Graph meta tags
- Twitter Card support
- Proper titles and descriptions

## Testing

### iOS Testing:

1. Share a post link
2. Open in Safari (not Chrome)
3. Should see smart app banner or auto-redirect

### Android Testing:

1. Share a post link
2. Open in any browser
3. Should auto-redirect or show intent chooser

### Desktop Testing:

1. Open shared link on desktop
2. Should show desktop-friendly message

## Troubleshooting

### Common Issues:

1. **Universal Links not working on iOS:**
   - Ensure `apple-app-site-association` is accessible at `https://himisiri.expo.app/.well-known/apple-app-site-association`
   - Check that the file has no `.json` extension
   - Verify Team ID is correct

2. **App Links not working on Android:**
   - Verify `assetlinks.json` is accessible
   - Check SHA256 fingerprint matches your signing certificate
   - Ensure `autoVerify: true` is set

3. **Deep links not preserving parameters:**
   - Check that query parameters are properly encoded
   - Verify the deep link handler processes all parameters

### Debug Commands:

**iOS:**

```bash
# Test Universal Links
xcrun simctl openurl booted "https://himisiri.expo.app/main/post/test123"
```

**Android:**

```bash
# Test App Links
adb shell am start -W -a android.intent.action.VIEW -d "https://himisiri.expo.app/main/post/test123"
```

## Production Checklist

- [ ] Update `YOUR_APP_STORE_ID` with actual App Store ID
- [ ] Update Team ID in `apple-app-site-association`
- [ ] Update SHA256 fingerprint with production certificate
- [ ] Test on real devices (not just simulators)
- [ ] Verify web files are served with correct MIME types
- [ ] Test with different browsers and devices
