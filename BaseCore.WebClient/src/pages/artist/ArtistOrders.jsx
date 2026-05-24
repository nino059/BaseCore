import React, { useState, useEffect } from 'react';
import ArtistLayout from '../../components/ArtistLayout';
import { orderApi } from '../../services/api';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const STATUS_LABEL = {
  Pending:    'Chờ xác nhận',
  Processing: 'Đang xử lý',
  Shipping:   'Đang giao',
  Completed:  'Hoàn thành',
  Cancelled:  'Đã hủy',
};

const STATUS_STYLE = {
  Pending:    { color: '#92400e', background: '#fef3c7' },
  Processing: { color: '#1e40af', background: '#dbeafe' },
  Shipping:   { color: '#7c3aed', background: '#ede9fe' },
  Completed:  { color: '#065f46', background: '#d1fae5' },
  Cancelled:  { color: '#991b1b', background: '#fee2e2' },
};

const NEXT_STATUS = {
  Pending:    ['Processing'],
  Processing: ['Shipping'],
  Shipping:   ['Completed'],
  Completed:  [],
  Cancelled:  [],
};

const CAN_CANCEL = ['Pending', 'Processing', 'Shipping'];

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || { color: '#374151', background: '#f3f4f6' };
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', ...s, padding: '3px 10px', textTransform: 'uppercase' }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
};

const ArtistOrders = () => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast]       = useState(null);

  const loadOrders = () => {
    setLoading(true);
    orderApi.getArtistOrders()
      .then(res => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId + newStatus);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Đã cập nhật trạng thái: ${STATUS_LABEL[newStatus]}`);
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
          color: 'white', padding: '12px 22px',
          fontWeight: 700, fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 4, margin: 0 }}>Họa sĩ</p>
        <h1 style={{ fontWeight: 300, fontSize: '1.6rem', color: '#1a1a1a', margin: 0 }}>Đơn hàng tranh của tôi</h1>
      </div>

      {/* Status guide */}
      <div style={{ background: '#faf8f5', border: '1px solid #e8e4df', padding: '12px 18px', marginBottom: 20, fontSize: '0.8rem', color: '#767676' }}>
        <i className="fas fa-info-circle mr-2" style={{ color: '#c8a97a' }}></i>
        Quy trình: <strong>Chờ xác nhận</strong> → <strong>Đang xử lý</strong> → <strong>Đang giao</strong> → <strong>Hoàn thành</strong>
        &nbsp;·&nbsp; Có thể hủy bất kỳ lúc nào trừ khi đã Hoàn thành.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Đang tải...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
          <p style={{ color: '#aaa', fontWeight: 300 }}>Chưa có đơn hàng nào chứa tranh của bạn</p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e8e4df' }}>
          {orders.map((o, i) => {
            const nextSteps = NEXT_STATUS[o.status] || [];
            const canCancel = CAN_CANCEL.includes(o.status);
            return (
              <div key={o.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                <div
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', marginRight: 12 }}>Đơn #{o.id}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#767676', minWidth: 120 }}>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</div>
                  <div style={{ fontSize: '0.82rem', color: '#8b6c4a', fontWeight: 600, minWidth: 100 }}>
                    {fmt(o.items?.reduce((s, it) => s + it.total, 0) || 0)}
                  </div>
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
                          {['Tác phẩm', 'SL', 'Đơn giá', 'Thành tiền'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase', borderBottom: '1px solid #e8e4df' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {o.items?.map((it, j) => (
                          <tr key={j} style={{ borderBottom: '1px solid #f0ede8' }}>
                            <td style={{ padding: '10px 12px', fontSize: '0.88rem', color: '#1a1a1a', fontWeight: 500 }}>{it.productName}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.88rem', color: '#767676' }}>{it.quantity}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.88rem', color: '#767676' }}>{fmt(it.unitPrice)}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.88rem', color: '#1a1a1a', fontWeight: 600 }}>{fmt(it.total)}</td>
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
                              background: '#1a1a1a', color: 'white',
                              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
                              opacity: updating === o.id + ns ? 0.6 : 1,
                            }}>
                            {updating === o.id + ns
                              ? <><span className="spinner-border spinner-border-sm mr-1"></span>Đang cập nhật...</>
                              : STATUS_LABEL[ns]
                            }
                          </button>
                        ))}
                        {canCancel && (
                          <button
                            disabled={!!updating}
                            onClick={() => handleUpdateStatus(o.id, 'Cancelled')}
                            style={{
                              padding: '7px 18px', border: '1.5px solid #ef4444', cursor: updating ? 'not-allowed' : 'pointer',
                              background: 'white', color: '#ef4444',
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
