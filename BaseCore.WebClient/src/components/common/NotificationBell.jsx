import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi } from '../../services/api';
import NavActionIcon, { BellGlyph } from './NavActionIcon';

const TYPE_META = {
  order:   { icon: 'fa-shopping-bag', color: '#3b82f6' },
  product: { icon: 'fa-palette',      color: 'var(--brand)' },
  blog:    { icon: 'fa-pen-fancy',    color: '#8b5cf6' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Vừa xong';
  if (diff < 3600)  return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  return Math.floor(diff / 86400) + ' ngày trước';
}

function navPath(type, roleName, refId) {
  if (type === 'order') {
    if (refId) {
      if (roleName === 'Artist') return `/artist/orders/${refId}`;
      if (roleName === 'Admin')  return `/orders`;
      return `/my-orders/${refId}`;
    }
    return roleName === 'Admin' ? '/orders' : roleName === 'Artist' ? '/artist/orders' : '/my-orders';
  }
  if (type === 'product') return roleName === 'Admin' ? '/products' : '/artist/products';
  if (type === 'blog')    return roleName === 'Admin' ? '/admin/blog' : '/artist/blog';
  return '/';
}

const NotificationBell = ({ theme = 'dark' }) => {
  const { user } = useAuth();
  const roleName = user?.role === 'Admin' ? 'Admin'
                 : user?.role === 'Artist' ? 'Artist'
                 : 'User';

  const [open, setOpen]       = useState(false);
  const [unread, setUnread]   = useState(0);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef  = useRef(null);
  const navigate = useNavigate();

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnread(res.data?.count ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, [fetchCount]);

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await notificationApi.getAll();
        setItems(res.data || []);
      } catch {}
      setLoading(false);
    }
  };

  const handleClick = async (item) => {
    if (!item.isRead) {
      try { await notificationApi.markRead(item.id); } catch {}
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    navigate(navPath(item.type, roleName, item.refId));
  };

  const handleMarkAll = async () => {
    try { await notificationApi.markAllRead(); } catch {}
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const hasUnread = items.some(n => !n.isRead);

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <NavActionIcon
        theme={theme}
        count={unread}
        title="Thông báo"
        onClick={handleOpen}
        showAlertRing
      >
        <BellGlyph active={unread > 0} />
      </NavActionIcon>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 340, background: 'white', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
          border: '1px solid #f1f5f9', zIndex: 9999,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px', borderBottom: '1px solid #f1f5f9',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>
              Thông báo
              {unread > 0 && (
                <span style={{ color: 'var(--brand-dark)', fontSize: '0.8rem', marginLeft: 6 }}>
                  ({unread} mới)
                </span>
              )}
            </span>
            {hasUnread && (
              <button onClick={handleMarkAll} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700, padding: 0,
              }}>
                Đọc tất cả
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                <span style={{ display: 'inline-flex', marginBottom: 10, opacity: 0.45 }}>
                  <BellGlyph size={28} color="#94a3b8" />
                </span>
                <div style={{ fontSize: '0.85rem' }}>Chưa có thông báo nào</div>
              </div>
            ) : (
              items.map(item => {
                const meta = TYPE_META[item.type] || { icon: 'fa-info-circle', color: '#64748b' };
                return (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: item.isRead ? 'white' : '#fef9f0',
                      borderBottom: '1px solid #f8fafc',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = item.isRead ? 'white' : '#fef9f0'; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: meta.color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={'fas ' + meta.icon} style={{ color: meta.color, fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: item.isRead ? 500 : 700,
                        fontSize: '0.83rem', color: 'var(--ink)',
                        marginBottom: 3, lineHeight: 1.4,
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '0.78rem', color: '#767676', lineHeight: 1.45,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 4 }}>
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                    {!item.isRead && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--brand)', flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{
            padding: '10px 16px', borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
