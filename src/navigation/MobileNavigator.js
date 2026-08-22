import React from 'react';

import { View, StyleSheet } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';

import OrdersStackNavigator from './OrdersStackNavigator';
import MenuStackNavigator from './MenuStackNavigator';
import HistoryStackNavigator from './HistoryStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

import { theme } from '../constant';

const Tab = createBottomTabNavigator();

const MobileNavigator = () => {
  const insets = useSafeAreaInsets();

  /*
   * Normal visible tab height
   * excluding device safe-area.
   */
  const TAB_BAR_HEIGHT = 60;

  return (
    <Tab.Navigator
      initialRouteName="Orders"
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: theme.colors.textPrimary,

        tabBarInactiveTintColor: theme.colors.textMuted,

        /*
        |--------------------------------------------------------------------------
        | SAFE AREA TAB BAR
        |--------------------------------------------------------------------------
        */

        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,

          paddingTop: 6,

          /*
           * Android gesture area
           * will automatically be added.
           */
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,

          backgroundColor: theme.colors.surface,

          borderTopWidth: 1,

          borderTopColor: theme.colors.border,

          elevation: 8,
        },

        tabBarItemStyle: {
          paddingTop: 2,
        },

        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,

          fontWeight: theme.typography.fontWeight.semiBold,

          marginTop: 2,
        },

        /*
        |--------------------------------------------------------------------------
        | TAB ICONS
        |--------------------------------------------------------------------------
        */

        tabBarIcon: ({ focused }) => {
          let iconName;

          switch (route.name) {
            case 'Orders':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;

            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;

            case 'Menu':
              iconName = focused ? 'grid' : 'grid-outline';
              break;

            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;

            default:
              iconName = 'ellipse-outline';
          }

          return (
            <View
              style={[
                styles.iconContainer,

                focused && styles.iconContainerActive,
              ]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={
                  focused ? theme.colors.textPrimary : theme.colors.textMuted
                }
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Orders" component={OrdersStackNavigator} />
      <Tab.Screen name="History" component={HistoryStackNavigator} />
      <Tab.Screen name="Menu" component={MenuStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MobileNavigator;

const styles = StyleSheet.create({
  iconContainer: {
    width: 38,

    height: 32,

    justifyContent: 'center',

    alignItems: 'center',

    borderRadius: theme.radius.lg,
  },

  iconContainerActive: {
    backgroundColor: theme.colors.primary,
  },
});
