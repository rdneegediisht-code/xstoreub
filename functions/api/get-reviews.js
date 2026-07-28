export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const productId = url.searchParams.get('productId') || '';

  if (!productId) {
    return new Response(JSON.stringify({ error: 'productId шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const allReviews = (await context.env.XSTORE_KV.get('reviews', 'json')) || {};
    const reviews = (allReviews[productId] || []).slice().reverse();
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return new Response(JSON.stringify({ reviews, average: avg, count: reviews.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Сэтгэгдэл ачаалахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
