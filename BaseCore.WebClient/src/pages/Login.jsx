import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const inp = {
  width: '100%', padding: '13px 16px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.95rem', color: 'var(--ink)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password, remember);
    if (result.success) {
      const role = result.user?.role;
      if (role === 'Admin' || role === 'Staff') navigate('/dashboard');
      else if (role === 'Artist') navigate('/artist/dashboard');
      else navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>

      {/* Logo góc trên */}
      <div style={{ position: 'fixed', top: 24, left: 32 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.4rem', color: 'var(--brand)' }}>✦</span>
          <span style={{ fontWeight: 300, fontSize: '1.2rem', color: 'var(--ink)', letterSpacing: '0.08em' }}>ARTHENTIC</span>
        </Link>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 12 }}>
            Chào mừng trở lại
          </p>
          <h1 style={{ fontWeight: 200, fontSize: '2rem', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
            Đăng nhập
          </h1>
        </div>

        {/* Form */}
        <div style={{ background: 'white', padding: '40px 36px', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '11px 16px', fontSize: '0.85rem',
              marginBottom: 24, letterSpacing: '0.01em',
            }}>
              <i className="fas fa-exclamation-circle mr-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required autoFocus
                style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                onBlur={e => e.target.style.borderColor = '#e8e4df'}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}>
                  <i className={showPass ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#767676' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--ink)', width: 15, height: 15 }}
                />
                Ghi nhớ đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px 0',
                background: loading ? '#ccc' : 'var(--ink)',
                color: 'white', border: 'none',
                fontSize: '0.8rem', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm mr-2"></span>Đang xử lý...</>
                : 'Đăng nhập'
              }
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center', borderTop: '1px solid #f0ece6', paddingTop: 24 }}>
            <p style={{ fontSize: '0.88rem', color: '#767676', margin: 0 }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid var(--ink)' }}>
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.8rem', color: '#bbb' }}>
          © 2026 Arthentic. Gallery nghệ thuật Việt Nam.
        </p>
      </div>
    </div>
  );
};

export default Login;
