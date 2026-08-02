import { createHmac, timingSafeEqual } from 'crypto';

/** Max allowed age of initData, ms. */
const MAX_INIT_DATA_AGE_MS = 60 * 60 * 1000;

/**
 * Verifies Telegram WebApp initData via HMAC-SHA256 and the bot token.
 * @param {string} initData Raw Telegram initData string.
 * @param {string} [botToken] Bot token; if empty, verification is skipped and `true` returned.
 * @returns {boolean} True if data is valid (or no token configured).
 */
export function verifyInitData(initData, botToken) {
  if (!botToken) return true;

  let params;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return false;
  }

  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return false;

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) return false;
  if (Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_MS / 1000) return false;

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const checkString = [...params.entries()]
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const sig = createHmac('sha256', secret).update(checkString).digest();
  try {
    return timingSafeEqual(sig, Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}
