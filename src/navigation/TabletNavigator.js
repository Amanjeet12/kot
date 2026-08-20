import React, { useState } from 'react';

import { createDrawerNavigator } from '@react-navigation/drawer';

import OrdersScreen from '../screens/orders/OrdersScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import TabletSidebar from '../components/navigation/TabletSidebar';
import OrdersStackNavigator from './OrdersStackNavigator';

import { useResponsive } from '../contexts/ResponsiveContext';

import { theme } from '../constant';

const Drawer = createDrawerNavigator();

const TabletNavigator = () => {
  const { isLargeTablet } = useResponsive();

  const [collapsed, setCollapsed] = useState(false);

  const expandedWidth = isLargeTablet ? 280 : 220;

  const collapsedWidth = 82;

  return (
    <Drawer.Navigator
      initialRouteName="Orders"
      drawerContent={props => (
        <TabletSidebar
          {...props}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(prev => !prev)}
        />
      )}
      screenOptions={{
        headerShown: false,

        drawerType: 'permanent',

        swipeEnabled: false,

        drawerStyle: {
          width: collapsed ? collapsedWidth : expandedWidth,

          backgroundColor: theme.colors.surface,

          borderRightWidth: 0,
        },

        sceneContainerStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Drawer.Screen name="Orders" component={OrdersStackNavigator} />

      <Drawer.Screen name="History" component={HistoryScreen} />

      <Drawer.Screen name="Menu" component={MenuScreen} />

      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

export default TabletNavigator;
