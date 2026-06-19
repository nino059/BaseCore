/**
 * ═══════════════════════════════════════════════════════════════
 *  CÔNG TẮC TÍNH NĂNG ADMIN — CHỈ SỬA FILE NÀY
 * ═══════════════════════════════════════════════════════════════
 *
 *  Cách bật: bỏ // ở đầu dòng tính năng trong FEATURES_ON bên dưới
 *  Bật nhiều: bỏ // nhiều dòng — mỗi tính năng hoạt động độc lập
 *
 *  AdminOrders (bật 1 hoặc cả 2 — pipeline Lọc → Sắp xếp, UI tách hàng):
 *    DATE_FILTER — lọc khoảng ngày đặt (lịch Từ/Đến)
 *    SORT        — sắp xếp theo ngày đặt / tổng tiền
 *
 *  AdminProducts (tác phẩm không có ngày đăng — chỉ giá):
 *    PRODUCT_SORT         — sắp xếp theo giá bán (cao/thấp), dữ liệu từ backend
 *    AVG_PRICE            — giá TB toàn bộ tranh (mọi trạng thái), từ backend
 *    AVG_PRICE_FOR_SALE   — giá TB tranh Đang bán (ForSale), từ backend
 */

const FEATURES_ON = [
  // 'DATE_FILTER',
  // 'SORT',
  // 'PRODUCT_SORT',
  // 'AVG_PRICE',
  // 'AVG_PRICE_FOR_SALE',
];

export const ADMIN_ORDER_DATE_FILTER = FEATURES_ON.includes('DATE_FILTER');
export const ADMIN_ORDER_SORT = FEATURES_ON.includes('SORT');
export const ADMIN_PRODUCT_SORT = FEATURES_ON.includes('PRODUCT_SORT');
export const ADMIN_PRODUCT_AVG_PRICE = FEATURES_ON.includes('AVG_PRICE');
export const ADMIN_PRODUCT_AVG_PRICE_FOR_SALE = FEATURES_ON.includes('AVG_PRICE_FOR_SALE');