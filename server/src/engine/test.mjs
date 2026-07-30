import { StockfishEngine } from './stockfish.js';

const engine = new StockfishEngine();

try {
  await engine.start();
  console.log('engine started');

  const move = await engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { depth: 10 });
  console.log('bestmove:', move);

  engine.quit();
  console.log('done');
} catch (err) {
  console.error('error:', err);
  engine.quit();
}
