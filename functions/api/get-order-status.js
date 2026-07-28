export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const id = (url.searchParams.get('id') || '').toUpperCase();

  if (!id) {
    return new Response(JSON.stringify({ error: 'id шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const orders = (await context.env.XSTORE_KV.get('orders', 'json')) || [];
    const order = orders.find((o) => o.id.toUpperCase() === id);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Захиалга олдсонгүй.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      order: { id: order.id, status: order.status, total: order.total, createdAt: order.createdAt },
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Захиалга хайхад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
