# Start Here - Simple Expo Go Launch

## Run the App (One Command)

```bash
./launch.sh
```

When the QR code appears, press **'i'** to open the iOS Simulator.

That's it! No builds, no configuration, just works.

## Alternative

```bash
npm start
```

Then press **'i'** when prompted.

## If You Get a Crash or Error

```bash
npm run clean
npm start
```

## What This Uses

This app runs with **Expo Go** - the simplest way to develop React Native apps:
- No native builds required
- No Xcode compilation
- Just JavaScript that runs instantly

## What Was Fixed

1. **Missing dependency**: Added `react-native-gesture-handler`
2. **Removed dev client**: Simplified to use Expo Go only
3. **Added scheme**: `scheme: "daanarx"` in app.json
4. **Clean scripts**: One command to launch

## Need More Info?

See `LAUNCH_GUIDE.md` for all options and troubleshooting.
