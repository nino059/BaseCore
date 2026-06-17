// Định dạng dùng chung cho toàn site (gom các bản fmt rải rác về 1 nguồn).

// Tiền tệ VND: "1.000.000 ₫". An toàn với null/undefined.
export const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);

// Ngày kiểu Việt: "3 tháng 6, 2026". Trả chuỗi rỗng nếu không có ngày.
export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

// Tiền tệ VND dạng gọn: "1.000.000₫" (không khoảng trắng, ký hiệu ₫ liền) — dùng cho bảng admin/artist.
export const formatVNDCompact = (value) =>
  Number(value || 0).toLocaleString('vi-VN') + '₫';

export default formatVND;
