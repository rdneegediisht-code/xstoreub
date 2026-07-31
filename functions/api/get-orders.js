import { listAllOrders } from '../_lib/orders.js';

export async function onRequestGet(context) {
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

  try {
    const orders = await listAllOrders(context.env.XSTORE_KV);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return new Response(JSON.stringify({ orders }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Захиалга ачаалахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
