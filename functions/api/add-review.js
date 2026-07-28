export async function onRequestPost(context) {
  const { productId, name, rating, comment } = await context.request.json();

  if (!productId || !name || !rating) {
    return new Response(JSON.stringify({ error: 'Нэр болон үнэлгээ заавал шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const ratingNum = Number(rating);
  if (ratingNum < 1 || ratingNum > 5) {
    return new Response(JSON.stringify({ error: 'Үнэлгээ 1-5 хооронд байх ёстой.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const allReviews = (await context.env.XSTORE_KV.get('reviews', 'json')) || {};
    if (!allReviews[productId]) allReviews[productId] = [];
    allReviews[productId].push({
      id: 'R-' + Date.now(),
      name: String(name).slice(0, 60),
      rating: ratingNum,
      comment: String(comment || '').slice(0, 500),
      createdAt: new Date().toISOString(),
    });
    await context.env.XSTORE_KV.put('reviews', JSON.stringify(allReviews));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Сэтгэгдэл хадгалахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
