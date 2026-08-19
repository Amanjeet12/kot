import React, { createContext, useContext, useEffect, useState } from 'react';

import { disconnectSocket, initializeSocket } from '../socket/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, token, user, isAuthenticated }) => {
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();

      setSocket(null);
      setIsSocketConnected(false);
      setSocketError(null);

      return;
    }

    let socketInstance;

    try {
      socketInstance = initializeSocket(token);
      setSocketError(null);
    } catch (error) {
      console.warn(error.message);
      setSocketError(error);
      return;
    }

    setSocket(socketInstance);

    const handleConnect = () => {
      console.log('Socket connected:', socketInstance.id);

      setIsSocketConnected(true);

      if (user?.id) {
        socketInstance.emit('join_user', {
          user_id: user.id,
        });
      }
    };

    const handleDisconnect = reason => {
      console.log('Socket disconnected:', reason);

      setIsSocketConnected(false);
    };

    const handleConnectError = error => {
      console.log('Socket connection error:', error?.message);
      setSocketError(error);
    };

    socketInstance.on('connect', handleConnect);

    socketInstance.on('disconnect', handleDisconnect);

    socketInstance.on('connect_error', handleConnectError);

    return () => {
      socketInstance.off('connect', handleConnect);

      socketInstance.off('disconnect', handleDisconnect);

      socketInstance.off('connect_error', handleConnectError);

      disconnectSocket();
    };
  }, [token, isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isSocketConnected,
        socketError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used inside SocketProvider');
  }

  return context;
};
