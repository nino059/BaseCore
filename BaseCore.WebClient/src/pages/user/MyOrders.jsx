import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  { key: 'all',        label: 'Tất cả' },
  { key: 'Pending',    label: 'Chờ xác nhận' },
  { key: 'Processing', label: 'Đang xử lý' },
  { key: 'Shipping',   label: 'Đang giao' },
  { key: 'Completed',  label: 'Đã giao' },
  { key: 'Cancelled',  label: 'Đã hủy' },
];

const STATUS_MAP = {
  Pending:    { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  Processing: { label: 'Đang xử lý',   color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  Shipping:   { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  Completed:  { label: 'Đã giao',      color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  Cancelled:  { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
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
  const navigate = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('all');

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      const data = res.data?.data || res.data || [];
      setOrders(data);
    } catch (err) { console.error(err); }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 20px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 8 }}>
                Tài khoản
              </p>
              <h1 style={{ fontWeight: 200, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
                Đơn hàng của tôi
              </h1>
              <p style={{ fontSize: '0.72rem', color: '#aaa', marginTop: 6, margin: '6px 0 0' }}>
                <i className="fas fa-sync-alt" style={{ marginRight: 5, color: 'var(--brand)' }} />
                Tự động cập nhật mỗi 30 giây
              </p>
            </div>
            <Link to="/shop" style={{
              padding: '11px 24px', background: 'transparent',
              border: '1.5px solid var(--ink)', color: 'var(--ink)',
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
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '11px 18px', border: 'none', cursor: 'pointer',
                fontWeight: activeTab === t.key ? 700 : 400,
                fontSize: '0.82rem', letterSpacing: '0.06em',
                background: 'transparent', whiteSpace: 'nowrap',
                color: activeTab === t.key ? 'var(--ink)' : '#767676',
                borderBottom: activeTab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -1.5, transition: 'all 0.18s',
              }}>
                {t.label}
                {t.key !== 'all' && orders.filter(o => o.status === t.key).length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--brand)' }}>
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
                background: 'var(--ink)', color: 'white',
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

          {/* Danh sách đơn hàng */}
          {!loading && filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(order => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/my-orders/${order.id}`)}
                  style={{
                    background: 'white', padding: '20px 24px', cursor: 'pointer',
                    borderLeft: '3px solid transparent',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderLeftColor = 'var(--brand)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink)' }}>Đơn #{order.id}</span>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: 3 }}>
                        {fmtDate(order.createdAt || order.orderDate)}
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {order.items && (
                      <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                        {order.items.length} tác phẩm
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.95rem' }}>
                        {fmt(order.totalAmount || order.total || 0)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700 }}>
                        Xem chi tiết <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem' }} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default MyOrders;
