import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../common/NotificationBell';

const SIDEBAR_WIDTH   = 240;
const COLLAPSED_WIDTH = 64;

/**
 * Layout chung cho khu vực quản trị (Admin) và họa sĩ (Artist).
 * Gộp từ MainLayout + ArtistLayout (trước đây trùng ~90%).
 *
 * Props:
 *  - navItems: [{ path, icon, label }]
 *  - panelLabel:  phụ đề dưới logo (vd "Admin Panel")
 *  - roleBadge:   nhãn vai trò ở khối user sidebar (vd "Admin"/"Họa sĩ")
 *  - breadcrumbRoot: chữ đầu breadcrumb topbar (vd "Admin"/"Họa sĩ")
 *  - defaultTitle:   tiêu đề khi không khớp route nào
 *  - topbarRole:     chữ phụ dưới tên ở topbar (vd "Quản trị viên")
 *  - footerNote:     ghi chú footer phải
 *  - activeMatch:    'exact' | 'prefix' — cách xác định mục đang chọn
 *  - profileLink:    { to, label } — mục "chỉnh sửa hồ sơ" trong dropdown (tùy chọn)
 */
const DashboardLayout = ({
  children,
  navItems = [],
  panelLabel = 'Bảng điều khiển',
  roleBadge = '',
  breadcrumbRoot = '',
  defaultTitle = 'Trang quản trị',
  topbarRole = '',
  footerNote = 'All rights reserved.',
  activeMatch = 'exact',
  profileLink = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [pinned, setPinned]   = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isOpen        = pinned || hovered;
  const sidebarW      = isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH;
  const contentMargin = pinned ? SIDEBAR_WIDTH : COLLAPSED_WIDTH;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) =>
    activeMatch === 'prefix' ? location.pathname.startsWith(path) : location.pathname === path;
  const currentTitle =
    navItems.find(n => isActive(n.path))?.label || defaultTitle;

  const avatarUrl = user?.avatarUrl || '';
  const initial = (user?.username || user?.name || 'A')[0].toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        .sidebar-link:hover { background: rgba(200,169,122,0.12) !important; color: var(--brand-light) !important; }
        .sidebar-link:hover i { color: var(--brand-light) !important; }
      `}</style>

      {/* ===== SIDEBAR ===== */}
      <aside
        onMouseEnter={() => !pinned && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: sidebarW, minHeight: '100vh',
          background: 'linear-gradient(180deg, #1a1614 0%, #231e1b 60%, #2c2520 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: hovered && !pinned ? 300 : 100,
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          boxShadow: isOpen ? '6px 0 32px rgba(0,0,0,0.28)' : '2px 0 12px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}>

        {/* Logo + pin */}
        <div style={{ padding: '0 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-light), var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-palette" style={{ color: 'white', fontSize: '1rem' }}></i>
          </div>
          <div style={{ flex: 1, marginLeft: 10, overflow: 'hidden', opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>Arthentic</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }}>{panelLabel}</div>
          </div>
          {isOpen && (
            <button
              onClick={() => { setPinned(p => !p); setHovered(false); }}
              title={pinned ? 'Tự động thu' : 'Ghim sidebar'}
              style={{
                background: pinned ? 'rgba(200,169,122,0.25)' : 'rgba(255,255,255,0.08)',
                border: pinned ? '1px solid rgba(200,169,122,0.4)' : '1px solid transparent',
                color: pinned ? 'var(--brand)' : 'rgba(255,255,255,0.55)',
                borderRadius: 7, width: 28, height: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s', marginLeft: 6,
              }}>
              <i className="fas fa-thumbtack" style={{ fontSize: '0.72rem', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 0.2s' }}></i>
            </button>
          )}
        </div>

        {/* User info */}
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: avatarUrl ? '#f0ece8' : 'linear-gradient(135deg, var(--brand-light), var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: avatarUrl ? '2px solid rgba(200,169,122,0.5)' : 'none' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{initial}</span>}
          </div>
          <div style={{ overflow: 'hidden', flex: 1, opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.username}
            </div>
            <div style={{ display: 'inline-block', marginTop: 2, background: 'rgba(200,169,122,0.25)', color: 'var(--brand)', borderRadius: 20, padding: '1px 8px', fontSize: '0.66rem', fontWeight: 700 }}>
              {roleBadge}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="sidebar-link" title={!isOpen ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px',
                  borderRadius: 10, marginBottom: 2, textDecoration: 'none',
                  background: active ? 'linear-gradient(135deg, rgba(200,169,122,0.28), rgba(139,108,74,0.22))' : 'transparent',
                  border: active ? '1px solid rgba(200,169,122,0.35)' : '1px solid transparent',
                  transition: 'all 0.18s', color: active ? 'var(--brand-light)' : 'rgba(255,255,255,0.6)',
                  position: 'relative', whiteSpace: 'nowrap',
                }}>
                <i className={`fas ${item.icon}`} style={{ fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0, color: active ? 'var(--brand-light)' : 'rgba(255,255,255,0.5)' }}></i>
                <span style={{ fontWeight: active ? 700 : 500, fontSize: '0.88rem', opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s', overflow: 'hidden' }}>
                  {item.label}
                </span>
                {isOpen && active && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }}></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Đăng xuất */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <button onClick={handleLogout} title={!isOpen ? 'Đăng xuất' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.45)', width: '100%', fontSize: '0.85rem', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            <i className="fas fa-sign-out-alt" style={{ width: 20, textAlign: 'center', flexShrink: 0 }}></i>
            <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s' }}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div style={{ marginLeft: contentMargin, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ height: 64, background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: '0.88rem' }}>{breadcrumbRoot}</span>
            <i className="fas fa-chevron-right" style={{ color: '#d1d5db', fontSize: '0.65rem' }}></i>
            <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.88rem' }}>{currentTitle}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NotificationBell theme="light" />
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div onClick={() => setDropdownOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, userSelect: 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarUrl ? '#f0ece8' : 'linear-gradient(135deg, var(--brand-light), var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: avatarUrl ? '2px solid rgba(200,169,122,0.5)' : 'none' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{initial}</span>}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1f2937' }}>{user?.name || user?.username}</div>
                  <div style={{ fontSize: '0.73rem', color: '#9ca3af' }}>{topbarRole}</div>
                </div>
                <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ color: '#9ca3af', fontSize: '0.65rem' }}></i>
              </div>

              {dropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 180, zIndex: 200, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                  <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user?.name || user?.username}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{user?.email}</div>
                  </div>
                  {profileLink && (
                    <Link to={profileLink.to} onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.88rem', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
                      <i className="fas fa-user-edit mr-2" style={{ color: 'var(--brand)' }}></i>{profileLink.label}
                    </Link>
                  )}
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.88rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <i className="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px', minWidth: 0 }}>{children}</main>

        {/* Footer */}
        <footer style={{ padding: '14px 28px', borderTop: '1px solid #f0f0f0', background: 'white', fontSize: '0.8rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 <strong style={{ color: 'var(--brand)' }}>Arthentic</strong>. {footerNote}</span>
          <span>Version 1.0.0</span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
