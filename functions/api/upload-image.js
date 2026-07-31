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

  const { image } = body || {};
  if (!image || typeof image !== 'string') {
    return new Response(JSON.stringify({ error: 'Зурган өгөгдөл шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) {
    return new Response(JSON.stringify({ error: 'Зургийн формат танигдсангүй. base64 dataURL шаардлагатай.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const contentType = match[1];
  const base64Data = match[2];
  const extMap = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  const ext = extMap[contentType] || 'jpg';

  try {
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    if (binary.byteLength > 8 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Зураг хэт том байна (8MB-аас бага байх ёстой).' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await context.env.XSTORE_IMAGES.put(key, binary, { httpMetadata: { contentType } });
    return new Response(JSON.stringify({ url: `/api/image/${key}` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Зураг байршуулахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
