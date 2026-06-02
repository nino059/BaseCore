import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const inp = {
  width: '100%', padding: '13px 16px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.95rem', color: 'var(--ink)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const FIELDS = [
  { name: 'username',        label: 'Tên đăng nhập',       type: 'text',     placeholder: 'Chọn tên đăng nhập' },
  { name: 'email',           label: 'Địa chỉ Email',        type: 'email',    placeholder: 'your@email.com' },
  { name: 'password',        label: 'Mật khẩu',             type: 'password', placeholder: 'Ít nhất 6 ký tự' },
  { name: 'confirmPassword', label: 'Xác nhận mật khẩu',   type: 'password', placeholder: 'Nhập lại mật khẩu' },
];

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return setError('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      await authApi.register(form);
      navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
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

      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 12 }}>
            Tham gia cộng đồng
          </p>
          <h1 style={{ fontWeight: 200, fontSize: '2rem', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
            Tạo tài khoản
          </h1>
        </div>

        {/* Form */}
        <div style={{ background: 'white', padding: '40px 36px', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '11px 16px', fontSize: '0.85rem',
              marginBottom: 24,
            }}>
              <i className="fas fa-exclamation-circle mr-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {FIELDS.map((f, i) => (
              <div key={f.name} style={{ marginBottom: i === FIELDS.length - 1 ? 28 : 20 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required
                  style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
              </div>
            ))}

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
                : 'Tạo tài khoản'
              }
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center', borderTop: '1px solid #f0ece6', paddingTop: 24 }}>
            <p style={{ fontSize: '0.88rem', color: '#767676', margin: 0 }}>
              Đã có tài khoản?{' '}
              <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid var(--ink)' }}>
                Đăng nhập
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

export default Register;
