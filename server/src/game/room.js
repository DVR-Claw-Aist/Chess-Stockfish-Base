import { Chess } from 'chess.js';
import { StockfishEngine } from '../engine/stockfish.js';
import { acquire, release } from '../engine/pool.js';

const DEPTH_MAP = { easy: 4, medium: 10, hard: 18 };

export class GameRoom {
  constructor(id, mode = 'stockfish', playerColor = 'w', timeControl = null, onTick = null, difficulty = 'medium') {
    this.id = id;
    this.mode = mode;
    this.playerColor = playerColor;
    this.chess = new Chess();
    this.stockfish = null;
    this.sockets = new Set();

    this.state = 'paused';
    this.timeControl = timeControl;
    this.clocks = timeControl
      ? { w: timeControl.initial, b: timeControl.initial }
      : null;
    this._onTick = onTick;
    this._timerInterval = null;

    this.difficulty = difficulty;
    this.fenHistory = [];
  }

  get fen() { return this.chess.fen(); }
  get turn() { return this.chess.turn(); }
  get isOver() { return this.chess.isGameOver(); }

  addSocket(socketId) { this.sockets.add(socketId); }
  removeSocket(socketId) { this.sockets.delete(socketId); }

  startGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    if (this.clocks) this._startTicking();
  }

  _startTicking() {
    this._stopTicking();
    this._timerInterval = setInterval(() => {
      const active = this.chess.turn();
      this.clocks[active] = Math.max(0, this.clocks[active] - 0.1);

      if (this.clocks[active] <= 0) {
        this._stopTicking();
        this.state = 'gameover';
      }

      this._onTick?.({ w: this.clocks.w, b: this.clocks.b, active, gameOver: this.state === 'gameover' });
    }, 100);
  }

  _stopTicking() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _addIncrement(color) {
    if (!this.clocks) return;
    this.clocks[color] += this.timeControl.increment;
  }

  async makeMove(from, to, promotion) {
    this.fenHistory.push({ fen: this.chess.fen(), histLen: this.chess.history().length });
    const move = this.chess.move({ from, to, promotion });
    this._addIncrement(this.chess.turn() === 'w' ? 'b' : 'w');
    this._stopTicking();
    if (this.clocks && !this.chess.isGameOver()) this._startTicking();

    return this._moveResult(move);
  }

  async getBestMove() {
    if (this._engineBusy) return null;

    const fenBefore = this.chess.fen();
    this.fenHistory.push({ fen: fenBefore, histLen: this.chess.history().length });

    await acquire();
    this._engineBusy = true;
    try {
      if (!this.stockfish) {
        this.stockfish = new StockfishEngine();
        await this.stockfish.start();
      }

      const depth = DEPTH_MAP[this.difficulty] || 10;
      const engineMove = await this.stockfish.getBestMove(fenBefore, { depth });

      if (this.chess.fen() !== fenBefore) {
        this.fenHistory.pop();
        return null;
      }

      if (!engineMove || engineMove === '(none)') {
        return this._gameOverResult();
      }

      const move = this.chess.move(engineMove);
      this._addIncrement(this.chess.turn() === 'w' ? 'b' : 'w');
      this._stopTicking();
      if (this.clocks && !this.chess.isGameOver()) this._startTicking();

      return this._moveResult(move);
    } catch (err) {
      if (this.stockfish) {
        try { this.stockfish.quit(); } catch { /* ignore */ }
        this.stockfish = null;
      }
      throw err;
    } finally {
      this._engineBusy = false;
      release();
    }
  }

  _gameOverResult() {
    this._stopTicking();
    this.state = 'gameover';
    return {
      fen: this.chess.fen(),
      move: null,
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: true,
      history: this.chess.history({ verbose: true }),
    };
  }

  _moveResult(move) {
    return {
      fen: this.chess.fen(),
      move: { from: move.from, to: move.to, san: move.san, promotion: move.promotion },
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
      history: this.chess.history({ verbose: true }),
    };
  }

  getState() {
    return {
      id: this.id,
      mode: this.mode,
      playerColor: this.playerColor,
      state: this.state,
      timeControl: this.timeControl,
      clocks: this.clocks ? { ...this.clocks } : null,
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
      history: this.chess.history({ verbose: true }),
    };
  }

  undoMove() {
    if (this.fenHistory.length === 0) return null;

    this._stopTicking();

    const prev = this.fenHistory.pop();
    while (this.chess.history().length > prev.histLen) {
      this.chess.undo();
    }
    this.state = 'playing';

    if (this.clocks) this._startTicking();

    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
      history: this.chess.history({ verbose: true }),
    };
  }

  destroy() {
    this._stopTicking();
    if (this.stockfish) {
      this.stockfish.quit();
      this.stockfish = null;
    }
    this.sockets.clear();
  }
}
