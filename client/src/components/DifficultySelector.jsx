function DifficultySelector({ value, onChange }) {
  return (
    <div className="difficulty-selector">
      <label>difficulty:</label>
      <div className="diff-buttons">
        {['easy', 'medium', 'hard'].map((d) => (
          <button key={d} className={value === d ? 'active' : ''} onClick={() => onChange(d)}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DifficultySelector;
