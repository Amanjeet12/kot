import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useSelector } from 'react-redux';

import { useResponsive } from '../../contexts/ResponsiveContext';

import { theme } from '../../constant';

const menuItems = [
  {
    label: 'Orders',
    route: 'Orders',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  {
    label: 'History',
    route: 'History',
    icon: 'time-outline',
    activeIcon: 'time',
  },
  {
    label: 'Menu',
    route: 'Menu',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
  {
    label: 'POS',
    route: 'POS',
    icon: 'calculator-outline',
    activeIcon: 'calculator',
  },
  {
    label: 'Profile',
    route: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

const TabletSidebar = ({ navigation, state, collapsed, onToggleCollapse }) => {
  const { isLargeTablet } = useResponsive();

  const user = useSelector(reduxState => reduxState.auth.user);

  const locationName = user?.location?.locationName || 'Location';

  const currentRoute = state.routes[state.index]?.name;

  const handleNavigation = route => {
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      {/* ===================================================== */}
      {/* BRAND */}
      {/* ===================================================== */}

      <View
        style={[
          styles.logoContainer,

          collapsed && styles.logoContainerCollapsed,
        ]}
      >
        <View
          style={[
            styles.logoBox,

            isLargeTablet && styles.logoBoxLarge,

            collapsed && styles.logoBoxCollapsed,
          ]}
        >
          <Text
            style={[styles.logoLetter, isLargeTablet && styles.logoLetterLarge]}
          >
            W
          </Text>
        </View>

        {!collapsed && (
          <View style={styles.logoTextContainer}>
            <Text
              style={[styles.logoTitle, isLargeTablet && styles.logoTitleLarge]}
              numberOfLines={1}
            >
              Workfood KOT
            </Text>

            <Text
              style={[
                styles.logoSubtitle,

                isLargeTablet && styles.logoSubtitleLarge,
              ]}
              numberOfLines={1}
            >
              Management
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ===================================================== */}
      {/* MENU */}
      {/* ===================================================== */}

      <View style={styles.menuContainer}>
        {!collapsed && <Text style={styles.sectionTitle}>MENU</Text>}

        {menuItems.map(item => {
          const isActive = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.75}
              onPress={() => handleNavigation(item.route)}
              style={[
                styles.menuItem,

                isLargeTablet && styles.menuItemLarge,

                collapsed && styles.menuItemCollapsed,

                isActive && styles.menuItemActive,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,

                  isLargeTablet && styles.iconContainerLarge,

                  collapsed && styles.iconContainerCollapsed,

                  isActive && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={isLargeTablet ? 23 : 21}
                  color={
                    isActive
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary
                  }
                />
              </View>

              {!collapsed && (
                <>
                  <Text
                    style={[
                      styles.menuLabel,

                      isLargeTablet && styles.menuLabelLarge,

                      isActive && styles.menuLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>

                  {isActive && <View style={styles.activeIndicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ===================================================== */}
      {/* BOTTOM */}
      {/* ===================================================== */}

      <View style={styles.bottomContainer}>
        <View style={styles.divider} />

        {/* LOCATION CARD */}

        {!collapsed ? (
          <View
            style={[
              styles.locationCard,

              isLargeTablet && styles.locationCardLarge,
            ]}
          >
            <View style={styles.locationTopRow}>
              <View style={styles.onlineDotContainer}>
                <View style={styles.onlineDot} />
              </View>

              <Text
                style={[
                  styles.locationName,

                  isLargeTablet && styles.locationNameLarge,
                ]}
                numberOfLines={1}
              >
                {locationName}
              </Text>
            </View>

            <Text
              style={[
                styles.tabletStatus,

                isLargeTablet && styles.tabletStatusLarge,
              ]}
            >
              Tablet online
            </Text>
          </View>
        ) : (
          <View style={styles.collapsedLocationCard}>
            <View style={styles.onlineDotContainer}>
              <View style={styles.onlineDot} />
            </View>
          </View>
        )}

        {/* COLLAPSE BUTTON */}

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onToggleCollapse}
          style={[
            styles.collapseButton,

            collapsed && styles.collapseButtonCollapsed,
          ]}
        >
          <Ionicons
            name={
              collapsed ? 'chevron-forward-outline' : 'chevron-back-outline'
            }
            size={20}
            color={theme.colors.textSecondary}
          />

          {!collapsed && <Text style={styles.collapseText}>Collapse menu</Text>}
        </TouchableOpacity>

        {!collapsed && <Text style={styles.versionText}>Version 1.0.0</Text>}
      </View>
    </View>
  );
};

export default TabletSidebar;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: theme.colors.surface,

    paddingHorizontal: theme.spacing.md,

    paddingTop: theme.spacing.xxl,

    paddingBottom: theme.spacing.xl,

    borderRightWidth: 1,

    borderRightColor: theme.colors.border,
  },

  /* BRAND */

  logoContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: theme.spacing.sm,

    marginBottom: theme.spacing.xxl,
  },

  logoContainerCollapsed: {
    justifyContent: 'center',

    paddingHorizontal: 0,
  },

  logoBox: {
    width: 44,
    height: 44,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primary,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: theme.spacing.md,
  },

  logoBoxCollapsed: {
    marginRight: 0,
  },

  logoBoxLarge: {
    width: 50,
    height: 50,
  },

  logoLetter: {
    color: theme.colors.textOnPrimary,

    fontSize: theme.typography.fontSize.xl,

    fontWeight: theme.typography.fontWeight.extraBold,
  },

  logoLetterLarge: {
    fontSize: theme.typography.fontSize.xxl,
  },

  logoTextContainer: {
    flex: 1,
  },

  logoTitle: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.lg,

    fontWeight: theme.typography.fontWeight.bold,
  },

  logoTitleLarge: {
    fontSize: theme.typography.fontSize.xl,
  },

  logoSubtitle: {
    color: theme.colors.textMuted,

    fontSize: theme.typography.fontSize.xs,

    marginTop: theme.spacing.xs,
  },

  logoSubtitleLarge: {
    fontSize: theme.typography.fontSize.sm,
  },

  /* DIVIDER */

  divider: {
    height: 1,

    backgroundColor: theme.colors.border,

    marginBottom: theme.spacing.lg,
  },

  /* MENU */

  menuContainer: {
    flex: 1,
  },

  sectionTitle: {
    color: theme.colors.textMuted,

    fontSize: theme.typography.fontSize.xs,

    fontWeight: theme.typography.fontWeight.semiBold,

    paddingHorizontal: theme.spacing.md,

    marginBottom: theme.spacing.sm,

    letterSpacing: 1,
  },

  menuItem: {
    position: 'relative',

    height: 52,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: theme.spacing.sm,

    marginBottom: theme.spacing.xs,

    borderRadius: theme.radius.xl,
  },

  menuItemLarge: {
    height: 58,

    paddingHorizontal: theme.spacing.md,
  },

  menuItemCollapsed: {
    justifyContent: 'center',

    paddingHorizontal: 0,
  },

  menuItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },

  /* ICON */

  iconContainer: {
    width: 36,
    height: 36,

    borderRadius: theme.radius.lg,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: theme.spacing.sm,
  },

  iconContainerLarge: {
    width: 40,
    height: 40,
  },

  iconContainerCollapsed: {
    marginRight: 0,
  },

  iconContainerActive: {
    backgroundColor: theme.colors.primary,
  },

  /* MENU LABEL */

  menuLabel: {
    flex: 1,

    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.base,

    fontWeight: theme.typography.fontWeight.medium,
  },

  menuLabelLarge: {
    fontSize: theme.typography.fontSize.md,
  },

  menuLabelActive: {
    color: theme.colors.textPrimary,

    fontWeight: theme.typography.fontWeight.bold,
  },

  activeIndicator: {
    width: 4,

    height: 26,

    borderRadius: theme.radius.round,

    backgroundColor: theme.colors.primary,
  },

  /* BOTTOM */

  bottomContainer: {
    marginTop: 'auto',
  },

  /* LOCATION */

  locationCard: {
    minHeight: 60,

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: theme.colors.borderDark,

    borderRadius: theme.radius.xxl,

    paddingHorizontal: theme.spacing.lg,

    paddingVertical: theme.spacing.sm,

    marginHorizontal: theme.spacing.xs,

    marginBottom: theme.spacing.md,
  },

  locationCardLarge: {
    minHeight: 66,

    paddingHorizontal: theme.spacing.xl,
  },

  locationTopRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  collapsedLocationCard: {
    height: 48,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: theme.colors.borderDark,

    borderRadius: theme.radius.xl,

    marginBottom: theme.spacing.md,
  },

  onlineDotContainer: {
    width: 18,

    height: 18,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: theme.spacing.xs,

    borderRadius: theme.radius.round,

    backgroundColor: '#D1FAE5',
  },

  onlineDot: {
    width: 10,

    height: 10,

    borderRadius: theme.radius.round,

    backgroundColor: theme.colors.success,
  },

  locationName: {
    flexShrink: 1,

    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.sm,

    fontWeight: theme.typography.fontWeight.bold,
  },

  locationNameLarge: {
    fontSize: theme.typography.fontSize.base,
  },

  tabletStatus: {
    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.xs,

    textAlign: 'center',

    marginTop: theme.spacing.xs,
  },

  tabletStatusLarge: {
    fontSize: theme.typography.fontSize.sm,
  },

  /* COLLAPSE */

  collapseButton: {
    height: 50,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceSecondary,

    marginHorizontal: theme.spacing.xs,
  },

  collapseButtonCollapsed: {
    width: 48,

    alignSelf: 'center',
  },

  collapseText: {
    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.base,

    fontWeight: theme.typography.fontWeight.semiBold,

    marginLeft: theme.spacing.sm,
  },

  /* VERSION */

  versionText: {
    color: theme.colors.textMuted,

    fontSize: theme.typography.fontSize.xs,

    textAlign: 'center',

    marginTop: theme.spacing.md,
  },
});
