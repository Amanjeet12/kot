import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useResponsive } from '../../contexts/ResponsiveContext';

const menuItems = [
  {
    label: 'Home',
    route: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    label: 'Orders',
    route: 'Orders',
    icon: 'receipt-outline',
    activeIcon: 'receipt',
  },
  {
    label: 'Notifications',
    route: 'Notifications',
    icon: 'notifications-outline',
    activeIcon: 'notifications',
  },
  {
    label: 'Profile',
    route: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

const TabletSidebar = ({ navigation, state }) => {
  const { isLargeTablet } = useResponsive();

  const currentRoute = state.routes[state.index]?.name;

  const handleNavigation = route => {
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>M</Text>
        </View>

        <View>
          <Text style={styles.logoTitle}>My App</Text>

          <Text style={styles.logoSubtitle}>Management</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Navigation */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>MENU</Text>

        {menuItems.map(item => {
          const isActive = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.7}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => handleNavigation(item.route)}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={isLargeTablet ? 22 : 20}
                  color={isActive ? '#710708' : '#6B7280'}
                />
              </View>

              <Text
                style={[styles.menuLabel, isActive && styles.menuLabelActive]}
              >
                {item.label}
              </Text>

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom */}
      <View style={styles.bottomContainer}>
        <View style={styles.divider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoutButton}
          onPress={() => {
            console.log('Logout');
          }}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={21} color="#DC2626" />
          </View>

          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
};

export default TabletSidebar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 18,

    borderRightWidth: 1,
    borderRightColor: '#ECECEC',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#710708',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  logoLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  logoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  logoSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 18,
  },

  menuContainer: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: 14,
    marginBottom: 10,
    letterSpacing: 1,
  },

  menuItem: {
    position: 'relative',

    height: 54,
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 12,

    paddingHorizontal: 10,
    marginBottom: 6,
  },

  menuItemActive: {
    backgroundColor: '#F9EEEE',
  },

  iconContainer: {
    width: 36,
    height: 36,

    borderRadius: 9,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,
  },

  iconContainerActive: {
    backgroundColor: '#FFFFFF',
  },

  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },

  menuLabelActive: {
    color: '#710708',
    fontWeight: '700',
  },

  activeIndicator: {
    width: 4,
    height: 25,
    borderRadius: 4,
    backgroundColor: '#710708',
  },

  bottomContainer: {
    marginTop: 'auto',
  },

  logoutButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 10,
    borderRadius: 10,
  },

  logoutIconContainer: {
    width: 36,
    height: 36,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,
  },

  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },

  versionText: {
    fontSize: 10,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 12,
  },
});
