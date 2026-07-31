import { createHmac, timingSafeEqual } from 'crypto';

const MAX_INIT_DATA_AGE_MS = 60 * 60 * 1000;

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
