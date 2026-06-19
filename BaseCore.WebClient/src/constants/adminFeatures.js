/**
 * ═══════════════════════════════════════════════════════════════
 *  CÔNG TẮC TÍNH NĂNG ADMIN — CHỈ SỬA FILE NÀY
 * ═══════════════════════════════════════════════════════════════
 *
 *  Cách bật: bỏ // ở đầu dòng tính năng trong FEATURES_ON bên dưới
 *  Bật nhiều: bỏ // nhiều dòng — mỗi tính năng hoạt động độc lập
 *
 *  AdminOrders (bật 1 hoặc cả 2 — pipeline Lọc → Sắp xếp, UI tách hàng):
 *    DATE_FILTER         — lọc khoảng ngày đặt (lịch Từ/Đến)
 *    SORT                — sắp xếp theo ngày đặt / tổng tiền
 *
 *  AdminProducts (bật 1 hoặc cả 2 — pipeline Lọc → Sắp xếp, UI tách hàng):
 *    PRODUCT_DATE_FILTER — lọc khoảng ngày đăng tác phẩm (lịch Từ/Đến)
 *    PRODUCT_SORT        — sắp xếp theo ngày đăng / giá bán
 *    AVG_PRICE           — hiển thị giá tranh trung bình cuối trang
 */

const FEATURES_ON = [
  // product filter theo ngày đăng
   //'DATE_FILTER',
  //order sort theo ngày đặt / tổng tiền
   //'SORT',
  // product sort theo tiền
   // 'PRODUCT_SORT',
  // product giá trung bình
   //'AVG_PRICE',
];

export const ADMIN_ORDER_DATE_FILTER = FEATURES_ON.includes('DATE_FILTER');
export const ADMIN_ORDER_SORT = FEATURES_ON.includes('SORT');
export const ADMIN_PRODUCT_DATE_FILTER = FEATURES_ON.includes('PRODUCT_DATE_FILTER');
export const ADMIN_PRODUCT_SORT = FEATURES_ON.includes('PRODUCT_SORT');
export const ADMIN_PRODUCT_AVG_PRICE = FEATURES_ON.includes('AVG_PRICE');