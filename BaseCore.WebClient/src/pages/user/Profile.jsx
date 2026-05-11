import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/api';
import { useCart } from './Cart';

const Profile = () => {
  const { user, login } = useAuth();
  const { count } = useCart();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userApi.update(user.id, form);
      showMsg('success', 'Cập nhật thông tin thành công!');
    } catch {
      showMsg('error', 'Cập nhật thất bại. Vui lòng thử lại!');
    }
    setLoading(false);
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return showMsg('error', 'Mật khẩu xác nhận không khớp!');
    if (pwForm.newPassword.length < 6)
      return showMsg('error', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
    setLoading(true);
    try {
      await userApi.update(user.id, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showMsg('success', 'Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      showMsg('error', 'Mật khẩu hiện tại không đúng!');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>
        Hồ sơ cá nhân
      </h1>

      {/* Avatar */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'linear-gradient(135deg,#a78bfa22,#7c3aed11)',
        borderRadius: 20, padding: '28px 20px', marginBottom: 28,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: 14,
          boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
        }}>
          {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
          {user?.fullName || user?.username}
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 8 }}>{user?.email}</div>
        <span style={{
          background: user?.role === 'Admin' ? '#ede9fe' : '#d1fae5',
          color:      user?.role === 'Admin' ? '#7c3aed' : '#059669',
          padding: '3px 14px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
        }}>
          {user?.role === 'Admin' ? '⚙️ Quản trị viên' : '🎨 Khách hàng'}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f3f4f6', borderRadius: 14, padding: 6 }}>
        {[
          { key: 'info',     label: '👤 Thông tin' },
          { key: 'password', label: '🔒 Đổi mật khẩu' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem', borderRadius: 10, transition: 'all 0.2s',
            background: tab === t.key ? 'white' : 'transparent',
            color:      tab === t.key ? '#7c3aed' : '#6b7280',
            boxShadow:  tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Thông báo */}
      {msg.text && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontWeight: 600,
          fontSize: '0.9rem', textAlign: 'center',
          background: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
          color:      msg.type === 'success' ? '#065f46' : '#dc2626',
        }}>
          {msg.type === 'success' ? '✅ ' : '❌ '}{msg.text}
        </div>
      )}

      {/* Tab: Thông tin */}
      {tab === 'info' && (
        <form onSubmit={handleInfoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { key: 'fullName', label: 'Họ và tên',       type: 'text',  placeholder: 'Nguyễn Văn A', disabled: false },
            { key: 'email',    label: 'Email',            type: 'email', placeholder: '',              disabled: true  },
            { key: 'phone',    label: 'Số điện thoại',   type: 'tel',   placeholder: '0901 234 567', disabled: false },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151', display: 'block', marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => !f.disabled && setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                disabled={f.disabled}
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
                  borderRadius: 12, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  background: f.disabled ? '#f9fafb' : 'white',
                  color:      f.disabled ? '#9ca3af' : '#111827',
                  cursor:     f.disabled ? 'not-allowed' : 'text',
                }}
              />
              {f.disabled && (
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 }}>Email không thể thay đổi</p>
              )}
            </div>
          ))}
          <button type="submit" disabled={loading} style={{
            padding: '13px 28px', borderRadius: 14, border: 'none', fontWeight: 700,
            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            background: loading ? '#e5e7eb' : 'linear-gradient(135deg,#a78bfa,#7c3aed)',
            color: loading ? '#9ca3af' : 'white',
          }}>
            {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </form>
      )}

      {/* Tab: Đổi mật khẩu */}
      {tab === 'password' && (
        <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { name: 'currentPassword', label: 'Mật khẩu hiện tại',     placeholder: '••••••••' },
            { name: 'newPassword',     label: 'Mật khẩu mới',          placeholder: 'Ít nhất 6 ký tự' },
            { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.name}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151', display: 'block', marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                type="password"
                value={pwForm[f.name]}
                onChange={e => setPwForm({ ...pwForm, [f.name]: e.target.value })}
                placeholder={f.placeholder}
                required
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
                  borderRadius: 12, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{
            padding: '13px 28px', borderRadius: 14, border: 'none', fontWeight: 700,
            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            background: loading ? '#e5e7eb' : 'linear-gradient(135deg,#a78bfa,#7c3aed)',
            color: loading ? '#9ca3af' : 'white',
          }}>
            {loading ? '⏳ Đang đổi...' : '🔑 Đổi mật khẩu'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;