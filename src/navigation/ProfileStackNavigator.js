import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/profile/ProfileScreen';
import PrinterSettingsScreen from '../screens/settings/PrinterSettingsScreen';

const Stack = createNativeStackNavigator();

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    <Stack.Screen name="PrinterSettingsScreen" component={PrinterSettingsScreen} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
