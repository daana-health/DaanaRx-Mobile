import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ApolloProvider } from '@apollo/client/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './src/store';
import { apolloClient } from './src/lib/apollo';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          }
          persistor={persistor}
        >
          <ApolloProvider client={apolloClient}>
            <SafeAreaProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </SafeAreaProvider>
          </ApolloProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
