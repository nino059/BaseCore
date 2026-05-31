import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

const inp = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.93rem', color: '#1a1a1a', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const AuthModal = () => {
  const { show, tab, setTab, close } = useAuthModal();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showRegPass, setShowRegPass] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Reset state khi modal mở/đổi tab
  useEffect(() => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setUsername('');
    setPassword('');
    setRegForm({ username: '', email: '', password: '', confirmPassword: '' });
  }, [show, tab]);

  // Đóng bằng Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    if (show) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, close]);

  if (!show) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password, remember);

    if (result.success) {
      close();                    // Chỉ đóng khi thành công
      const role = result.user?.role;
      if (role === 'Admin' || role === 'Staff') navigate('/dashboard');
      else if (role === 'Artist') navigate('/artist/dashboard');
    } else {
      setError(result.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      // Không close() ở đây
    }

    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword)
      return setError('Mật khẩu xác nhận không khớp');
    setError('');
    setLoading(true);
    try {
      await authApi.register({ ...regForm, phone: '' });
      setSuccessMsg('Đăng ký thành công! Vui lòng đăng nhập.');
      setTab('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.48)',
          zIndex: 2000,
        }}
      />

      {/* Card */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 440,
        background: 'white',
        zIndex: 2001,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        maxHeight: '95vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem', color: '#c8a97a' }}>✦</span>
            <span style={{ fontWeight: 300, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '0.08em' }}>ARTHENTIC</span>
          </div>
          <button
            onClick={close}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#aaa', fontSize: '1.2rem', lineHeight: 1,
              padding: '2px 6px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e8e4df', margin: '16px 0 0' }}>
          {[['login', 'Đăng nhập'], ['register', 'Đăng ký']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1, padding: '12px 0',
                background: 'none', border: 'none',
                borderBottom: tab === key ? '2.5px solid #c8a97a' : '2.5px solid transparent',
                marginBottom: -1,
                color: tab === key ? '#1a1a1a' : '#aaa',
                fontWeight: tab === key ? 700 : 400,
                fontSize: '0.88rem', letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* Thông báo thành công */}
          {successMsg && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              color: '#166534', padding: '10px 14px', fontSize: '0.85rem',
              marginBottom: 20,
            }}>
              <i className="fas fa-check-circle mr-2"></i>{successMsg}
            </div>
          )}

          {/* Lỗi */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '10px 14px', fontSize: '0.85rem',
              marginBottom: 20,
            }}>
              <i className="fas fa-exclamation-circle mr-2"></i>{error}
            </div>
          )}

          {/* ── FORM ĐĂNG NHẬP ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 6 }}>
                  Tên đăng nhập
                </label>
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  required autoFocus
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 6 }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    style={{ ...inp, paddingRight: 40 }}
                    onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={e => e.target.style.borderColor = '#e8e4df'}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}>
                    <i className={showPass ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.83rem', color: '#767676' }}>
                  <input
                    type="checkbox" checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{ accentColor: '#1a1a1a', width: 14, height: 14 }}
                  />
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px 0',
                background: loading ? '#ccc' : '#1a1a1a',
                color: 'white', border: 'none',
                fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm mr-2"></span>Đang xử lý...</>
                  : 'Đăng nhập'
                }
              </button>

              <div style={{ marginTop: 20, textAlign: 'center', borderTop: '1px solid #f0ece6', paddingTop: 16 }}>
                <p style={{ fontSize: '0.85rem', color: '#767676', margin: 0 }}>
                  Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => setTab('register')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#1a1a1a', fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid #1a1a1a', fontSize: '0.85rem' }}>
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── FORM ĐĂNG KÝ ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              {[
                { name: 'username', label: 'Tên đăng nhập', type: 'text', placeholder: 'Chọn tên đăng nhập' },
                { name: 'email',    label: 'Địa chỉ Email',  type: 'email', placeholder: 'your@email.com' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type} name={f.name}
                    value={regForm[f.name]}
                    onChange={e => setRegForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    required
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={e => e.target.style.borderColor = '#e8e4df'}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 6 }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    name="password" value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    style={{ ...inp, paddingRight: 40 }}
                    onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={e => e.target.style.borderColor = '#e8e4df'}
                  />
                  <button type="button" onClick={() => setShowRegPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}>
                    <i className={showRegPass ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 6 }}>
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password" name="confirmPassword"
                  value={regForm.confirmPassword}
                  onChange={e => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu"
                  required
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px 0',
                background: loading ? '#ccc' : '#1a1a1a',
                color: 'white', border: 'none',
                fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm mr-2"></span>Đang xử lý...</>
                  : 'Tạo tài khoản'
                }
              </button>

              <div style={{ marginTop: 20, textAlign: 'center', borderTop: '1px solid #f0ece6', paddingTop: 16 }}>
                <p style={{ fontSize: '0.85rem', color: '#767676', margin: 0 }}>
                  Đã có tài khoản?{' '}
                  <button type="button" onClick={() => setTab('login')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#1a1a1a', fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid #1a1a1a', fontSize: '0.85rem' }}>
                    Đăng nhập
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthModal;
