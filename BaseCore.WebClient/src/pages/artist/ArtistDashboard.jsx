import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArtistLayout from '../../components/ArtistLayout';
import { productApi, blogApi, orderApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const StatCard = ({ icon, label, value, color = '#1a1a1a', bg = '#f7f5f2' }) => (
  <div style={{ background: 'white', border: '1px solid #e8e4df', padding: '24px 28px', flex: 1, minWidth: 160 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={icon} style={{ color, fontSize: '1rem' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: '#aaa', textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 300, color: '#1a1a1a' }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = { Pending: ['#92400e', '#fef3c7'], Available: ['#065f46', '#d1fae5'], Rejected: ['#991b1b', '#fee2e2'], Published: ['#065f46', '#d1fae5'] };
  const [color, bg] = map[status] || ['#374151', '#f3f4f6'];
  const label = { Pending: 'Chờ duyệt', Available: 'Đang bán', Rejected: 'Từ chối', Published: 'Đã đăng' }[status] || status;
  return <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color, background: bg, padding: '3px 10px', textTransform: 'uppercase' }}>{label}</span>;
};

const ArtistDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ selling: 0, pending: 0, blogs: 0, orders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId && !user?.id) { setLoading(false); return; }
    const sellerId = user.userId || user.id;

    Promise.allSettled([
      productApi.getAll({ sellerId, pageSize: 999 }),
      blogApi.getAll({ mine: true, pageSize: 999 }),
      orderApi.getArtistOrders(),
    ]).then(([pResult, bResult, oResult]) => {
      const products = pResult.status === 'fulfilled' ? (pResult.value.data?.items || []) : [];
      const blogsRaw = bResult.status === 'fulfilled' ? (bResult.value.data?.items ?? bResult.value.data ?? []) : [];
      const blogs    = Array.isArray(blogsRaw) ? blogsRaw : [];
      const ordersRaw = oResult.status === 'fulfilled' ? (oResult.value.data ?? []) : [];
      const orders   = Array.isArray(ordersRaw) ? ordersRaw : [];

      setStats({
        selling: products.filter(p => p.status === 'Available').length,
        pending: products.filter(p => p.status === 'Pending').length,
        blogs:   blogs.length,
        orders:  orders.length,
      });
      setPendingProducts(products.filter(p => p.status === 'Pending').slice(0, 3));
      setRecentOrders(orders.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <ArtistLayout><div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Đang tải...</div></ArtistLayout>;

  return (
    <ArtistLayout>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 4 }}>Bảng điều khiển</p>
        <h1 style={{ fontWeight: 300, fontSize: '1.8rem', color: '#1a1a1a', margin: 0 }}>Xin chào, {user?.name || 'Họa sĩ'}</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
        <StatCard icon="fas fa-store" label="Đang bán"    value={stats.selling} color="#065f46" bg="#d1fae5" />
        <StatCard icon="fas fa-clock" label="Chờ duyệt"   value={stats.pending} color="#92400e" bg="#fef3c7" />
        <StatCard icon="fas fa-pen"   label="Bài viết"    value={stats.blogs}   color="#1e40af" bg="#dbeafe" />
        <StatCard icon="fas fa-bag-shopping" label="Đơn hàng" value={stats.orders} color="#6b21a8" bg="#f3e8ff" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flexWrap: 'wrap' }}>
        {/* Pending products */}
        <div style={{ background: 'white', border: '1px solid #e8e4df', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a', margin: 0 }}>Tranh chờ duyệt</h2>
            <Link to="/artist/products" style={{ fontSize: '0.78rem', color: '#8b6c4a', textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>
          {pendingProducts.length === 0
            ? <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Không có tranh nào chờ duyệt</p>
            : pendingProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f0ede8' }}>
                  <div style={{ width: 44, height: 44, background: '#f0ede8', overflow: 'hidden', flexShrink: 0 }}>
                    {p.imageUrl && <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `http://localhost:5000${p.imageUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#8b6c4a' }}>{fmt(p.price)}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))
          }
        </div>

        {/* Recent orders */}
        <div style={{ background: 'white', border: '1px solid #e8e4df', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a', margin: 0 }}>Đơn hàng gần đây</h2>
            <Link to="/artist/orders" style={{ fontSize: '0.78rem', color: '#8b6c4a', textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>
          {recentOrders.length === 0
            ? <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Chưa có đơn hàng nào</p>
            : recentOrders.map(o => (
                <div key={o.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f0ede8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>#{o.id}</span>
                    <span style={{ fontSize: '0.75rem', color: '#767676' }}>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#767676' }}>{o.items?.length} sản phẩm · <StatusBadge status={o.status} /></div>
                </div>
              ))
          }
        </div>
      </div>
    </ArtistLayout>
  );
};

export default ArtistDashboard;
