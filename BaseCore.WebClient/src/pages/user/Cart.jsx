import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import { useAuth } from '../../contexts/AuthContext';

// ===== CartContext =====
export const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) =>
    setItems(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });

  const removeFromCart = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => qty < 1
    ? removeFromCart(id)
    : setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

// ===== Helpers =====
const fmt = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

// ===== Trang Cart =====
const Cart = () => {
  const { items, removeFromCart, updateQty, total, clearCart, count } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const subtotal   = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.qty, 0);
  const shipping   = subtotal >= 5_000_000 ? 0 : 50_000;
  const grandTotal = subtotal + shipping;

  return (
    <PublicLayout cartCount={count}>
      <div className="container py-4">

        {/* Tiêu đề */}
        <h3 className="mb-4" style={{ fontWeight: 700 }}>
          <i className="fas fa-shopping-cart mr-2" style={{ color: '#a78bfa' }}></i>
          Giỏ hàng của bạn
          {count > 0 && (
            <span className="badge badge-pill ml-2"
              style={{ background: '#a78bfa', color: 'white', fontSize: '0.8rem' }}>
              {count}
            </span>
          )}
        </h3>

        {/* Giỏ trống */}
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'white', borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <i className="fas fa-shopping-cart fa-4x mb-4 d-block" style={{ color: '#d1d5db' }}></i>
            <h5 style={{ color: '#6b7280', marginBottom: 8 }}>Giỏ hàng trống</h5>
            <p style={{ color: '#9ca3af' }}>Hãy khám phá và thêm sản phẩm vào giỏ nhé!</p>
            <Link to="/shop" className="btn mt-2" style={{
              background: '#a78bfa', color: 'white',
              borderRadius: 20, padding: '10px 28px', fontWeight: 600,
            }}>
              <i className="fas fa-store mr-2"></i>Khám phá cửa hàng
            </Link>
          </div>
        ) : (
          <div className="row">

            {/* ── Danh sách sản phẩm ── */}
            <div className="col-lg-8 mb-4">
              <div style={{
                background: 'white', borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
              }}>
                {items.map((item, idx) => {
                  const unitPrice  = item.discountPrice ?? item.price;
                  const lineTotal  = unitPrice * item.qty;

                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px',
                      borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}>
                      {/* Ảnh */}
                      <div style={{
                        width: 70, height: 70, borderRadius: 10,
                        background: '#f3f4f6', overflow: 'hidden', flexShrink: 0,
                      }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{
                              width: '100%', height: '100%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <i className="fas fa-image" style={{ color: '#d1d5db', fontSize: '1.5rem' }}></i>
                            </div>
                        }
                      </div>

                      {/* Tên + badge + giá đơn vị */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600, fontSize: '0.95rem', marginBottom: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.name}
                        </div>

                        {item.categoryName && (
                          <span style={{
                            background: '#ede9fe', color: '#7c3aed',
                            borderRadius: 12, padding: '2px 10px', fontSize: '0.75rem',
                          }}>
                            {item.categoryName}
                          </span>
                        )}

                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.discountPrice ? (
                            <>
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
                                {fmt(item.discountPrice)}
                              </span>
                              <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.8rem' }}>
                                {fmt(item.price)}
                              </span>
                              <span style={{
                                background: '#fee2e2', color: '#dc2626',
                                borderRadius: 999, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700,
                              }}>
                                SALE
                              </span>
                            </>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
                              {fmt(item.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Số lượng */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: '1px solid #e5e7eb', background: 'white',
                          cursor: 'pointer', fontSize: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>−</button>
                        <span style={{ width: 28, textAlign: 'center', fontWeight: 600 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: '1px solid #e5e7eb', background: 'white',
                          cursor: 'pointer', fontSize: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>+</button>
                      </div>

                      {/* Thành tiền */}
                      <div style={{
                        fontWeight: 700, color: '#1f2937',
                        minWidth: 90, textAlign: 'right', flexShrink: 0,
                      }}>
                        {fmt(lineTotal)}
                      </div>

                      {/* Xóa */}
                      <button onClick={() => removeFromCart(item.id)} style={{
                        background: 'none', border: 'none',
                        color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0,
                        transition: 'color 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Footer list */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <Link to="/shop" style={{
                  color: '#6b7280', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem',
                }}>
                  <i className="fas fa-arrow-left"></i> Tiếp tục mua sắm
                </Link>
                <button onClick={clearCart} style={{
                  background: 'none', border: 'none',
                  color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  <i className="fas fa-trash mr-1"></i> Xóa tất cả
                </button>
              </div>
            </div>

            {/* ── Tóm tắt đơn hàng ── */}
            <div className="col-lg-4">
              <div style={{
                background: 'white', borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24,
                position: 'sticky', top: 80,
              }}>
                <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Tóm tắt đơn hàng</h6>

                {/* Tạm tính */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#6b7280', fontSize: '0.9rem' }}>
                  <span>Tạm tính ({count} sản phẩm)</span>
                  <span>{fmt(subtotal)}</span>
                </div>

                {/* Phí vận chuyển */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#6b7280', fontSize: '0.9rem' }}>
                  <span>Phí vận chuyển</span>
                  <span style={{ color: shipping === 0 ? '#10b981' : '#1f2937', fontWeight: 600 }}>
                    {shipping === 0 ? 'Miễn phí 🎉' : fmt(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 12 }}>
                    Miễn phí vận chuyển cho đơn từ {fmt(5_000_000)}
                  </p>
                )}

                {/* Tổng */}
                <div style={{
                  borderTop: '1px solid #f3f4f6', paddingTop: 16, marginBottom: 20,
                  display: 'flex', justifyContent: 'space-between',
                  fontWeight: 700, fontSize: '1.1rem',
                }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: '#ef4444' }}>{fmt(grandTotal)}</span>
                </div>

                {/* Nút thanh toán */}
                <button
                  onClick={() =>
                    isAuthenticated
                       ? navigate('/checkout')
                      : navigate('/login', { state: { from: '/cart' } })
                  }
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    color: 'white', border: 'none', borderRadius: 12,
                    fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  {isAuthenticated ? 'Thanh toán' : 'Đăng nhập để thanh toán'}
                </button>

                {!isAuthenticated && (
                  <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.85rem', color: '#9ca3af' }}>
                    Hoặc <Link to="/register" style={{ color: '#a78bfa' }}>tạo tài khoản mới</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default Cart;