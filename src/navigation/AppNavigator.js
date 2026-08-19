import React from 'react';

import { useResponsive } from '../contexts/ResponsiveContext';

import MobileNavigator from './MobileNavigator';
import TabletNavigator from './TabletNavigator';

const AppNavigator = () => {
  const { isMobile, isTablet } = useResponsive();

  if (isTablet) {
    return <TabletNavigator />;
  }

  return <MobileNavigator />;
};

export default AppNavigator;
