import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PosScreen from '../screens/pos/PosScreen';

const Stack = createNativeStackNavigator();

const PosStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PosHome" component={PosScreen} />
  </Stack.Navigator>
);

export default PosStackNavigator;
