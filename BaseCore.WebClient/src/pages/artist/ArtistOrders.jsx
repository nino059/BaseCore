import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistLayout from '../../components/layout/ArtistLayout';
import { orderApi } from '../../services/api';
import { formatVND as fmt } from '../../utils/format';

import { getOrderStatus, getProductStatus, ORDER_NEXT, ORDER_CAN_CANCEL } from '../../utils/orderStatus';

const OrderStatusBadge = ({ status }) => {
  const s = getOrderStatus(status);
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: s.color, background: s.bg, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

const ProductStatusBadge = ({ status }) => {
  const s = getProductStatus(status);
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

const STATUS_FILTERS = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'Pending',    label: 'Chờ xác nhận' },
  { key: 'Processing', label: 'Đang xử lý' },
  { key: 'Shipping',   label: 'Đang giao' },
  { key: 'Completed',  label: 'Đã giao' },
  { key: 'Cancelled',  label: 'Đã hủy' },
];

const ArtistOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [updating, setUpdating] = useState(null);
  const [toast, setToast]       = useState(null);

  const loadOrders = (silent = false) => {
    if (!silent) setLoading(true);
    orderApi.getArtistOrders()
      .then(res => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const countByStatus = STATUS_FILTERS.slice(1).reduce((acc, f) => {
    acc[f.key] = orders.filter(o => o.status === f.key).length;
    return acc;
  }, {});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId + newStatus);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Đã cập nhật trạng thái: ${getOrderStatus(newStatus).label}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể cập nhật trạng thái', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <ArtistLayout>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: 'white', padding: '12px 22px', borderRadius: 10,
          fontWeight: 700, fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* ── KPI Boxes giống Admin ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Tổng đơn',     value: orders.length,                 icon: 'fa-list',         color: 'var(--brand)', bg: '#f5edd6', key: 'all'       },
          { label: 'Chờ xác nhận', value: countByStatus['Pending'] || 0, icon: 'fa-clock',        color: '#f59e0b', bg: '#fef3c7', key: 'Pending'   },
          { label: 'Đang xử lý',   value: countByStatus['Processing'] || 0, icon: 'fa-cog',       color: '#3b82f6', bg: '#dbeafe', key: 'Processing'},
          { label: 'Đang giao',    value: countByStatus['Shipping'] || 0, icon: 'fa-truck',       color: 'var(--brand-dark)', bg: '#f5edd6', key: 'Shipping'  },
          { label: 'Đã giao',      value: countByStatus['Completed'] || 0, icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5', key: 'Completed' },
          { label: 'Đã hủy',       value: countByStatus['Cancelled'] || 0, icon: 'fa-times-circle', color: '#ef4444', bg: '#fee2e2', key: 'Cancelled' },
        ].map((s, i) => {
          const active = filter === s.key;
          return (
            <div
              key={i}
              onClick={() => setFilter(s.key)}
              style={{
                background: active ? s.bg + '55' : 'white',
                border: '1px solid #e8e4df',
                borderTop: `3px solid ${active ? s.color : '#e8e4df'}`,
                borderRadius: 12,
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginTop: 5 }}>
                    {s.label}
                  </div>
                </div>
                <div style={{ 
                  width: 34, height: 34, borderRadius: 10, 
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '0.95rem' }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status guide */}
      <div style={{ background: '#faf8f5', border: '1px solid #e8e4df', padding: '12px 18px', marginBottom: 20, fontSize: '0.8rem', color: '#767676', borderRadius: 8 }}>
        <i className="fas fa-info-circle mr-2" style={{ color: 'var(--brand)' }}></i>
        Quy trình: <strong>Chờ xác nhận</strong> → <strong>Đang xử lý</strong> → <strong>Đang giao</strong> → <strong>Đã giao</strong>
        &nbsp;·&nbsp; Khi đã giao, tranh sẽ chuyển sang trạng thái <strong>Đã bán</strong>.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Đang tải...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
          <p style={{ color: '#aaa', fontWeight: 300 }}>
            {filter === 'all' ? 'Chưa có đơn hàng nào chứa tranh của bạn' : `Không có đơn hàng nào ở trạng thái "${STATUS_FILTERS.find(f => f.key === filter)?.label}"`}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          {filteredOrders.map((o, i) => {
            const nextSteps   = ORDER_NEXT[o.status] || [];
            const canCancel   = ORDER_CAN_CANCEL.includes(o.status);
            const totalAmount = o.items?.reduce((s, it) => s + (it.unitPrice || 0), 0) || 0;
            return (
              <div
                key={o.id}
                style={{ borderBottom: i < filteredOrders.length - 1 ? '1px solid #f0ede8' : 'none' }}
              >
                <div
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>Đơn #{o.id}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    {o.customerName && (
                      <div style={{ fontSize: '0.78rem', color: '#555', marginTop: 3 }}>
                        <i className="fas fa-user" style={{ color: 'var(--brand)', marginRight: 5, fontSize: '0.7rem' }} />
                        {o.customerName}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#767676', minWidth: 120 }}>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--brand-dark)', fontWeight: 600, minWidth: 100 }}>
                    {fmt(totalAmount)}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/artist/orders/${o.id}`); }}
                    style={{
                      background: 'none', border: '1px solid var(--brand)', color: 'var(--brand)',
                      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                    }}
                  >
                    Chi tiết
                  </button>
                  <i className={`fas fa-chevron-${expanded === o.id ? 'up' : 'down'}`} style={{ color: '#aaa', fontSize: '0.8rem' }} />
                </div>

                {expanded === o.id && (
                  <div style={{ padding: '0 20px 20px', background: '#faf8f5' }}>
                    {o.shippingAddress && (
                      <p style={{ fontSize: '0.82rem', color: '#767676', marginBottom: 12 }}>
                        <i className="fas fa-map-marker-alt mr-2" style={{ color: '#aaa' }} />
                        {o.shippingAddress} {o.phone && `· ${o.phone}`}
                      </p>
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                      <thead>
                        <tr>
                          {['Tác phẩm', 'Đơn giá', 'T.thái tranh'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase', borderBottom: '1px solid #e8e4df' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {o.items?.map((it, j) => (
                          <tr key={j} style={{ borderBottom: '1px solid #f0ede8' }}>
                            <td style={{ padding: '10px 12px', fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 500 }}>{it.productName}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.88rem', color: '#767676' }}>{fmt(it.unitPrice)}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <ProductStatusBadge status={it.productStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Status action buttons */}
                    {(nextSteps.length > 0 || canCancel) && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #e8e4df' }}>
                        <span style={{ fontSize: '0.75rem', color: '#aaa', alignSelf: 'center', marginRight: 4 }}>Chuyển sang:</span>
                        {nextSteps.map(ns => (
                          <button key={ns}
                            disabled={!!updating}
                            onClick={() => handleUpdateStatus(o.id, ns)}
                            style={{
                              padding: '7px 18px', border: 'none', cursor: updating ? 'not-allowed' : 'pointer',
                              background: 'var(--ink)', color: 'white', borderRadius: 7,
                              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
                              opacity: updating === o.id + ns ? 0.6 : 1,
                            }}>
                            {updating === o.id + ns
                              ? <><span className="spinner-border spinner-border-sm mr-1"></span>Đang cập nhật...</>
                              : getOrderStatus(ns).label
                            }
                          </button>
                        ))}
                        {canCancel && (
                          <button
                            disabled={!!updating}
                            onClick={() => handleUpdateStatus(o.id, 'Cancelled')}
                            style={{
                              padding: '7px 18px', border: '1.5px solid #ef4444', cursor: updating ? 'not-allowed' : 'pointer',
                              background: 'white', color: '#ef4444', borderRadius: 7,
                              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
                              opacity: updating === o.id + 'Cancelled' ? 0.6 : 1,
                            }}>
                            {updating === o.id + 'Cancelled'
                              ? <><span className="spinner-border spinner-border-sm mr-1"></span>Đang hủy...</>
                              : 'Hủy đơn'
                            }
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ArtistLayout>
  );
};

export default ArtistOrders;
