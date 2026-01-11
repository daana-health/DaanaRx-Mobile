# Quick Start Guide - DaanaRx Mobile

Get up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version
npm --version

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli
```

## Step 1: Install Dependencies (2 minutes)

```bash
cd DaanaRx-Mobile
npm install
```

## Step 2: Configure Environment (1 minute)

```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

**Required values in `.env`:**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql
```

**Important for Physical Devices:**
If testing on a physical device, replace `localhost` with your computer's IP address:
```bash
# Find your IP address
# Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# Then use in .env:
EXPO_PUBLIC_GRAPHQL_URL=http://192.168.1.XXX:3000/api/graphql
```

## Step 3: Start Backend Server (1 minute)

In a separate terminal:

```bash
cd ../DaanarRX
npm run dev
```

Wait for: `Server running on http://localhost:3000`

## Step 4: Start Mobile App (1 minute)

Back in the DaanaRx-Mobile directory:

```bash
npm start
```

You'll see a QR code and menu:

```
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web
```

## Choose Your Platform

### Option A: iOS Simulator (Mac only)

```bash
# Press 'i' or run:
npm run ios
```

### Option B: Android Emulator

```bash
# Press 'a' or run:
npm run android
```

Make sure Android Studio is installed and an emulator is running.

### Option C: Physical Device (Recommended)

1. Install **Expo Go** from App Store or Play Store
2. Scan the QR code shown in terminal
3. App will load on your device

**Troubleshooting Device Connection:**
- Ensure device and computer are on same Wi-Fi
- Update GraphQL URL in `.env` to use computer's IP (not localhost)
- Restart Expo dev server after changing `.env`

## Step 5: Test the App

1. **Sign Up** - Create a new clinic account
   - Enter clinic name, email, and password
   - Tap "Create Account"

2. **Sign In** - Login with your account
   - Enter email and password
   - Tap "Sign In"

3. **Explore** - Navigate through the tabs
   - Dashboard
   - Check In
   - Check Out
   - Inventory
   - More (Settings)

## Verify Everything Works

### ✅ Success Checklist

- [ ] App launches without errors
- [ ] Can see Sign In screen
- [ ] Can create a new account
- [ ] Can sign in successfully
- [ ] See 5 tabs at bottom after login
- [ ] Can navigate between tabs
- [ ] Can logout from Settings tab
- [ ] App remembers login after restart

### ❌ Common Issues

**"Network request failed"**
```bash
# Check backend is running
curl http://localhost:3000/api/health

# If on physical device, use computer IP instead of localhost in .env
```

**"Unable to resolve module"**
```bash
# Clear cache and restart
npx expo start -c
```

**"Permission denied" for camera**
- Grant camera permission in device settings
- Restart the app

**iOS Simulator not opening**
```bash
# Make sure Xcode is installed
xcode-select --install

# Reset simulator
npx expo start --ios --clear
```

**Android Emulator not opening**
```bash
# Make sure Android Studio is installed
# Start emulator manually from Android Studio

# Or specify emulator:
npm run android -- -e emulator-name
```

## What's Working Now

✅ **Authentication**
- Sign up with clinic creation
- Sign in with email/password
- Auto-login with persisted token
- Logout

✅ **Navigation**
- Bottom tabs for main features
- Stack navigation for modals
- Protected routes (auth required)
- Role-based tab visibility

✅ **State Management**
- Redux store configured
- AsyncStorage persistence
- Auth state management

✅ **Backend Integration**
- Apollo Client for GraphQL
- Supabase client
- JWT authentication

## What's Coming Next

🚧 **To Be Implemented**
- Dashboard statistics
- Full Check-In workflow
- Full Check-Out workflow
- QR code scanning
- Inventory list and search
- Transaction reports
- Admin location management
- Settings and user management

See `PROJECT_SUMMARY.md` for complete implementation plan.

## Development Workflow

### Making Changes

1. **Edit Code**
   ```bash
   # Changes auto-reload in Expo
   # Edit files in src/
   ```

2. **Debug**
   ```bash
   # View logs in terminal
   # Or shake device and tap "Debug Remote JS"
   ```

3. **Add Dependencies**
   ```bash
   npm install package-name
   # Restart Expo after installing native modules
   ```

4. **Clear Cache** (if seeing stale data)
   ```bash
   npx expo start -c
   ```

### Hot Reloading

Expo has Fast Refresh enabled by default:
- Edit a file
- Save
- App updates instantly

Shake device to:
- Reload app
- Open debug menu
- Toggle inspector

## Next Steps

1. **Explore the Code**
   - Check `src/screens/` for screen implementations
   - Review `src/navigation/AppNavigator.tsx` for navigation
   - Look at `src/store/authSlice.ts` for state management

2. **Implement a Feature**
   - Start with Dashboard (`src/screens/DashboardScreen.tsx`)
   - Add GraphQL query for stats
   - Display data in cards

3. **Read Documentation**
   - `README.md` - Full documentation
   - `PROJECT_SUMMARY.md` - Implementation status
   - Web app source - Business logic reference

## Useful Commands

```bash
# Start development
npm start

# Clear cache and restart
npx expo start -c

# iOS (Mac only)
npm run ios

# Android
npm run android

# Web (limited features)
npm run web

# Type checking
npx tsc --noEmit

# Install dependencies
npm install

# Update Expo SDK
npx expo upgrade
```

## Getting Help

**Error in terminal?**
- Read the full error message
- Check file paths are correct
- Ensure backend is running

**App crashes?**
- Check terminal logs
- Look for red error screen
- Restart Expo dev server

**Need documentation?**
- Expo: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- Apollo Client: https://www.apollographql.com/docs/react/

## Success! 🎉

You should now see:
- Login screen on first launch
- Bottom navigation after signing in
- Placeholder screens for each feature
- Smooth navigation between tabs

**Ready to start implementing features!**

---

**Time to First Run**: ~5 minutes
**Status**: ✅ Ready for Development
**Next**: Implement Dashboard or Inventory screen
