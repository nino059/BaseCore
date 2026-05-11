import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const OrderConfirmation = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const order = state?.order;

    useEffect(() => {
        if (!order) navigate('/');
    }, [order, navigate]);

    if (!order) return null;

    return (
        <PublicLayout>
            <div className="container py-5" style={{ maxWidth: 620 }}>
                {/* Success banner */}
                <div style={{
                    textAlign: 'center', padding: '40px 20px 32px',
                    background: 'white', borderRadius: 24,
                    boxShadow: '0 8px 40px rgba(167,139,250,0.15)',
                    marginBottom: 24,
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <i className="fas fa-check" style={{ color: 'white', fontSize: '2rem' }}></i>
                    </div>
                    <h3 style={{ fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>
                        Đặt hàng thành công! 🎉
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: 0 }}>
                        Cảm ơn bạn đã tin tưởng <strong style={{ color: '#a78bfa' }}>Arthentic</strong>.<br />
                        Chúng tôi sẽ liên hệ xác nhận sớm nhất!
                    </p>
                </div>

                {/* Thông tin đơn hàng */}
                <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                    <h5 style={{ fontWeight: 700, marginBottom: 20 }}>
                        <i className="fas fa-receipt mr-2" style={{ color: '#a78bfa' }}></i>
                        Chi tiết đơn hàng #{order.id}
                    </h5>

                    {order.shippingAddress && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12, color: '#374151', fontSize: '0.92rem' }}>
                            <i className="fas fa-map-marker-alt mt-1" style={{ color: '#a78bfa', width: 16 }}></i>
                            <span>{order.shippingAddress}</span>
                        </div>
                    )}

                    {order.paymentMethod && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12, color: '#374151', fontSize: '0.92rem' }}>
                            <i className="fas fa-wallet mt-1" style={{ color: '#a78bfa', width: 16 }}></i>
                            <span>{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</span>
                        </div>
                    )}

                    {/* Sản phẩm */}
                    {order.items && order.items.length > 0 && (
                        <>
                            <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 0' }}></div>
                            {order.items.map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '8px 0', fontSize: '0.9rem',
                                    borderBottom: '1px solid #f9fafb'
                                }}>
                                    <span style={{ color: '#374151' }}>
                                        {item.productName || item.name}
                                        <span style={{ color: '#9ca3af', marginLeft: 6 }}>x{item.quantity || item.qty}</span>
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{fmt(item.price * (item.quantity || item.qty))}</span>
                                </div>
                            ))}
                        </>
                    )}

                    <div style={{
                        borderTop: '2px solid #f3f4f6', marginTop: 16, paddingTop: 16,
                        display: 'flex', justifyContent: 'space-between',
                        fontWeight: 800, fontSize: '1.15rem'
                    }}>
                        <span>Tổng cộng</span>
                        <span style={{ color: '#ef4444' }}>{fmt(order.totalAmount || order.total || 0)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to="/my-orders" style={{
                        flex: 1, textAlign: 'center', padding: '13px 0',
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        color: 'white', textDecoration: 'none',
                        borderRadius: 12, fontWeight: 700, fontSize: '0.95rem'
                    }}>
                        <i className="fas fa-box mr-2"></i>Xem đơn hàng của tôi
                    </Link>
                    <Link to="/shop" style={{
                        flex: 1, textAlign: 'center', padding: '13px 0',
                        border: '2px solid #a78bfa', color: '#7c3aed',
                        textDecoration: 'none', borderRadius: 12,
                        fontWeight: 700, fontSize: '0.95rem'
                    }}>
                        <i className="fas fa-store mr-2"></i>Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
};

export default OrderConfirmation;