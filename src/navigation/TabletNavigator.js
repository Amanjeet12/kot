import React from 'react';

import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import TabletSidebar from '../components/navigation/TabletSidebar';

const Drawer = createDrawerNavigator();

const TabletNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={props => <TabletSidebar {...props} />}
      screenOptions={{
        headerShown: false,

        drawerType: 'permanent',

        swipeEnabled: false,

        drawerStyle: {
          width: 240,
          backgroundColor: '#FFFFFF',
        },

        sceneContainerStyle: {
          backgroundColor: '#F7F8FA',
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />

      <Drawer.Screen name="Orders" component={OrdersScreen} />

      <Drawer.Screen name="Notifications" component={NotificationsScreen} />

      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

export default TabletNavigator;
