import { Chess } from 'chess.js';

/** @type {Record<string, string>} */
const WHITE_UNICODE = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };
/** @type {Record<string, string>} */
const BLACK_UNICODE = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

const game = new Chess();

/**
 * Returns the unicode glyph for a piece type and color.
 * @param {string} type Piece type (`k`, `q`, `r`, `b`, `n`, `p`).
 * @param {string} color Piece color (`w` or `b`).
 * @returns {string} Glyph, or empty string if unknown type.
 */
export function pieceUnicode(type, color) {
  const map = color === 'w' ? WHITE_UNICODE : BLACK_UNICODE;
  return map[type] || '';
}

/**
 * Loads a FEN into the local display-only game. Ignores invalid input.
 * @param {string} fen
 * @returns {void}
 */
export function setFen(fen) {
  if (!fen || typeof fen !== 'string') return;
  try { game.load(fen); } catch {}
}

/**
 * Returns legal moves from a square.
 * @param {string} square Algebraic square (e.g. `e2`).
 * @returns {import('chess.js').Move[]}
 */
export function getLegalMoves(square) {
  return game.moves({ square, verbose: true });
}

/**
 * @returns {import('chess.js').Move[]} Full move history.
 */
export function getFullMoveList() {
  return game.history({ verbose: true });
}

/**
 * @returns {Array<Array<{ type: string, color: string } | null>>} 8x8 board, row 0 = rank 8.
 */
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
