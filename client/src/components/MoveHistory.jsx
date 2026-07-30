function MoveHistory({ history }) {
  if (!history || history.length === 0) return null;

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: history[i]?.san || '',
      black: history[i + 1]?.san || '',
    });
  }

  return (
    <div className="move-history">
      {rows.map((row) => (
        <div key={row.num} className="move-row">
          <span className="move-num">{row.num}.</span>
          <span>{row.white}</span>
          <span>{row.black}</span>
        </div>
      ))}
    </div>
  );
}

export default MoveHistory;
