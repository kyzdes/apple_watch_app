# Haptic Friends - Complete Setup Guide

This guide will walk you through setting up the complete Haptic Friends application from scratch.

## Prerequisites Checklist

- [ ] macOS 13+ (for iOS/watchOS development)
- [ ] Xcode 14+ installed
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed
- [ ] Redis 7+ installed
- [ ] Docker & Docker Compose (optional but recommended)
- [ ] Apple Developer Account (for testing on devices)
- [ ] Google Cloud Console account (for Google OAuth)

## Part 1: Backend Setup (30 minutes)

### Step 1: Database Setup

#### Option A: Using Docker (Recommended)

```bash
cd backend
docker-compose up -d postgres redis
```

#### Option B: Manual Installation

**Install PostgreSQL:**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql-15
sudo systemctl start postgresql
```

**Install Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

**Create Database:**
```bash
# Create user and database
psql postgres
CREATE USER haptic_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE haptic_friends OWNER haptic_user;
\q

# Run migrations
psql -U haptic_user -d haptic_friends -f migrations/001_initial_schema.sql
```

### Step 2: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and update:

```env
# Database
DB_PASSWORD=your_secure_password_from_step1

# JWT Secrets (generate strong random strings)
JWT_SECRET=run_openssl_rand_base64_32
JWT_REFRESH_SECRET=run_openssl_rand_base64_32

# Apple Sign In (get from Apple Developer Portal)
APPLE_CLIENT_ID=com.yourcompany.hapticfriends
APPLE_TEAM_ID=YOUR_10_CHAR_TEAM_ID
APPLE_KEY_ID=YOUR_10_CHAR_KEY_ID

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# APNS (get from Apple Developer Portal)
APNS_KEY_PATH=/path/to/AuthKey_KEYID.p8
APNS_KEY_ID=YOUR_10_CHAR_KEY_ID
APNS_TEAM_ID=YOUR_10_CHAR_TEAM_ID
APNS_TOPIC=com.yourcompany.hapticfriends
```

### Step 3: Install Dependencies & Start Server

```bash
cd backend
npm install
npm run build
npm start
```

Verify it's working:
```bash
curl http://localhost:3000/health
# Should return: {"success":true,"message":"Server is healthy",...}
```

## Part 2: Apple Developer Setup (20 minutes)

### Step 1: Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles → Identifiers → (+)
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Description: `Haptic Friends`
6. Bundle ID: `com.yourcompany.hapticfriends`
7. Capabilities:
   - ☑️ Sign in with Apple
   - ☑️ Push Notifications
   - ☑️ App Groups (create: `group.com.yourcompany.hapticfriends`)
8. Continue → Register

### Step 2: Create Watch App ID

1. Create another App ID
2. Description: `Haptic Friends Watch`
3. Bundle ID: `com.yourcompany.hapticfriends.watchkitapp`
4. Capabilities: Same as above
5. Register

### Step 3: Generate APNs Key

1. Certificates, Identifiers & Profiles → Keys → (+)
2. Key Name: `Haptic Friends APNs`
3. Enable: Apple Push Notifications service (APNs)
4. Continue → Register
5. Download `AuthKey_XXXXXXXXXX.p8`
6. Save Key ID (10 characters)
7. Move file to `backend/keys/` directory

### Step 4: Configure Sign in with Apple

1. Certificates, Identifiers & Profiles → Identifiers → Select your App ID
2. Sign in with Apple → Configure
3. Primary App ID: Select your app
4. Save

### Step 5: Create Provisioning Profiles

1. Profiles → (+) → iOS App Development
2. Select your App ID → Continue
3. Select your certificates → Continue
4. Select your devices → Continue
5. Name: `Haptic Friends Development`
6. Generate → Download
7. Repeat for Watch App

## Part 3: Google OAuth Setup (10 minutes)

### Step 1: Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create New Project → "Haptic Friends"
3. Enable APIs → Enable "Google+ API"

### Step 2: Configure OAuth Consent Screen

1. APIs & Services → OAuth consent screen
2. User Type: External → Create
3. App name: `Haptic Friends`
4. User support email: your-email@example.com
5. Authorized domains: `hapticfriends.app` (or your domain)
6. Developer contact: your-email@example.com
7. Save and Continue

### Step 3: Create OAuth Credentials

1. APIs & Services → Credentials → Create Credentials
2. OAuth client ID → iOS
3. Name: `Haptic Friends iOS`
4. Bundle ID: `com.yourcompany.hapticfriends`
5. Create
6. Copy Client ID
7. Also create Web application type for backend

### Step 4: Add Credentials to Backend

Update `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Part 4: iOS App Setup (20 minutes)

### Step 1: Open Xcode Project

```bash
cd ios/HapticFriends
open HapticFriends.xcodeproj
```

### Step 2: Configure Project Settings

1. Select project in navigator
2. General tab:
   - Bundle Identifier: `com.yourcompany.hapticfriends`
   - Team: Select your team
   - Version: 1.0.0
   - Build: 1
3. Signing & Capabilities:
   - Automatically manage signing: ✓
   - Team: Your team
   - Add Capability:
     - Sign in with Apple
     - Push Notifications
     - App Groups: `group.com.yourcompany.hapticfriends`

