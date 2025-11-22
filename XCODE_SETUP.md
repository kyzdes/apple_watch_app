# Xcode Project Setup Guide

This guide will help you properly configure the Xcode project for the Haptic Friends iOS and watchOS applications.

## Project Structure

```
apple_watch_app/
├── ios/                      # iOS App (Swift/SwiftUI)
├── watchos/                  # watchOS App (Swift/SwiftUI)
├── backend/                  # Node.js Backend API
├── webapp/                   # React Web Application
├── docker-compose.yml        # Docker orchestration
├── nginx-proxy.conf          # Nginx configuration
└── .env.example             # Environment variables template
```

**IMPORTANT**: Only the `ios/` and `watchos/` directories should be included in your Xcode workspace. The `backend/`, `webapp/`, and root configuration files are for server deployment only.

## Xcode Project Configuration

### Step 1: Remove Backend/Webapp Files from Xcode Target

When you first open the Xcode project, you may see build errors about "Multiple commands produce" various files. This happens when backend and webapp files are incorrectly added to the iOS app target.

**To fix this:**

1. **Open your Xcode project**
2. **Select your iOS target** in the project navigator
3. **Go to Build Phases tab**
4. **Expand "Copy Bundle Resources"**
5. **Remove the following files/folders if present:**
   - `backend/` (entire folder)
   - `webapp/` (entire folder)
   - `docker-compose.yml`
   - `nginx-proxy.conf`
   - `.env.example`
   - Root `README.md`
   - Any `.js`, `.ts`, `.json`, `.conf` files from backend/webapp

6. **Repeat for watchOS target** if necessary

### Step 2: Verify File References

Ensure your Xcode project only references files in these directories:

**iOS Target should include:**
- `ios/HapticFriends/` (all Swift files)
- `ios/HapticFriends/Assets.xcassets`
- `ios/HapticFriends/Info.plist`
- `ios/HapticFriends/HapticFriends.entitlements`

**watchOS Target should include:**
- `watchos/HapticFriendsWatch/` (all Swift files)
- `watchos/HapticFriendsWatch/Assets.xcassets`
- `watchos/HapticFriendsWatch/Info.plist`
- `watchos/HapticFriendsWatch/HapticFriendsWatch.entitlements`

### Step 3: Clean Build Folder

After removing incorrect file references:

1. **In Xcode menu**: Product → Clean Build Folder (⇧⌘K)
2. **Close Xcode**
3. **Delete Derived Data:**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/HapticFriends-*
   ```
4. **Reopen Xcode**

### Step 4: Configure Signing & Capabilities

**iOS Target:**
1. Select your iOS target
2. Go to "Signing & Capabilities" tab
3. Configure your Team and Bundle Identifier
4. Ensure these capabilities are enabled:
   - Sign in with Apple
   - Push Notifications
   - Background Modes (Remote notifications)
   - Keychain Sharing

**watchOS Target:**
1. Select your watchOS target
2. Go to "Signing & Capabilities" tab
3. Configure your Team and Bundle Identifier
4. Ensure these capabilities are enabled:
   - Push Notifications

### Step 5: Update Constants

Before building, update the API configuration in:

**File:** `ios/HapticFriends/Utils/Constants.swift`

```swift
struct Constants {
    static let apiBaseURL = "https://your-server.com/api/v1"  // Update this
    static let websocketURL = "https://your-server.com"        // Update this

