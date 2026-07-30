import { useEffect, useState } from 'react';
import { pieceUnicode, getLegalMoves } from '../lib/chess.js';
import Square from './Square.jsx';
import PromotionDialog from './PromotionDialog.jsx';

function Board({ board, fen, turn, onMove, flip }) {
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);

  useEffect(() => {
    setSelected(null);
    setPromotion(null);
  }, [fen]);

  function toBoardCoord(vR, vC) {
    return { r: flip ? 7 - vR : vR, c: flip ? 7 - vC : vC };
  }

  function tryMove(fromR, fromC, toR, toC) {
    const from = 'abcdefgh'[fromC] + (8 - fromR);
    const to = 'abcdefgh'[toC] + (8 - toR);
    const moves = getLegalMoves(from);
    const match = moves.find(m => m.to === to);

    if (!match) return false;

    const isPromotion = moves.some(m => m.to === to && m.promotion);
    if (isPromotion) {
      setPromotion({ fromR, fromC, toR, toC, from, to });
      return true;
    }

    onMove(fromR, fromC, toR, toC, match.promotion);
    setSelected(null);
    return true;
  }

  function handlePromotion(piece) {
    onMove(promotion.fromR, promotion.fromC, promotion.toR, promotion.toC, piece);
    setSelected(null);
    setPromotion(null);
  }

  function handleClick(vR, vC) {
    if (!fen) return;
    const { r, c } = toBoardCoord(vR, vC);
    const sq = board[r][c];

    if (selected) {
      if (selected.r === r && selected.c === c) {
        setSelected(null);
        return;
      }

      if (tryMove(selected.r, selected.c, r, c)) return;

      if (sq && sq.color === board[selected.r][selected.c]?.color) {
        setSelected({ r, c });
        return;
      }

      setSelected(null);
      return;
    }

    if (sq && sq.color === turn) {
      setSelected({ r, c });
    }
  }

  function getTargets() {
    if (!selected) return new Set();
    const algebraic = 'abcdefgh'[selected.c] + (8 - selected.r);
    const moves = getLegalMoves(algebraic);
    return new Set(moves.map(m => m.to));
  }

  const targets = getTargets();

  const squares = [];
  for (let vR = 0; vR < 8; vR++) {
    for (let vC = 0; vC < 8; vC++) {
      const { r, c } = toBoardCoord(vR, vC);
      const algebraic = 'abcdefgh'[c] + (8 - r);
      squares.push({ vR, vC, r, c, algebraic, piece: board[r]?.[c] || null });
    }
  }

  return (
    <>
      <div className="board">
        {squares.map(({ vR, vC, r, c, algebraic, piece }) => (
          <Square
            key={algebraic}
            piece={piece ? pieceUnicode(piece.type, piece.color) : ''}
            isLight={(vR + vC) % 2 === 0}
            isSelected={selected?.r === r && selected?.c === c}
            isLegal={targets.has(algebraic)}
            onClick={() => handleClick(vR, vC)}
          />
        ))}
      </div>
      {promotion && (
        <PromotionDialog color={turn} onSelect={handlePromotion} />
      )}
    </>
  );
}

export default Board;
