# Web to Mobile Conversion - Comparison Guide

This document shows how the DaanarRX web application was ported to DaanaRx Mobile.

## Architecture Comparison

| Aspect | Web (DaanarRX) | Mobile (DaanaRx Mobile) | Status |
|--------|----------------|-------------------------|--------|
| **Framework** | Next.js 16 | React Native (Expo) | ✅ |
| **Language** | TypeScript | TypeScript | ✅ |
| **Routing** | Next.js App Router | React Navigation | ✅ |
| **State** | Redux Toolkit | Redux Toolkit | ✅ |
| **Persistence** | localStorage | AsyncStorage | ✅ |
| **GraphQL** | Apollo Client | Apollo Client | ✅ |
| **Database** | Supabase | Supabase | ✅ |
| **Styling** | Tailwind CSS | StyleSheet | ✅ |
| **UI Library** | Radix UI + shadcn/ui | Custom Components | ✅ |
| **Forms** | react-hook-form + zod | react-hook-form + zod | ✅ |

## File-by-File Mapping

### Types (100% Ported)

| Web File | Mobile File | Status |
|----------|-------------|--------|
| `src/types/index.ts` | `src/types/index.ts` | ✅ Identical |
| `src/types/graphql.ts` | `src/types/graphql.ts` | ✅ Identical |
| `src/types/inventory.ts` | `src/types/inventory.ts` | ✅ Identical |

### State Management (100% Ported, Mobile-Optimized)

| Web File | Mobile File | Status | Changes |
|----------|-------------|--------|---------|
| `src/store/index.ts` | `src/store/index.ts` | ✅ | Added redux-persist |
| `src/store/authSlice.ts` | `src/store/authSlice.ts` | ✅ | AsyncStorage instead of localStorage |

### Backend Clients (100% Ported, Mobile-Optimized)

| Web File | Mobile File | Status | Changes |
|----------|-------------|--------|---------|
| `src/lib/apollo.ts` | `src/lib/apollo.ts` | ✅ | Async token retrieval |
| `src/lib/supabase/client.ts` | `src/lib/supabase.ts` | ✅ | React Native client |

### Utilities (100% Ported)

| Web File | Mobile File | Status |
|----------|-------------|--------|
| `src/utils/smartSearch.ts` | `src/utils/smartSearch.ts` | ✅ Identical |

### Screens/Pages Mapping

| Web Page | Mobile Screen | Implementation | Notes |
|----------|---------------|----------------|-------|
| `app/auth/signin/page.tsx` | `screens/auth/SignInScreen.tsx` | ✅ **Complete** | GraphQL mutation working |
| `app/auth/signup/page.tsx` | `screens/auth/SignUpScreen.tsx` | ✅ **Complete** | GraphQL mutation working |
| `app/page.tsx` (Dashboard) | `screens/DashboardScreen.tsx` | 🟡 **Placeholder** | UI created, needs data |
| `app/checkin/page.tsx` | `screens/checkin/CheckInScreen.tsx` | 🟡 **Placeholder** | Workflow needs implementation |
| `app/checkout/page.tsx` | `screens/checkout/CheckOutScreen.tsx` | 🟡 **Placeholder** | Workflow needs implementation |
| `app/scan/page.tsx` | `screens/scan/ScanScreen.tsx` | 🟡 **Placeholder** | Camera integration needed |
| `app/inventory/page.tsx` | `screens/inventory/InventoryScreen.tsx` | 🟡 **Placeholder** | List and filters needed |
| `app/reports/page.tsx` | `screens/reports/ReportsScreen.tsx` | 🟡 **Placeholder** | Transaction list needed |
| `app/admin/page.tsx` | `screens/admin/AdminScreen.tsx` | 🟡 **Placeholder** | CRUD operations needed |
| `app/settings/page.tsx` | `screens/settings/SettingsScreen.tsx` | 🟢 **Partial** | Logout works, needs more |

