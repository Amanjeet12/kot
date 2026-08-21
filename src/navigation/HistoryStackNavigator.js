import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OrderHistoryScreen from '../screens/history/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';

const Stack = createNativeStackNavigator();

const HistoryStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HistoryList" component={OrderHistoryScreen} />
    <Stack.Screen name="HistoryOrderDetails" component={OrderDetailsScreen} />
  </Stack.Navigator>
);

export default HistoryStackNavigator;
