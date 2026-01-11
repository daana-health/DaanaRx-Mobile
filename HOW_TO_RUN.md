# HOW TO RUN THIS APP (Read This First!)

## ✅ THE RIGHT WAY

```bash
npm start
```

When you see the QR code, press **'i'** to open iOS Simulator.

That's it! The app will open in **Expo Go**.

## ❌ WHAT NOT TO DO

**DO NOT** run these commands:
- ❌ `expo run:ios` - This builds native code (causes crashes)
- ❌ `npx expo run:ios` - Same as above
- ❌ `npm run ios:build` - Builds native code
- ❌ Any command with "build" or "run:ios" in it

**WHY?** These commands create native iOS builds that are outdated and will crash.

## 🔧 If You Get a Crash

The crash you saw looks like this:
```
NSInvalidArgumentException: attempt to insert nil object
DaanaRxMobile.debug.dylib
```

This means an **old native build** is still on your simulator.

### FIX IT:

```bash
./reset-simulator.sh
npm start
```

Then press **'i'** when the QR code appears.

## 🎯 What Just Happened

I did a complete cleanup:
1. ✅ Uninstalled the old native app from ALL simulators
2. ✅ Erased all simulator data
3. ✅ Removed `ios/`, `android/`, `.expo/` folders
4. ✅ Updated scripts to prevent native builds

Your simulator is now **completely clean**.

## 📱 How Expo Go Works

When you run `npm start` and press 'i':
1. iOS Simulator opens
2. **Expo Go app** opens inside the simulator
3. Your JavaScript code loads into Expo Go
4. No native compilation needed!

This is different from a native build where your app is compiled into a `.app` file.

## 🚀 Quick Reference

| Command | What It Does |
|---------|--------------|
| `npm start` → press 'i' | ✅ Opens in Expo Go (SAFE) |
| `./launch.sh` | ✅ Same as above with cleanup |
| `./reset-simulator.sh` | ✅ Fixes crashes by cleaning simulator |
| `expo run:ios` | ❌ Creates native build (AVOID) |
| `npx expo run:ios` | ❌ Creates native build (AVOID) |

## 🆘 Still Having Issues?

1. Make sure Xcode is installed
2. Make sure Xcode command line tools are installed:
   ```bash
   xcode-select --install
   ```
3. Try the reset script:
   ```bash
   ./reset-simulator.sh
   ```
4. Then start fresh:
   ```bash
   npm start
   ```

## 📝 Remember

- Expo Go = Good ✅
- Native builds = Bad (for now) ❌
- If you see "DaanaRxMobile.debug.dylib" in errors = Old native build = Run reset script
