import { io } from 'socket.io-client';

// In production, it will use the Vercel environment variable. In development, it defaults to localhost.
const URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.MODE === 'production' ? undefined : 'http://localhost:3001');

export const socket = io(URL, {
  autoConnect: true
});
