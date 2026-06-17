// Nguồn DUY NHẤT cho nhãn/màu trạng thái (đồng bộ với backend).
// Trạng thái đơn hàng (backend OrdersController): Pending → Processing → Shipping → Completed, + Cancelled.
// ⚠ Trước đây vài trang map nhầm key "Shipped" (backend dùng "Shipping") → badge "đang giao" không khớp. Đã chuẩn hóa.

export const ORDER_STATUS = {
  Pending:    { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b', icon: 'fa-clock' },
  Processing: { label: 'Đang xử lý',   color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6', icon: 'fa-cog' },
  Shipping:   { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6', icon: 'fa-truck' },
  Completed:  { label: 'Đã giao',      color: '#065f46', bg: '#d1fae5', dot: '#10b981', icon: 'fa-check-circle' },
  Cancelled:  { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2', dot: '#ef4444', icon: 'fa-times-circle' },
};

// Luồng chuyển trạng thái (khớp backend): bước kế tiếp hợp lệ từ mỗi trạng thái.
export const ORDER_STEPS = ['Pending', 'Processing', 'Shipping', 'Completed'];
export const ORDER_NEXT = {
  Pending:    ['Processing'],
  Processing: ['Shipping'],
  Shipping:   ['Completed'],
  Completed:  [],
  Cancelled:  [],
};
export const ORDER_CAN_CANCEL = ['Pending', 'Processing', 'Shipping'];

export const getOrderStatus = (s) =>
  ORDER_STATUS[s] || { label: s || '—', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', icon: 'fa-info-circle' };

// Trạng thái sản phẩm (backend Product.Status): Pending | ForSale | Ordered | Sold | Rejected (+ legacy Available/Hidden).
export const PRODUCT_STATUS = {
  Pending:   { label: 'Chờ duyệt', color: '#92400e', bg: '#fef3c7', icon: 'fa-clock' },
  ForSale:   { label: 'Đang bán',  color: '#065f46', bg: '#d1fae5', icon: 'fa-check-circle' },
  Ordered:   { label: 'Đã đặt',    color: '#1e40af', bg: '#dbeafe', icon: 'fa-shopping-cart' },
  Sold:      { label: 'Đã bán',    color: '#6b7280', bg: '#f3f4f6', icon: 'fa-box' },
  Rejected:  { label: 'Từ chối',   color: '#991b1b', bg: '#fee2e2', icon: 'fa-ban' },
  Available: { label: 'Có sẵn',    color: '#3b82f6', bg: '#dbeafe', icon: 'fa-check' },
  Hidden:    { label: 'Đã ẩn',     color: '#94a3b8', bg: '#f1f5f9', icon: 'fa-eye-slash' },
};
export const getProductStatus = (s) =>
  PRODUCT_STATUS[s] || { label: s || '—', color: '#374151', bg: '#f3f4f6', icon: 'fa-info-circle' };

// Trạng thái bài viết (backend BlogPostsController): Pending | Published | Rejected.
export const BLOG_STATUS = {
  Pending:   { label: 'Chờ duyệt', color: '#92400e', bg: '#fef3c7' },
  Published: { label: 'Đã đăng',   color: '#065f46', bg: '#d1fae5' },
  Rejected:  { label: 'Từ chối',   color: '#991b1b', bg: '#fee2e2' },
};
export const getBlogStatus = (s) =>
  BLOG_STATUS[s] || { label: s || '—', color: '#374151', bg: '#f3f4f6' };
