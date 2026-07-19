import { io } from 'socket.io-client';

// In production, it will use the Vercel environment variable. In development, it defaults to localhost.
const URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.MODE === 'production' ? undefined : 'http://localhost:3001');

export const getPlayerId = () => {
  let pid = sessionStorage.getItem('playerId');
  if (!pid) {
    pid = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('playerId', pid);
  }
  return pid;
};

export const playerId = getPlayerId();

export const socket = io(URL, {
  autoConnect: true,
  auth: {
    playerId
  }
});
