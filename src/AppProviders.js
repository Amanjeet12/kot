import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';

import { store } from './store/store';
import { queryClient } from './config/queryClient';
import { SocketProvider } from './contexts/SocketContext';

const GlobalProviders = ({ children }) => {
  const { token, user, isAuthenticated } = useSelector(state => state.auth);

  return (
    <SocketProvider token={token} user={user} isAuthenticated={isAuthenticated}>
      {children}
    </SocketProvider>
  );
};

const AppProviders = ({ children }) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <GlobalProviders>{children}</GlobalProviders>
      </QueryClientProvider>
    </Provider>
  );
};

export default AppProviders;
