import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 1030, padding: '12px 0'
      }}>
        <div className="container">
          <Link className="navbar-brand" to="/" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            <i className="fas fa-palette mr-2" style={{ color: '#a78bfa' }}></i>
            <span style={{ color: 'white' }}>Art</span>
            <span style={{ color: '#a78bfa' }}>hentic</span>
          </Link>

          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarMain">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  <i className="fas fa-home mr-1"></i> Trang chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/shop" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  <i className="fas fa-store mr-1"></i> Cửa hàng
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/artists" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  <i className="fas fa-user-circle mr-1"></i> Nghệ sĩ
                </Link>
              </li>
            </ul>

            <ul className="navbar-nav align-items-center">
              <li className="nav-item mr-2">
                <Link className="nav-link" to="/cart">
                  <i className="fas fa-shopping-cart" style={{ color: 'white', fontSize: '1.2rem' }}></i>
                </Link>
              </li>

              {user ? (
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" data-toggle="dropdown">
                    <div style={{
                      width: 35, height: 35, borderRadius: '50%',
                      background: '#a78bfa', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 8, fontWeight: 700, color: 'white'
                    }}>
                      {(user.name || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>{user.name}</span>
                  </a>
                  <div className="dropdown-menu dropdown-menu-right">
                    <span className="dropdown-item-text text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</span>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                    </button>
                  </div>
                </li>
              ) : (
                <li className="nav-item">
                  <Link to="/login" className="btn btn-sm" style={{
                    background: '#a78bfa', color: 'white',
                    borderRadius: 20, padding: '6px 20px', fontWeight: 600
                  }}>
                    <i className="fas fa-sign-in-alt mr-1"></i> Đăng nhập
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* FOOTER */}
      <footer style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.8)' }}>
        <div className="container py-5">
          <div className="row">
            <div className="col-md-4 mb-4">
              <h5 style={{ color: '#a78bfa', fontWeight: 700 }}>
                <i className="fas fa-palette mr-2"></i>Artthentic
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
                <li className="mb-1"><Link to="/artists" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Nghệ sĩ</Link></li>
              </ul>
            </div>
            <div className="col-md-4 mb-4">
              <h6 style={{ color: 'white', fontWeight: 600 }}>Liên hệ</h6>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                <i className="fas fa-envelope mr-2" style={{ color: '#a78bfa' }}></i>hello@artthentic.vn
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                <i className="fas fa-phone mr-2" style={{ color: '#a78bfa' }}></i>1800 0000
              </p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', padding: '14px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          © 2026 Arthentic. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;