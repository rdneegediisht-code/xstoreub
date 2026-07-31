function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '').slice(-8);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const id = (url.searchParams.get('id') || '').trim().toUpperCase();
  const phone = (url.searchParams.get('phone') || '').trim();

  if (!id && !phone) {
    return new Response(JSON.stringify({ error: 'Захиалгын дугаар эсвэл утасны дугаар шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const orders = (await context.env.XSTORE_KV.get('orders', 'json')) || [];

    if (id) {
      const order = orders.find((o) => o.id.toUpperCase() === id);
      if (!order) {
        return new Response(JSON.stringify({ error: 'Захиалга олдсонгүй.' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({
        order: { id: order.id, status: order.status, total: order.total, createdAt: order.createdAt, note: order.note || '' },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const normalizedPhone = normalizePhone(phone);
    const matches = orders
      .filter((o) => normalizePhone(o.customer && o.customer.phone) === normalizedPhone)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((o) => ({ id: o.id, status: o.status, total: o.total, createdAt: o.createdAt, note: o.note || '' }));

    if (matches.length === 0) {
      return new Response(JSON.stringify({ error: 'Энэ дугаартай захиалга олдсонгүй.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ orders: matches }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Захиалга хайхад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