    // ... rest of the file
}
```

Replace `your-server.com` with your actual backend server URL.

## Building and Running

### Prerequisites

- **Xcode 14.0+** (for iOS 16+ and watchOS 9+)
- **macOS Ventura 13.0+**
- **Apple Developer Account** (for device testing and App Store distribution)

### Build for Simulator

1. **Select iOS Simulator** from the scheme selector (e.g., iPhone 14 Pro)
2. **Press ⌘R** to build and run
3. The watchOS app will automatically run in the paired Watch simulator

### Build for Physical Device

1. **Connect your iPhone** via USB
2. **Select your iPhone** from the scheme selector
3. **Ensure your Apple Watch is paired** with the iPhone
4. **Press ⌘R** to build and run
5. **Accept code signing** if prompted on your device

## Troubleshooting

### Error: "Multiple commands produce..."

**Solution:** Follow Step 1 above to remove backend/webapp files from Copy Bundle Resources.

### Error: "No such module 'Socket'"

**Solution:** Ensure you're using Swift Package Manager dependencies correctly. The project uses URLSession for networking, not external socket libraries.

### Error: "Failed to register for remote notifications"

**Solution:**
1. Ensure Push Notifications capability is enabled
2. Test on a physical device (push notifications don't work in simulator)
3. Check that your APNS certificates are configured in the backend

### Error: "Signing for HapticFriends requires a development team"

**Solution:**
1. Go to Signing & Capabilities
2. Select your Team from the dropdown
3. Xcode will automatically manage provisioning profiles

### Backend Connection Issues

**Solution:**
1. Ensure backend server is running: `docker-compose up -d`
2. Update `Constants.swift` with correct backend URL
3. For local development, use your Mac's IP address: `http://192.168.1.X:3000/api/v1`
4. Ensure firewall allows connections on port 3000

## Code Architecture

### iOS App Structure

```
ios/HapticFriends/
├── App/
│   ├── HapticFriendsApp.swift          # App entry point
│   └── ContentView.swift               # Main tab view
├── Models/
│   ├── User.swift                      # User data models
│   └── Vibration.swift                 # Vibration models
├── Services/
│   ├── APIClient.swift                 # REST API client
│   ├── AuthService.swift               # Authentication
│   ├── WebSocketManager.swift          # Real-time communication
│   ├── HapticManager.swift             # CoreHaptics integration
│   └── NotificationManager.swift       # APNS handling
├── ViewModels/
│   ├── AuthViewModel.swift             # Auth state
│   ├── FriendsViewModel.swift          # Friends management
│   └── VibrationViewModel.swift        # Vibration sending
├── Views/
│   ├── LoginView.swift                 # Login screen
│   ├── FriendsView.swift               # Friends list
│   ├── VibrationSendView.swift         # Send vibrations
│   ├── HistoryView.swift               # Vibration history
│   └── SettingsView.swift              # User settings
└── Utils/
    ├── Constants.swift                 # Configuration
    └── KeychainHelper.swift            # Secure storage
```

### watchOS App Structure

```
watchos/HapticFriendsWatch/
├── HapticFriendsWatchApp.swift         # Watch app entry point
├── Views/
│   └── WatchContentView.swift          # Main watch interface
├── Models/
│   └── WatchVibration.swift            # Watch data models
└── Services/
    ├── WatchHapticManager.swift        # WKInterfaceDevice haptics
    ├── WatchConnectivityManager.swift  # iPhone sync
    └── WatchVibrationManager.swift     # Vibration handling
```

## Development Workflow

### 1. Backend Development

Start the backend services:
```bash
cd /path/to/apple_watch_app
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f api
```

### 2. iOS/watchOS Development

1. Open Xcode project
2. Make changes to Swift code
3. Build and run (⌘R)
4. Test on simulator or device

### 3. Web App Development

```bash
cd webapp
npm install
npm run dev
# Access at http://localhost:3001
```

## Deployment

### iOS App Store Submission

1. **Archive the app**: Product → Archive
2. **Validate the archive**: Window → Organizer → Validate App
3. **Upload to App Store Connect**: Distribute App → App Store Connect
4. **Submit for review** in App Store Connect

### TestFlight Distribution

1. **Archive the app**: Product → Archive
2. **Upload to App Store Connect**: Distribute App → App Store Connect
3. **Invite testers** in App Store Connect → TestFlight

## Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [watchOS App Development](https://developer.apple.com/documentation/watchos-apps)
- [Core Haptics Guide](https://developer.apple.com/documentation/corehaptics)
- [Push Notifications Setup](https://developer.apple.com/documentation/usernotifications)

## Support

For issues related to:
- **iOS/watchOS code**: Check Swift files in `ios/` and `watchos/`
- **Backend API**: See `backend/README.md`
- **Web App**: See `webapp/README.md`
- **Docker deployment**: See root `README.md`

---

**Last Updated:** 2025-11-22
