const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

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

  const { id, status, note } = await context.request.json();
  const hasStatus = status !== undefined;
  const hasNote = note !== undefined;

  if (!id || (!hasStatus && !hasNote) || (hasStatus && !VALID_STATUSES.includes(status))) {
    return new Response(JSON.stringify({ error: 'id болон зөв status эсвэл тэмдэглэл шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (hasNote && String(note).length > 300) {
    return new Response(JSON.stringify({ error: 'Тэмдэглэл 300 тэмдэгтээс ихгүй байх ёстой.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const orders = (await context.env.XSTORE_KV.get('orders', 'json')) || [];
    const order = orders.find((o) => o.id === id);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Захиалга олдсонгүй.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (hasStatus) order.status = status;
    if (hasNote) order.statusNote = String(note).trim();
    await context.env.XSTORE_KV.put('orders', JSON.stringify(orders));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Шинэчлэхэд алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
