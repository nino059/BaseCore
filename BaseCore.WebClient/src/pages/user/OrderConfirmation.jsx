import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { useCart } from '../../contexts/CartContext';
import { orderApi } from '../../services/api';
import { formatVND as fmt } from '../../utils/format';
import { normalizeOrder } from '../../utils/orderNormalize';

const linePrice = (item) => {
  const unit = item.unitPrice ?? item.UnitPrice ?? item.price ?? item.Price ?? 0;
  const qty = item.quantity ?? item.Quantity ?? item.qty ?? 1;
  return Number(unit) * Number(qty);
};

const OrderCard = ({ order }) => {
  const items = order.items || [];
  const total = order.totalAmount ?? 0;

  return (
    <div className="bg-white px-8 py-7 mb-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <p className="text-[0.68rem] font-bold tracking-[0.16em] text-brand-dark uppercase mb-5">
        Đơn hàng #{order.id}
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
        <div className="border-t-[1.5px] border-line pt-4.5 mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2.25 text-[0.88rem] border-b border-[#f9f6f2]">
              <span className="text-ink font-light">
                {item.productName || item.ProductName || item.name || item.Name}
                <span className="text-[#aaa] ml-2">×{item.quantity ?? item.Quantity ?? item.qty ?? 1}</span>
              </span>
              <span className="font-semibold text-ink">
                {fmt(linePrice(item))}
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
  );
};

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { removePurchasedFromCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cartClearedRef = useRef(false);
  useEffect(() => {
    if (cartClearedRef.current) return;
    const ids = location.state?.purchasedProductIds;
    if (!location.state?.fromCheckout || !Array.isArray(ids) || ids.length === 0) return;
    cartClearedRef.current = true;
    removePurchasedFromCart(ids);
  }, [location.state, removePurchasedFromCart]);

  useEffect(() => {
    const idsFromState = location.state?.orderIds;
    const ids = Array.isArray(idsFromState) && idsFromState.length > 0
      ? idsFromState
      : (orderId && orderId !== 'undefined' ? [orderId] : []);

    if (ids.length === 0) {
      setError('Không tìm thấy mã đơn hàng.');
      setLoading(false);
      return;
    }

    Promise.all(ids.map((id) => orderApi.getById(id).then((res) => normalizeOrder(res.data))))
      .then((list) => setOrders(list.filter(Boolean)))
      .catch(() => setError('Không thể tải thông tin đơn hàng.'))
      .finally(() => setLoading(false));
  }, [orderId, location.state?.orderIds, navigate]);

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

  if (error || orders.length === 0) return (
    <PublicLayout>
      <div className="bg-cream min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-5">
          <p className="text-[2rem] text-[#ccc] mb-4">✦</p>
          <p className="text-muted mb-6 font-light">{error || 'Không tìm thấy đơn hàng.'}</p>
          <Link to="/my-orders" className="inline-block px-8 py-3.25 bg-ink text-white no-underline text-[0.78rem] font-bold tracking-[0.14em] uppercase">
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </PublicLayout>
  );

  const multi = orders.length > 1;
  const grandTotal = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">
        <div className={`mx-auto px-5 py-15 ${multi ? 'max-w-215' : 'max-w-160'}`}>

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
              {multi
                ? <>Đã tạo <strong>{orders.length} đơn hàng</strong> riêng theo từng họa sĩ.<br />Mỗi đơn được xử lý độc lập — hủy một đơn không ảnh hưởng các đơn khác.</>
                : <>Đơn hàng #{orders[0].id} đã được tiếp nhận.<br />Chúng tôi sẽ liên hệ xác nhận sớm nhất.</>
              }
            </p>
          </div>

          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}

          {multi && (
            <div className="bg-white px-8 py-5 mb-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex justify-between font-semibold text-base text-ink">
              <span>Tổng thanh toán ({orders.length} đơn)</span>
              <span className="font-bold">{fmt(grandTotal)}</span>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Link to="/my-orders" state={{ fromConfirmation: true }} className="flex-1 text-center py-3.25 bg-ink text-white no-underline text-[0.78rem] font-bold tracking-[0.14em] uppercase">
              Xem đơn hàng của tôi
            </Link>
            <Link to="/shop" className="flex-1 text-center py-3.25 bg-transparent border-[1.5px] border-ink text-ink no-underline text-[0.78rem] font-bold tracking-[0.14em] uppercase">
              Tiếp tục mua sắm
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};

export default OrderConfirmation;