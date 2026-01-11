# Fix for Expo Go Boolean Type Error

## Problem
Expo Go always enforces React Native's new architecture (Fabric), which has stricter type checking and causes the error:
```
TypeError: expected dynamic type 'boolean', but had type 'string'
```

This happens even though our code is correct - it's a limitation of Expo Go with certain navigation libraries.

## Solution: Use Development Build Instead of Expo Go

### Option 1: Create iOS Development Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure the project:**
   ```bash
   eas build:configure
   ```

4. **Create a development build for iOS:**
   ```bash
   eas build --profile development --platform ios
   ```

5. **Install the development build** on your simulator or device when it's ready

6. **Start the dev server:**
   ```bash
   npx expo start --dev-client
   ```

### Option 2: Use Expo Dev Client Locally

1. **Add expo-dev-client:**
   ```bash
   npx expo install expo-dev-client
   ```

2. **Prebuild for iOS:**
   ```bash
   npx expo prebuild --platform ios
   ```

3. **Run on iOS simulator:**
   ```bash
   npx expo run:ios
   ```

### Option 3: Temporarily Disable Navigation Features

If you must use Expo Go for testing, you can temporarily simplify your navigation by removing the Tab Navigator and using a simpler setup, but this is not recommended for production.

## Why This Happens

- **Expo Go** runs in a single app that includes Fabric (new architecture)
- **Fabric** has stricter type checking than the old architecture
- **react-native-screens** (used by react-navigation) has some props that don't perfectly align with Fabric's expectations
- **Development builds** allow you to control the architecture and native dependencies

## Recommended Next Steps

1. Use `eas build --profile development --platform ios` to create a development build
2. This will give you an app similar to Expo Go but with your exact dependencies
3. The app will work correctly with your navigation setup

## More Information

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)




