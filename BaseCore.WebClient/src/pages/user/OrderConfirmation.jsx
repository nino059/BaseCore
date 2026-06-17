import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { orderApi } from '../../services/api';
import { formatVND as fmt } from '../../utils/format';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) { navigate('/'); return; }
    orderApi.getById(orderId)
      .then(res => setOrder(res.data))
      .catch(() => setError('Không thể tải thông tin đơn hàng.'))
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  if (loading) return (
    <PublicLayout>
      <div className="bg-cream min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-9 h-9 mx-auto mb-4 rounded-full border-2 border-brand border-t-transparent animate-spin [animation-duration:0.8s]" />
          <p className="text-muted text-[0.9rem] tracking-[0.06em]">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    </PublicLayout>
  );

  if (error || !order) return (
    <PublicLayout>
      <div className="bg-cream min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-5">
          <p className="text-[2rem] text-[#ccc] mb-4">✦</p>
          <p className="text-muted mb-6 font-light">{error || 'Không tìm thấy đơn hàng.'}</p>
          <Link to="/my-orders" className="inline-block px-8 py-[13px] bg-ink text-white no-underline text-[0.78rem] font-bold tracking-[0.14em] uppercase">
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </PublicLayout>
  );

  const items = order.items || order.orderItems || [];
  const total = order.totalAmount ?? order.total ?? 0;

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">
        <div className="max-w-[640px] mx-auto px-5 py-15">

          {/* Success banner */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-ink flex items-center justify-center">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <p className="text-[0.72rem] font-bold tracking-[0.18em] text-brand uppercase mb-2.5">
              Đặt hàng thành công
            </p>
            <h2 className="font-extralight text-[clamp(1.3rem,3vw,1.8rem)] text-ink tracking-[0.04em] mt-0 mb-3">
              Cảm ơn bạn!
            </h2>
            <p className="text-muted text-[0.95rem] font-light">
              Đơn hàng #{order.id} đã được tiếp nhận.<br />
              Chúng tôi sẽ liên hệ xác nhận sớm nhất.
            </p>
          </div>

          {/* Chi tiết đơn hàng */}
          <div className="bg-white px-8 py-7 mb-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="text-[0.68rem] font-bold tracking-[0.16em] text-brand-dark uppercase mb-5">
              Chi tiết đơn hàng #{order.id}
            </p>

            <div className="flex flex-col gap-3 mb-5">
              {order.shippingAddress && (
                <div className="flex gap-3 text-[0.88rem] text-ink">
                  <i className="fas fa-map-marker-alt text-brand mt-0.5 w-3.5"></i>
                  <span className="font-light">{order.shippingAddress}</span>
                </div>
              )}
              {order.paymentMethod && (
                <div className="flex gap-3 text-[0.88rem] text-ink">
                  <i className="fas fa-wallet text-brand mt-0.5 w-3.5"></i>
                  <span className="font-light">
                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
              )}
              {order.status && (
                <div className="flex gap-3 text-[0.88rem] text-ink">
                  <i className="fas fa-info-circle text-brand mt-0.5 w-3.5"></i>
                  <span className="font-semibold">{order.status}</span>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t-[1.5px] border-line pt-[18px] mb-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-[9px] text-[0.88rem] border-b border-[#f9f6f2]">
                    <span className="text-ink font-light">
                      {item.productName || item.name}
                      <span className="text-[#aaa] ml-2">×{item.quantity || item.qty}</span>
                    </span>
                    <span className="font-semibold text-ink">
                      {fmt(item.price * (item.quantity || item.qty))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t-[1.5px] border-line pt-4 flex justify-between font-semibold text-base text-ink">
              <span>Tổng cộng</span>
              <span className="font-bold">{fmt(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Link to="/my-orders" className="flex-1 text-center py-[13px] bg-ink text-white no-underline text-[0.78rem] font-bold tracking-[0.14em] uppercase">
              Xem đơn hàng của tôi
            </Link>
            <Link to="/shop" className="flex-1 text-center py-[13px] bg-transparent border-[1.5px] border-ink text-ink no-underline text-[0.78rem] font-bold tracking-[0.14em] uppercase">
              Tiếp tục mua sắm
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};

export default OrderConfirmation;