### UI Components Mapping

#### ✅ Created (Mobile Replacements)

| Web Component | Mobile Component | Status | Notes |
|---------------|------------------|--------|-------|
| `components/ui/button.tsx` (Radix) | `components/ui/Button.tsx` | ✅ | Touchable with variants |
| `components/ui/input.tsx` (Radix) | `components/ui/Input.tsx` | ✅ | TextInput with label/error |
| `components/ui/card.tsx` (Radix) | `components/ui/Card.tsx` | ✅ | View with styling |

#### 🚧 Not Yet Created (Needed for Full Implementation)

| Web Component | Mobile Equivalent Needed | Priority |
|---------------|-------------------------|----------|
| `components/ui/dialog.tsx` | Modal component | High |
| `components/ui/toast.tsx` | Toast/Alert component | High |
| `components/ui/select.tsx` | Picker component | Medium |
| `components/ui/date-picker.tsx` | DateTimePicker | Medium |
| `components/ui/table.tsx` | FlatList with custom rows | Medium |
| `components/ui/tabs.tsx` | Tab view component | Low |
| `components/ui/badge.tsx` | Badge component | Low |
| `components/ui/skeleton.tsx` | Loading skeleton | Low |

### Navigation Mapping

| Web Routing | Mobile Navigation | Status |
|-------------|-------------------|--------|
| Next.js App Router | React Navigation | ✅ |
| File-based routes | Component-based routes | ✅ |
| `/auth/signin` → Page | Stack: SignIn screen | ✅ |
| `/auth/signup` → Page | Stack: SignUp screen | ✅ |
| `/` → Dashboard | Tab: Dashboard | ✅ |
| `/checkin` → Page | Tab: CheckIn | ✅ |
| `/checkout` → Page | Tab: CheckOut | ✅ |
| `/inventory` → Page | Tab: Inventory | ✅ |
| `/reports` → Page | Tab: Reports (conditional) | ✅ |
| `/admin` → Page | Stack: Admin | ✅ |
| `/settings` → Page | Tab: More → Settings | ✅ |

## Feature Parity Status

### ✅ Fully Ported (Working)

1. **Authentication System**
   - Sign in with email/password
   - Sign up with clinic creation
   - JWT token management
   - Auto-login persistence
   - Logout functionality
   - Session expiration handling

2. **State Management**
   - Redux store configuration
   - Auth state slice
   - Persistent storage
   - State hydration

3. **Backend Integration**
   - GraphQL client setup
   - Supabase client
   - Error handling
   - Token refresh

4. **Navigation**
   - Bottom tab navigation
   - Stack navigation
   - Protected routes
   - Role-based visibility

### 🟡 Partially Ported (Placeholder)

5. **Dashboard**
   - **Web**: Shows stats, expiring meds, quick actions
   - **Mobile**: UI shell only, needs GraphQL queries

6. **Check-In Workflow**
   - **Web**: Full lot/drug/unit creation flow
   - **Mobile**: Placeholder screen, needs forms

7. **Check-Out Workflow**
   - **Web**: Unit search, dispensing, transaction
   - **Mobile**: Placeholder screen, needs implementation

8. **Inventory Management**
   - **Web**: Advanced filtering, smart search, pagination
   - **Mobile**: Placeholder screen, needs list view

9. **Reports**
   - **Web**: Transaction history with filters
   - **Mobile**: Placeholder screen, needs implementation

10. **Admin Panel**
    - **Web**: Location CRUD operations
    - **Mobile**: Placeholder screen, needs forms

11. **Settings**
    - **Web**: User management, invitations
    - **Mobile**: Basic logout only

### ❌ Not Yet Ported (Mobile-Specific Features Needed)

12. **QR Code Scanning**
    - **Web**: Uses html5-qrcode library
    - **Mobile**: Needs expo-camera integration
    - **Status**: Camera permissions configured, implementation pending

