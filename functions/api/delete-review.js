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

  const { productId, reviewId } = await context.request.json();
  if (!productId || !reviewId) {
    return new Response(JSON.stringify({ error: 'productId болон reviewId шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const allReviews = (await context.env.XSTORE_KV.get('reviews', 'json')) || {};
    if (allReviews[productId]) {
      allReviews[productId] = allReviews[productId].filter((r) => r.id !== reviewId);
      await context.env.XSTORE_KV.put('reviews', JSON.stringify(allReviews));
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Устгахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
