import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Clinic } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;

interface AuthState {
  user: User | null;
  clinic: Clinic | null;
  clinics: Clinic[]; // All clinics the user belongs to
  token: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  lastActivity: number | null;
}

const initialState: AuthState = {
  user: null,
  clinic: null,
  clinics: [],
  token: null,
  expiresAt: null,
  isAuthenticated: false,
  hasHydrated: false,
  lastActivity: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; clinic: Clinic; token: string; clinics?: Clinic[] }>) => {
      const now = Date.now();
      const expiresAt = now + TWO_HOURS_IN_MS;

      state.user = action.payload.user;
      state.clinic = action.payload.clinic;
      state.clinics = action.payload.clinics || [action.payload.clinic];
      state.token = action.payload.token;
      state.expiresAt = expiresAt;
      state.lastActivity = now;
      state.isAuthenticated = true;
      state.hasHydrated = true;

      // Store token in AsyncStorage
      AsyncStorage.setItem('authToken', action.payload.token);
      AsyncStorage.setItem('user', JSON.stringify(action.payload.user));
      AsyncStorage.setItem('clinic', JSON.stringify(action.payload.clinic));
      AsyncStorage.setItem('clinics', JSON.stringify(state.clinics));
      AsyncStorage.setItem('authExpiresAt', expiresAt.toString());
      AsyncStorage.setItem('lastActivity', now.toString());
    },
    switchClinic: (state, action: PayloadAction<Clinic>) => {
      state.clinic = action.payload;
      if (state.user) {
        state.user.activeClinicId = action.payload.clinicId;
      }

      // Update AsyncStorage
      AsyncStorage.setItem('clinic', JSON.stringify(action.payload));
      if (state.user) {
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    refreshActivity: (state) => {
      const now = Date.now();
      state.lastActivity = now;
      AsyncStorage.setItem('lastActivity', now.toString());
    },
    logout: (state, action: PayloadAction<string | undefined>) => {
      const reason = action.payload;

      state.user = null;
      state.clinic = null;
      state.clinics = [];
      state.token = null;
      state.expiresAt = null;
      state.lastActivity = null;
      state.isAuthenticated = false;
      state.hasHydrated = true;

      // Clear AsyncStorage
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
      AsyncStorage.removeItem('clinic');
      AsyncStorage.removeItem('clinics');
      AsyncStorage.removeItem('authExpiresAt');
      AsyncStorage.removeItem('lastActivity');

      // Store logout reason if provided
      if (reason) {
        AsyncStorage.setItem('logoutReason', reason);
      }
    },
    restoreAuth: (state) => {
      // Always set hasHydrated to true
      state.hasHydrated = true;

      // AsyncStorage operations are async, so this will be called separately
      // This reducer just updates the state with restored data
    },
    setRestoredAuth: (state, action: PayloadAction<AuthState>) => {
      return { ...state, ...action.payload, hasHydrated: true };
    },
  },
});

export const { setAuth, logout, restoreAuth, refreshActivity, switchClinic, setRestoredAuth } = authSlice.actions;
export default authSlice.reducer;

// Helper function to restore auth from AsyncStorage (call this on app startup)
export const restoreAuthFromStorage = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const userStr = await AsyncStorage.getItem('user');
    const clinicStr = await AsyncStorage.getItem('clinic');
    const clinicsStr = await AsyncStorage.getItem('clinics');
    const expiresAtStr = await AsyncStorage.getItem('authExpiresAt');
    const lastActivityStr = await AsyncStorage.getItem('lastActivity');
    const expiresAt = expiresAtStr ? Number.parseInt(expiresAtStr, 10) : null;
    const lastActivity = lastActivityStr ? Number.parseInt(lastActivityStr, 10) : null;

    const isValid =
      !!token &&
      !!userStr &&
      !!clinicStr &&
      typeof expiresAt === 'number' &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now();

    if (isValid) {
      return {
        token: token!,
        user: JSON.parse(userStr!),
        clinic: JSON.parse(clinicStr!),
        clinics: clinicsStr ? JSON.parse(clinicsStr) : [JSON.parse(clinicStr!)],
        expiresAt: expiresAt!,
        lastActivity,
        isAuthenticated: true,
        hasHydrated: true,
      };
    } else {
      if (expiresAt && expiresAt <= Date.now()) {
        await AsyncStorage.multiRemove([
          'authToken',
          'user',
          'clinic',
          'clinics',
          'authExpiresAt',
          'lastActivity',
          'logoutReason',
        ]);
      }

      return {
        user: null,
        clinic: null,
        clinics: [],
        token: null,
        expiresAt: null,
        lastActivity: null,
        isAuthenticated: false,
        hasHydrated: true,
      };
    }
  } catch (error) {
    console.error('Error restoring auth:', error);
    return {
      user: null,
      clinic: null,
      clinics: [],
      token: null,
      expiresAt: null,
      lastActivity: null,
      isAuthenticated: false,
      hasHydrated: true,
    };
  }
};
