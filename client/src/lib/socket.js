import { io } from 'socket.io-client';

function getInitData() {
  try {
    return window.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

export const socket = io({
  transports: ['websocket'],
  auth: { initData: getInitData() },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
