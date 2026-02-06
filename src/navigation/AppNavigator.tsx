import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Auth Screens
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import CheckInScreen from '../screens/checkin/CheckInScreen';
import CheckOutScreen from '../screens/checkout/CheckOutScreen';
import ScanScreen from '../screens/scan/ScanScreen';
import EnhancedInventoryScreen from '../screens/inventory/EnhancedInventoryScreen';
import LogsScreen from '../screens/logs/LogsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  CheckIn: undefined;
  CheckOut: undefined;
  Scan: undefined;
  Admin: undefined;
  Settings: undefined;
  Logs: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  CheckIn: undefined;
  CheckOut: undefined;
  Scan: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.userRole || 'employee';
  const isAdmin: boolean = userRole === 'superadmin' || userRole === 'admin';

  const screenOptions = React.useCallback(({ route }: any): BottomTabNavigationOptions => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: keyof typeof Ionicons.glyphMap = 'home';

      if (route.name === 'Dashboard') {
        iconName = focused ? 'home' : 'home-outline';
      } else if (route.name === 'Inventory') {
        iconName = focused ? 'list' : 'list-outline';
      } else if (route.name === 'CheckIn') {
        iconName = focused ? 'add-circle' : 'add-circle-outline';
      } else if (route.name === 'CheckOut') {
        iconName = focused ? 'remove-circle' : 'remove-circle-outline';
      } else if (route.name === 'Scan') {
        iconName = focused ? 'qr-code' : 'qr-code-outline';
      }

      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#2563eb',
    tabBarInactiveTintColor: '#6b7280',
    headerShown: false as const,
  }), []);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={EnhancedInventoryScreen} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check In' }} />
      <Tab.Screen name="CheckOut" component={CheckOutScreen} options={{ title: 'Check Out' }} />
      <Tab.Screen name="Scan" component={ScanScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const defaultScreenOptions: StackNavigationOptions = {
    headerShown: false as const,
  };

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={defaultScreenOptions}>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={defaultScreenOptions}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            headerShown: true as const,
            title: 'Admin',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true as const,
            title: 'Settings',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Logs"
          component={LogsScreen}
          options={{
            headerShown: true as const,
            title: 'Activity Logs',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
