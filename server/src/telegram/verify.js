import { createHmac, timingSafeEqual } from 'crypto';

export function verifyInitData(initData, botToken) {
  if (!botToken) return true;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const checkString = [...params.entries()]
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const sig = createHmac('sha256', secret).update(checkString).digest();
  return timingSafeEqual(sig, Buffer.from(hash, 'hex'));
}
