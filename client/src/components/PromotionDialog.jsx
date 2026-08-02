/** @type {Array<{ type: string, label: string }>} */
const PIECES = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

/**
 * Modal asking which piece to promote to.
 * @param {{ color: string, onSelect: (type: string) => void }} props
 * @returns {JSX.Element}
 */
function PromotionDialog({ color, onSelect }) {
  return (
    <div className="promotion-overlay" onClick={() => onSelect('q')}>
      <div className="promotion-dialog" onClick={e => e.stopPropagation()}>
        {PIECES.map(({ type }) => (
          <button key={type} className="promotion-btn" onClick={() => onSelect(type)}>
            <span className="piece">{color === 'w' ? '♕♖♗♘'['qrbn'.indexOf(type)] : '♛♜♝♞'['qrbn'.indexOf(type)]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PromotionDialog;
