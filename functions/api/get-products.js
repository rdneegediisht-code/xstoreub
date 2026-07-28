const SEED_PRODUCTS = [
  { id: 'P-seed-1', name: 'Oversize Hoodie', category: 'Хувцас', spec: 'Хөвөн даавуу', price: 89000, image: '', stock: null, featured: false, colors: [], sizes: [] },
  { id: 'P-seed-2', name: 'Chunky Sneakers', category: 'Гутал', spec: 'Дугтуй гутал', price: 145000, image: '', stock: null, featured: false, colors: [], sizes: [] },
  { id: 'P-seed-3', name: 'Mechanical Keyboard', category: 'PC Gear', spec: 'RGB · Blue switch', price: 189000, image: '', stock: null, featured: false, colors: [], sizes: [] },
  { id: 'P-seed-4', name: 'Gaming Mouse', category: 'PC Gear', spec: '16000 DPI', price: 79000, image: '', stock: null, featured: false, colors: [], sizes: [] },
];

export async function onRequestGet(context) {
  try {
    let products = await context.env.XSTORE_KV.get('products', 'json');
    if (!products) {
      products = SEED_PRODUCTS;
      await context.env.XSTORE_KV.put('products', JSON.stringify(products));
    }
    return new Response(JSON.stringify({ products }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Бараа ачаалахад алдаа гарлаа', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
