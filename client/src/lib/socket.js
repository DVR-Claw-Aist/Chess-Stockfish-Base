import { io } from 'socket.io-client';

/**
 * Reads Telegram initData from the WebApp, if running inside Telegram.
 * @returns {string} initData string or empty string.
 */
function getInitData() {
  try {
    return window.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

/** Reconnecting Socket.IO client instance (websocket transport). */
export const socket = io({
  transports: ['websocket'],
  auth: { initData: getInitData() },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
