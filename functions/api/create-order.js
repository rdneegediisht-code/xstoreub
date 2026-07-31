import { makeOrderId, getOrder, putOrder } from '../_lib/orders.js';

export async function onRequestPost(context) {
  const { items, subtotal, deliveryFee, total, customer } = await context.request.json();

  if (!Array.isArray(items) || items.length === 0 || !customer || !customer.name || !customer.phone || !customer.address) {
    return new Response(JSON.stringify({ error: 'Захиалгын мэдээлэл дутуу байна.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // ID давхцах магадлал бага ч, давхцвал хуучин захиалгыг дарахгүйн тулд шалгаж,
    // шаардлагатай бол шинээр ID үүсгэнэ.
    let orderId = makeOrderId();
    for (let i = 0; i < 3 && (await getOrder(context.env.XSTORE_KV, orderId)); i++) {
      orderId = makeOrderId();
    }

    var order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items, subtotal, deliveryFee: deliveryFee || 0, total, customer,
      status: 'pending',
    };
    await putOrder(context.env.XSTORE_KV, order);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Захиалга хадгалахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const TELEGRAM_BOT_TOKEN = context.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = context.env.TELEGRAM_CHAT_ID;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const itemsText = items.map((i) => `• ${i.name} x${i.qty} — ${Number(i.price * i.qty).toLocaleString('en-US')}₮`).join('\n');
      const message =
        `🛍️ Шинэ захиалга #${order.id}\n\n${itemsText}\n\n` +
        `Хүргэлт: ${Number(deliveryFee || 0).toLocaleString('en-US')}₮\n` +
        `Нийт: ${Number(total).toLocaleString('en-US')}₮\n\n` +
        `👤 ${customer.name}\n📞 ${customer.phone}\n📍 ${customer.address}` +
        (customer.note ? `\n📝 ${customer.note}` : '');
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      });
    } catch (err) {
      console.error('Telegram notification failed:', err.message);
    }
  }

  return new Response(JSON.stringify({ orderId: order.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
