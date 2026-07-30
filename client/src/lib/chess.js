import { Chess } from 'chess.js';

const WHITE_UNICODE = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };
const BLACK_UNICODE = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

const game = new Chess();

export function pieceUnicode(type, color) {
  const map = color === 'w' ? WHITE_UNICODE : BLACK_UNICODE;
  return map[type] || '';
}

export function setFen(fen) {
  if (!fen || typeof fen !== 'string') return;
  try { game.load(fen); } catch {}
}

export function getLegalMoves(square) {
  return game.moves({ square, verbose: true });
}

export function getFullMoveList() {
  return game.history({ verbose: true });
}

export function getBoard() {
  const board = [];
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    for (let c = 0; c < 8; c++) {
      const sq = game.board()[r][c];
      board[r][c] = sq ? { type: sq.type, color: sq.color } : null;
    }
  }
  return board;
}
