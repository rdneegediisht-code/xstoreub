import { getOrder, putOrder } from '../_lib/orders.js';

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
    // Захиалга тусдаа key-д хадгалагддаг тул бусад захиалгад нөлөөлөхгүйгээр
    // яг энэ нэгийг л уншиж, шинэчилж, буцааж бичнэ.
    const order = await getOrder(context.env.XSTORE_KV, id);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Захиалга олдсонгүй.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (hasStatus) order.status = status;
    if (hasNote) order.note = String(note).trim();
    await putOrder(context.env.XSTORE_KV, order);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Шинэчлэхэд алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
