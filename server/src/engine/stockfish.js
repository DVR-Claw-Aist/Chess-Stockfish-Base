import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = resolve(__dirname, '..', '..', 'bin', 'stockfish');

/**
 * Returns the default Stockfish binary name for the current platform.
 * @returns {string} Binary filename (Windows-specific build on win32, generic `stockfish` elsewhere).
 */
function getDefaultBinary() {
  if (process.platform === 'win32') return 'stockfish-windows-x86-64-sse41-popcnt.exe';
  return 'stockfish';
}

const BIN_PATH = process.env.STOCKFISH_PATH || resolve(BIN_DIR, getDefaultBinary());

export class StockfishEngine {
  /**
   * @param {string} [binPath] Path to the Stockfish binary (defaults to auto-detected `BIN_PATH`).
   */
  constructor(binPath = BIN_PATH) {
    /** @type {string} */
    this.binPath = binPath;
    /** @type {import('child_process').ChildProcess | null} */
    this.process = null;
    /** @type {import('readline').Interface | null} */
    this.rl = null;
  }

  /**
   * Spawns the Stockfish process and waits until the UCI banner is received.
   * @returns {Promise<void>} Resolves when engine is ready, rejects on spawn error.
   */
  start() {
    return new Promise((resolve, reject) => {
      if (this.process) {
        this.quit();
      }

      this.process = spawn(this.binPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
      this.rl = readline.createInterface({ input: this.process.stdout });

      this.rl.on('line', (line) => {
        if (line.includes('Stockfish')) resolve();
      });

      this.process.on('error', (err) => {
        this.process = null;
        this.rl = null;
        reject(err);
      });
      this.process.stdin.write('uci\n');
    });
  }

  /**
   * Asks the engine for the best move in the given position.
   * @param {string} fen FEN of the position.
   * @param {{ depth?: number, timeout?: number }} [options] `depth` search depth (default 15), `timeout` ms (default 30000).
   * @returns {Promise<string | null>} Best move in UCI notation (e.g. `e2e4`), or `(none)` from engine.
   * @throws {Error} If engine not started, crashes, or search times out.
   */
  getBestMove(fen, options = {}) {
    const depth = options.depth || 15;
    const timeoutMs = options.timeout || 30000;

    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('engine not started'));
        return;
      }

      const timer = setTimeout(() => {
        this.rl.removeAllListeners('line');
        if (this.process) {
          this.process.kill();
          this.process = null;
        }
        this.rl = null;
        reject(new Error('stockfish timeout'));
      }, timeoutMs);

      this.process.stdin.write(`position fen ${fen}\n`);
      this.process.stdin.write(`go depth ${depth}\n`);

      const handler = (line) => {
        if (line.startsWith('bestmove')) {
          clearTimeout(timer);
          this.rl.removeListener('line', handler);
          resolve(line.split(' ')[1]);
        }
      };

      this.rl.on('line', handler);
      this.process.on('error', (err) => {
        clearTimeout(timer);
        this.process = null;
        this.rl = null;
        reject(err);
      });
    });
  }

  /**
   * Terminates the engine process and cleans up readline.
   * @returns {void}
   */
  quit() {
    if (this.process) {
      this.process.stdin.write('quit\n');
      this.process.kill();
      this.process = null;
    }
    this.rl = null;
  }
}
