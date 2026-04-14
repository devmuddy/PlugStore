import { io, Socket } from 'socket.io-client';
import { env } from '../../config/env';

let socket: Socket | null = null;

export const initializeSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(env.socketUrl, {
    auth: {
      token: token || localStorage.getItem('token'),
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;

