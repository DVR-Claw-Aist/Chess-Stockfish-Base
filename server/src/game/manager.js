import { randomUUID } from 'crypto';
import { GameRoom } from './room.js';

/** @type {Map<string, GameRoom>} */
const rooms = new Map();

/**
 * Creates and registers a new game room.
 * @param {string} [mode]
 * @param {import('./room.js').Color} [playerColor]
 * @param {import('./room.js').TimeControl | null} [timeControl]
 * @param {((update: import('./room.js').ClockUpdate) => void) | null} [onTick]
 * @param {import('./room.js').Difficulty} [difficulty]
 * @returns {GameRoom} Newly created room.
 */
export function createRoom(mode = 'stockfish', playerColor = 'w', timeControl = null, onTick = null, difficulty = 'medium') {
  const id = randomUUID();
  const room = new GameRoom(id, mode, playerColor, timeControl, onTick, difficulty);
  rooms.set(id, room);
  return room;
}

/**
 * @param {string} id
 * @returns {GameRoom | undefined}
 */
export function getRoom(id) {
  return rooms.get(id);
}

/**
 * Destroys and removes a room if it exists.
 * @param {string} id
 * @returns {void}
 */
export function removeRoom(id) {
  const room = rooms.get(id);
  if (room) {
    room.destroy();
    rooms.delete(id);
  }
}

/**
 * Attaches a socket to an existing room.
 * @param {string} roomId
 * @param {string} socketId
 * @returns {void}
 */
export function addSocketToRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) room.addSocket(socketId);
}

/**
 * Removes a socket from all rooms; empties rooms get destroyed.
 * @param {string} socketId
 * @returns {void}
 */
export function removeSocketFromRoom(socketId) {
  for (const room of rooms.values()) {
    room.removeSocket(socketId);
    if (room.sockets.size === 0) removeRoom(room.id);
  }
}
