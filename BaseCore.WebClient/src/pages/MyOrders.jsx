import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { orderApi } from '../services/api';
import { useCart } from './Cart';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
});

const STATUS_MAP = {
    Pending:   { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7' },
    Confirmed: { label: 'Đã xác nhận',  color: '#3b82f6', bg: '#dbeafe' },
    Shipping:  { label: 'Đang giao',    color: '#8b5cf6', bg: '#ede9fe' },
    Delivered: { label: 'Đã giao',      color: '#10b981', bg: '#d1fae5' },
    Cancelled: { label: 'Đã hủy',       color: '#ef4444', bg: '#fee2e2' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
    return (
        <span style={{
            background: s.bg, color: s.color,
            borderRadius: 12, padding: '4px 12px',
            fontSize: '0.8rem', fontWeight: 600
        }}>{s.label}</span>
    );
};

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const { count } = useCart();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await orderApi.getMyOrders();
                setOrders(res.data?.data || res.data || []);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <PublicLayout cartCount={count}>
            <div className="container py-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <h3 style={{ fontWeight: 800, margin: 0 }}>
                        <i className="fas fa-box mr-2" style={{ color: '#a78bfa' }}></i>
                        Đơn hàng của tôi
                    </h3>
                    <Link to="/shop" style={{
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        color: 'white', textDecoration: 'none',
                        borderRadius: 20, padding: '8px 20px', fontWeight: 600, fontSize: '0.9rem'
                    }}>
                        <i className="fas fa-store mr-1"></i> Tiếp tục mua sắm
                    </Link>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div className="spinner-border" style={{ color: '#a78bfa', width: 48, height: 48 }}></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '60px 20px',
                        background: 'white', borderRadius: 20,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                    }}>
                        <i className="fas fa-inbox fa-4x d-block mb-3" style={{ color: '#d1d5db' }}></i>
                        <h5 style={{ color: '#6b7280' }}>Bạn chưa có đơn hàng nào</h5>
                        <Link to="/shop" className="btn mt-3" style={{
                            background: '#a78bfa', color: 'white',
                            borderRadius: 20, padding: '10px 28px', fontWeight: 600
                        }}>Mua sắm ngay</Link>
                    </div>
                ) : (
                    <div className="row">
                        {/* Danh sách đơn */}
                        <div className={selected ? 'col-lg-5' : 'col-12'}>
                            {orders.map(order => (
                                <div key={order.id}
                                    onClick={() => setSelected(selected?.id === order.id ? null : order)}
                                    style={{
                                        background: 'white', borderRadius: 16, padding: 20,
                                        marginBottom: 16, cursor: 'pointer',
                                        boxShadow: selected?.id === order.id
                                            ? '0 0 0 2px #a78bfa, 0 4px 24px rgba(167,139,250,0.15)'
                                            : '0 2px 12px rgba(0,0,0,0.06)',
                                        transition: 'box-shadow 0.2s',
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Đơn #{order.id}</div>
                                            <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 2 }}>
                                                {fmtDate(order.createdAt || order.orderDate)}
                                            </div>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {order.items && (
                                            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                                {order.items.length} sản phẩm
                                            </span>
                                        )}
                                        <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.1rem' }}>
                                            {fmt(order.totalAmount || order.total || 0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chi tiết đơn hàng */}
                        {selected && (
                            <div className="col-lg-7">
                                <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', position: 'sticky', top: 80 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <h5 style={{ fontWeight: 800, margin: 0 }}>Chi tiết đơn #{selected.id}</h5>
                                        <button onClick={() => setSelected(null)}
                                            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9ca3af' }}>
                                            ×
                                        </button>
                                    </div>

                                    {/* Trạng thái */}
                                    <div style={{ marginBottom: 16 }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Trạng thái: </span>
                                        <StatusBadge status={selected.status} />
                                    </div>

                                    {/* Thời gian */}
                                    <div style={{ marginBottom: 12, color: '#6b7280', fontSize: '0.9rem' }}>
                                        <i className="fas fa-clock mr-2" style={{ color: '#a78bfa' }}></i>
                                        {fmtDate(selected.createdAt || selected.orderDate)}
                                    </div>

                                    {/* Địa chỉ */}
                                    {selected.shippingAddress && (
                                        <div style={{ marginBottom: 12, color: '#6b7280', fontSize: '0.9rem' }}>
                                            <i className="fas fa-map-marker-alt mr-2" style={{ color: '#a78bfa' }}></i>
                                            {selected.shippingAddress}
                                        </div>
                                    )}

                                    {/* Ghi chú */}
                                    {selected.note && (
                                        <div style={{ marginBottom: 12, color: '#6b7280', fontSize: '0.9rem' }}>
                                            <i className="fas fa-sticky-note mr-2" style={{ color: '#a78bfa' }}></i>
                                            {selected.note}
                                        </div>
                                    )}

                                    {/* Danh sách sản phẩm */}
                                    {selected.items && selected.items.length > 0 && (
                                        <>
                                            <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 0' }}></div>
                                            <h6 style={{ fontWeight: 700, marginBottom: 12 }}>Sản phẩm</h6>
                                            {selected.items.map((item, idx) => (
                                                <div key={idx} style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    padding: '8px 0', borderBottom: '1px solid #f9fafb',
                                                    fontSize: '0.9rem'
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

                                    {/* Tổng cộng */}
                                    <div style={{
                                        borderTop: '1px solid #f3f4f6', marginTop: 16, paddingTop: 16,
                                        display: 'flex', justifyContent: 'space-between',
                                        fontWeight: 800, fontSize: '1.1rem'
                                    }}>
                                        <span>Tổng cộng</span>
                                        <span style={{ color: '#ef4444' }}>{fmt(selected.totalAmount || selected.total || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
};

export default MyOrders;