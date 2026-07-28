const DEFAULT_SETTINGS = {
  facebook: '', instagram: '', tiktok: '', phone: '',
  bankName: '', accountNumber: '', accountHolder: '', iban: '', deliveryFee: 0,
  freeDeliveryMode: 'none', freeDeliveryAmount: 0, freeDeliveryCount: 0,
  trustText: '', aboutText: '', deliveryText: '', paymentText: '',
};

export async function onRequestGet(context) {
  try {
    let settings = await context.env.XSTORE_KV.get('settings', 'json');
    if (!settings) {
      settings = DEFAULT_SETTINGS;
      await context.env.XSTORE_KV.put('settings', JSON.stringify(settings));
    } else {
      settings = { ...DEFAULT_SETTINGS, ...settings };
    }
    return new Response(JSON.stringify({ settings }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Тохиргоо ачаалахад алдаа гарлаа', details: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
