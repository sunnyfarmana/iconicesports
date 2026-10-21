import { io, Socket } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;

// Use same-origin connection through Vite proxy or explicitly configured backend URL
export const socket: Socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling']
});

export default socket;
