import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useCart } from './Cart';
import { orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const Checkout = () => {
    const { items, total, clearCart, count } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        fullName: user?.fullName || user?.username || '',
        phone: '',
        address: '',
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
            const orderData = {
                shippingAddress: `${form.address}, ${form.city}`,
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
            navigate('/order-confirmation', { state: { order: res.data } });
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
        }
        setLoading(false);
    };

    if (items.length === 0) return (
        <PublicLayout cartCount={count}>
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <i className="fas fa-shopping-cart fa-4x d-block mb-3" style={{ color: '#d1d5db' }}></i>
                <h5 style={{ color: '#6b7280' }}>Giỏ hàng trống, không thể thanh toán</h5>
                <Link to="/shop" className="btn mt-3" style={{
                    background: '#a78bfa', color: 'white', borderRadius: 20, padding: '10px 28px', fontWeight: 600
                }}>Quay lại cửa hàng</Link>
            </div>
        </PublicLayout>
    );

    return (
        <PublicLayout cartCount={count}>
            <div className="container py-4">
                <h3 style={{ fontWeight: 800, marginBottom: 24 }}>
                    <i className="fas fa-credit-card mr-2" style={{ color: '#a78bfa' }}></i>
                    Thanh toán
                </h3>

                {error && (
                    <div style={{
                        background: '#fee2e2', color: '#991b1b', borderRadius: 12,
                        padding: '12px 20px', marginBottom: 20, fontSize: '0.9rem'
                    }}>
                        <i className="fas fa-exclamation-circle mr-2"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Form địa chỉ */}
                        <div className="col-lg-7 mb-4">
                            <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                                <h5 style={{ fontWeight: 700, marginBottom: 20 }}>
                                    <i className="fas fa-map-marker-alt mr-2" style={{ color: '#a78bfa' }}></i>
                                    Thông tin giao hàng
                                </h5>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                                            Họ và tên *
                                        </label>
                                        <input name="fullName" value={form.fullName}
                                            onChange={handleChange} required
                                            style={inputStyle}
                                            placeholder="Nguyễn Văn A" />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                                            Số điện thoại *
                                        </label>
                                        <input name="phone" value={form.phone}
                                            onChange={handleChange} required type="tel"
                                            style={inputStyle}
                                            placeholder="0901 234 567" />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                                        Địa chỉ *
                                    </label>
                                    <input name="address" value={form.address}
                                        onChange={handleChange} required
                                        style={inputStyle}
                                        placeholder="Số nhà, tên đường, phường/xã" />
                                </div>

                                <div className="mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                                        Tỉnh / Thành phố *
                                    </label>
                                    <select name="city" value={form.city}
                                        onChange={handleChange} required
                                        style={inputStyle}>
                                        <option value="">-- Chọn tỉnh/thành --</option>
                                        {['TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Cần Thơ','Hải Phòng',
                                          'Bình Dương','Đồng Nai','An Giang','Khánh Hòa','Lâm Đồng']
                                          .map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                                        Ghi chú
                                    </label>
                                    <textarea name="note" value={form.note}
                                        onChange={handleChange} rows={3}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                        placeholder="Ghi chú cho người giao hàng (tùy chọn)" />
                                </div>
                            </div>

                            {/* Phương thức thanh toán */}
                            <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginTop: 20 }}>
                                <h5 style={{ fontWeight: 700, marginBottom: 20 }}>
                                    <i className="fas fa-wallet mr-2" style={{ color: '#a78bfa' }}></i>
                                    Phương thức thanh toán
                                </h5>

                                {[
                                    { value: 'COD', icon: 'fa-money-bill-wave', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận được hàng' },
                                    { value: 'BANKING', icon: 'fa-university', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trước khi giao hàng' },
                                ].map(opt => (
                                    <label key={opt.value} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 14,
                                        padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                                        border: `2px solid ${form.paymentMethod === opt.value ? '#a78bfa' : '#e5e7eb'}`,
                                        background: form.paymentMethod === opt.value ? '#faf5ff' : 'white',
                                        marginBottom: 12, transition: 'all 0.2s',
                                    }}>
                                        <input type="radio" name="paymentMethod" value={opt.value}
                                            checked={form.paymentMethod === opt.value}
                                            onChange={handleChange}
                                            style={{ marginTop: 3, accentColor: '#a78bfa' }} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                                <i className={`fas ${opt.icon} mr-2`} style={{ color: '#a78bfa' }}></i>
                                                {opt.label}
                                            </div>
                                            <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 2 }}>{opt.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Tóm tắt đơn hàng */}
                        <div className="col-lg-5">
                            <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: 'sticky', top: 80 }}>
                                <h5 style={{ fontWeight: 700, marginBottom: 20 }}>
                                    <i className="fas fa-receipt mr-2" style={{ color: '#a78bfa' }}></i>
                                    Đơn hàng ({count} sản phẩm)
                                </h5>

                                {items.map(item => (
                                    <div key={item.id} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', marginBottom: 12,
                                        paddingBottom: 12, borderBottom: '1px solid #f3f4f6'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 8,
                                                background: '#f3f4f6', overflow: 'hidden', flexShrink: 0
                                            }}>
                                                {item.imageUrl
                                                    ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="fas fa-image" style={{ color: '#d1d5db' }}></i>
                                                      </div>
                                                }
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</div>
                                                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>x{item.qty}</div>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(item.price * item.qty)}</span>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginBottom: 8 }}>
                                    <span>Tạm tính</span><span>{fmt(total)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginBottom: 16 }}>
                                    <span>Phí vận chuyển</span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>Miễn phí</span>
                                </div>
                                <div style={{
                                    borderTop: '2px solid #f3f4f6', paddingTop: 16,
                                    display: 'flex', justifyContent: 'space-between',
                                    fontWeight: 800, fontSize: '1.2rem', marginBottom: 20
                                }}>
                                    <span>Tổng cộng</span>
                                    <span style={{ color: '#ef4444' }}>{fmt(total)}</span>
                                </div>

                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '14px 0',
                                    background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                                    color: loading ? '#9ca3af' : 'white',
                                    border: 'none', borderRadius: 12,
                                    fontWeight: 700, fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer',
                                }}>
                                    {loading
                                        ? <><span className="spinner-border spinner-border-sm mr-2"></span>Đang xử lý...</>
                                        : <><i className="fas fa-check-circle mr-2"></i>Xác nhận đặt hàng</>
                                    }
                                </button>

                                <Link to="/cart" style={{
                                    display: 'block', textAlign: 'center', marginTop: 12,
                                    color: '#9ca3af', fontSize: '0.85rem', textDecoration: 'none'
                                }}>
                                    <i className="fas fa-arrow-left mr-1"></i> Quay lại giỏ hàng
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
};

const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: '0.95rem', outline: 'none',
    transition: 'border-color 0.2s',
    marginTop: 4,
};

export default Checkout;