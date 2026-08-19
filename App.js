import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppProviders from './src/AppProviders';

import { ResponsiveProvider } from './src/contexts/ResponsiveContext';

import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <SafeAreaProvider>
      <ResponsiveProvider>
        <AppProviders>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProviders>
      </ResponsiveProvider>
    </SafeAreaProvider>
  );
};

export default App;
