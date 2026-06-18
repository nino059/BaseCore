/** Chuẩn hóa đơn hàng từ API (hỗ trợ PascalCase + camelCase) */

export function normalizeOrderItem(raw) {
  if (!raw) return null;
  return {
    productId: raw.productId ?? raw.ProductId,
    productName: raw.productName ?? raw.ProductName ?? raw.name ?? raw.Name ?? '',
    imageUrl: raw.imageUrl ?? raw.ImageUrl ?? '',
    artistName: raw.artistName ?? raw.ArtistName ?? '',
    unitPrice: raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? 0,
    quantity: raw.quantity ?? raw.Quantity ?? raw.qty ?? 1,
    productStatus: raw.productStatus ?? raw.ProductStatus ?? '',
  };
}

export function normalizeOrder(raw) {
  if (!raw) return null;
  const itemsRaw = raw.items ?? raw.Items ?? raw.orderItems ?? raw.OrderItems ?? [];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map(normalizeOrderItem).filter(Boolean)
    : [];

  return {
    id: raw.id ?? raw.Id,
    userId: raw.userId ?? raw.UserId,
    status: raw.status ?? raw.Status ?? '',
    orderDate: raw.orderDate ?? raw.OrderDate ?? raw.createdAt ?? raw.CreatedAt,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? raw.orderDate ?? raw.OrderDate,
    totalAmount: raw.totalAmount ?? raw.TotalAmount ?? raw.total ?? raw.Total ?? 0,
    shippingAddress: raw.shippingAddress ?? raw.ShippingAddress ?? '',
    paymentMethod: raw.paymentMethod ?? raw.PaymentMethod ?? '',
    phone: raw.phone ?? raw.Phone ?? '',
    note: raw.note ?? raw.Note ?? '',
    items,
  };
}

/** Trích danh sách đơn từ response axios — luôn trả về mảng */
export function extractOrderList(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.orders)) return body.orders;
  return [];
}

export function normalizeOrderList(res) {
  return extractOrderList(res)
    .map(normalizeOrder)
    .filter((o) => o && o.id != null);
}