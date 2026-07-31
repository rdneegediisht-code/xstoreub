export function makeOrderId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getOrder(kv, id) {
  return kv.get(`order:${id}`, 'json');
}

export async function putOrder(kv, order) {
  await kv.put(`order:${order.id}`, JSON.stringify(order));
}

// Захиалга бүрийг тусдаа key-д ('order:<id>') хадгалдаг тул хоёр захиалга
// зэрэг орж ирэх, эсвэл admin статус солиж байхад шинэ захиалга орж ирэх үед
// нэг нь нөгөөгөө дарж, өгөгдөл алдагдах эрсдэлгүй.
export async function listAllOrders(kv) {
  const orders = [];
  let cursor;
  let sawAny = false;
  do {
    const listResult = await kv.list({ prefix: 'order:', cursor });
    if (listResult.keys.length) sawAny = true;
    const values = await Promise.all(listResult.keys.map((k) => kv.get(k.name, 'json')));
    values.forEach((v) => { if (v) orders.push(v); });
    cursor = listResult.list_complete ? undefined : listResult.cursor;
  } while (cursor);

  if (!sawAny) {
    // Хуучин хувилбарт бүх захиалга нэг "orders" key дор массив хэлбэрээр
    // хадгалагддаг байсан. Хэрэв шинэ бүтэцтэй захиалга олдоогүй бол хуучин
    // өгөгдлийг нэг удаа автоматаар шинэ бүтэц рүү шилжүүлнэ.
    const legacy = await kv.get('orders', 'json');
    if (Array.isArray(legacy) && legacy.length) {
      await Promise.all(legacy.map((o) => kv.put(`order:${o.id}`, JSON.stringify(o))));
      await kv.delete('orders');
      return legacy;
    }
  }
  return orders;
}
