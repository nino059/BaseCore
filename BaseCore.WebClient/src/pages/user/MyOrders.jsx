import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const fmt = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'Pending',   label: 'Chờ xác nhận' },
  { key: 'Confirmed', label: 'Đã xác nhận' },
  { key: 'Shipping',  label: 'Đang giao' },
  { key: 'Delivered', label: 'Đã giao' },
  { key: 'Cancelled', label: 'Đã hủy' },
];

const STATUS_MAP = {
  Pending:   { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  Confirmed: { label: 'Đã xác nhận',  color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  Shipping:  { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  Delivered: { label: 'Đã giao',      color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  Cancelled: { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700,
      letterSpacing: '0.06em', background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }}></span>
      {s.label}
    </span>
  );
};

const MyOrders = () => {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [activeTab, setActiveTab]       = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      setOrders(res.data?.data || res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const handleCancel = async (order) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn #${order.id}?`)) return;
    setCancellingId(order.id);
    try {
      await orderApi.cancel(order.id);
      await loadOrders();
      setSelected(null);
    } catch { alert('Hủy đơn thất bại!'); }
    setCancellingId(null);
  };

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 20px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 8 }}>
                Tài khoản
              </p>
              <h1 style={{ fontWeight: 200, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#1a1a1a', letterSpacing: '0.04em', margin: 0 }}>
                Đơn hàng của tôi
              </h1>
            </div>
            <Link to="/shop" style={{
              padding: '11px 24px', background: 'transparent',
              border: '1.5px solid #1a1a1a', color: '#1a1a1a',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', textDecoration: 'none',
              display: 'inline-block',
            }}>
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 32, borderBottom: '1.5px solid #e8e4df' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setActiveTab(t.key); setSelected(null); }} style={{
                padding: '11px 18px', border: 'none', cursor: 'pointer',
                fontWeight: activeTab === t.key ? 700 : 400,
                fontSize: '0.82rem', letterSpacing: '0.06em',
                background: 'transparent', whiteSpace: 'nowrap',
                color: activeTab === t.key ? '#1a1a1a' : '#767676',
                borderBottom: activeTab === t.key ? '2px solid #1a1a1a' : '2px solid transparent',
                marginBottom: -1.5, transition: 'all 0.18s',
              }}>
                {t.label}
                {t.key !== 'all' && orders.filter(o => o.status === t.key).length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#c8a97a' }}>
                    ({orders.filter(o => o.status === t.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 80, background: '#ede9e0', opacity: 0.5 }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 20 }}>✦</p>
              <p style={{ fontWeight: 300, fontSize: '1.1rem', color: '#767676', marginBottom: 8 }}>Bạn chưa có đơn hàng nào</p>
              <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: 28 }}>Khám phá bộ sưu tập nghệ thuật của chúng tôi</p>
              <Link to="/shop" style={{
                display: 'inline-block', padding: '13px 32px',
                background: '#1a1a1a', color: 'white',
                fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Khám phá ngay
              </Link>
            </div>
          )}

          {/* Tab empty */}
          {!loading && orders.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>✦</p>
              <p style={{ fontWeight: 300 }}>Không có đơn hàng nào ở trạng thái này.</p>
            </div>
          )}

          {/* List + Detail */}
          {!loading && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.1fr' : '1fr', gap: 24 }}>

              {/* Danh sách */}
              <div>
                {filtered.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelected(selected?.id === order.id ? null : order)}
                    style={{
                      background: 'white', padding: '20px 24px', marginBottom: 10, cursor: 'pointer',
                      borderLeft: selected?.id === order.id ? '3px solid #1a1a1a' : '3px solid transparent',
                      boxShadow: selected?.id === order.id
                        ? '0 4px 24px rgba(0,0,0,0.08)'
                        : '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (selected?.id !== order.id) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { if (selected?.id !== order.id) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a' }}>Đơn #{order.id}</span>
                        <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: 3, letterSpacing: '0.02em' }}>
                          {fmtDate(order.createdAt || order.orderDate)}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {order.items && (
                        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{order.items.length} tác phẩm</span>
                      )}
                      <span style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.95rem' }}>
                        {fmt(order.totalAmount || order.total || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chi tiết */}
              {selected && (
                <div style={{
                  background: 'white', padding: 28,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
                  height: 'fit-content', position: 'sticky', top: 80,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 4 }}>
                        Chi tiết
                      </p>
                      <h3 style={{ fontWeight: 400, fontSize: '1rem', color: '#1a1a1a', margin: 0 }}>
                        Đơn hàng #{selected.id}
                      </h3>
                    </div>
                    <button onClick={() => setSelected(null)} style={{
                      background: '#f9f6f2', border: 'none',
                      width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', color: '#767676',
                    }}>✕</button>
                  </div>

                  <div style={{ background: '#faf8f5', padding: '14px 18px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: '#767676' }}>Trạng thái</span>
                      <StatusBadge status={selected.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', color: '#767676' }}>Ngày đặt</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1a1a' }}>
                        {fmtDate(selected.createdAt || selected.orderDate)}
                      </span>
                    </div>
                    {selected.paymentMethod && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#767676' }}>Thanh toán</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1a1a' }}>{selected.paymentMethod}</span>
                      </div>
                    )}
                  </div>

                  {selected.shippingAddress && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 6 }}>
                        Địa chỉ giao hàng
                      </p>
                      <p style={{ fontSize: '0.88rem', color: '#1a1a1a', fontWeight: 300, lineHeight: 1.6 }}>{selected.shippingAddress}</p>
                    </div>
                  )}

                  {selected.note && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', marginBottom: 20, fontSize: '0.85rem', color: '#92400e' }}>
                      <i className="fas fa-sticky-note mr-2"></i>{selected.note}
                    </div>
                  )}

                  {selected.items && selected.items.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 12 }}>
                        Tác phẩm đặt mua
                      </p>
                      {selected.items.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 0', borderBottom: '1px solid #f0ece6',
                        }}>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a' }}>{item.productName || item.name}</div>
                            <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: 2 }}>Số lượng: {item.quantity || item.qty}</div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.88rem' }}>
                            {fmt(item.price * (item.quantity || item.qty))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #e8e4df', paddingTop: 16, marginBottom: 20 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a' }}>Tổng cộng</span>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a' }}>
                      {fmt(selected.totalAmount || selected.total || 0)}
                    </span>
                  </div>

                  {selected.status === 'Pending' && (
                    <button onClick={() => handleCancel(selected)} disabled={cancellingId === selected.id} style={{
                      width: '100%', padding: '12px 0', border: '1.5px solid #991b1b',
                      background: 'transparent', color: '#991b1b',
                      fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', cursor: cancellingId === selected.id ? 'not-allowed' : 'pointer',
                      opacity: cancellingId === selected.id ? 0.6 : 1,
                    }}>
                      {cancellingId === selected.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default MyOrders;
