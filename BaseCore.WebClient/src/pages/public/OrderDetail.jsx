import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { orderApi } from '../../services/api';
import PublicLayout from '../../components/layout/PublicLayout';
import ArtistLayout from '../../components/layout/ArtistLayout';
import MainLayout from '../../components/layout/MainLayout';
import { toImg } from '../../utils/image';
import { formatVND as fmt } from '../../utils/format';
import { normalizeOrder, getCustomerDisplayName } from '../../utils/orderNormalize';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

import {
  ORDER_STATUS as STATUS_MAP,
  PRODUCT_STATUS as PRODUCT_STATUS_MAP,
  ORDER_STEPS as STEPS,
  ORDER_NEXT as NEXT_STATUS,
} from '../../utils/orderStatus';

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700,
      letterSpacing: '0.06em', background: s.bg, color: s.color, borderRadius: 4,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

const ProductStatusBadge = ({ status }) => {
  const s = PRODUCT_STATUS_MAP[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 9px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const isArtist = role === 'Artist';
  const isAdmin = role === 'Admin';

  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [updating, setUpdating]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]         = useState(null);

  const backPath = isArtist ? '/artist/orders' : '/my-orders';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await orderApi.getById(orderId);
      const normalized = normalizeOrder(res.data);
      if (!normalized?.id) {
        setError('Không tìm thấy đơn hàng.');
        setOrder(null);
        return;
      }
      setOrder(normalized);
      setError(null);
    } catch {
      setOrder(null);
      setError('Không tìm thấy đơn hàng.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  // Lần đầu tải + polling 15s cho cả user lẫn artist
  useEffect(() => {
    fetchOrder();
    const t = setInterval(() => fetchOrder(true), 15000);
    return () => clearInterval(t);
  }, [fetchOrder]);

  // Artist: chuyển trạng thái
  const handleUpdateStatus = async (newStatus) => {
    setUpdating(newStatus);
    try {
      await orderApi.updateStatus(order.id, newStatus);
      await fetchOrder(true);
      showToast(`Đã chuyển sang: ${STATUS_MAP[newStatus]?.label || newStatus}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể cập nhật trạng thái', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // User: hủy đơn
  const handleCancel = async () => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn #${order.id}?`)) return;
    setUpdating('Cancelled');
    try {
      await orderApi.cancel(order.id);
      await fetchOrder(true);
      showToast('Đã hủy đơn hàng thành công');
    } catch {
      showToast('Hủy đơn thất bại!', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const currentStep  = order?.status === 'Cancelled' ? -1 : STEPS.indexOf(order?.status);
  const nextSteps    = isArtist ? (NEXT_STATUS[order?.status] || []) : [];
  const canCancel    = !isArtist && ['Pending', 'Processing'].includes(order?.status);
  const artistCancel = isArtist && ['Pending', 'Processing', 'Shipping'].includes(order?.status);

  const content = (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: 'white', padding: '12px 22px', borderRadius: 10,
          fontWeight: 700, fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate(backPath)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: '#767676', fontSize: '0.82rem', fontWeight: 600,
          marginBottom: 28, padding: 0,
        }}
      >
        <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} />
        {isArtist ? 'Quay lại danh sách đơn hàng' : 'Quay lại đơn hàng của tôi'}
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 12, display: 'block' }} />
          Đang tải...
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
          <p style={{ color: '#aaa' }}>{error}</p>
        </div>
      )}

      {!loading && order && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Chi tiết đơn hàng
              </p>
              <h1 style={{ fontWeight: 300, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--ink)', margin: 0 }}>
                Đơn #{order.id}
              </h1>
              <p style={{ fontSize: '0.78rem', color: '#aaa', margin: '6px 0 0' }}>
                {fmtDate(order.createdAt || order.orderDate)}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <StatusBadge status={order.status} />
              <button
                onClick={async () => { setRefreshing(true); await fetchOrder(true); setRefreshing(false); }}
                disabled={refreshing}
                title="Tải lại"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}
              >
                <i
                  className={`fas fa-sync-alt${refreshing ? ' fa-spin' : ''}`}
                  style={{ color: 'var(--brand)', fontSize: '0.85rem' }}
                />
              </button>
            </div>
          </div>

          {/* Thanh tiến trình */}
          {order.status !== 'Cancelled' && (
            <div style={{ background: 'white', padding: '24px 28px', marginBottom: 16, border: '1px solid #e8e4df', borderRadius: 8 }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 20, margin: '0 0 20px' }}>
                Tiến trình đơn hàng
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 14, left: '12.5%', right: '12.5%', height: 2, background: '#e8e4df', zIndex: 0 }} />
                <div style={{
                  position: 'absolute', top: 14, left: '12.5%',
                  width: `${Math.max(0, currentStep) / (STEPS.length - 1) * 75}%`,
                  height: 2, background: 'var(--brand)', zIndex: 1, transition: 'width 0.5s',
                }} />
                {STEPS.map((s, i) => {
                  const done   = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', marginBottom: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done || active ? 'var(--brand)' : 'white',
                        border: `2px solid ${done || active ? 'var(--brand)' : '#e8e4df'}`,
                        transition: 'all 0.3s',
                      }}>
                        {done
                          ? <i className="fas fa-check" style={{ color: 'white', fontSize: '0.65rem' }} />
                          : <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'white' : '#e8e4df' }} />
                        }
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 400, color: active ? 'var(--ink)' : done ? 'var(--brand)' : '#aaa', textAlign: 'center', lineHeight: 1.3 }}>
                        {STATUS_MAP[s]?.label || s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.status === 'Cancelled' && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '14px 18px', marginBottom: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fas fa-times-circle" style={{ color: '#ef4444', fontSize: '1.1rem' }} />
              <span style={{ fontSize: '0.88rem', color: '#991b1b', fontWeight: 600 }}>Đơn hàng đã bị hủy</span>
            </div>
          )}

          {/* Nút chuyển trạng thái (Artist) */}
          {isArtist && (nextSteps.length > 0 || artistCancel) && (
            <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: 8, padding: '18px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#767676', fontWeight: 600 }}>Chuyển trạng thái:</span>
              {nextSteps.map(ns => (
                <button
                  key={ns}
                  disabled={!!updating}
                  onClick={() => handleUpdateStatus(ns)}
                  style={{
                    padding: '8px 20px', border: 'none', borderRadius: 7,
                    background: 'var(--ink)', color: 'white', cursor: updating ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                    opacity: updating === ns ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {updating === ns && <i className="fas fa-spinner fa-spin" style={{ fontSize: '0.75rem' }} />}
                  {STATUS_MAP[ns]?.label || ns}
                </button>
              ))}
              {artistCancel && (
                <button
                  disabled={!!updating}
                  onClick={() => handleUpdateStatus('Cancelled')}
                  style={{
                    padding: '8px 20px', border: '1.5px solid #ef4444', borderRadius: 7,
                    background: 'white', color: '#ef4444', cursor: updating ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                    opacity: updating === 'Cancelled' ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {updating === 'Cancelled' && <i className="fas fa-spinner fa-spin" style={{ fontSize: '0.75rem' }} />}
                  Hủy đơn
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
            {/* Thông tin đơn */}
            <div style={{ background: 'white', padding: '20px 24px', border: '1px solid #e8e4df', borderRadius: 8 }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px' }}>
                Thông tin đơn hàng
              </p>
              {[
                ['Mã đơn',     `#${order.id}`],
                ['Ngày đặt',   fmtDate(order.createdAt || order.orderDate)],
                ...((isArtist || isAdmin) ? [['Khách hàng', getCustomerDisplayName(order)]] : []),
                ['Thanh toán', order.paymentMethod || '—'],
                ...(order.phone ? [['Điện thoại', order.phone]] : []),
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f3f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#767676' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'right', maxWidth: '55%' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Địa chỉ giao hàng */}
            {order.shippingAddress && (
              <div style={{ background: 'white', padding: '20px 24px', border: '1px solid #e8e4df', borderRadius: 8 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px' }}>
                  Địa chỉ giao hàng
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
                  <i className="fas fa-map-marker-alt" style={{ color: 'var(--brand)', marginRight: 8 }} />
                  {order.shippingAddress}
                </p>
                {order.phone && (
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: '8px 0 0' }}>
                    <i className="fas fa-phone" style={{ color: 'var(--brand)', marginRight: 8 }} />
                    {order.phone}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          {order.note && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 18px', marginBottom: 16, borderRadius: 8, fontSize: '0.85rem', color: '#92400e' }}>
              <i className="fas fa-sticky-note" style={{ marginRight: 8 }} />
              {order.note}
            </div>
          )}

          {/* Danh sách tác phẩm */}
          <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ece6' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand-dark)', textTransform: 'uppercase', margin: 0 }}>
                Tác phẩm đặt mua
              </p>
            </div>

            {order.items?.map((item, idx) => {
              const imgUrl = toImg(item.imageUrl);
              const price = item.unitPrice ?? item.price ?? 0;

              const itemContent = (
                <div style={{
                  display: 'flex', gap: 16, alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: idx < order.items.length - 1 ? '1px solid #f5f3f0' : 'none',
                  cursor: !isArtist ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (!isArtist) e.currentTarget.style.background = '#faf8f5'; }}
                  onMouseLeave={e => { if (!isArtist) e.currentTarget.style.background = 'white'; }}
                >
                  {/* Ảnh */}
                  <div style={{ width: 80, height: 80, flexShrink: 0, background: '#f2ede8', borderRadius: 4, overflow: 'hidden' }}>
                    {imgUrl
                      ? <img src={imgUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-image" style={{ color: '#c8b8a8', fontSize: '1.4rem' }} />
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.productName || item.name}
                      {!isArtist && (
                        <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem', color: 'var(--brand)', marginLeft: 6 }} />
                      )}
                    </div>
                    {item.artistName && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--brand-dark)', marginBottom: 6 }}>
                        <i className="fas fa-palette" style={{ marginRight: 5, fontSize: '0.7rem' }} />
                        {item.artistName}
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', flexShrink: 0 }}>
                    {fmt(price)}
                  </div>
                </div>
              );

              // User: click vào tác phẩm chuyển sang trang chi tiết sản phẩm
              return !isArtist ? (
                <div
                  key={idx}
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  {itemContent}
                </div>
              ) : (
                <div key={idx}>{itemContent}</div>
              );
            })}

            {/* Tổng cộng */}
            <div style={{ padding: '16px 24px', borderTop: '2px solid #e8e4df', background: '#faf8f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink)' }}>Tổng cộng</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>
                {fmt(order.totalAmount || order.total || 0)}
              </span>
            </div>
          </div>

          {/* Nút hủy đơn (User) */}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={!!updating}
              style={{
                width: '100%', padding: '13px 0',
                border: '1.5px solid #991b1b', background: 'transparent',
                color: '#991b1b', fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.6 : 1, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {updating === 'Cancelled' && <i className="fas fa-spinner fa-spin" />}
              {updating === 'Cancelled' ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </button>
          )}
        </>
      )}
    </div>
  );

  if (isArtist)        return <ArtistLayout>{content}</ArtistLayout>;
  if (role === 'Admin') return <MainLayout>{content}</MainLayout>;
  return <PublicLayout>{content}</PublicLayout>;
};

export default OrderDetail;
