const MAX = Number(process.env.MAX_ENGINES) || 4;
let inUse = 0;
/** @type {Array<() => void>} */
const waiters = [];

/**
 * Acquires an engine slot. Resolves immediately if a slot is free,
 * otherwise waits in a FIFO queue.
 * @returns {Promise<void>}
 */
export function acquire() {
  if (inUse < MAX) {
    inUse++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiters.push(resolve));
}

/**
 * Releases an engine slot, waking the next waiting caller.
 * @returns {void}
 */
export function release() {
  const next = waiters.shift();
  if (next) {
    next();
  } else {
    inUse = Math.max(0, inUse - 1);
  }
}

/**
 * @returns {number} Number of engine slots currently in use.
 */
export function activeEngines() {
  return inUse;
}

/**
 * @returns {number} Maximum number of concurrent engines.
 */
export function maxEngines() {
  return MAX;
}
