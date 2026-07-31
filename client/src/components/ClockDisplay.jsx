import { formatClock } from '../lib/time.js';

function ClockDisplay({ clocks, active, turn: _turn, gameOver, isCheckmate }) {
  function expired(color) {
    return (gameOver && clocks?.[color] <= 0) || isCheckmate;
  }
  return (
    <div className="clocks">
      <div className={`clock clock-black ${clocks && active === 'b' ? 'active' : ''} ${expired('b') ? 'expired' : ''}`}>
        black: {formatClock(clocks?.b)}
      </div>
      <div className={`clock clock-white ${clocks && active === 'w' ? 'active' : ''} ${expired('w') ? 'expired' : ''}`}>
        white: {formatClock(clocks?.w)}
      </div>
    </div>
  );
}

export default ClockDisplay;
