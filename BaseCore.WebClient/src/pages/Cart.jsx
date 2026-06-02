import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAuthModal } from '../contexts/AuthModalContext';

const fmt = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const Cart = () => {
  const { items, removeFromCart, updateQty, total, clearCart, count } = useCart();
  const { isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();

  const subtotal   = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.qty, 0);
  const shipping   = subtotal >= 5_000_000 ? 0 : 50_000;
  const grandTotal = subtotal + shipping;

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
      <div className="container py-5">

        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 8 }}>
            Mua sắm
          </p>
          <h1 style={{ fontWeight: 200, fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
            Giỏ hàng
            {count > 0 && (
              <span style={{ fontSize: '1rem', fontWeight: 400, color: '#aaa', marginLeft: 12 }}>({count} sản phẩm)</span>
            )}
          </h1>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white' }}>
            <p style={{ fontSize: '2.5rem', color: '#e8e4df', marginBottom: 20 }}>✦</p>
            <h5 style={{ fontWeight: 300, color: '#767676', marginBottom: 8 }}>Giỏ hàng của bạn đang trống</h5>
            <p style={{ color: '#aaa', marginBottom: 28, fontSize: '0.9rem' }}>Khám phá các tác phẩm nghệ thuật độc đáo</p>
            <Link to="/shop" style={{
              display: 'inline-block', padding: '13px 32px',
              background: 'var(--ink)', color: 'white',
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', textDecoration: 'none',
            }}>
              Khám phá cửa hàng
            </Link>
          </div>
        ) : (
          <div className="row">

            <div className="col-lg-8 mb-4">
              <div style={{ background: 'white', overflow: 'hidden' }}>
                {items.map((item, idx) => {
                  const unitPrice  = item.discountPrice ?? item.price;
                  const lineTotal  = unitPrice * item.qty;

                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px',
                      borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}>
                      <div style={{ width: 70, height: 70, background: '#f0ece6', overflow: 'hidden', flexShrink: 0 }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="fas fa-image" style={{ color: '#d1d5db', fontSize: '1.5rem' }}></i>
                            </div>
                        }
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>

                        {item.categoryName && (
                          <span style={{ background: '#f0ece6', color: 'var(--brand-dark)', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                            {item.categoryName}
                          </span>
                        )}

                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.discountPrice ? (
                            <>
                              <span style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '0.9rem' }}>{fmt(item.discountPrice)}</span>
                              <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.8rem' }}>{fmt(item.price)}</span>
                              <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em' }}>SALE</span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '0.9rem' }}>{fmt(item.price)}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, color: 'var(--ink)', minWidth: 90, textAlign: 'right', flexShrink: 0 }}>
                        {fmt(lineTotal)}
                      </div>

                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#991b1b'}
                        onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <Link to="/shop" style={{ color: '#767676', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', letterSpacing: '0.02em' }}>
                  <i className="fas fa-arrow-left"></i> Tiếp tục mua sắm
                </Link>
                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.82rem', letterSpacing: '0.04em' }}>
                  <i className="fas fa-trash mr-1"></i> Xóa tất cả
                </button>
              </div>
            </div>

            <div className="col-lg-4">
              <div style={{ background: 'white', padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', position: 'sticky', top: 80 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 20 }}>
                  Tóm tắt đơn hàng
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#767676', fontSize: '0.88rem' }}>
                  <span>Tạm tính ({count} sản phẩm)</span>
                  <span style={{ color: 'var(--ink)' }}>{fmt(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#767676', fontSize: '0.88rem' }}>
                  <span>Phí vận chuyển</span>
                  <span style={{ color: shipping === 0 ? '#2d6a4f' : 'var(--ink)', fontWeight: 600 }}>
                    {shipping === 0 ? 'Miễn phí' : fmt(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 16 }}>
                    Miễn phí vận chuyển cho đơn từ {fmt(5_000_000)}
                  </p>
                )}

                <div style={{ borderTop: '1.5px solid #e8e4df', paddingTop: 18, marginBottom: 24, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1rem' }}>
                  <span style={{ color: 'var(--ink)' }}>Tổng cộng</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmt(grandTotal)}</span>
                </div>

                <button
                  onClick={() => isAuthenticated ? navigate('/checkout') : openLogin()}
                  style={{ width: '100%', padding: '13px 0', background: 'var(--ink)', color: 'white', border: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  {isAuthenticated ? 'Thanh toán' : 'Đăng nhập để thanh toán'}
                </button>

                {!isAuthenticated && (
                  <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.82rem', color: '#aaa' }}>
                    Hoặc{' '}
                    <button type="button" onClick={openRegister}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ink)', fontWeight: 700, borderBottom: '1px solid var(--ink)', cursor: 'pointer', fontSize: '0.82rem' }}>
                      tạo tài khoản mới
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </PublicLayout>
  );
};

export default Cart;
