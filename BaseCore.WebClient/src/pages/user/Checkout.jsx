import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import { useCart } from '../../contexts/CartContext';
import { orderApi, userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const inp = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.95rem', color: 'var(--ink)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const Checkout = () => {
  const { items, total, clearCart, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shipping   = total >= 5_000_000 ? 0 : 50_000;
  const grandTotal = total + shipping;
  const [saveAddress, setSaveAddress] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.username || '',
    phone: user?.phone || '',
    address: user?.address || '',
    ward: '',
    city: '',
    note: '',
    paymentMethod: 'COD',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const shippingParts = [form.address, form.ward, form.city].filter(Boolean);
      if (saveAddress && user?.id) {
        try {
          await userApi.update(user.id, {
            fullName: form.fullName,
            phone: form.phone,
            address: shippingParts.join(', '),
          });
        } catch { /* không chặn đặt hàng nếu lưu địa chỉ lỗi */ }
      }
      const orderData = {
        shippingAddress: shippingParts.join(', '),
        phone: form.phone,
        note: form.note,
        paymentMethod: form.paymentMethod,
        items: items.map(i => ({
          productId: i.id,
          quantity: i.qty,
          price: i.price,
        })),
      };
      const res = await orderApi.create(orderData);
      clearCart();
      navigate(`/order-confirmation/${res.data.id || res.data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
    }
    setLoading(false);
  };

  if (items.length === 0) return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 20 }}>✦</p>
          <h5 style={{ fontWeight: 300, color: '#767676', marginBottom: 8 }}>Giỏ hàng trống, không thể thanh toán</h5>
          <Link to="/shop" style={{
            display: 'inline-block', marginTop: 20, padding: '13px 32px',
            background: 'var(--ink)', color: 'white',
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    </PublicLayout>
  );

  const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </label>
  );

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div className="container py-5">

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 8 }}>
              Đặt hàng
            </p>
            <h1 style={{ fontWeight: 200, fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
              Thanh toán
            </h1>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '12px 18px', marginBottom: 24, fontSize: '0.85rem',
            }}>
              <i className="fas fa-exclamation-circle mr-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Form địa chỉ */}
              <div className="col-lg-7 mb-4">
                <div style={{ background: 'white', padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 24 }}>
                    Thông tin giao hàng
                  </p>

                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <Label>Họ và tên *</Label>
                      <input name="fullName" value={form.fullName} onChange={handleChange} required
                        style={inp} placeholder="Nguyễn Văn A"
                        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                        onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                    </div>
                    <div className="col-md-6 mb-4">
                      <Label>Số điện thoại *</Label>
                      <input name="phone" value={form.phone} onChange={handleChange} required type="tel"
                        style={inp} placeholder="0901 234 567"
                        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                        onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label>Địa chỉ *</Label>
                    <input name="address" value={form.address} onChange={handleChange} required
                      style={inp} placeholder="Số nhà, tên đường, phường/xã"
                      onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                      onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <Label>Xã / Phường</Label>
                      <input name="ward" value={form.ward} onChange={handleChange}
                        style={inp} placeholder="Phường Bến Nghé"
                        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                        onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                    </div>
                    <div className="col-md-6 mb-4">
                      <Label>Tỉnh / Thành phố *</Label>
                      <select name="city" value={form.city} onChange={handleChange} required
                        style={{ ...inp, cursor: 'pointer' }}>
                        <option value="">-- Chọn tỉnh/thành --</option>
                        {['TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Cần Thơ','Hải Phòng',
                          'Bình Dương','Đồng Nai','An Giang','Khánh Hòa','Lâm Đồng']
                          .map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--ink)', cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.85rem', color: '#767676' }}>Lưu địa chỉ giao hàng này vào hồ sơ cá nhân</span>
                    </label>
                  </div>

                  <div>
                    <Label>Ghi chú</Label>
                    <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                      style={{ ...inp, resize: 'vertical' }}
                      placeholder="Ghi chú cho người giao hàng (tùy chọn)"
                      onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                      onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div style={{ background: 'white', padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', marginTop: 16 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 20 }}>
                    Phương thức thanh toán
                  </p>

                  {[
                    { value: 'COD',     label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận được hàng' },
                    { value: 'BANKING', label: 'Chuyển khoản ngân hàng',         desc: 'Chuyển khoản trước khi giao hàng' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '14px 18px', cursor: 'pointer',
                      border: `1.5px solid ${form.paymentMethod === opt.value ? 'var(--ink)' : '#e8e4df'}`,
                      background: form.paymentMethod === opt.value ? '#f9f6f2' : 'white',
                      marginBottom: 10, transition: 'all 0.18s',
                    }}>
                      <input type="radio" name="paymentMethod" value={opt.value}
                        checked={form.paymentMethod === opt.value}
                        onChange={handleChange}
                        style={{ marginTop: 3, accentColor: 'var(--ink)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{opt.label}</div>
                        <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="col-lg-5">
                <div style={{ background: 'white', padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 80 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 20 }}>
                    Đơn hàng ({count} sản phẩm)
                  </p>

                  {items.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 12,
                      paddingBottom: 12, borderBottom: '1px solid #f0ece6',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, background: '#f0ece6', overflow: 'hidden', flexShrink: 0 }}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-image" style={{ color: '#ccc' }}></i>
                              </div>
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--ink)' }}>{item.name}</div>
                          <div style={{ color: '#aaa', fontSize: '0.78rem' }}>×{item.qty}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>
                        {fmt(item.price * item.qty)}
                      </span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#767676', marginBottom: 8, fontSize: '0.88rem' }}>
                    <span>Tạm tính</span><span style={{ color: 'var(--ink)' }}>{fmt(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#767676', marginBottom: 16, fontSize: '0.88rem' }}>
                    <span>Phí vận chuyển</span>
                    {shipping === 0
                      ? <span style={{ color: '#2d6a4f', fontWeight: 600 }}>Miễn phí</span>
                      : <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{fmt(shipping)}</span>
                    }
                  </div>
                  {shipping > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 14, textAlign: 'right' }}>
                      Miễn phí ship cho đơn từ {fmt(5_000_000)}
                    </div>
                  )}
                  <div style={{
                    borderTop: '1.5px solid #e8e4df', paddingTop: 16,
                    display: 'flex', justifyContent: 'space-between',
                    fontWeight: 700, fontSize: '1.05rem', marginBottom: 24, color: 'var(--ink)',
                  }}>
                    <span>Tổng cộng</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px 0',
                    background: loading ? '#ccc' : 'var(--ink)',
                    color: 'white', border: 'none',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm mr-2"></span>Đang xử lý...</>
                      : 'Xác nhận đặt hàng'
                    }
                  </button>

                  <Link to="/cart" style={{
                    display: 'block', textAlign: 'center', marginTop: 14,
                    color: '#aaa', fontSize: '0.82rem', textDecoration: 'none', letterSpacing: '0.04em',
                  }}>
                    <i className="fas fa-arrow-left mr-1"></i> Quay lại giỏ hàng
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Checkout;
