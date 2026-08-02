import { Chess } from 'chess.js';
import { StockfishEngine } from '../engine/stockfish.js';
import { acquire, release } from '../engine/pool.js';

const DEPTH_MAP = { easy: 4, medium: 10, hard: 18 };

/**
 * @typedef {'easy'|'medium'|'hard'} Difficulty
 * @typedef {'w'|'b'} Color
 * @typedef {'paused'|'playing'|'gameover'} RoomState
 * @typedef {{ initial: number, increment: number }} TimeControl
 * @typedef {{ w: number, b: number, active: Color, gameOver: boolean }} ClockUpdate
 * @typedef {{ from: string, to: string, san: string, promotion?: string }} MoveInfo
 * @typedef {{ fen: string, move: MoveInfo | null, turn: Color, isCheck: boolean,
 *   isCheckmate: boolean, isDraw: boolean, isGameOver: boolean,
 *   history: Array<import('chess.js').Move> }} MoveResult
 * @typedef {{ fen: string, histLen: number }} FenSnapshot
 */

export class GameRoom {
  /**
   * @param {string} id Unique room id.
   * @param {string} [mode] Game mode (`stockfish`).
   * @param {Color} [playerColor] Side the human plays.
   * @param {TimeControl | null} [timeControl] Clock settings, or null for no clock.
   * @param {((update: ClockUpdate) => void) | null} [onTick] Called every 100ms while clock runs.
   * @param {Difficulty} [difficulty] Engine strength.
   */
  constructor(id, mode = 'stockfish', playerColor = 'w', timeControl = null, onTick = null, difficulty = 'medium') {
    /** @type {string} */
    this.id = id;
    /** @type {string} */
    this.mode = mode;
    /** @type {Color} */
    this.playerColor = playerColor;
    /** @type {import('chess.js').Chess} */
    this.chess = new Chess();
    /** @type {StockfishEngine | null} */
    this.stockfish = null;
    /** @type {Set<string>} */
    this.sockets = new Set();

    /** @type {RoomState} */
    this.state = 'paused';
    /** @type {TimeControl | null} */
    this.timeControl = timeControl;
    /** @type {{ w: number, b: number } | null} */
    this.clocks = timeControl
      ? { w: timeControl.initial, b: timeControl.initial }
      : null;
    /** @type {((update: ClockUpdate) => void) | null} */
    this._onTick = onTick;
    /** @type {NodeJS.Timeout | null} */
    this._timerInterval = null;

    /** @type {Difficulty} */
    this.difficulty = difficulty;
    /** @type {FenSnapshot[]} */
    this.fenHistory = [];
    /** @type {boolean} */
    this._engineBusy = false;
  }

  /** @returns {string} Current FEN. */
  get fen() { return this.chess.fen(); }
  /** @returns {Color} Side to move. */
  get turn() { return this.chess.turn(); }
  /** @returns {boolean} Whether the game is over. */
  get isOver() { return this.chess.isGameOver(); }

  /**
   * Attaches a socket to the room.
   * @param {string} socketId
   * @returns {void}
   */
  addSocket(socketId) { this.sockets.add(socketId); }

  /**
   * Detaches a socket from the room.
   * @param {string} socketId
   * @returns {void}
   */
  removeSocket(socketId) { this.sockets.delete(socketId); }

  /**
   * Starts the game if paused; begins the clock.
   * @returns {void}
   */
  startGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    if (this.clocks) this._startTicking();
  }

  /**
   * Starts the 100ms clock interval, decrementing the active side's clock.
   * @returns {void}
   */
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

  /**
   * Stops the clock interval.
   * @returns {void}
   */
  _stopTicking() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  /**
   * Adds the time-control increment to the given side's clock.
   * @param {Color} color Side to give increment.
   * @returns {void}
   */
  _addIncrement(color) {
    if (!this.clocks) return;
    this.clocks[color] += this.timeControl.increment;
  }

  /**
   * Applies a move to the board, records FEN history, adds increment and restarts the clock.
   * @param {string} from Starting square (e.g. `e2`).
   * @param {string} to Target square (e.g. `e4`).
   * @param {string} [promotion] Promotion piece for pawn promotions.
   * @returns {Promise<MoveResult>}
   * @throws {Error} If the move is illegal.
   */
  async makeMove(from, to, promotion) {
    const move = this.chess.move({ from, to, promotion });
    this.fenHistory.push({ fen: this.chess.fen(), histLen: this.chess.history().length });
    this._addIncrement(this.chess.turn() === 'w' ? 'b' : 'w');
    this._stopTicking();
    if (this.clocks && !this.chess.isGameOver()) this._startTicking();

    return this._moveResult(move);
  }

  /**
   * Asks Stockfish for a move, applies it, and returns the result.
   * Returns null if the position changed while the engine was thinking.
   * @returns {Promise<MoveResult | null>}
   * @throws {Error} On engine failure (engine killed and released afterwards).
   */
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

  /**
   * Builds a game-over result (no move played).
   * @returns {MoveResult}
   */
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

  /**
   * Builds a result payload from a played chess.js move.
   * @param {import('chess.js').Move} move
   * @returns {MoveResult}
   */
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

  /**
   * Returns a full snapshot of the room state for the client.
   * @returns {{ id: string, mode: string, playerColor: Color, state: RoomState,
   *   timeControl: TimeControl | null, clocks: { w: number, b: number } | null,
   *   fen: string, turn: Color, isCheck: boolean, isCheckmate: boolean, isDraw: boolean,
   *   isGameOver: boolean, history: Array<import('chess.js').Move> }}
   */
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

  /**
   * Undoes moves back to the most recent FEN snapshot.
   * @returns {MoveResult | null} New state, or null if no history to undo.
   */
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

  /**
   * Stops the clock, quits the engine and clears sockets.
   * @returns {void}
   */
  destroy() {
    this._stopTicking();
    if (this.stockfish) {
      this.stockfish.quit();
      this.stockfish = null;
    }
    this.sockets.clear();
  }
}
