import Config from 'react-native-config';
import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = token => {
  const socketUrl = Config.SOCKET_URL || 'wss://kot.workfoodap.in';
  console.log("socketUrl", socketUrl)

  if (!socketUrl) {
    throw new Error(
      'Socket URL is missing. Set SOCKET_URL (or API_URL) in your .env file.',
    );
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