13. **QR Code Generation**
    - **Web**: Uses qrcode.react
    - **Mobile**: Needs react-native-qrcode-svg implementation
    - **Status**: Library installed, implementation pending

14. **Barcode Scanning (NDC)**
    - **Web**: Uses html5-qrcode
    - **Mobile**: Needs expo-barcode-scanner
    - **Status**: Scanner installed, implementation pending

## Dependencies Comparison

### Core Dependencies (Shared)

| Package | Web Version | Mobile Version | Status |
|---------|-------------|----------------|--------|
| React | 18.3.1 | 19.1.0 | ✅ |
| TypeScript | 5.6.0 | 5.9.2 | ✅ |
| @apollo/client | 3.14.0 | 4.0.11 | ✅ |
| @reduxjs/toolkit | 2.2.0 | 2.5.0 | ✅ |
| react-redux | 9.1.0 | 9.2.0 | ✅ |
| @supabase/supabase-js | 2.45.0 | 2.49.2 | ✅ |
| react-hook-form | 7.68.0 | 7.54.2 | ✅ |
| zod | 3.25.76 | 3.24.1 | ✅ |
| graphql | 16.9.0 | 16.10.0 | ✅ |
| axios | 1.7.0 | 1.7.9 | ✅ |
| date-fns | 4.1.0 | 4.1.0 | ✅ |

### Web-Only Dependencies (Not Needed on Mobile)

