/**
 * ═══════════════════════════════════════════════════════════════
 *  CÔNG TẮC TÍNH NĂNG ARTIST — CHỈ SỬA FILE NÀY
 * ═══════════════════════════════════════════════════════════════
 *
 *  Cách bật: bỏ // ở đầu dòng tính năng trong FEATURES_ON bên dưới
 *  Bật nhiều: bỏ // nhiều dòng — mỗi tính năng hoạt động độc lập
 *
 *  ArtistProducts (tác phẩm không có ngày đăng — chỉ giá):
 *    SORT               — sắp xếp theo giá bán (cao/thấp), dữ liệu từ backend
 *    AVG_PRICE          — giá TB toàn bộ tranh (mọi trạng thái), từ backend
 *    AVG_PRICE_FOR_SALE — giá TB tranh Đang bán (ForSale), từ backend
 *
 *  ArtistOrders:
 *    ORDER_DATE_FILTER  — lọc khoảng ngày đặt (lịch Từ/Đến), từ backend
 *    ORDER_SORT         — sắp xếp theo ngày đặt / tổng tiền tranh của bạn, từ backend
 */

const FEATURES_ON = [
  // 'SORT',
  // 'AVG_PRICE',
  // 'AVG_PRICE_FOR_SALE',
  // 'ORDER_DATE_FILTER',
  // 'ORDER_SORT',
];

export const ARTIST_PRODUCT_SORT = FEATURES_ON.includes('SORT');
export const ARTIST_PRODUCT_AVG_PRICE = FEATURES_ON.includes('AVG_PRICE');
export const ARTIST_PRODUCT_AVG_PRICE_FOR_SALE = FEATURES_ON.includes('AVG_PRICE_FOR_SALE');
export const ARTIST_ORDER_DATE_FILTER = FEATURES_ON.includes('ORDER_DATE_FILTER');
export const ARTIST_ORDER_SORT = FEATURES_ON.includes('ORDER_SORT');