import React, { createContext, useContext, useMemo } from 'react';

import { useWindowDimensions } from 'react-native';

const ResponsiveContext = createContext(null);

const BREAKPOINTS = {
  tablet: 768,
  largeTablet: 1024,
};

export const ResponsiveProvider = ({ children }) => {
  const { width, height, scale, fontScale } = useWindowDimensions();

  const responsive = useMemo(() => {
    const isMobile = width < BREAKPOINTS.tablet;
    const isTablet = width >= BREAKPOINTS.tablet;
    const isLargeTablet = width >= BREAKPOINTS.largeTablet;
    const isLandscape = width > height;
    const isPortrait = height >= width;
    let deviceType = 'mobile';

    if (isLargeTablet) {
      deviceType = 'largeTablet';
    } else if (isTablet) {
      deviceType = 'tablet';
    }

    return {
      width,
      height,
      scale,
      fontScale,

      deviceType,

      isMobile,
      isTablet,
      isLargeTablet,

      isLandscape,
      isPortrait,

      screenPadding: isTablet ? 24 : 16,
      sidebarWidth: isLargeTablet ? 280 : isTablet ? 220 : 0,
    };
  }, [width, height, scale, fontScale]);

  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);

  if (!context) {
    throw new Error('useResponsive must be used inside ResponsiveProvider');
  }

  return context;
};
