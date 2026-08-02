/** @type {Record<string, HTMLAudioElement>} */
const audioCache = {};
let soundEnabled = true;

/**
 * Sets whether sounds play.
 * @param {boolean} v
 * @returns {void}
 */
export function setSoundEnabled(v) {
  soundEnabled = v;
}

/**
 * @returns {boolean} Whether sounds are currently enabled.
 */
export function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Lazily loads and caches an audio element for a sound name.
 * @param {string} name Sound name (file `/sounds/{name}.mp3`).
 * @returns {HTMLAudioElement}
 */
function loadSound(name) {
  if (!audioCache[name]) {
    audioCache[name] = new Audio(`/sounds/${name}.mp3`);
  }
  return audioCache[name];
}

/**
 * Plays a sound from the start if enabled. Silently ignores failures.
 * @param {string} name Sound name.
 * @returns {void}
 */
export function playSound(name) {
  if (!soundEnabled) return;
  try {
    const audio = loadSound(name);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
