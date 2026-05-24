import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import { orderApi } from '../../services/api';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

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
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2px solid #c8a97a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#767676', fontSize: '0.9rem', letterSpacing: '0.06em' }}>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    </PublicLayout>
  );

  if (error || !order) return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: '2rem', color: '#ccc', marginBottom: 16 }}>✦</p>
          <p style={{ color: '#767676', marginBottom: 24, fontWeight: 300 }}>{error || 'Không tìm thấy đơn hàng.'}</p>
          <Link to="/my-orders" style={{
            display: 'inline-block', padding: '13px 32px',
            background: '#1a1a1a', color: 'white',
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', textDecoration: 'none',
          }}>
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
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 20px' }}>

          {/* Success banner */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              width: 64, height: 64, background: '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <i className="fas fa-check" style={{ color: 'white', fontSize: '1.5rem' }}></i>
            </div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 10 }}>
              Đặt hàng thành công
            </p>
            <h2 style={{ fontWeight: 200, fontSize: 'clamp(1.3rem,3vw,1.8rem)', color: '#1a1a1a', letterSpacing: '0.04em', margin: '0 0 12px' }}>
              Cảm ơn bạn!
            </h2>
            <p style={{ color: '#767676', fontSize: '0.95rem', fontWeight: 300 }}>
              Đơn hàng #{order.id} đã được tiếp nhận.<br />
              Chúng tôi sẽ liên hệ xác nhận sớm nhất.
            </p>
          </div>

          {/* Chi tiết đơn hàng */}
          <div style={{ background: 'white', padding: '28px 32px', marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 20 }}>
              Chi tiết đơn hàng #{order.id}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {order.shippingAddress && (
                <div style={{ display: 'flex', gap: 12, fontSize: '0.88rem', color: '#1a1a1a' }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#c8a97a', marginTop: 2, width: 14 }}></i>
                  <span style={{ fontWeight: 300 }}>{order.shippingAddress}</span>
                </div>
              )}
              {order.paymentMethod && (
                <div style={{ display: 'flex', gap: 12, fontSize: '0.88rem', color: '#1a1a1a' }}>
                  <i className="fas fa-wallet" style={{ color: '#c8a97a', marginTop: 2, width: 14 }}></i>
                  <span style={{ fontWeight: 300 }}>
                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
              )}
              {order.status && (
                <div style={{ display: 'flex', gap: 12, fontSize: '0.88rem', color: '#1a1a1a' }}>
                  <i className="fas fa-info-circle" style={{ color: '#c8a97a', marginTop: 2, width: 14 }}></i>
                  <span style={{ fontWeight: 600 }}>{order.status}</span>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <>
                <div style={{ borderTop: '1.5px solid #e8e4df', paddingTop: 18, marginBottom: 12 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '9px 0', fontSize: '0.88rem',
                      borderBottom: '1px solid #f9f6f2',
                    }}>
                      <span style={{ color: '#1a1a1a', fontWeight: 300 }}>
                        {item.productName || item.name}
                        <span style={{ color: '#aaa', marginLeft: 8 }}>×{item.quantity || item.qty}</span>
                      </span>
                      <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {fmt(item.price * (item.quantity || item.qty))}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{
              borderTop: '1.5px solid #e8e4df', paddingTop: 16,
              display: 'flex', justifyContent: 'space-between',
              fontWeight: 600, fontSize: '1rem', color: '#1a1a1a',
            }}>
              <span>Tổng cộng</span>
              <span style={{ fontWeight: 700 }}>{fmt(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/my-orders" style={{
              flex: 1, textAlign: 'center', padding: '13px 0',
              background: '#1a1a1a', color: 'white',
              textDecoration: 'none',
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>
              Xem đơn hàng của tôi
            </Link>
            <Link to="/shop" style={{
              flex: 1, textAlign: 'center', padding: '13px 0',
              background: 'transparent', border: '1.5px solid #1a1a1a',
              color: '#1a1a1a', textDecoration: 'none',
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>
              Tiếp tục mua sắm
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};

export default OrderConfirmation;
