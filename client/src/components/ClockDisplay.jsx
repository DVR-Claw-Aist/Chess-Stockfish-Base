import { formatClock } from '../lib/time.js';

function ClockDisplay({ clocks, active, turn }) {
  return (
    <div className="clocks">
      <div className={`clock ${clocks && active === 'b' ? 'active' : ''}`}>
        black: {formatClock(clocks?.b)}
      </div>
      <div className={`clock ${clocks && active === 'w' ? 'active' : ''}`}>
        white: {formatClock(clocks?.w)}
      </div>
    </div>
  );
}

export default ClockDisplay;
