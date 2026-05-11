import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { useCart } from './Cart';

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
      display: 'inline-block', padding: '3px 12px', borderRadius: 999,
      fontSize: '0.78rem', fontWeight: 700, background: s.bg, color: s.color,
    }}>
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
  const { count } = useCart();

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Đơn hàng của tôi</h1>
        <Link to="/shop" style={{
          padding: '8px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600,
          background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: 'white', textDecoration: 'none',
        }}>
          Tiếp tục mua sắm
        </Link>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setSelected(null); }} style={{
            padding: '7px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
            background: activeTab === t.key ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : '#f3f4f6',
            color: activeTab === t.key ? 'white' : '#6b7280',
          }}>
            {t.label}
            {t.key !== 'all' && (
              <span style={{ marginLeft: 6, opacity: 0.8 }}>
                ({orders.filter(o => o.status === t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 88, borderRadius: 16, background: '#f3f4f6' }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📦</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Bạn chưa có đơn hàng nào
          </p>
          <Link to="/shop" style={{
            display: 'inline-block', marginTop: 12, padding: '10px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
            color: 'white', textDecoration: 'none', fontWeight: 700,
          }}>
            Mua sắm ngay
          </Link>
        </div>
      )}

      {/* Tab empty */}
      {!loading && orders.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
          <p>Không có đơn hàng nào ở trạng thái này.</p>
        </div>
      )}

      {/* List + Detail */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.1fr' : '1fr', gap: 16 }}>

          {/* Danh sách */}
          <div>
            {filtered.map(order => (
              <div key={order.id}
                onClick={() => setSelected(selected?.id === order.id ? null : order)}
                style={{
                  background: 'white', borderRadius: 16, padding: '16px 20px', marginBottom: 12, cursor: 'pointer',
                  boxShadow: selected?.id === order.id
                    ? '0 0 0 2px #a78bfa, 0 4px 24px rgba(167,139,250,0.15)'
                    : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Đơn #{order.id}</span>
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 2 }}>
                      {fmtDate(order.createdAt || order.orderDate)}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {order.items && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{order.items.length} sản phẩm</span>
                  )}
                  <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: '1rem' }}>
                    {fmt(order.totalAmount || order.total || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chi tiết */}
          {selected && (
            <div style={{
              background: 'white', borderRadius: 20, padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: 'fit-content',
              position: 'sticky', top: 80,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Chi tiết đơn #{selected.id}</h3>
                <button onClick={() => setSelected(null)} style={{
                  background: '#f3f4f6', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', color: '#6b7280',
                }}>✕</button>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Trạng thái</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Ngày đặt</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {fmtDate(selected.createdAt || selected.orderDate)}
                  </span>
                </div>
              </div>

              {selected.shippingAddress && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>ĐỊA CHỈ GIAO HÀNG</div>
                  <div style={{ fontSize: '0.9rem', color: '#374151' }}>{selected.shippingAddress}</div>
                </div>
              )}

              {selected.note && (
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.87rem', color: '#92400e' }}>
                  📝 {selected.note}
                </div>
              )}

              {selected.items && selected.items.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 10, fontWeight: 600 }}>SẢN PHẨM</div>
                  {selected.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: '1px solid #f3f4f6',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.productName || item.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>x{item.quantity || item.qty}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#7c3aed' }}>
                        {fmt(item.price * (item.quantity || item.qty))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #f3f4f6', paddingTop: 14, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Tổng cộng</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#7c3aed' }}>
                  {fmt(selected.totalAmount || selected.total || 0)}
                </span>
              </div>

              {selected.status === 'Pending' && (
                <button onClick={() => handleCancel(selected)} disabled={cancellingId === selected.id} style={{
                  width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                  background: cancellingId === selected.id ? '#f3f4f6' : '#fee2e2',
                  color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  {cancellingId === selected.id ? 'Đang hủy...' : '🗑 Hủy đơn hàng'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;