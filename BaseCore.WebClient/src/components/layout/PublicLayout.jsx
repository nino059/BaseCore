import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import NotificationBell from '../common/NotificationBell';

const NAV_ITEMS = [
  { to: '/',        label: 'Trang chủ' },
  { to: '/shop',    label: 'Cửa hàng' },
  { to: '/artists', label: 'Nghệ sĩ' },
  { to: '/blog',    label: 'Bài viết' },
];

const PublicLayout = ({ children }) => {
  const { user, logout, isAdmin, isArtist } = useAuth();
  const { count: cartCount } = useCart();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen]   = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setNavOpen(false); setDropOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isActive = to => {
    if (to === '/') return location.pathname === '/';
    if (to === '/shop') return location.pathname === '/shop' || location.pathname.startsWith('/product');
    return location.pathname.startsWith(to);
  };

  const dropItem = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 18px', color: '#374151', textDecoration: 'none',
    fontSize: '0.88rem', background: 'none', border: 'none',
    width: '100%', textAlign: 'left', cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1030,
        background: (isHome && !scrolled) ? 'transparent' : 'rgba(20,16,12,0.97)',
        backdropFilter: (isHome && !scrolled) ? 'none' : 'blur(14px)',
        borderBottom: (isHome && !scrolled) ? 'none' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: (isHome && !scrolled) ? 'none' : '0 2px 24px rgba(0,0,0,0.25)',
        transition: 'background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease',
      }}>
        <div className="max-w-[1140px] mx-auto px-4" style={{
          display: 'flex', alignItems: 'center', height: 64,
          padding: '0 15px', position: 'relative',
        }}>

          {/* ── Logo (far left) ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.08rem', color: 'white', letterSpacing: '0.18em', lineHeight: 1.1 }}>
                ART<span style={{ color: 'var(--brand)' }}>HENTIC</span>
              </div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.24em', textTransform: 'uppercase', marginTop: 3 }}>
                Nghệ thuật dân gian
              </div>
            </div>
          </Link>

          {/* ── Desktop nav links (absolute centered) ── */}
          <ul className="hidden lg:flex"
            style={{
              listStyle: 'none', margin: 0, padding: 0,
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'stretch', height: 64, gap: 0,
            }}>
            {NAV_ITEMS.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <li key={to} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <Link to={to}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '0 20px', whiteSpace: 'nowrap',
                      color: active ? 'var(--brand)' : 'rgba(255,255,255,0.72)',
                      fontWeight: active ? 700 : 400,
                      fontSize: '0.76rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                      textDecoration: 'none',
                      borderBottom: `2px solid ${active ? 'var(--brand)' : 'transparent'}`,
                      transition: 'color 0.2s, border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderBottomColor = 'rgba(200,169,122,0.45)'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Right controls ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto' }}>

            {/* Bell + Cart (nhóm gần nhau) */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <NotificationBell theme="dark" />
                {!isAdmin && !isArtist && (
                  <Link to="/cart" style={{ position: 'relative', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '6px 8px' }}>
                    <i className="fas fa-shopping-bag" style={{ fontSize: '1rem' }}></i>
                    {cartCount > 0 && (
                      <span style={{
                        position: 'absolute', top: 2, right: 2,
                        background: 'var(--brand)', color: 'white',
                        borderRadius: '50%', width: 17, height: 17,
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid rgba(20,16,12,0.9)',
                      }}>{cartCount > 9 ? '9+' : cartCount}</span>
                    )}
                  </Link>
                )}
              </div>
            )}

            {/* User section */}
            {user ? (
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropOpen(o => !o)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{
                    width: 33, height: 33, borderRadius: '50%', flexShrink: 0,
                    background: user.avatarUrl ? '#f0ece8' : 'var(--brand)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    border: '2px solid rgba(255,255,255,0.2)',
                    overflow: 'hidden',
                  }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
                      : (user.fullName || user.name || user.username || 'U')[0].toUpperCase()
                    }
                  </div>
                  <i className="fas fa-chevron-down" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.56rem', transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}></i>
                </button>

                {dropOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                    background: 'white', minWidth: 220,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    zIndex: 9999, border: '1px solid #e8e4df', overflow: 'hidden',
                  }}>
                    <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f0ece8', background: '#faf8f5' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
                        {user.fullName || user.username}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: 2 }}>{user.email}</div>
                      {isAdmin && (
                        <span style={{ display: 'inline-block', marginTop: 5, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--brand)', color: 'white', padding: '2px 8px' }}>
                          Quản trị
                        </span>
                      )}
                      {isArtist && (
                        <span style={{ display: 'inline-block', marginTop: 5, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--brand-dark)', color: 'white', padding: '2px 8px' }}>
                          Họa sĩ
                        </span>
                      )}
                    </div>

                    {isAdmin ? (
                      <Link to="/dashboard" onClick={() => setDropOpen(false)} style={{ ...dropItem }}>
                        <i className="fas fa-tachometer-alt" style={{ color: 'var(--brand)', width: 16, textAlign: 'center' }}></i>
                        Quản lý hệ thống
                      </Link>
                    ) : isArtist ? (
                      <Link to="/artist/dashboard" onClick={() => setDropOpen(false)} style={{ ...dropItem }}>
                        <i className="fas fa-palette" style={{ color: 'var(--brand)', width: 16, textAlign: 'center' }}></i>
                        Trang họa sĩ
                      </Link>
                    ) : (
                      <>
                        <Link to="/my-orders" onClick={() => setDropOpen(false)} style={{ ...dropItem }}>
                          <i className="fas fa-box-open" style={{ color: 'var(--brand)', width: 16, textAlign: 'center' }}></i>
                          Đơn hàng của tôi
                        </Link>
                        <Link to="/profile" onClick={() => setDropOpen(false)} style={{ ...dropItem }}>
                          <i className="fas fa-user" style={{ color: 'var(--brand)', width: 16, textAlign: 'center' }}></i>
                          Hồ sơ cá nhân
                        </Link>
                      </>
                    )}

                    <div style={{ borderTop: '1px solid #f0ece8' }}>
                      <button onClick={handleLogout} style={{ ...dropItem, color: '#ef4444' }}>
                        <i className="fas fa-sign-out-alt" style={{ width: 16, textAlign: 'center' }}></i>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={openLogin} style={{
                  width: 110, padding: '7px 0', color: 'white', background: 'none',
                  fontSize: '0.74rem', fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.4)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                >
                  Đăng nhập
                </button>
                <button onClick={openRegister} style={{
                  width: 110, padding: '7px 0', background: 'var(--brand)', color: 'white',
                  border: '1px solid var(--brand)',
                  fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', textAlign: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-dark)'; e.currentTarget.style.borderColor = 'var(--brand-dark)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
                >
                  Đăng ký
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="lg:hidden" onClick={() => setNavOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.15rem', cursor: 'pointer', padding: '4px', marginLeft: 4 }}>
              <i className={navOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <div className="lg:hidden" style={{ background: 'rgba(20,16,12,0.98)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="max-w-[1140px] mx-auto px-4" style={{ paddingTop: 8, paddingBottom: 16 }}>
              {NAV_ITEMS.map(({ to, label }) => (
                <Link key={to} to={to} style={{
                  display: 'block', padding: '11px 0',
                  color: isActive(to) ? 'var(--brand)' : 'rgba(255,255,255,0.7)',
                  fontWeight: isActive(to) ? 700 : 400,
                  textDecoration: 'none', fontSize: '0.88rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {label}
                </Link>
              ))}

              {user ? (
                <div style={{ marginTop: 8 }}>
                  {!isAdmin && !isArtist && (
                    <Link to="/cart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <span>Giỏ hàng</span>
                      {cartCount > 0 && <span style={{ background: 'var(--brand)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>{cartCount}</span>}
                    </Link>
                  )}
                  <Link to={isAdmin ? '/dashboard' : isArtist ? '/artist/dashboard' : '/my-orders'} style={{ display: 'block', padding: '11px 0', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {isAdmin ? 'Quản lý hệ thống' : isArtist ? 'Trang họa sĩ' : 'Đơn hàng của tôi'}
                  </Link>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 0', color: '#ef4444', background: 'none', border: 'none', fontSize: '0.88rem', cursor: 'pointer' }}>
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={openLogin} style={{ flex: 1, padding: '10px', textAlign: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.35)', background: 'none', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Đăng nhập
                  </button>
                  <button onClick={openRegister} style={{ flex: 1, padding: '10px', textAlign: 'center', color: 'white', background: 'var(--brand)', border: '1px solid var(--brand)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Đăng ký
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <div style={{ flex: 1, paddingTop: 64 }}>{children}</div>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ background: 'var(--ink)' }}>
        <div className="max-w-[1140px] mx-auto px-4 py-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6">

            {/* Brand */}
            <div className="md:col-span-4 mb-4">
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', letterSpacing: '0.16em' }}>
                  ART<span style={{ color: 'var(--brand)' }}>HENTIC</span>
                </div>
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 5 }}>
                  Nghệ thuật dân gian Việt Nam
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.87rem', lineHeight: 1.85, margin: 0 }}>
                Nơi kết nối nghệ sĩ và người yêu nghệ thuật,<br />
                bảo tồn và lan tỏa vẻ đẹp tranh dân gian Việt Nam.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {['fa-facebook', 'fa-instagram', 'fa-youtube'].map(icon => (
                  <div key={icon} style={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <i className={`fab ${icon}`} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}></i>
                  </div>
                ))}
              </div>
            </div>

            {/* Explore */}
            <div className="md:col-span-2 mb-4">
              <h6 style={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
                Khám phá
              </h6>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { to: '/', label: 'Trang chủ' },
                  { to: '/shop', label: 'Cửa hàng' },
                  { to: '/artists', label: 'Nghệ sĩ' },
                  { to: '/blog', label: 'Bài viết' },
                ].map(({ to, label }) => (
                  <li key={to} style={{ marginBottom: 10 }}>
                    <Link to={to} className="foot-link"
                      style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.87rem', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div className="md:col-span-2 mb-4">
              <h6 style={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
                Tài khoản
              </h6>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { to: '/login',     label: 'Đăng nhập' },
                  { to: '/register',  label: 'Đăng ký' },
                  { to: '/my-orders', label: 'Đơn hàng' },
                  { to: '/profile',   label: 'Hồ sơ' },
                ].map(({ to, label }) => (
                  <li key={to} style={{ marginBottom: 10 }}>
                    <Link to={to}
                      style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.87rem' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-4 mb-4">
              <h6 style={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
                Liên hệ
              </h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: 'fa-envelope', text: 'arthentic@gmail.com' },
                  { icon: 'fa-phone',    text: '0868 868 868' },
                  { icon: 'fa-map-marker-alt', text: 'Phường Nghĩa Đô, Thủ đô Hà Nội' },
                ].map(({ icon, text }) => (
                  <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.45)', fontSize: '0.87rem' }}>
                    <i className={`fas ${icon}`} style={{ color: 'var(--brand)', width: 14, textAlign: 'center', flexShrink: 0 }}></i>
                    {text}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', padding: '16px 0', fontSize: '0.76rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
          © 2026 Arthentic. Tất cả quyền được bảo lưu.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
