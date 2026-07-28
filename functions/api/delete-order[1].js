export async function onRequestPost(context) {
  const suppliedPassword = context.request.headers.get('x-admin-password') || '';
  const adminPassword = context.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new Response(JSON.stringify({ error: 'ADMIN_PASSWORD Cloudflare дээр тохируулагдаагүй байна.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (suppliedPassword !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Нэвтрэх эрхгүй.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await context.request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'id шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const orders = (await context.env.XSTORE_KV.get('orders', 'json')) || [];
    const next = orders.filter((o) => o.id !== id);
    await context.env.XSTORE_KV.put('orders', JSON.stringify(next));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Устгахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
