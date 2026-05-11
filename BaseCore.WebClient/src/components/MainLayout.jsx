//import React, { useState } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SIDEBAR_WIDTH = 240;

const navItems = [
    { path: '/dashboard',  icon: 'fa-chart-bar',      label: 'Tổng quan' },
    { path: '/products',   icon: 'fa-palette',         label: 'Tác phẩm' },
    { path: '/categories', icon: 'fa-layer-group',     label: 'Thể loại' },
    { path: '/orders',     icon: 'fa-shopping-bag',    label: 'Đơn hàng' },
    { path: '/users',      icon: 'fa-users',           label: 'Người dùng', adminOnly: true },
];

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const sidebarW = collapsed ? 64 : SIDEBAR_WIDTH;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* ===== SIDEBAR ===== */}
            <aside style={{
                width: sidebarW,
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0, left: 0, bottom: 0,
                zIndex: 100,
                transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
                overflow: 'hidden',
            }}>

                {/* Logo */}
                <div style={{
                    padding: collapsed ? '20px 0' : '24px 20px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    minHeight: 68,
                }}>
                    {!collapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i className="fas fa-palette" style={{ color: 'white', fontSize: '1rem' }}></i>
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>Arthentic</div>
                                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>Admin Panel</div>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setCollapsed(c => !c)} style={{
                        background: 'rgba(255,255,255,0.08)', border: 'none',
                        color: 'rgba(255,255,255,0.7)', borderRadius: 8,
                        width: 32, height: 32, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.2s',
                    }}>
                        <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'}`} style={{ fontSize: '0.8rem' }}></i>
                    </button>
                </div>

                {/* User info */}
                {!collapsed && (
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                                {(user?.username || user?.name || 'A')[0].toUpperCase()}
                            </span>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name || user?.username}
                            </div>
                            <div style={{
                                display: 'inline-block', marginTop: 2,
                                background: 'rgba(167,139,250,0.25)', color: '#a78bfa',
                                borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600
                            }}>
                                {isAdmin ? 'Admin' : 'Staff'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Nav items */}
                <nav style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 12px', overflowY: 'auto' }}>
                    {navItems
                        .filter(item => !item.adminOnly || isAdmin)
                        .map(item => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={collapsed ? item.label : ''}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: collapsed ? '12px 0' : '11px 14px',
                                        borderRadius: 10,
                                        marginBottom: 4,
                                        textDecoration: 'none',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        background: active
                                            ? 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(124,58,237,0.2))'
                                            : 'transparent',
                                        border: active ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                                    }}
                                >
                                    <i className={`fas ${item.icon}`} style={{
                                        fontSize: '1rem', width: 20, textAlign: 'center',
                                        color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                                        flexShrink: 0,
                                    }}></i>
                                    {!collapsed && (
                                        <span style={{ fontWeight: active ? 700 : 500, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            {item.label}
                                        </span>
                                    )}
                                    {!collapsed && active && (
                                        <span style={{
                                            marginLeft: 'auto', width: 6, height: 6,
                                            borderRadius: '50%', background: '#a78bfa',
                                        }}></span>
                                    )}
                                </Link>
                            );
                        })
                    }
                </nav>

                {/* Divider + link về shop */}
                <div style={{ padding: collapsed ? '8px' : '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Link to="/" style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: collapsed ? '10px 0' : '10px 14px',
                        borderRadius: 10, textDecoration: 'none',
                        color: 'rgba(255,255,255,0.45)',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        fontSize: '0.85rem',
                    }}>
                        <i className="fas fa-store" style={{ width: 20, textAlign: 'center', flexShrink: 0 }}></i>
                        {!collapsed && <span>Xem cửa hàng</span>}
                    </Link>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: collapsed ? '10px 0' : '10px 14px',
                        borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: 'rgba(255,255,255,0.45)',
                        width: '100%',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        fontSize: '0.85rem',
                        transition: 'color 0.2s',
                    }}>
                        <i className="fas fa-sign-out-alt" style={{ width: 20, textAlign: 'center', flexShrink: 0 }}></i>
                        {!collapsed && <span>Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <div style={{
                marginLeft: sidebarW,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
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
                    {/* Breadcrumb / Page title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Admin</span>
                        <i className="fas fa-chevron-right" style={{ color: '#d1d5db', fontSize: '0.7rem' }}></i>
                        <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>
                            {navItems.find(n => n.path === location.pathname)?.label || 'Trang quản trị'}
                        </span>
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Nút về shop */}
                        <Link to="/shop" style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8,
                            background: '#f5f3ff', color: '#7c3aed',
                            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                        }}>
                            <i className="fas fa-store"></i>
                            <span>Cửa hàng</span>
                        </Link>

                        {/* Avatar + dropdown */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <div
                                onClick={() => setDropdownOpen(o => !o)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, userSelect: 'none' }}
                            >
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                        {(user?.username || user?.fullName || 'A')[0].toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1f2937' }}>{user?.fullName || user?.username}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</div>
                                </div>
                                <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ color: '#9ca3af', fontSize: '0.7rem' }}></i>
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
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: '28px', minWidth: 0 }}>
                    {children}
                </main>

                {/* Footer */}
                <footer style={{
                    padding: '16px 28px',
                    borderTop: '1px solid #f0f0f0',
                    background: 'white',
                    fontSize: '0.82rem',
                    color: '#9ca3af',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <span>© 2026 <strong style={{ color: '#7c3aed' }}>Arthentic</strong>. All rights reserved.</span>
                    <span>Version 1.0.0</span>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;
