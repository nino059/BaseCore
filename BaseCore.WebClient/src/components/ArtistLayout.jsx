import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SIDEBAR_W   = 230;
const COLLAPSED_W = 64;

const NAV = [
  { path: '/artist/dashboard', icon: 'fa-tachometer-alt', label: 'Tổng quan' },
  { path: '/artist/products',  icon: 'fa-palette',        label: 'Tranh của tôi' },
  { path: '/artist/blog',      icon: 'fa-pen-fancy',      label: 'Bài viết' },
  { path: '/artist/orders',    icon: 'fa-shopping-bag',   label: 'Đơn hàng' },
  { path: '/artist/profile',   icon: 'fa-user-circle',    label: 'Hồ sơ' },
];

const ArtistLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [pinned,  setPinned]  = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const isOpen  = pinned || hovered;
  const sidebarW = isOpen ? SIDEBAR_W : COLLAPSED_W;
  const contentMargin = pinned ? SIDEBAR_W : COLLAPSED_W;

  useEffect(() => {
    const h = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname.startsWith(path);

  const initial = (user?.name || user?.username || 'A')[0].toUpperCase();
  const avatarUrl = user?.avatarUrl || '';

  const AvatarBubble = ({ size = 36, fontSize = '0.95rem' }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarUrl ? '#f0ece8' : 'linear-gradient(135deg,#c8a97a,#8b6c4a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', border: avatarUrl ? '2px solid #c8a97a' : 'none',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
        : <span style={{ color: 'white', fontWeight: 700, fontSize }}>{initial}</span>
      }
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f6fa', fontFamily:"'Segoe UI', sans-serif" }}>

      <style>{`
        .al-link { display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; margin-bottom:2px;
          text-decoration:none; color:rgba(255,255,255,0.6); transition:all .18s; whiteSpace:nowrap; border:1px solid transparent; }
        .al-link:hover { background:rgba(200,169,122,0.15) !important; color:#e8d5a8 !important; }
        .al-link.active { background:linear-gradient(135deg,rgba(200,169,122,0.28),rgba(139,108,74,0.22)) !important;
          color:#c8a97a !important; border:1px solid rgba(200,169,122,0.35) !important; }
        .al-link.active i { color:#c8a97a !important; }
        .al-link-bottom { display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px;
          text-decoration:none; color:rgba(255,255,255,0.45); transition:color .2s; whiteSpace:nowrap; border:none;
          background:transparent; width:100%; cursor:pointer; font-size:0.85rem; }
        .al-link-bottom:hover { color:rgba(255,255,255,0.8) !important; }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside
        onMouseEnter={() => !pinned && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: sidebarW,
          minHeight: '100vh',
          background: 'linear-gradient(180deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: hovered && !pinned ? 300 : 100,
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          boxShadow: isOpen ? '6px 0 32px rgba(0,0,0,0.28)' : '2px 0 12px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}>

        {/* Logo + pin */}
        <div style={{
          padding:'0 12px', borderBottom:'1px solid rgba(255,255,255,0.08)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          height:64, flexShrink:0,
        }}>
          <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg,#c8a97a,#8b6c4a)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-palette" style={{ color:'white', fontSize:'1rem' }}></i>
          </div>
          <div style={{
            flex:1, marginLeft:10, overflow:'hidden',
            opacity: isOpen ? 1 : 0, transition:'opacity 0.15s', whiteSpace:'nowrap',
          }}>
            <div style={{ color:'white', fontWeight:800, fontSize:'1rem', lineHeight:1.1 }}>Arthentic</div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.68rem' }}>Không gian họa sĩ</div>
          </div>
          {isOpen && (
            <button
              onClick={() => { setPinned(p => !p); setHovered(false); }}
              title={pinned ? 'Tự động thu' : 'Ghim sidebar'}
              style={{
                background: pinned ? 'rgba(200,169,122,0.25)' : 'rgba(255,255,255,0.08)',
                border: pinned ? '1px solid rgba(200,169,122,0.4)' : '1px solid transparent',
                color: pinned ? '#c8a97a' : 'rgba(255,255,255,0.55)',
                borderRadius:7, width:28, height:28, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, transition:'all 0.2s', marginLeft:6,
              }}>
              <i className="fas fa-thumbtack" style={{
                fontSize:'0.72rem',
                transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)',
                transition:'transform 0.2s',
              }}></i>
            </button>
          )}
        </div>

        {/* User info */}
        <div style={{
          padding:'12px', borderBottom:'1px solid rgba(255,255,255,0.08)',
          display:'flex', alignItems:'center', gap:10, flexShrink:0,
        }}>
          <AvatarBubble size={36} fontSize="0.95rem" />
          <div style={{
            overflow:'hidden', flex:1,
            opacity: isOpen ? 1 : 0, transition:'opacity 0.15s', whiteSpace:'nowrap',
          }}>
            <div style={{ color:'white', fontWeight:600, fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.name || user?.username}
            </div>
            <div style={{
              display:'inline-block', marginTop:2,
              background:'rgba(200,169,122,0.25)', color:'#c8a97a',
              borderRadius:20, padding:'1px 8px', fontSize:'0.66rem', fontWeight:700,
            }}>
              Họa sĩ
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto', overflowX:'hidden' }}>
          {NAV.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={`al-link${active ? ' active' : ''}`}
                title={!isOpen ? item.label : undefined}
              >
                <i className={`fas ${item.icon}`} style={{
                  fontSize:'1rem', width:20, textAlign:'center', flexShrink:0,
                  color: active ? '#c8a97a' : 'rgba(255,255,255,0.5)',
                }}></i>
                <span style={{
                  fontWeight: active ? 700 : 500, fontSize:'0.88rem',
                  opacity: isOpen ? 1 : 0, transition:'opacity 0.15s', overflow:'hidden',
                }}>
                  {item.label}
                </span>
                {isOpen && active && (
                  <span style={{
                    marginLeft:'auto', width:6, height:6,
                    borderRadius:'50%', background:'#c8a97a', flexShrink:0,
                  }}></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'8px', borderTop:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          <Link to="/" className="al-link-bottom" title={!isOpen ? 'Trang chủ' : undefined}>
            <i className="fas fa-home" style={{ width:20, textAlign:'center', flexShrink:0 }}></i>
            <span style={{ opacity: isOpen ? 1 : 0, transition:'opacity 0.15s' }}>Trang chủ</span>
          </Link>
          <button onClick={handleLogout} className="al-link-bottom" title={!isOpen ? 'Đăng xuất' : undefined}>
            <i className="fas fa-sign-out-alt" style={{ width:20, textAlign:'center', flexShrink:0 }}></i>
            <span style={{ opacity: isOpen ? 1 : 0, transition:'opacity 0.15s' }}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{
        marginLeft: contentMargin,
        flex:1,
        display:'flex', flexDirection:'column',
        transition:'margin-left 0.22s cubic-bezier(.4,0,.2,1)',
        minWidth:0,
      }}>
        {/* Top bar */}
        <header style={{
          height:64, background:'white', borderBottom:'1px solid #f0f0f0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', position:'sticky', top:0, zIndex:50,
          boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#9ca3af', fontSize:'0.88rem' }}>Họa sĩ</span>
            <i className="fas fa-chevron-right" style={{ color:'#d1d5db', fontSize:'0.65rem' }}></i>
            <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.88rem' }}>
              {NAV.find(n => location.pathname.startsWith(n.path))?.label || 'Không gian họa sĩ'}
            </span>
          </div>

          {/* Avatar dropdown */}
          <div ref={dropRef} style={{ position:'relative' }}>
            <div onClick={() => setDropOpen(o => !o)} style={{
              display:'flex', alignItems:'center', gap:8, cursor:'pointer',
              padding:'4px 8px', borderRadius:8, userSelect:'none',
            }}>
              <AvatarBubble size={34} fontSize="0.9rem" />
              <div style={{ lineHeight:1.2 }}>
                <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#1f2937' }}>
                  {user?.name || user?.username}
                </div>
                <div style={{ fontSize:'0.73rem', color:'#9ca3af' }}>Họa sĩ</div>
              </div>
              <i className={`fas fa-chevron-${dropOpen ? 'up' : 'down'}`} style={{ color:'#9ca3af', fontSize:'0.65rem' }}></i>
            </div>

            {dropOpen && (
              <div style={{
                position:'absolute', right:0, top:'110%',
                background:'white', borderRadius:12,
                boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
                minWidth:180, zIndex:200, overflow:'hidden',
                border:'1px solid #f3f4f6',
              }}>
                <div style={{ padding:'10px 16px 8px', borderBottom:'1px solid #f3f4f6' }}>
                  <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{user?.name || user?.username}</div>
                  <div style={{ fontSize:'0.78rem', color:'#9ca3af' }}>{user?.email}</div>
                </div>
                <Link to="/artist/profile" onClick={() => setDropOpen(false)} style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'10px 16px', fontSize:'0.88rem',
                  color:'#374151', background:'none', border:'none', cursor:'pointer',
                  textDecoration:'none',
                }}>
                  <i className="fas fa-user-edit mr-2" style={{ color:'#c8a97a' }}></i>Chỉnh sửa hồ sơ
                </Link>
                <button onClick={handleLogout} style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'10px 16px', fontSize:'0.88rem',
                  color:'#ef4444', background:'none', border:'none', cursor:'pointer',
                }}>
                  <i className="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:'28px', minWidth:0 }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          padding:'14px 28px', borderTop:'1px solid #f0f0f0', background:'white',
          fontSize:'0.8rem', color:'#9ca3af',
          display:'flex', justifyContent:'space-between',
        }}>
          <span>© 2026 <strong style={{ color:'#c8a97a' }}>Arthentic</strong>. Không gian họa sĩ.</span>
          <span>Version 1.0.0</span>
        </footer>
      </div>
    </div>
  );
};

export default ArtistLayout;
