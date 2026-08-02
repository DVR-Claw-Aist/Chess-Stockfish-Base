import { formatClock } from '../lib/time.js';

/**
 * Renders both player clocks, marking the active side and expired clocks.
 * @param {{ clocks?: { w: number, b: number } | null, active?: string | null,
 *   turn?: string, gameOver?: boolean, isCheckmate?: boolean }} props
 * @returns {JSX.Element}
 */
function ClockDisplay({ clocks, active, turn: _turn, gameOver, isCheckmate }) {
  /**
   * @param {string} color
   * @returns {boolean} Whether this clock is expired.
   */
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
