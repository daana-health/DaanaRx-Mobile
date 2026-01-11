# DaanaRx Mobile - Launch Guide

## Quick Start (One Command)

```bash
./launch.sh
```

Press **'i'** when the QR code appears to open the iOS Simulator.

## Manual Start

```bash
npm start
```

Then press **'i'** for iOS Simulator.

## What is Expo Go?

This app uses **Expo Go** - a container app that runs your JavaScript code without requiring native builds:

- ✅ No Xcode compilation
- ✅ No native build process
- ✅ Instant updates
- ✅ Works on physical devices too

## Launch Options

### iOS Simulator (Recommended)

```bash
npm start
```

Press **'i'** when prompted. Make sure Xcode is installed.

### Physical Device

1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)
2. Run `npm start`
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Different Network (Tunnel Mode)

If your device is on a different network:

```bash
npm run tunnel
```

## Troubleshooting

### App Crashes on Launch

```bash
# Clean everything and start fresh
npm run clean
npm start
```

### "Cannot find module" Errors

```bash
npm run clean
```

### Simulator Won't Open

```bash
# Reset the simulator
./reset-simulator.sh

# Then start
npm start
```

### Network Issues (Can't Connect on Device)

```bash
npm run tunnel
```

## Available Commands

| Command | Description |
|---------|-------------|
| `./launch.sh` | One-command launch script |
| `npm start` | Start Expo Go development server |
| `npm run ios` | Start and open iOS Simulator |
| `npm run android` | Start and open Android Emulator |
| `npm run tunnel` | Start with tunnel mode |
| `npm run clean` | Clean everything and reinstall |

## Daily Workflow

```bash
# Just run this every time:
./launch.sh

# Or:
npm start
```

## Important Notes

- This app uses **Expo Go** - no native builds needed
- If you see native crash errors, run `npm run clean` first
- The `ios/` and `android/` folders are auto-generated and ignored
- Camera permissions are required for QR code scanning

## When Expo Go Isn't Enough

If you add custom native code or need native modules not supported by Expo Go, you'll need to:
1. Run `npx expo prebuild` to generate native folders
2. Run `npx expo run:ios` to build and run natively

But for now, stick with Expo Go - it's simpler and faster.
