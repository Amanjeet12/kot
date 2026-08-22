/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: () => null,
  BaseToast: () => null,
}));

jest.mock('../src/AppProviders', () => ({
  __esModule: true,
  default: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('../src/contexts/ResponsiveContext', () => ({
  ResponsiveProvider: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('../src/navigation/RootNavigator', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../src/components/feedback/AppToast', () => ({
  __esModule: true,
  default: () => null,
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
