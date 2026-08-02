/**
 * Renders game status, color picker, and action buttons.
 * @param {{ fen?: string, turn?: string, isCheck?: boolean, isCheckmate?: boolean,
 *   isDraw?: boolean, isGameOver?: boolean, playerColor?: string, gameState?: string,
 *   onColorChange?: (color: string) => void, onStart?: () => void, onNewGame?: () => void,
 *   onUndo?: () => void, soundEnabled?: boolean, onSoundToggle?: () => void }} props
 * @returns {JSX.Element}
 */
function GameInfo({ fen, turn, isCheck, isCheckmate, isDraw, isGameOver, connected: _connected, playerColor, gameState, onColorChange, onStart, onNewGame, onUndo, soundEnabled, onSoundToggle }) {
  return (
    <div className="game-info">
      {fen && gameState !== 'idle' && (
        <>
          <p>turn: {turn === 'w' ? 'white' : 'black'}</p>
          {isCheck && <p>check!</p>}
          {isCheckmate && <p>checkmate</p>}
          {isDraw && <p>draw</p>}
          {isGameOver && <p>game over</p>}
        </>
      )}

      {gameState === 'idle' && (
        <div className="color-picker">
          <label>play as:</label>
          <button className={playerColor === 'w' ? 'active' : ''} onClick={() => onColorChange('w')}>white</button>
          <button className={playerColor === 'b' ? 'active' : ''} onClick={() => onColorChange('b')}>black</button>
        </div>
      )}

      {gameState === 'idle' && (
        <div className="game-info-buttons">
          <button onClick={onStart}>start game</button>
          <button className={soundEnabled ? 'sound-btn-on' : 'sound-btn-off'} onClick={onSoundToggle}>sound {soundEnabled ? 'on' : 'off'}</button>
        </div>
      )}
      {gameState !== 'idle' && (
        <div className="game-info-buttons">
          {gameState !== 'gameover' && <button onClick={onUndo}>undo</button>}
          <button onClick={onNewGame}>new game</button>
          <button className={soundEnabled ? 'sound-btn-on' : 'sound-btn-off'} onClick={onSoundToggle}>sound {soundEnabled ? 'on' : 'off'}</button>
        </div>
      )}
    </div>
  );
}

export default GameInfo;
