import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SIDEBAR_WIDTH   = 240;
const COLLAPSED_WIDTH = 64;

const navItems = [
    { path: '/dashboard',  icon: 'fa-chart-bar',     label: 'Tổng quan' },
    { path: '/products',   icon: 'fa-palette',        label: 'Tác phẩm' },
    { path: '/categories', icon: 'fa-layer-group',    label: 'Thể loại' },
    { path: '/orders',     icon: 'fa-shopping-bag',   label: 'Đơn hàng' },
    { path: '/admin/blog', icon: 'fa-pen-fancy',      label: 'Bài viết' },
    { path: '/users',      icon: 'fa-users',          label: 'Người dùng', adminOnly: true },
];

const MainLayout = ({ children }) => {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    // pinned = luôn mở; hovered = mở tạm khi di chuột vào
    const [pinned,  setPinned]  = useState(false);
    const [hovered, setHovered] = useState(false);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isOpen        = pinned || hovered;
    const sidebarW      = isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH;
    // Chỉ đẩy content sang khi pinned; khi hover thì sidebar overlay lên trên
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
    const isActive     = (path) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Segoe UI', sans-serif" }}>

            <style>{`
                .sidebar-link:hover { background: rgba(200,169,122,0.12) !important; color: #e8d5a8 !important; }
                .sidebar-link:hover i { color: #e8d5a8 !important; }
                .nav-tooltip { position: absolute; left: 72px; background: #1e293b; color: white;
                    padding: 5px 10px; borderRadius: 6px; fontSize: 12px; fontWeight: 600;
                    whiteSpace: nowrap; pointerEvents: none; zIndex: 9999;
                    boxShadow: 0 4px 12px rgba(0,0,0,0.3); }
                .nav-tooltip::before { content:''; position:absolute; left:-5px; top:50%; transform:translateY(-50%);
                    borderRight: 5px solid #1e293b; borderTop: 5px solid transparent; borderBottom: 5px solid transparent; }
            `}</style>

            {/* ===== SIDEBAR ===== */}
            <aside
                onMouseEnter={() => !pinned && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: sidebarW,
                    minHeight: '100vh',
                    background: 'linear-gradient(180deg, #1a1614 0%, #231e1b 60%, #2c2520 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0, left: 0, bottom: 0,
                    zIndex: hovered && !pinned ? 300 : 100,
                    transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
                    boxShadow: isOpen
                        ? '6px 0 32px rgba(0,0,0,0.28)'
                        : '2px 0 12px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                }}>

                {/* Logo + pin button */}
                <div style={{
                    padding: '0 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 64, flexShrink: 0,
                }}>
                    {/* Logo icon (luôn hiển thị) */}
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, #e8d5a8, #c8a97a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-palette" style={{ color: 'white', fontSize: '1rem' }}></i>
                    </div>

                    {/* Tên app — chỉ hiện khi mở */}
                    <div style={{
                        flex: 1, marginLeft: 10, overflow: 'hidden',
                        opacity: isOpen ? 1 : 0,
                        transition: 'opacity 0.15s',
                        whiteSpace: 'nowrap',
                    }}>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>Arthentic</div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }}>Admin Panel</div>
                    </div>

                    {/* Nút ghim — chỉ hiện khi mở */}
                    {isOpen && (
                        <button
                            onClick={() => { setPinned(p => !p); setHovered(false); }}
                            title={pinned ? 'Tự động thu' : 'Ghim sidebar'}
                            style={{
                                background: pinned ? 'rgba(200,169,122,0.25)' : 'rgba(255,255,255,0.08)',
                                border: pinned ? '1px solid rgba(200,169,122,0.4)' : '1px solid transparent',
                                color: pinned ? '#c8a97a' : 'rgba(255,255,255,0.55)',
                                borderRadius: 7, width: 28, height: 28, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all 0.2s', marginLeft: 6,
                            }}>
                            <i className="fas fa-thumbtack" style={{
                                fontSize: '0.72rem',
                                transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)',
                                transition: 'transform 0.2s',
                            }}></i>
                        </button>
                    )}
                </div>

                {/* User info */}
                <div style={{
                    padding: '12px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #e8d5a8, #c8a97a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                            {(user?.username || user?.name || 'A')[0].toUpperCase()}
                        </span>
                    </div>
                    <div style={{
                        overflow: 'hidden', flex: 1,
                        opacity: isOpen ? 1 : 0,
                        transition: 'opacity 0.15s',
                        whiteSpace: 'nowrap',
                    }}>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || user?.username}
                        </div>
                        <div style={{
                            display: 'inline-block', marginTop: 2,
                            background: 'rgba(200,169,122,0.25)', color: '#c8a97a',
                            borderRadius: 20, padding: '1px 8px', fontSize: '0.66rem', fontWeight: 700,
                        }}>
                            {isAdmin ? 'Admin' : 'Staff'}
                        </div>
                    </div>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {navItems
                        .filter(item => !item.adminOnly || isAdmin)
                        .map(item => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="sidebar-link"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 10px',
                                        borderRadius: 10,
                                        marginBottom: 2,
                                        textDecoration: 'none',
                                        background: active
                                            ? 'linear-gradient(135deg, rgba(200,169,122,0.28), rgba(139,108,74,0.22))'
                                            : 'transparent',
                                        border: active ? '1px solid rgba(200,169,122,0.35)' : '1px solid transparent',
                                        transition: 'all 0.18s',
                                        color: active ? '#e8d5a8' : 'rgba(255,255,255,0.6)',
                                        position: 'relative',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <i className={`fas ${item.icon}`} style={{
                                        fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0,
                                        color: active ? '#e8d5a8' : 'rgba(255,255,255,0.5)',
                                    }}></i>
                                    <span style={{
                                        fontWeight: active ? 700 : 500, fontSize: '0.88rem',
                                        opacity: isOpen ? 1 : 0,
                                        transition: 'opacity 0.15s',
                                        overflow: 'hidden',
                                    }}>
                                        {item.label}
                                    </span>
                                    {isOpen && active && (
                                        <span style={{
                                            marginLeft: 'auto', width: 6, height: 6,
                                            borderRadius: '50%', background: '#c8a97a', flexShrink: 0,
                                        }}></span>
                                    )}
                                </Link>
                            );
                        })
                    }
                </nav>

                {/* Đăng xuất */}
                <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: 'rgba(255,255,255,0.45)',
                        width: '100%', fontSize: '0.85rem', transition: 'color 0.2s',
                        whiteSpace: 'nowrap',
                    }}>
                        <i className="fas fa-sign-out-alt" style={{ width: 20, textAlign: 'center', flexShrink: 0 }}></i>
                        <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s' }}>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <div style={{
                marginLeft: contentMargin,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)',
                minWidth: 0,
            }}>

                {/* Top bar */}
                <header style={{
                    height: 64,
                    background: 'white',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 28px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Admin</span>
                        <i className="fas fa-chevron-right" style={{ color: '#d1d5db', fontSize: '0.65rem' }}></i>
                        <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.88rem' }}>
                            {navItems.find(n => n.path === location.pathname)?.label || 'Trang quản trị'}
                        </span>
                    </div>

                    {/* Avatar + dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <div
                            onClick={() => setDropdownOpen(o => !o)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, userSelect: 'none' }}
                        >
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5a8, #c8a97a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {(user?.username || user?.fullName || 'A')[0].toUpperCase()}
                                </span>
                            </div>
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1f2937' }}>{user?.fullName || user?.username}</div>
                                <div style={{ fontSize: '0.73rem', color: '#9ca3af' }}>{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</div>
                            </div>
                            <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ color: '#9ca3af', fontSize: '0.65rem' }}></i>
                        </div>

                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute', right: 0, top: '110%',
                                background: 'white', borderRadius: 12,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                minWidth: 180, zIndex: 200, overflow: 'hidden',
                                border: '1px solid #f3f4f6',
                            }}>
                                <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #f3f4f6' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user?.fullName || user?.username}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{user?.email}</div>
                                </div>
                                <button onClick={handleLogout} style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '10px 16px', fontSize: '0.88rem',
                                    color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer',
                                }}>
                                    <i className="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: '28px', minWidth: 0 }}>
                    {children}
                </main>

                {/* Footer */}
                <footer style={{
                    padding: '14px 28px',
                    borderTop: '1px solid #f0f0f0',
                    background: 'white',
                    fontSize: '0.8rem',
                    color: '#9ca3af',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <span>© 2026 <strong style={{ color: '#c8a97a' }}>Arthentic</strong>. All rights reserved.</span>
                    <span>Version 1.0.0</span>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;
