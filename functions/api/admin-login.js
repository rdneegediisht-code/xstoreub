const MAX_ATTEMPTS = 2;
const LOCKOUT_SECONDS = 15 * 60; // 15 минут

export async function onRequestPost(context) {
  const adminPassword = context.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'ADMIN_PASSWORD Cloudflare дээр тохируулагдаагүй байна.',
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const attemptsKey = `login_attempts:${ip}`;

  let attempts = 0;
  try {
    const stored = await context.env.XSTORE_KV.get(attemptsKey);
    attempts = stored ? parseInt(stored, 10) || 0 : 0;
  } catch (err) {
    attempts = 0;
  }

  if (attempts >= MAX_ATTEMPTS) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Хэт олон удаа буруу нууц үг оруулсан байна. 15 минутын дараа дахин оролдоно уу.',
    }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  let password;
  try {
    ({ password } = await context.request.json());
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Буруу хүсэлт.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const success = password === adminPassword;

  try {
    if (success) {
      await context.env.XSTORE_KV.delete(attemptsKey);
    } else {
      await context.env.XSTORE_KV.put(attemptsKey, String(attempts + 1), { expirationTtl: LOCKOUT_SECONDS });
    }
  } catch (err) {
    // KV тохируулга алдаатай ч нэвтрэлтийг зогсоохгүй, зөвхөн rate-limit ажиллахгүй болно
  }

  return new Response(JSON.stringify({ ok: success }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
