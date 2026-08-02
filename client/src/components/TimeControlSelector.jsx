import { TIME_PRESETS } from '../lib/time.js';

/**
 * Renders a dropdown of predefined time controls.
 * @param {{ value?: { initial: number, increment: number } | null,
 *   onChange: (tc: { initial: number, increment: number }) => void }} props
 * @returns {JSX.Element}
 */
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
