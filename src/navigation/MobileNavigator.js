import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const MobileNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: '#710708',

        tabBarInactiveTintColor: '#8A8A8A',

        tabBarStyle: {
          height: 65,
          paddingTop: 5,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EEEEEE',
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },

        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;

            case 'Orders':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;

            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;

            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;

            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />

      <Tab.Screen name="Orders" component={OrdersScreen} />

      <Tab.Screen name="Notifications" component={NotificationsScreen} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MobileNavigator;
