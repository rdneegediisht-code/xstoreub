export async function onRequestGet(context) {
  const keyParam = context.params.key;
  if (!keyParam || (Array.isArray(keyParam) && keyParam.length === 0)) {
    return new Response('Not found', { status: 404 });
  }
  const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;

  if (!context.env.XSTORE_IMAGES) {
    return new Response('R2 холбогдоогүй байна.', { status: 500 });
  }

  try {
    const object = await context.env.XSTORE_IMAGES.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
  } catch (err) {
    return new Response('Алдаа гарлаа', { status: 500 });
  }
}
