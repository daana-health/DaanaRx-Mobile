# DaanaRx Mobile - Debugging Boolean Type Error

## Error
```
ERROR [Error: Exception in HostFunction: TypeError: expected dynamic type 'boolean', but had type 'string']
```

## What This Means
This error occurs when a native React Native component receives a string value for a prop that expects a boolean.

## All Fixes Applied
✅ Removed all `gap` properties from StyleSheet (not supported)
✅ Fixed Apollo Client imports to use `/react` for hooks  
✅ Verified all component exports
✅ Checked all map operations have keys
✅ Cleared all caches

## Debugging Steps

###1. Create Minimal App to Isolate Issue

Replace `App.tsx` temporarily with:
```tsx
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Test</Text>
    </View>
  );
}
```

If this works, the issue is in one of our components/screens.

### 2. Add Components Back One by One

Start with just Redux:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';

export default function App() {
  return (
    <Provider store={store}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Test with Redux</Text>
      </View>
    </Provider>
  );
}
```

Then add PersistGate, then ApolloProvider, etc.

### 3. Common Culprits to Check

**TextInput Props:**
- ✅ `secureTextEntry` should be boolean (we use just `secureTextEntry` which is correct)
- ✅ `autoCorrect` should be boolean
- ✅ `autoCapitalize` is string ("none", "sentences", etc.) - correct in our code

**ScrollView Props:**
- ✅ `keyboardShouldPersistTaps` should be boolean or specific string
- ✅ `removeClippedSubviews` should be boolean

**Animated Props:**
- ✅ `useNativeDriver` should be boolean - we use `true` (correct)

### 4. Check Environment

The error might be environment-specific. Try:
```bash
# Clear everything
rm -rf node_modules
rm -rf .expo
rm -rf ios/Pods
npm install
npx expo start --clear
```

### 5. Potential Quick Fix

If the issue persists, try disabling strict mode temporarily in `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false  // Temporarily
  }
}
```

## Most Likely Cause

Based on the error occurring after our changes, the most likely culprits are:

1. **Expo Camera** - The CameraView component is new and might have strict prop requirements
2. **Redux Persist** - The PersistGate might have configuration issues
3. **Style Spreading** - Our style array spreading might be causing type coercion

## Recommended Fix Attempt

Try commenting out the camera-related screens first:

In `src/navigation/AppNavigator.tsx`, temporarily comment out:
```tsx
// import ScanScreen from '../screens/scan/ScanScreen';
// import CheckInScreen from '../screens/checkin/CheckInScreen';
```

And in the navigator, comment out those screen definitions.

If the app works without those screens, we know the issue is camera-related.

## Contact

If you continue to have issues, the error stack trace would be helpful. Look for the full error in the Metro bundler console, not just the red box error.
