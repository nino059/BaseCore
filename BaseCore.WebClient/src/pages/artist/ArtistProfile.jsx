import React, { useState, useRef, useEffect } from 'react';
import ArtistLayout from '../../components/ArtistLayout';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/api';

const inp = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.92rem', color: '#1a1a1a', outline: 'none',
  boxSizing: 'border-box', borderRadius: 6, transition: 'border-color 0.2s',
};

const ArtistProfile = () => {
  const { user, updateUser } = useAuth();
  const userId = user?.userId || user?.id;

  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    name:  user?.name  || user?.fullName || '',
    phone: user?.phone || '',
  });
  const [bio, setBio]                 = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const [avatarUrl, setAvatarUrl]       = useState(user?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [imgErr, setImgErr]             = useState(false);
  const fileRef = useRef(null);

  // Fetch avatar hiện tại từ API (xử lý session cũ chưa có avatarUrl)
  useEffect(() => {
    if (!userId) return;
    userApi.getById(userId)
      .then(res => {
        const url = res.data?.avatarUrl || '';
        if (url && url !== avatarUrl) {
          setAvatarUrl(url);
          updateUser({ avatarUrl: url });
        }
        if (res.data?.bio) setBio(res.data.bio);
      })
      .catch(() => {});
  }, [userId]); // eslint-disable-line

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4500);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setImgErr(false);
    try {
      const uploadRes = await userApi.uploadAvatar(userId, file);
      const url = uploadRes.data?.avatarUrl || uploadRes.data?.url || uploadRes.data;
      setAvatarUrl(url);
      updateUser({ avatarUrl: url });
      showMsg('success', 'Cập nhật ảnh đại diện thành công');
    } catch {
      showMsg('error', 'Tải ảnh thất bại. Vui lòng thử lại');
    }
    setAvatarLoading(false);
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showMsg('error', 'Vui lòng nhập họ và tên');
    setLoading(true);
    try {
      await userApi.update(userId, { name: form.name, phone: form.phone });
      updateUser({ name: form.name, fullName: form.name, phone: form.phone });
      showMsg('success', 'Cập nhật thông tin thành công');
    } catch {
      showMsg('error', 'Cập nhật thất bại. Vui lòng thử lại');
    }
    setLoading(false);
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    console.log('[Bio] userId =', userId, '| bio length =', bio.length);
    if (!userId) return showMsg('error', 'Không xác định được tài khoản. Vui lòng đăng xuất và đăng nhập lại.');
    setLoading(true);
    try {
      const res = await userApi.update(userId, { bio });
      console.log('[Bio] update OK', res.data);
      showMsg('success', 'Cập nhật giới thiệu thành công');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || '';
      console.error('[Bio] update failed', status, err.response?.data);
      showMsg('error', `Cập nhật thất bại${status ? ` (${status})` : ''}: ${msg || 'Vui lòng thử lại'}`);
    }
    setLoading(false);
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return showMsg('error', 'Mật khẩu xác nhận không khớp');
    if (pwForm.newPassword.length < 6)
      return showMsg('error', 'Mật khẩu mới phải có ít nhất 6 ký tự');
    setLoading(true);
    try {
      await userApi.update(userId, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showMsg('success', 'Đổi mật khẩu thành công');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      showMsg('error', 'Mật khẩu hiện tại không đúng');
    }
    setLoading(false);
  };

  const initial = (user?.name || user?.username || 'A')[0].toUpperCase();
  const showImg = avatarUrl && !imgErr;

  return (
    <ArtistLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 4 }}>
            Hồ sơ
          </p>
          <h1 style={{ fontWeight: 300, fontSize: '1.8rem', color: '#1a1a1a', margin: 0 }}>
            Chỉnh sửa hồ sơ
          </h1>
        </div>

        {/* Avatar card */}
        <div style={{
          background: 'white', border: '1px solid #e8e4df',
          borderRadius: 12, padding: '32px',
          display: 'flex', alignItems: 'center', gap: 28,
          marginBottom: 24,
        }}>
          {/* Avatar với nút upload */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              border: '3px solid #c8a97a',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showImg ? '#f0ece8' : 'linear-gradient(135deg,#c8a97a,#8b6c4a)',
            }}>
              {showImg ? (
                <img
                  src={avatarUrl} alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImgErr(true)}
                />
              ) : (
                <span style={{ color: 'white', fontWeight: 300, fontSize: '2.8rem' }}>{initial}</span>
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              title="Đổi ảnh đại diện"
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 32, height: 32, borderRadius: '50%',
                border: '2.5px solid white',
                background: avatarLoading ? '#aaa' : '#c8a97a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: avatarLoading ? 'not-allowed' : 'pointer', padding: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              }}
            >
              {avatarLoading
                ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2, color: 'white' }}></span>
                : <i className="fas fa-camera" style={{ color: 'white', fontSize: '0.7rem' }}></i>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1a1a1a', marginBottom: 4 }}>
              {user?.name || user?.username}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#767676', marginBottom: 10 }}>{user?.email}</div>
            <span style={{
              display: 'inline-block', padding: '3px 12px',
              background: 'rgba(200,169,122,0.15)', color: '#8b6c4a',
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
              borderRadius: 20, border: '1px solid rgba(200,169,122,0.4)',
            }}>
              HỌA SĨ
            </span>
            <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 10, marginBottom: 0 }}>
              <i className="fas fa-info-circle mr-1"></i>
              Nhấp vào biểu tượng máy ảnh để thay đổi ảnh đại diện
            </p>
          </div>
        </div>

        {/* Thông báo */}
        {msg.text && (
          <div style={{
            padding: '12px 18px', fontSize: '0.85rem', marginBottom: 20,
            borderRadius: 8,
            background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msg.type === 'success' ? '#166534' : '#991b1b',
          }}>
            <i className={`fas fa-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2`}></i>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e8e4df', marginBottom: 24 }}>
          {[
            { key: 'info',     label: 'Thông tin cá nhân', icon: 'fa-user' },
            { key: 'bio',      label: 'Giới thiệu',        icon: 'fa-pen-nib' },
            { key: 'password', label: 'Đổi mật khẩu',      icon: 'fa-lock' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '11px 20px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: '0.85rem', letterSpacing: '0.03em',
              color: tab === t.key ? '#c8a97a' : '#767676',
              borderBottom: tab === t.key ? '2px solid #c8a97a' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <i className={`fas ${t.icon}`} style={{ fontSize: '0.8rem' }}></i>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: 12, padding: '32px' }}>

          {/* Tab: Thông tin */}
          {tab === 'info' && (
            <form onSubmit={handleInfoSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 8 }}>
                  Tên hiển thị <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Tên họa sĩ của bạn"
                  required
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#c8a97a'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 8 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ ...inp, background: '#faf8f5', color: '#aaa', cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '0.73rem', color: '#bbb', marginTop: 5 }}>Email không thể thay đổi</p>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 8 }}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="0901 234 567"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#c8a97a'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                padding: '12px 32px', borderRadius: 8,
                background: loading ? '#e0d6c8' : 'linear-gradient(135deg,#c8a97a,#8b6c4a)',
                color: 'white', border: 'none',
                fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          )}

          {/* Tab: Giới thiệu */}
          {tab === 'bio' && (
            <form onSubmit={handleBioSubmit}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 8 }}>
                  Giới thiệu về bạn
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Viết về phong cách sáng tác, hành trình nghệ thuật, triết lý sáng tác của bạn..."
                  rows={10}
                  style={{
                    ...inp,
                    resize: 'vertical',
                    lineHeight: 1.7,
                    minHeight: 200,
                  }}
                  onFocus={e => e.target.style.borderColor = '#c8a97a'}
                  onBlur={e => e.target.style.borderColor = '#e8e4df'}
                />
                <p style={{ fontSize: '0.73rem', color: '#bbb', marginTop: 6 }}>
                  Thông tin này sẽ hiển thị công khai trên trang hồ sơ của bạn · {bio.length}/2000 ký tự
                </p>
              </div>

              <button type="submit" disabled={loading || bio.length > 2000} style={{
                padding: '12px 32px', borderRadius: 8,
                background: (loading || bio.length > 2000) ? '#e0d6c8' : 'linear-gradient(135deg,#c8a97a,#8b6c4a)',
                color: 'white', border: 'none',
                fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: (loading || bio.length > 2000) ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}>
                {loading ? 'Đang lưu...' : 'Lưu giới thiệu'}
              </button>
            </form>
          )}

          {/* Tab: Đổi mật khẩu */}
          {tab === 'password' && (
            <form onSubmit={handlePwSubmit}>
              {[
                { name: 'currentPassword', label: 'Mật khẩu hiện tại',     placeholder: '••••••••' },
                { name: 'newPassword',     label: 'Mật khẩu mới',          placeholder: 'Ít nhất 6 ký tự' },
                { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 8 }}>
                    {f.label}
                  </label>
                  <input
                    type="password"
                    value={pwForm[f.name]}
                    onChange={e => setPwForm({ ...pwForm, [f.name]: e.target.value })}
                    placeholder={f.placeholder}
                    required
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#c8a97a'}
                    onBlur={e => e.target.style.borderColor = '#e8e4df'}
                  />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                padding: '12px 32px', borderRadius: 8,
                background: loading ? '#e0d6c8' : 'linear-gradient(135deg,#c8a97a,#8b6c4a)',
                color: 'white', border: 'none',
                fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </ArtistLayout>
  );
};

export default ArtistProfile;
