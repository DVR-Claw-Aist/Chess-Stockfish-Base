const MAX = Number(process.env.MAX_ENGINES) || 4;
let inUse = 0;
const waiters = [];

export function acquire() {
  if (inUse < MAX) {
    inUse++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiters.push(resolve));
}

export function release() {
  const next = waiters.shift();
  if (next) {
    next();
  } else {
    inUse = Math.max(0, inUse - 1);
  }
}

export function activeEngines() {
  return inUse;
}

export function maxEngines() {
  return MAX;
}
