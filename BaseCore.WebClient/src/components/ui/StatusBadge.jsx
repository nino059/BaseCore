import React from 'react';
import { getOrderStatus, getProductStatus, getBlogStatus } from '../../utils/orderStatus';

const GETTERS = { order: getOrderStatus, product: getProductStatus, blog: getBlogStatus };

/**
 * Badge trạng thái dùng chung (đơn hàng / sản phẩm / bài viết).
 * @param {string} status  giá trị trạng thái (khớp backend)
 * @param {'order'|'product'|'blog'} type  loại trạng thái (mặc định 'order')
 * @param {boolean} withDot  hiện chấm tròn màu phía trước (chỉ order)
 */
const StatusBadge = ({ status, type = 'order', withDot = false }) => {
  const cfg = (GETTERS[type] || getOrderStatus)(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: '0.72rem', fontWeight: 700, color: cfg.color, background: cfg.bg,
      padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {withDot && cfg.dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      )}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
