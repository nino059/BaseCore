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

  const legacyName = raw.userName ?? raw.UserName ?? raw.buyerName ?? raw.BuyerName ?? '';
  const customerName = raw.customerName ?? raw.CustomerName ?? pickRealPersonName(legacyName) ?? '';
  const userPhone = raw.userPhone ?? raw.UserPhone ?? raw.phone ?? raw.Phone ?? '';

  return {
    id: raw.id ?? raw.Id,
    userId: raw.userId ?? raw.UserId,
    status: raw.status ?? raw.Status ?? '',
    orderDate: raw.orderDate ?? raw.OrderDate ?? raw.createdAt ?? raw.CreatedAt,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? raw.orderDate ?? raw.OrderDate,
    totalAmount: raw.totalAmount ?? raw.TotalAmount ?? raw.total ?? raw.Total ?? 0,
    shippingAddress: raw.shippingAddress ?? raw.ShippingAddress ?? '',
    paymentMethod: raw.paymentMethod ?? raw.PaymentMethod ?? '',
    phone: raw.phone ?? raw.Phone ?? userPhone,
    userPhone,
    customerName,
    note: raw.note ?? raw.Note ?? '',
    items,
  };
}

/** Bỏ qua chuỗi giống username đăng nhập (không dấu, không khoảng trắng) */
function pickRealPersonName(value) {
  const s = value && String(value).trim();
  if (!s) return '';
  if (s.includes(' ') || /[^\u0000-\u007f]/.test(s)) return s;
  if (/^[a-z0-9._-]+$/i.test(s)) return '';
  return s;
}

/** Tên hiển thị khách hàng — ưu tiên tên người nhận, không dùng username đăng nhập */
export function getCustomerDisplayName(order) {
  if (!order) return '—';
  const direct = order.customerName ?? order.CustomerName;
  if (direct && String(direct).trim()) return String(direct).trim();
  const legacy = pickRealPersonName(order.userName ?? order.UserName ?? order.buyerName ?? order.BuyerName);
  if (legacy) return legacy;
  return '—';
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