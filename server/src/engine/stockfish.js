import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = resolve(__dirname, '..', '..', 'bin', 'stockfish');

function getDefaultBinary() {
  if (process.platform === 'win32') return 'stockfish-windows-x86-64-sse41-popcnt.exe';
  return 'stockfish';
}

const BIN_PATH = process.env.STOCKFISH_PATH || resolve(BIN_DIR, getDefaultBinary());

export class StockfishEngine {
  constructor(binPath = BIN_PATH) {
    this.binPath = binPath;
    this.process = null;
    this.rl = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.binPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
      this.rl = readline.createInterface({ input: this.process.stdout });

      this.rl.on('line', (line) => {
        if (line.includes('Stockfish')) resolve();
      });

      this.process.on('error', reject);
      this.process.stdin.write('uci\n');
    });
  }

  getBestMove(fen, options = {}) {
    const depth = options.depth || 15;
    const timeoutMs = options.timeout || 30000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.rl.removeAllListeners('line');
        if (this.process) this.process.kill();
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
      this.process.on('error', (err) => { clearTimeout(timer); reject(err); });
    });
  }

  quit() {
    if (this.process) {
      this.process.stdin.write('quit\n');
      this.process.kill();
      this.process = null;
      this.rl = null;
    }
  }
}
