export function formatClock(seconds) {
  if (seconds == null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const TIME_PRESETS = [
  { label: 'Bullet 1+0', initial: 60, increment: 0 },
  { label: 'Bullet 1+1', initial: 60, increment: 1 },
  { label: 'Bullet 2+1', initial: 120, increment: 1 },
  { label: 'Blitz 3+0', initial: 180, increment: 0 },
  { label: 'Blitz 3+2', initial: 180, increment: 2 },
  { label: 'Blitz 5+0', initial: 300, increment: 0 },
  { label: 'Blitz 5+3', initial: 300, increment: 3 },
  { label: 'Rapid 10+0', initial: 600, increment: 0 },
  { label: 'Rapid 10+5', initial: 600, increment: 5 },
  { label: 'Rapid 15+10', initial: 900, increment: 10 },
  { label: 'Classic 30+0', initial: 1800, increment: 0 },
  { label: 'Classic 30+20', initial: 1800, increment: 20 },
];
