const audioCache = {};
let soundEnabled = true;

export function setSoundEnabled(v) {
  soundEnabled = v;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function loadSound(name) {
  if (!audioCache[name]) {
    audioCache[name] = new Audio(`/sounds/${name}.mp3`);
  }
  return audioCache[name];
}

export function playSound(name) {
  if (!soundEnabled) return;
  try {
    const audio = loadSound(name);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
