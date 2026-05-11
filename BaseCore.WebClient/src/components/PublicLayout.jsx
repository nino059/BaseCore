import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicLayout = ({ children, cartCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Đóng nav khi chuyển trang
  useEffect(() => { setNavOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/login');
  };

  const navLinkStyle = (path) => ({
    color: location.pathname === path ? '#a78bfa' : 'rgba(255,255,255,0.85)',
    fontWeight: location.pathname === path ? 700 : 500,
    padding: '8px 14px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    transition: 'color 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 1030,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', padding: '12px 15px' }}>

          {/* Logo */}
          <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 700, textDecoration: 'none', marginRight: 'auto' }}>
            <i className="fas fa-palette mr-2" style={{ color: '#a78bfa' }}></i>
            <span style={{ color: 'white' }}>Art</span>
            <span style={{ color: '#a78bfa' }}>hentic</span>
          </Link>

          {/* Desktop Nav Links */}
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, alignItems: 'center', gap: 4 }}
            className="d-none d-lg-flex">
            <li><Link to="/" style={navLinkStyle('/')}><i className="fas fa-home"></i> Trang chủ</Link></li>
            <li><Link to="/shop" style={navLinkStyle('/shop')}><i className="fas fa-store"></i> Cửa hàng</Link></li>
            <li><Link to="/artists" style={navLinkStyle('/artists')}><i className="fas fa-user-circle"></i> Nghệ sĩ</Link></li>
          </ul>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>

            {/* Cart icon + badge */}
            <Link to="/cart" style={{ position: 'relative', color: 'white', textDecoration: 'none' }}>
              <i className="fas fa-shopping-cart" style={{ fontSize: '1.3rem' }}></i>
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -8, right: -8,
                  background: '#ef4444', color: 'white',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: 11, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700,
                }}>{cartCount}</span>
              )}
            </Link>

            {/* User section */}
            {user ? (
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                    borderRadius: 8,
                  }}>
                  <div style={{
                    width: 35, height: 35, borderRadius: '50%',
                    background: '#a78bfa', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'white', fontSize: '1rem',
                  }}>
                    {(user.fullName || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <span style={{ color: 'white', fontSize: '0.9rem' }} className="d-none d-md-inline">
                    {user.fullName || user.username}
                  </span>
                  <i className="fas fa-chevron-down" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}></i>
                </button>

                {/* Dropdown menu */}
                {dropOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '110%',
                    background: 'white', borderRadius: 10, minWidth: 200,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    zIndex: 9999, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.fullName || user.username}</div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>{user.email}</div>
                    </div>
                    <Link to="/my-orders"
                      onClick={() => setDropOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}>
                      <i className="fas fa-box" style={{ color: '#a78bfa', width: 16 }}></i> Đơn hàng của tôi
                    </Link>
                    <div style={{ borderTop: '1px solid #f0f0f0' }}>
                      <button onClick={handleLogout}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none',
                          border: 'none', padding: '10px 16px', color: '#ef4444',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem',
                        }}>
                        <i className="fas fa-sign-out-alt" style={{ width: 16 }}></i> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/login" style={{
                  color: 'white', textDecoration: 'none',
                  padding: '7px 16px', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.4)',
                  fontSize: '0.9rem', fontWeight: 500,
                }}>
                  Đăng nhập
                </Link>
                <Link to="/register" style={{
                  background: '#a78bfa', color: 'white',
                  textDecoration: 'none', padding: '7px 16px',
                  borderRadius: 20, fontSize: '0.9rem', fontWeight: 600,
                }}>
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="d-lg-none"
              onClick={() => setNavOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer' }}>
              <i className={navOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <div className="d-lg-none" style={{ background: '#16213e', padding: '8px 16px 16px' }}>
            <Link to="/" style={{ display: 'block', color: 'rgba(255,255,255,0.85)', padding: '10px 0', textDecoration: 'none' }}>
              <i className="fas fa-home mr-2"></i> Trang chủ
            </Link>
            <Link to="/shop" style={{ display: 'block', color: 'rgba(255,255,255,0.85)', padding: '10px 0', textDecoration: 'none' }}>
              <i className="fas fa-store mr-2"></i> Cửa hàng
            </Link>
            <Link to="/artists" style={{ display: 'block', color: 'rgba(255,255,255,0.85)', padding: '10px 0', textDecoration: 'none' }}>
              <i className="fas fa-user-circle mr-2"></i> Nghệ sĩ
            </Link>
          </div>
        )}
      </nav>

      {/* ===== CONTENT ===== */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.8)' }}>
        <div className="container py-5">
          <div className="row">
            <div className="col-md-4 mb-4">
              <h5 style={{ color: '#a78bfa', fontWeight: 700 }}>
                <i className="fas fa-palette mr-2"></i>Arthentic
              </h5>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                Nơi kết nối nghệ sĩ và người yêu nghệ thuật Việt Nam.
              </p>
            </div>
            <div className="col-md-4 mb-4">
              <h6 style={{ color: 'white', fontWeight: 600 }}>Liên kết</h6>
              <ul className="list-unstyled mt-2">
                <li className="mb-1"><Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Trang chủ</Link></li>
                <li className="mb-1"><Link to="/shop" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Cửa hàng</Link></li>
                <li className="mb-1"><Link to="/my-orders" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Đơn hàng của tôi</Link></li>
              </ul>
            </div>
            <div className="col-md-4 mb-4">
              <h6 style={{ color: 'white', fontWeight: 600 }}>Liên hệ</h6>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                <i className="fas fa-envelope mr-2" style={{ color: '#a78bfa' }}></i>hello@arthentic.vn
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                <i className="fas fa-phone mr-2" style={{ color: '#a78bfa' }}></i>1800 0000
              </p>
            </div>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center', padding: '14px 0',
          fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)'
        }}>
          © 2026 Arthentic. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;