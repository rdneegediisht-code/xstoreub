export async function onRequestPost(context) {
  const { password } = await context.request.json();
  const adminPassword = context.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'ADMIN_PASSWORD Cloudflare дээр тохируулагдаагүй байна.',
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: password === adminPassword }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
