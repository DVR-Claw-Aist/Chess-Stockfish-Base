import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from '../lib/socket.js';
import { setFen, getBoard } from '../lib/chess.js';
import Board from './Board.jsx';
import GameInfo from './GameInfo.jsx';
import MoveHistory from './MoveHistory.jsx';
import ClockDisplay from './ClockDisplay.jsx';
import TimeControlSelector from './TimeControlSelector.jsx';
import DifficultySelector from './DifficultySelector.jsx';
import { playSound, setSoundEnabled, isSoundEnabled } from '../lib/sounds.js';

function Game() {
  const [board, setBoard] = useState([]);
  const [fen, setFenState] = useState('');
  const [turn, setTurn] = useState('w');
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const [roomId, setRoomId] = useState(null);
  const [history, setHistory] = useState([]);
  const [playerColor, setPlayerColor] = useState('w');
  const [gameState, setGameState] = useState('idle');
  const [clocks, setClocks] = useState(null);
  const [clockActive, setClockActive] = useState(null);
  const [timeControl, setTimeControl] = useState({ initial: 180, increment: 0 });
  const [difficulty, setDifficulty] = useState('medium');
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabledState(prev => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);
  const roomIdRef = useRef(null);

  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('game_state', (state) => {
      setFen(state.fen);
      setFenState(state.fen);
      setTurn(state.turn);
      setIsCheck(state.isCheck);
      setIsCheckmate(state.isCheckmate);
      setIsDraw(state.isDraw);
      setIsGameOver(state.isGameOver);
      setBoard(getBoard());
      setRoomId(state.id);
      setHistory(state.history || []);
      setGameState(state.state || 'paused');
      setPlayerColor(state.playerColor || 'w');
      setClocks(state.clocks || null);
    });

    function handleSound(result) {
      if (result.isCheckmate) playSound('checkmate');
      else if (result.isCheck) playSound('check');
      else if (result.move && result.move.san && result.move.san.includes('x')) playSound('capture');
      else playSound('move');
    }

    socket.on('move_result', (result) => {
      setFen(result.fen);
      setFenState(result.fen);
      setTurn(result.turn);
      setIsCheck(result.isCheck);
      setIsCheckmate(result.isCheckmate);
      setIsDraw(result.isDraw);
      setIsGameOver(result.isGameOver);
      setBoard(getBoard());
      setHistory(result.history || []);
      handleSound(result);
    });

    socket.on('stockfish_move', (result) => {
      setFen(result.fen);
      setFenState(result.fen);
      setTurn(result.turn);
      setIsCheck(result.isCheck);
      setIsCheckmate(result.isCheckmate);
      setIsDraw(result.isDraw);
      setIsGameOver(result.isGameOver);
      setBoard(getBoard());
      setHistory(result.history || []);
      handleSound(result);
    });

    socket.on('time_update', ({ w, b, active, roomId: rId }) => {
      if (rId && rId !== roomIdRef.current) return;
      setClocks({ w, b });
      setClockActive(active);
    });

    socket.on('error', ({ message }) => {
      console.error('socket error:', message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game_state');
      socket.off('move_result');
      socket.off('stockfish_move');
      socket.off('time_update');
      socket.off('error');
    };
  }, []);

  const handleStart = useCallback(() => {
    socket.emit('join_game', { mode: 'stockfish', playerColor, timeControl, difficulty, autoStart: true });
  }, [playerColor, timeControl, difficulty]);

  const handleMove = useCallback((fromR, fromC, toR, toC, promotion) => {
    if (!roomId) return;
    const from = 'abcdefgh'[fromC] + (8 - fromR);
    const to = 'abcdefgh'[toC] + (8 - toR);
    socket.emit('make_move', { roomId, from, to, promotion });
  }, [roomId]);

  const handleNewGame = useCallback(() => {
    if (roomId) socket.emit('leave_game', { roomId });
    setFenState('');
    setTurn('w');
    setIsCheck(false);
    setIsCheckmate(false);
    setIsDraw(false);
    setIsGameOver(false);
    setBoard([]);
    setRoomId(null);
    setHistory([]);
    setClocks(null);
    setClockActive(null);
    setGameState('idle');
  }, [roomId]);

  const handleUndo = useCallback(() => {
    if (roomId) socket.emit('undo_move', { roomId });
  }, [roomId]);

  const showSetup = gameState === 'idle';

  return (
    <div className="game">
      <div className={`connection-status ${connected ? 'on' : 'off'}`}>
        {connected ? 'connected' : 'disconnected'}
      </div>
      <div className="game-board-col">
        {clocks && (
          <ClockDisplay clocks={clocks} active={clockActive} turn={turn} gameOver={isGameOver} isCheckmate={isCheckmate} />
        )}
        <Board board={board} fen={fen} turn={turn} onMove={handleMove} flip={playerColor === 'b'} isCheck={isCheck} isCheckmate={isCheckmate} />
      </div>
      {showSetup && !fen ? (
        <div className="setup">
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
          <TimeControlSelector value={timeControl} onChange={setTimeControl} />
          <GameInfo
            fen={fen}
            connected={connected}
            playerColor={playerColor}
            gameState={gameState}
            onColorChange={setPlayerColor}
            onStart={handleStart}
            soundEnabled={soundEnabled}
            onSoundToggle={handleSoundToggle}
          />
        </div>
      ) : (
        <div className="game-bottom">
          <MoveHistory history={history} />
          <GameInfo
            fen={fen}
            turn={turn}
            isCheck={isCheck}
            isCheckmate={isCheckmate}
            isDraw={isDraw}
            isGameOver={isGameOver}
            connected={connected}
            playerColor={playerColor}
            gameState={gameState}
            onStart={handleStart}
            onNewGame={handleNewGame}
            onUndo={handleUndo}
            soundEnabled={soundEnabled}
            onSoundToggle={handleSoundToggle}
          />
        </div>
      )}
    </div>
  );
}

export default Game;
