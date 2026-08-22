import React from 'react';

import { Text, TextInput } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppProviders from './src/AppProviders';
import { ResponsiveProvider } from './src/contexts/ResponsiveContext';

import RootNavigator from './src/navigation/RootNavigator';
import AppToast from './src/components/feedback/AppToast';

/*
|--------------------------------------------------------------------------
| DISABLE SYSTEM FONT SCALING
|--------------------------------------------------------------------------
*/

if (Text.defaultProps == null) {
  Text.defaultProps = {};
}

Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
}

TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

const App = () => {
  return (
    <SafeAreaProvider>
      <ResponsiveProvider>
        <AppProviders>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProviders>
        <AppToast />
      </ResponsiveProvider>
    </SafeAreaProvider>
  );
};

export default App;