- next (Next.js framework)
- @radix-ui/* (UI primitives)
- tailwindcss (CSS framework)
- html5-qrcode (Web camera library)
- qrcode.react (QR code component)
- react-dom (DOM renderer)
- react-to-print (Print functionality)

### Mobile-Only Dependencies (New)

- react-native (Mobile framework)
- expo (Development platform)
- @react-navigation/* (Navigation)
- react-native-safe-area-context (Safe areas)
- react-native-screens (Native navigation)
- @react-native-async-storage/async-storage (Storage)
- redux-persist (State persistence)
- expo-camera (Camera access)
- expo-barcode-scanner (Barcode scanning)
- react-native-qrcode-svg (QR generation)
- @expo/vector-icons (Icons)

## GraphQL Operations Status

### ✅ Implemented

| Operation | Type | Used In | Status |
|-----------|------|---------|--------|
| `signIn` | Mutation | SignInScreen | ✅ Working |
| `signUp` | Mutation | SignUpScreen | ✅ Working |

### 🚧 Ready to Implement (Queries/Mutations defined in web version)

| Operation | Type | Needed For | Priority |
|-----------|------|------------|----------|
| `getDashboardStats` | Query | Dashboard | High |
| `getUnitsAdvanced` | Query | Inventory | High |
| `getUnit` | Query | QR Scanner | High |
| `checkOutUnit` | Mutation | Check-Out | High |
| `createLot` | Mutation | Check-In | High |
| `createUnit` | Mutation | Check-In | High |
| `searchDrugByNDC` | Query | Check-In | High |
| `searchDrugs` | Query | Check-In | Medium |
| `getLocations` | Query | Multiple | Medium |
| `getTransactions` | Query | Reports | Medium |
| `createLocation` | Mutation | Admin | Low |
| `deleteLocation` | Mutation | Admin | Low |
| `inviteUser` | Mutation | Settings | Low |
| `getUsers` | Query | Settings | Low |

## Key Differences & Adaptations

### 1. Storage

**Web:**
```typescript
localStorage.setItem('authToken', token);
const token = localStorage.getItem('authToken');
```

**Mobile:**
```typescript
await AsyncStorage.setItem('authToken', token);
const token = await AsyncStorage.getItem('authToken');
```

### 2. Navigation

**Web:**
```typescript
import { useRouter } from 'next/navigation';
router.push('/dashboard');
```

**Mobile:**
```typescript
import { useNavigation } from '@react-navigation/native';
navigation.navigate('Dashboard');
```

### 3. Styling

**Web:**
```tsx
<div className="flex flex-col gap-4 p-6">
  <Button className="bg-blue-500 text-white">
    Click Me
  </Button>
</div>
```

**Mobile:**
```tsx
<View style={styles.container}>
  <Button
    title="Click Me"
    variant="primary"
  />
</View>

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 16,
    padding: 24,
  }
});
```

### 4. Forms

**Web (with Radix UI):**
```tsx
<Form>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
      </FormItem>
    )}
  />
</Form>
```

**Mobile (simplified):**
```tsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
/>
```

### 5. Camera/QR Scanning

**Web (html5-qrcode):**
```tsx
import { Html5QrcodeScanner } from 'html5-qrcode';

const scanner = new Html5QrcodeScanner('reader', config);
scanner.render(onScanSuccess, onScanError);
```

**Mobile (expo-barcode-scanner):**
```tsx
import { BarCodeScanner } from 'expo-barcode-scanner';

<BarCodeScanner
  onBarCodeScanned={handleBarCodeScanned}
  style={StyleSheet.absoluteFillObject}
/>
```

## What's Compatible (Can Copy Directly)

✅ **Can copy with minimal/no changes:**
- Type definitions (100%)
- GraphQL queries and mutations (100%)
- Business logic functions (95%)
- Utility functions (100%)
- Data transformation logic (100%)
- Validation schemas (Zod) (100%)

❌ **Needs significant adaptation:**
- UI components (need React Native versions)
- Styling (Tailwind → StyleSheet)
- Navigation (Next.js → React Navigation)
- Forms (Radix UI → Native components)
- Camera/QR code (Web APIs → Native modules)
- File operations (if any)
- Print functionality

## Implementation Roadmap

Based on web version features, implement in this order:

### Phase 1: Data Display (Week 1-2)
1. ✅ Dashboard stats query and display
2. ✅ Inventory list with FlatList
3. ✅ Unit details view
4. ✅ Basic search/filter

### Phase 2: QR Features (Week 3)
5. ✅ QR code scanner with camera
6. ✅ QR code generation for units
7. ✅ Barcode scanner for NDC codes

### Phase 3: Core Workflows (Week 4-5)
8. ✅ Check-Out flow (scan, select quantity, dispense)
9. ✅ Check-In flow (lot creation, drug lookup, unit creation)
10. ✅ Transaction history

### Phase 4: Admin Features (Week 6)
11. ✅ Location management CRUD
12. ✅ User management (Settings)
13. ✅ Reports and filters

### Phase 5: Polish (Week 7-8)
14. ✅ Error handling
15. ✅ Loading states
16. ✅ Offline support
17. ✅ Push notifications (optional)
18. ✅ Testing

## Success Metrics

| Metric | Web | Mobile | Status |
|--------|-----|--------|--------|
| **Type Safety** | 100% | 100% | ✅ |
| **Auth Flow** | 100% | 100% | ✅ |
| **Navigation** | 100% | 100% | ✅ |
| **State Management** | 100% | 100% | ✅ |
| **Dashboard** | 100% | 0% | 🚧 |
| **Check-In** | 100% | 0% | 🚧 |
| **Check-Out** | 100% | 0% | 🚧 |
| **Inventory** | 100% | 0% | 🚧 |
| **QR Scanning** | 100% | 0% | 🚧 |
| **Reports** | 100% | 0% | 🚧 |
| **Admin** | 100% | 0% | 🚧 |
| **Settings** | 100% | 20% | 🚧 |

**Overall Completion: ~30%**
- Foundation: 100% ✅
- Features: 10% 🚧

## Conclusion

The mobile app has a **solid foundation** with:
- ✅ All infrastructure in place
- ✅ Authentication fully working
- ✅ Navigation complete
- ✅ State management configured
- ✅ Backend integration ready

**Next steps**: Implement feature screens by referencing web version and adapting UI for mobile.

**Estimated time to feature parity**: 6-8 weeks for one developer.