### Step 3: Configure Constants

Edit `ios/HapticFriends/Utils/Constants.swift`:

```swift
// For local development
static let baseURL = "http://YOUR_MAC_IP:3000/api/v1"
static let wsURL = "ws://YOUR_MAC_IP:3000"

// Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 4: Configure Info.plist

Add to `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- For development only! Remove for production -->
</dict>
```

### Step 5: Build and Run

1. Select iPhone simulator or your device
2. Product → Run (⌘R)
3. App should launch and show login screen

## Part 5: watchOS App Setup (15 minutes)

### Step 1: Configure Watch Target

1. In Xcode, select HapticFriendsWatch target
2. General tab:
   - Bundle Identifier: `com.yourcompany.hapticfriends.watchkitapp`
   - Team: Your team
3. Signing & Capabilities:
   - Sign in with Apple
   - Push Notifications
   - App Groups: Same as iOS app

### Step 2: Test on Watch Simulator

1. Select "HapticFriendsWatch" scheme
2. Select iPhone + Watch simulator pair
3. Product → Run
4. Watch app should install automatically

## Part 6: Testing the Complete Flow (30 minutes)

### Step 1: Create Test Accounts

1. Launch iOS app
2. Tap "Sign in with Apple"
3. Create first account with username `user1`
4. Logout
5. Create second account with username `user2`

### Step 2: Add Friends

1. Login as `user1`
2. Tap Friends tab
3. Tap "+" button
4. Search for `user2`
5. Send friend request
6. Switch to `user2` account
7. Accept friend request

### Step 3: Send Vibration

1. As `user1`, go to Send tab
2. Select `user2` as recipient
3. Choose "Heartbeat" pattern
4. Add ❤️ emoji
5. Tap "Send Vibration"
6. Should feel haptic feedback

### Step 4: Test Watch

1. With `user2` logged in on iPhone
2. Open Watch app on paired Watch
3. Send vibration from `user1` to `user2`
4. Watch should vibrate and display message

### Step 5: Test Real-time Updates

1. Have both accounts open in different simulators
2. Send friend request from one
3. Should appear instantly on the other
4. Test online/offline status
5. Verify WebSocket connection indicator

## Part 7: Production Deployment

### Backend Deployment

#### Option A: Docker on VPS

```bash
# On your server
git clone your-repo
cd backend

# Configure production .env
nano .env
# Set NODE_ENV=production
# Update all production URLs and secrets

# Start with Docker Compose
docker-compose up -d

# Setup SSL with Let's Encrypt
certbot --nginx -d api.yourdomain.com
```

#### Option B: Platform as a Service

Deploy to:
- **Render**: Easy PostgreSQL and Redis
- **Railway**: One-click deployment
- **Heroku**: Managed platform
- **AWS**: Full control

### iOS App Store Submission

1. **Prepare for Release:**
   ```swift
   // Update Constants.swift
   static let baseURL = "https://api.yourdomain.com/api/v1"
   static let wsURL = "wss://api.yourdomain.com"
   ```

2. **Create App Store Connect Entry:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - My Apps → (+) → New App
   - Fill in metadata, screenshots, etc.

3. **Archive and Upload:**
   - Product → Archive
   - Organizer → Distribute App
   - App Store Connect → Upload
   - Submit for Review

4. **Watch App:**
   - Included automatically with iOS app

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs -f

# Verify database
psql -U haptic_user -d haptic_friends -c "SELECT COUNT(*) FROM users;"

# Verify Redis
redis-cli ping
```

### iOS app can't connect

```bash
# Test API from command line
curl http://YOUR_IP:3000/health

# Check firewall
sudo ufw allow 3000

# Verify IP in Constants.swift matches
ifconfig | grep "inet "
```

### Sign in with Apple not working

1. Check Bundle ID matches Apple Developer Portal
2. Verify capabilities are enabled
3. Test on real device (simulator may have issues)
4. Check entitlements file

### Watch not receiving vibrations

1. Ensure iPhone and Watch are paired
2. Check Watch app is installed
3. Verify same account on both
4. Check Watch Connectivity status in app

### Haptics not working

1. Only works on real devices (iPhone 7+)
2. Check device haptic settings
3. Verify not in Low Power Mode
4. Test with different patterns

## Next Steps

- [ ] Set up continuous deployment (GitHub Actions)
- [ ] Add monitoring (Sentry, DataDog)
- [ ] Configure CDN for static assets
- [ ] Set up automated testing
- [ ] Create privacy policy and terms
- [ ] Submit for App Store review
- [ ] Set up analytics (optional)
- [ ] Create promotional materials

## Support

If you encounter issues:

1. Check logs: `docker-compose logs` or Xcode console
2. Verify all configuration files
3. Test each component individually
4. Check GitHub Issues
5. Contact support@hapticfriends.app

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Generate new JWT secrets
- [ ] Enable HTTPS only (no HTTP)
- [ ] Remove development NSAppTransportSecurity settings
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Configure CORS for your domain only
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Review and update dependencies
- [ ] Enable 2FA for all admin accounts

---

Congratulations! You now have Haptic Friends running end-to-end. 🎉
