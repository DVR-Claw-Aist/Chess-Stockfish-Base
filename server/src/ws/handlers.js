import { createRoom, getRoom, removeRoom, addSocketToRoom, removeSocketFromRoom } from '../game/manager.js';

export function registerHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join_game', async ({ mode = 'stockfish', playerColor = 'w', timeControl, difficulty = 'medium', autoStart } = {}) => {
      const existingRooms = [...socket.rooms].filter(r => r !== socket.id);
      existingRooms.forEach(r => { socket.leave(r); removeRoom(r); });
      removeSocketFromRoom(socket.id);

      const room = createRoom(mode, playerColor, timeControl || null, (clocks) => {
        io.to(room.id).emit('time_update', { ...clocks, roomId: room.id });
      }, difficulty);
      socket.join(room.id);
      addSocketToRoom(room.id, socket.id);

      socket.emit('game_state', room.getState());

      if (autoStart) {
        room.startGame();
        io.to(room.id).emit('game_state', room.getState());

        if (room.mode === 'stockfish' && room.turn !== room.playerColor) {
          try {
            const result = await room.getBestMove();
            if (!result) return;
            io.to(room.id).emit('stockfish_move', result);
            io.to(room.id).emit('game_state', room.getState());
            if (result.isGameOver) removeRoom(room.id);
          } catch (err) {
            io.to(room.id).emit('error', { message: 'engine error' });
          }
        }
      }
    });

    socket.on('start_game', async ({ roomId } = {}) => {
      const room = getRoom(roomId);
      if (!room || room.state !== 'paused' || !room.sockets.has(socket.id)) return;

      room.startGame();
      io.to(roomId).emit('game_state', room.getState());

      if (room.mode === 'stockfish' && room.turn !== room.playerColor) {
        try {
          const result = await room.getBestMove();
          if (!result) return;
          io.to(roomId).emit('stockfish_move', result);
          io.to(roomId).emit('game_state', room.getState());

          if (result.isGameOver) removeRoom(roomId);
        } catch (err) {
          io.to(roomId).emit('error', { message: 'engine error' });
        }
      }
    });

    socket.on('make_move', async ({ roomId, from, to, promotion } = {}) => {
      const room = getRoom(roomId);
      if (!room || room.state !== 'playing' || !room.sockets.has(socket.id)) {
        socket.emit('error', { message: 'room not found or game not started' });
        return;
      }

      try {
        const result = await room.makeMove(from, to, promotion);
        io.to(roomId).emit('move_result', result);
        io.to(roomId).emit('game_state', room.getState());

        if (result.isGameOver) {
          removeRoom(roomId);
          return;
        }

        if (room.mode === 'stockfish' && room.turn !== room.playerColor) {
          try {
            const engineResult = await room.getBestMove();
            if (!engineResult) return;
            io.to(roomId).emit('stockfish_move', engineResult);
            io.to(roomId).emit('game_state', room.getState());

            if (engineResult.isGameOver) {
              removeRoom(roomId);
            }
          } catch (err) {
            io.to(roomId).emit('error', { message: 'engine error' });
          }
        }
      } catch (err) {
        console.error('make_move error:', err?.message, JSON.stringify({ roomId, from, to, promotion }));
        socket.emit('error', { message: err?.message || 'invalid move' });
      }
    });

    socket.on('undo_move', ({ roomId } = {}) => {
      const room = getRoom(roomId);
      if (!room || room.fenHistory.length === 0 || !room.sockets.has(socket.id)) return;

      const result = room.undoMove();
      if (result) {
        io.to(roomId).emit('move_result', result);
        io.to(roomId).emit('game_state', room.getState());
      }
    });

    socket.on('leave_game', ({ roomId } = {}) => {
      if (roomId) {
        const room = getRoom(roomId);
        if (!room || !room.sockets.has(socket.id)) return;
        socket.leave(roomId);
        removeRoom(roomId);
        removeSocketFromRoom(socket.id);
      }
    });

    socket.on('disconnect', () => {
      removeSocketFromRoom(socket.id);
    });
  });
}
