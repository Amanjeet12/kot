import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MenuScreen from '../screens/menu/MenuScreen';
import ManageInventoryScreen from '../screens/menu/ManageInventoryScreen';

const Stack = createNativeStackNavigator();

const MenuStackNavigator = () => (
  <Stack.Navigator
    initialRouteName="MenuList"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="MenuList" component={MenuScreen} />
    <Stack.Screen name="ManageInventory" component={ManageInventoryScreen} />
  </Stack.Navigator>
);

export default MenuStackNavigator;
