# DaanaRx Mobile - HIPAA-Compliant Medication Tracking

A React Native mobile application for non-profit clinics to track and distribute donated prescription medications. This is the mobile companion to the DaanarRX web application, ported using Expo.

## Overview

DaanaRx Mobile provides comprehensive medication inventory management for non-profit clinics with:

- **Complete Inventory Management**: Track medications from check-in to dispensing
- **QR Code System**: Generate and scan QR codes for quick unit identification
- **Drug Lookup**: Integrated RxNorm and FDA APIs for NDC barcode scanning
- **Role-Based Access**: Superadmin, Admin, and Employee roles with appropriate permissions
- **HIPAA Compliance**: Secure data handling, encrypted storage, audit trails
- **Multi-Clinic Support**: Isolated data per clinic with automatic security policies
- **Offline Support**: Redux Persist for local data caching

## Features

### Core Functionality

1. **Authentication**: Sign in/Sign up with secure JWT tokens
2. **Dashboard**: Quick overview of inventory and statistics
3. **Check-In Flow**: Create inventory from donated medications
4. **Check-Out Flow**: Dispense medications to patients
5. **QR Code Scanner**: Quick unit lookup using camera
6. **Inventory Management**: View and manage all medication units
7. **Reports**: Transaction audit trail (Admin/Superadmin only)
8. **Admin Panel**: Location management (Admin/Superadmin only)
9. **Settings**: User profile and clinic management

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Download |
|------------|---------|----------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Included with Node.js |
| **Expo CLI** | Latest | `npm install -g expo-cli` |
| **iOS Simulator** (Mac only) | Latest | Via Xcode |
| **Android Emulator** or **Physical Device** | - | Via Android Studio or Expo Go app |

**Backend Requirements:**
- Running DaanarRX backend server (GraphQL API)
- Supabase project with the DaanarRX schema

## Installation

### Step 1: Clone or Navigate to the Project

```bash
cd DaanaRx-Mobile
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```bash
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # GraphQL API Endpoint
   EXPO_PUBLIC_GRAPHQL_URL=http://your-server-ip:3000/api/graphql
   ```

   **Note**: If testing on a physical device, replace `localhost` with your computer's local IP address.

### Step 4: Start the Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS Simulator (Mac only)
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your physical device

## Running on Different Platforms

### iOS (Mac only)

```bash
npm run ios
```

Requirements:
- Xcode installed
- iOS Simulator set up

### Android

```bash
npm run android
```

Requirements:
- Android Studio installed
- Android Emulator set up OR
- Physical Android device with USB debugging enabled

### Web (for testing)

```bash
npm run web
```

Note: Some features like camera access may not work on web.

## Project Structure

```
DaanaRx-Mobile/
├── src/
│   ├── components/          # Reusable React components
│   │   └── ui/             # UI components (Button, Input, Card)
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── checkin/       # Check-in flow
│   │   ├── checkout/      # Check-out flow
│   │   ├── scan/          # QR code scanning
│   │   ├── inventory/     # Inventory management
│   │   ├── reports/       # Transaction reports
│   │   ├── admin/         # Admin panel
│   │   └── settings/      # User settings
│   ├── navigation/        # React Navigation configuration
│   ├── store/             # Redux store and slices
│   ├── lib/               # Core utilities
│   │   ├── apollo.ts     # GraphQL client
│   │   └── supabase.ts   # Supabase client
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom React hooks (future)
├── assets/                # Images, fonts, etc.
├── App.tsx                # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Key Dependencies

### Core
- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety

### Navigation
- **React Navigation** - Navigation library
- **React Native Screens** - Native navigation
- **React Native Safe Area Context** - Safe area handling

### State Management
- **Redux Toolkit** - State management
- **React Redux** - React bindings
- **Redux Persist** - State persistence
- **AsyncStorage** - Local storage

### GraphQL & Backend
- **Apollo Client** - GraphQL client
- **Supabase** - Database and auth

### Forms & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### UI & Features
- **Expo Camera** - Camera access
- **Expo Barcode Scanner** - QR/Barcode scanning
- **React Native QRCode SVG** - QR code generation
- **Expo Vector Icons** - Icon library
- **Date-fns** - Date utilities
- **Axios** - HTTP client

## Development Workflow

### 1. Running the Backend

