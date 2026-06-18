import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { useCart } from '../../contexts/CartContext';
import { orderApi, userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatVND as fmt } from '../../utils/format';
import { VIETNAM_CITIES } from '../../constants/cities';
import { groupByArtist, calcShipping, itemUnitPrice, groupSubtotal } from '../../utils/cart';

const inp = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.95rem', color: 'var(--ink)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const fillFormFromAddress = (addr) => ({
  fullName: addr.fullName || '',
  phone: addr.phone || '',
  address: addr.addressLine || '',
  ward: addr.ward || '',
  city: addr.city || '',
});

const addressMatchesForm = (addr, f) =>
  addr.fullName === f.fullName &&
  addr.phone === f.phone &&
  addr.addressLine === f.address &&
  (addr.ward || '') === (f.ward || '') &&
  addr.city === f.city;

const Checkout = () => {
  const { selectedItems, selectedCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const artistGroups = useMemo(() => groupByArtist(selectedItems), [selectedItems]);
  const subtotal = useMemo(
    () => selectedItems.reduce((s, i) => s + itemUnitPrice(i) * (i.qty || 1), 0),
    [selectedItems],
  );
  const shipping = useMemo(
    () => artistGroups.reduce((s, g) => s + calcShipping(groupSubtotal(g.items)), 0),
    [artistGroups],
  );
  const grandTotal = subtotal + shipping;
  const [saveAddress, setSaveAddress] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || user?.username || '',
    phone: user?.phone || '',
    address: '',
    ward: '',
    city: '',
    note: '',
    paymentMethod: 'COD',
  });

  useEffect(() => {
    if (!user?.userId) return;
    userApi.getAddresses(user.userId)
      .then(res => {
        const list = res.data || [];
        setAddresses(list);
        const def = list.find(a => a.isDefault) || list[0];
        if (def) {
          setSelectedAddressId(String(def.id));
          setForm(prev => ({ ...prev, ...fillFormFromAddress(def) }));
        }
      })
      .catch(() => {});
  }, [user?.userId]);

  const refreshAddresses = async () => {
    if (!user?.userId) return;
    const res = await userApi.getAddresses(user.userId);
    setAddresses(res.data || []);
  };

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (selectedAddressId) {
      const sel = addresses.find(a => String(a.id) === selectedAddressId);
      if (sel && !addressMatchesForm(sel, next)) setSelectedAddressId('');
    }
  };

  const handleSelectAddress = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (!id) return;
    const addr = addresses.find(a => String(a.id) === id);
    if (addr) setForm(prev => ({ ...prev, ...fillFormFromAddress(addr) }));
  };

  const saveShippingAddress = async () => {
    if (!user?.userId) return;
    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      addressLine: form.address,
      ward: form.ward || null,
      city: form.city,
      isDefault: true,
    };

    const duplicate = addresses.find(a => addressMatchesForm(a, form));
    if (duplicate) {
      await userApi.setDefaultAddress(user.userId, duplicate.id);
      setSelectedAddressId(String(duplicate.id));
      await refreshAddresses();
      return;
    }

    const selected = selectedAddressId
      ? addresses.find(a => String(a.id) === selectedAddressId)
      : null;

    if (selected && addressMatchesForm(selected, form)) {
      await userApi.updateAddress(user.userId, selectedAddressId, payload);
    } else {
      const res = await userApi.createAddress(user.userId, payload);
      if (res.data?.id) setSelectedAddressId(String(res.data.id));
    }
    await refreshAddresses();
  };

  const resolveOrderId = (data) => {
    if (!data) return null;
    return data.id ?? data.orderId ?? data.Id ?? data.OrderId
      ?? data.order?.id ?? data.order?.Id ?? null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const shippingParts = [form.address, form.ward, form.city].filter(Boolean);
      if (saveAddress && user?.userId) {
        try {
          await saveShippingAddress();
        } catch { /* không chặn đặt hàng nếu lưu địa chỉ lỗi */ }
      }

      const baseOrder = {
        customerName: form.fullName?.trim(),
        shippingAddress: shippingParts.join(', '),
        phone: form.phone,
        note: form.note,
        paymentMethod: form.paymentMethod,
      };

      const orderIds = [];
      for (const group of artistGroups) {
        const res = await orderApi.create({
          ...baseOrder,
          items: group.items.map((i) => ({
            productId: i.id,
            quantity: i.qty || 1,
            price: itemUnitPrice(i),
          })),
        });
        const newOrderId = resolveOrderId(res.data);
        if (!newOrderId) {
          throw new Error('Không nhận được mã đơn hàng từ server.');
        }
        orderIds.push(newOrderId);
      }

      const purchasedProductIds = selectedItems.map((i) => i.id);
      if (orderIds.length === 1) {
        navigate(`/order-confirmation/${orderIds[0]}`, {
          replace: true,
          state: { fromCheckout: true, purchasedProductIds },
        });
      } else {
        navigate('/order-confirmation', {
          replace: true,
          state: { fromCheckout: true, orderIds, purchasedProductIds },
        });
      }
      return;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
      setLoading(false);
    }
  };

  if (selectedItems.length === 0 && !loading) return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 20 }}>✦</p>
          <h5 style={{ fontWeight: 300, color: '#767676', marginBottom: 8 }}>Chưa chọn sản phẩm để thanh toán</h5>
          <Link to="/cart" style={{
            display: 'inline-block', marginTop: 12, marginRight: 12, padding: '13px 32px',
            background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--ink)',
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Quay lại giỏ hàng
          </Link>
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
        <div className="max-w-285 mx-auto px-4 py-5">

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
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-7 mb-4">
                <div style={{ background: 'white', padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 24 }}>
                    Thông tin giao hàng
                  </p>

                  {user?.userId && addresses.length > 0 && (
                    <div className="mb-4">
                      <Label>Chọn địa chỉ đã lưu ({addresses.length})</Label>
                      <select value={selectedAddressId} onChange={handleSelectAddress}
                        style={{ ...inp, cursor: 'pointer' }}>
                        <option value="">-- Thêm địa chỉ mới --</option>
                        {addresses.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.isDefault ? '★ ' : ''}{a.fullName} — {a.addressLine}{a.ward ? `, ${a.ward}` : ''}, {a.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-6">
                    <div className="mb-4">
                      <Label>Họ và tên *</Label>
                      <input name="fullName" value={form.fullName} onChange={handleChange} required
                        style={inp} placeholder="Nguyễn Văn A"
                        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                        onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                    </div>
                    <div className="mb-4">
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

                  <div className="grid grid-cols-2 gap-x-6">
                    <div className="mb-4">
                      <Label>Xã / Phường</Label>
                      <input name="ward" value={form.ward} onChange={handleChange}
                        style={inp} placeholder="Phường Bến Nghé"
                        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                        onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                    </div>
                    <div className="mb-4">
                      <Label>Tỉnh / Thành phố *</Label>
                      <select name="city" value={form.city} onChange={handleChange} required
                        style={{ ...inp, cursor: 'pointer' }}>
                        <option value="">-- Chọn tỉnh/thành --</option>
                        {VIETNAM_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {user?.userId && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: 'var(--ink)', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.85rem', color: '#767676' }}>Lưu địa chỉ này vào hồ sơ và đặt làm mặc định</span>
                      </label>
                    </div>
                  )}

                  <div>
                    <Label>Ghi chú</Label>
                    <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                      style={{ ...inp, resize: 'vertical' }}
                      placeholder="Ghi chú cho người giao hàng (tùy chọn)"
                      onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                      onBlur={e => e.target.style.borderColor = '#e8e4df'} />
                  </div>
                </div>

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

              <div className="col-span-5">
                <div style={{ background: 'white', padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 80 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 20 }}>
                    Đơn hàng ({selectedCount} sản phẩm{artistGroups.length > 1 ? ` · ${artistGroups.length} đơn` : ''})
                  </p>

                  {artistGroups.length > 1 && (
                    <div style={{
                      background: '#faf8f5', border: '1px solid #e8e4df',
                      padding: '10px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#767676', lineHeight: 1.5,
                    }}>
                      <i className="fas fa-info-circle" style={{ color: 'var(--brand)', marginRight: 6 }} />
                      Mỗi họa sĩ sẽ có đơn riêng — hủy một tranh không ảnh hưởng các đơn khác.
                    </div>
                  )}

                  {artistGroups.map((group, gIdx) => {
                    const groupTotal = groupSubtotal(group.items);
                    const groupShip = calcShipping(groupTotal);
                    return (
                      <div key={group.key} style={{ marginBottom: gIdx < artistGroups.length - 1 ? 18 : 0 }}>
                        {artistGroups.length > 1 && (
                          <div style={{
                            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                            color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 10,
                          }}>
                            <i className="fas fa-palette" style={{ marginRight: 6, color: 'var(--brand)' }} />
                            {group.name}
                          </div>
                        )}
                        {group.items.map((item) => (
                          <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 10,
                            paddingBottom: 10, borderBottom: '1px solid #f0ece6',
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
                                <div style={{ color: '#aaa', fontSize: '0.78rem' }}>×{item.qty || 1}</div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>
                              {fmt(itemUnitPrice(item) * (item.qty || 1))}
                            </span>
                          </div>
                        ))}
                        {artistGroups.length > 1 && (
                          <div style={{ fontSize: '0.78rem', color: '#aaa', textAlign: 'right' }}>
                            Đơn này: {fmt(groupTotal + groupShip)}
                            {groupShip > 0 && ` (ship ${fmt(groupShip)})`}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#767676', marginBottom: 8, fontSize: '0.88rem' }}>
                    <span>Tạm tính</span><span style={{ color: 'var(--ink)' }}>{fmt(subtotal)}</span>
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