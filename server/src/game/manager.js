import { GameRoom } from './room.js';

const rooms = new Map();
let nextId = 1;

export function createRoom(mode = 'stockfish', playerColor = 'w', timeControl = null, onTick = null, difficulty = 'medium') {
  const id = String(nextId++);
  const room = new GameRoom(id, mode, playerColor, timeControl, onTick, difficulty);
  rooms.set(id, room);
  return room;
}

export function getRoom(id) {
  return rooms.get(id);
}

export function removeRoom(id) {
  const room = rooms.get(id);
  if (room) {
    room.destroy();
    rooms.delete(id);
  }
}

export function addSocketToRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) room.addSocket(socketId);
}

export function removeSocketFromRoom(socketId) {
  for (const room of rooms.values()) {
    room.removeSocket(socketId);
    if (room.sockets.size === 0) removeRoom(room.id);
  }
}