Ensure your DaanarRX backend is running:

```bash
cd ../DaanarRX
npm run dev  # Starts backend on port 3000
```

### 2. Testing on Physical Device

If using a physical device:

1. Install Expo Go app from App Store/Play Store
2. Make sure your device and computer are on the same Wi-Fi network
3. Update `.env` to use your computer's local IP:
   ```bash
   EXPO_PUBLIC_GRAPHQL_URL=http://192.168.1.XXX:3000/api/graphql
   ```
4. Start the Expo dev server and scan the QR code

### 3. Debugging

- **React Native Debugger**: Install from [github.com/jhen0409/react-native-debugger](https://github.com/jhen0409/react-native-debugger)
- **Console Logs**: Use `console.log()` and view in terminal or Expo Dev Tools
- **Redux DevTools**: Available in React Native Debugger

## Building for Production

### iOS (requires Mac and Apple Developer account)

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

Or use EAS Build for managed workflow:

```bash
npm install -g eas-cli
eas build --platform android
```

## User Roles & Permissions

| Role | Check-In | Check-Out | Inventory | Reports | Admin | Settings |
|------|----------|-----------|-----------|---------|-------|----------|
| **Superadmin** | ✅ Full | ✅ Full | ✅ Edit | ✅ Full | ✅ Full | ✅ Full |
| **Admin** | ✅ Yes | ✅ Yes | 👁️ Read | 👁️ Read | ✅ Locations | ❌ No |
| **Employee** | ✅ Yes | ✅ Yes | 👁️ View | ❌ No | ❌ No | ❌ No |

## Troubleshooting

### Common Issues

#### "Unable to resolve module..."

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

#### "Network request failed" when testing GraphQL

- Ensure backend is running
- Check that `.env` has correct API URL
- If on physical device, use computer's local IP instead of `localhost`
- Verify device and computer are on same network

#### Camera/Barcode scanner not working

- Ensure permissions are granted in app settings
- Check that `expo-barcode-scanner` plugin is in `app.json`
- Restart the app after granting permissions

#### iOS Simulator issues

```bash
# Reset iOS Simulator
npx expo start --ios --clear
```

#### Android Emulator issues

```bash
# Reset Android
npx expo start --android --clear
```

### Getting Help

- Check [Expo Documentation](https://docs.expo.dev/)
- Review [React Navigation Docs](https://reactnavigation.org/)
- Search existing issues in the DaanarRX repository

## Security & HIPAA Compliance

- All PHI is encrypted in transit (HTTPS)
- Local data encrypted via AsyncStorage
- No sensitive data in logs or error messages
- Secure authentication with JWT tokens
- Session timeout after 2 hours of inactivity
- Role-based access control

**⚠️ Important**: Consult with legal and compliance teams for full HIPAA certification before production use.

## Current Implementation Status

### ✅ Completed
- Project setup and configuration
- Redux store with persistence
- Apollo Client and GraphQL setup
- Supabase client configuration
- React Navigation structure
- Authentication screens (Sign In/Sign Up)
- Basic UI components (Button, Input, Card)
- Placeholder screens for all features
- Type definitions ported from web version
- Utility functions (smart search, etc.)

### 🚧 In Progress / To Do
- Full Check-In flow implementation
- Full Check-Out flow implementation
- QR code scanning implementation
- QR code generation for labels
- Inventory list and filtering
- Reports and transaction history
- Admin panel functionality
- Settings and user management
- Offline-first functionality
- Push notifications
- Image capture for medications

## Contributing

This is a mobile port of the DaanarRX web application. When adding new features:

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Maintain consistency with web version where applicable
4. Test on both iOS and Android
5. Update this README with new features

## License

Proprietary - All Rights Reserved

---

**Built with ❤️ for non-profit clinics providing essential healthcare services.**

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with credentials
- [ ] DaanarRX backend running
- [ ] Expo dev server started (`npm start`)
- [ ] App running on simulator/device
- [ ] Successfully signed in to test account
- [ ] Camera permissions granted (for QR scanning)

## Need Help?

1. ✅ Check this README thoroughly
2. 📖 Review the [Expo Documentation](https://docs.expo.dev/)
3. 🔍 Search for similar issues
4. 📧 Contact the development team

**Remember**: The mobile app requires the DaanarRX backend to be running and accessible!
