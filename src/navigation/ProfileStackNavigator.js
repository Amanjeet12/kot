import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/profile/ProfileScreen';
import PrinterSettingsScreen from '../screens/settings/PrinterSettingsScreen';
import UsbPrinterSpikeScreen from '../screens/settings/UsbPrinterSpikeScreen';

const Stack = createNativeStackNavigator();

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    <Stack.Screen name="PrinterSettingsScreen" component={PrinterSettingsScreen} />
    {__DEV__ && (
      <Stack.Screen name="UsbPrinterSpikeScreen" component={UsbPrinterSpikeScreen} />
    )}
  </Stack.Navigator>
);

export default ProfileStackNavigator;
