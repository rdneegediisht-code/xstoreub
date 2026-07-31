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
  if (!context.env.XSTORE_IMAGES) {
    return new Response(JSON.stringify({ error: 'R2 bucket холбогдоогүй байна (XSTORE_IMAGES).' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Буруу хүсэлт.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Нэг URL эсвэл олон URL-ыг нэг дор хүлээж авна
  const urls = Array.isArray(body.urls) ? body.urls : (body.url ? [body.url] : []);
  const keys = urls
    .filter((u) => typeof u === 'string' && u.startsWith('/api/image/'))
    .map((u) => u.replace('/api/image/', ''));

  if (keys.length === 0) {
    return new Response(JSON.stringify({ ok: true, deleted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await Promise.all(keys.map((key) => context.env.XSTORE_IMAGES.delete(key)));
    return new Response(JSON.stringify({ ok: true, deleted: keys.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Устгах үед алдаа гарсан ч бараа устгах ажиллагааг тасалдуулах шаардлагагүй
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
