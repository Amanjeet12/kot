import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OrdersScreen from '../screens/orders/OrdersScreen';

import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';

const Stack = createNativeStackNavigator();

const OrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="OrdersList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OrdersList" component={OrdersScreen} />

      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
};

export default OrdersStackNavigator;
