import { TIME_PRESETS } from '../lib/time.js';

function TimeControlSelector({ value, onChange }) {
  return (
    <div className="tc-selector">
      <label>time:</label>
      <select value={value ? `${value.initial}+${value.increment}` : '300+0'} onChange={(e) => {
        const [initial, increment] = e.target.value.split('+').map(Number);
        onChange({ initial, increment });
      }}>
        {TIME_PRESETS.map(p => (
          <option key={p.label} value={`${p.initial}+${p.increment}`}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default TimeControlSelector;
