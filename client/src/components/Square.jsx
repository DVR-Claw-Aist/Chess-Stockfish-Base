function Square({ piece, isLight, isSelected, isLegal, onClick }) {
  const className = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected && 'selected',
    isLegal && 'legal',
    isLegal && piece && 'legal-piece',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} onClick={onClick}>
      {piece && <span className="piece">{piece}</span>}
    </div>
  );
}

export default Square;
