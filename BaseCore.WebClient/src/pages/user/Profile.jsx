import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/api';
import PublicLayout from '../../components/layout/PublicLayout';
import { VIETNAM_CITIES } from '../../constants/cities';

const inp = {
  width: '100%', padding: '12px 16px',
  border: '1.5px solid #e8e4df', background: 'white',
  fontSize: '0.95rem', color: 'var(--ink)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const Profile = () => {
  const { user, isAdmin, updateUser } = useAuth();
  const userId = user?.userId || user?.id;
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    fullName: user?.name || user?.fullName || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef(null);

  const emptyAddrForm = { fullName: '', phone: '', addressLine: '', ward: '', city: '' };
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState(emptyAddrForm);
  const [setAsDefault, setSetAsDefault] = useState(false);

  const loadAddresses = useCallback(() => {
    if (!userId) return;
    userApi.getAddresses(userId)
      .then(res => setAddresses(res.data || []))
      .catch(() => {});
  }, [userId]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

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
      })
      .catch(() => {});
  }, [userId]); // eslint-disable-line

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
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
    setLoading(true);
    try {
      await userApi.update(userId, { name: form.fullName, phone: form.phone });
      updateUser({ name: form.fullName, fullName: form.fullName, phone: form.phone });
      showMsg('success', 'Cập nhật thông tin thành công');
    } catch {
      showMsg('error', 'Cập nhật thất bại. Vui lòng thử lại');
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

  const openAddAddress = () => {
    setEditingAddrId(null);
    setSetAsDefault(addresses.length === 0);
    setAddrForm({
      ...emptyAddrForm,
      fullName: form.fullName || user?.name || '',
      phone: form.phone || user?.phone || '',
    });
    setShowAddrForm(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddrId(addr.id);
    setAddrForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine: addr.addressLine || '',
      ward: addr.ward || '',
      city: addr.city || '',
    });
    setShowAddrForm(true);
  };

  const closeAddrForm = () => {
    setShowAddrForm(false);
    setEditingAddrId(null);
    setSetAsDefault(false);
    setAddrForm(emptyAddrForm);
  };

  const handleAddrSubmit = async (e) => {
    e.preventDefault();
    if (!addrForm.fullName || !addrForm.phone || !addrForm.addressLine || !addrForm.city)
      return showMsg('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    setAddrLoading(true);
    try {
      const payload = {
        fullName: addrForm.fullName,
        phone: addrForm.phone,
        addressLine: addrForm.addressLine,
        ward: addrForm.ward || null,
        city: addrForm.city,
        isDefault: editingAddrId ? false : (addresses.length === 0 || setAsDefault),
      };
      if (editingAddrId) {
        const existing = addresses.find(a => a.id === editingAddrId);
        await userApi.updateAddress(userId, editingAddrId, {
          ...payload,
          isDefault: existing?.isDefault ?? false,
        });
        showMsg('success', 'Cập nhật địa chỉ thành công');
      } else {
        await userApi.createAddress(userId, payload);
        showMsg('success', 'Thêm địa chỉ thành công');
      }
      loadAddresses();
      closeAddrForm();
    } catch {
      showMsg('error', 'Lưu địa chỉ thất bại. Vui lòng thử lại');
    }
    setAddrLoading(false);
  };

  const handleSetDefault = async (addressId) => {
    setAddrLoading(true);
    try {
      await userApi.setDefaultAddress(userId, addressId);
      loadAddresses();
      showMsg('success', 'Đã đặt làm địa chỉ mặc định');
    } catch {
      showMsg('error', 'Không thể đặt địa chỉ mặc định');
    }
    setAddrLoading(false);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    setAddrLoading(true);
    try {
      await userApi.deleteAddress(userId, addressId);
      loadAddresses();
      showMsg('success', 'Đã xóa địa chỉ');
    } catch {
      showMsg('error', 'Xóa địa chỉ thất bại');
    }
    setAddrLoading(false);
  };

  const TABS = [
    { key: 'info',      label: 'Thông tin cá nhân' },
    { key: 'addresses', label: 'Địa chỉ giao hàng' },
    { key: 'password',  label: 'Đổi mật khẩu' },
  ];

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 10 }}>
              Tài khoản
            </p>
            <h1 style={{ fontWeight: 200, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
              Hồ sơ cá nhân
            </h1>
          </div>

          {/* Avatar Card */}
          <div style={{
            background: 'white', padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 24,
            marginBottom: 32, boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 72, height: 72, background: 'var(--ink)', overflow: 'hidden',
                borderRadius: '50%', border: '2px solid var(--brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.8rem', fontWeight: 300,
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl('')} />
                  : (user?.fullName || user?.username || 'U')[0].toUpperCase()
                }
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarLoading}
                title="Đổi ảnh đại diện"
                style={{
                  position: 'absolute', bottom: -6, right: -6,
                  width: 26, height: 26, border: '2px solid white',
                  borderRadius: '50%', background: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: avatarLoading ? 'not-allowed' : 'pointer', padding: 0,
                }}
              >
                {avatarLoading
                  ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10, borderWidth: 2, color: 'white' }}></span>
                  : <i className="fas fa-camera" style={{ color: 'white', fontSize: '0.6rem' }}></i>
                }
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: 4 }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#767676', marginBottom: 8 }}>{user?.email}</div>
              <span style={{
                display: 'inline-block', padding: '3px 12px',
                background: isAdmin ? '#fef3c7' : '#f0fdf4',
                color: isAdmin ? '#92400e' : '#065f46',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
              }}>
                {isAdmin ? 'QUẢN TRỊ VIÊN' : 'THÀNH VIÊN'}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid #e8e4df', marginBottom: 32 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '12px 20px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                fontWeight: tab === t.key ? 700 : 400,
                fontSize: '0.85rem', letterSpacing: '0.04em',
                color: tab === t.key ? 'var(--ink)' : '#767676',
                borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -1.5, transition: 'all 0.18s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Thông báo */}
          {msg.text && (
            <div style={{
              padding: '12px 18px', fontSize: '0.85rem', marginBottom: 24, letterSpacing: '0.01em',
              background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: msg.type === 'success' ? '#166534' : '#991b1b',
            }}>
              <i className={`fas fa-${msg.type === 'success' ? 'check' : 'exclamation-circle'} mr-2`}></i>
              {msg.text}
            </div>
          )}

          {/* Form panel */}
          <div style={{ background: 'white', padding: '36px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

            {/* Tab: Thông tin */}
            {tab === 'info' && (
              <form onSubmit={handleInfoSubmit}>
                {[
                  { key: 'fullName', label: 'Họ và tên',     type: 'text',  placeholder: 'Nguyễn Văn A', disabled: false },
                  { key: 'email',    label: 'Email',          type: 'email', placeholder: '',              disabled: true  },
                  { key: 'phone',    label: 'Số điện thoại', type: 'tel',   placeholder: '0901 234 567',  disabled: false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 22 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => !f.disabled && setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      disabled={f.disabled}
                      style={{
                        ...inp,
                        background: f.disabled ? '#faf8f5' : 'white',
                        color: f.disabled ? '#aaa' : 'var(--ink)',
                        cursor: f.disabled ? 'not-allowed' : 'text',
                      }}
                      onFocus={e => !f.disabled && (e.target.style.borderColor = 'var(--ink)')}
                      onBlur={e => (e.target.style.borderColor = '#e8e4df')}
                    />
                    {f.disabled && (
                      <p style={{ fontSize: '0.75rem', color: '#bbb', marginTop: 5 }}>Email không thể thay đổi</p>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: 32 }}>
                  <button type="submit" disabled={loading} style={{
                    padding: '13px 32px', background: loading ? '#ccc' : 'var(--ink)',
                    color: 'white', border: 'none',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Địa chỉ giao hàng */}
            {tab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  {!showAddrForm && (
                    <button type="button" onClick={openAddAddress} style={{
                      padding: '10px 18px', background: 'var(--ink)', color: 'white', border: 'none',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', cursor: 'pointer',
                    }}>
                      + Thêm địa chỉ
                    </button>
                  )}
                </div>

                {showAddrForm && (
                  <form onSubmit={handleAddrSubmit} style={{
                    padding: '20px', background: '#faf8f5', marginBottom: 24,
                    border: '1px solid #e8e4df',
                  }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 18, textAlign: 'center' }}>
                      {editingAddrId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                    </p>
                    {[
                      { key: 'fullName', label: 'Họ và tên *', placeholder: 'Nguyễn Văn A', required: true },
                      { key: 'phone', label: 'Số điện thoại *', placeholder: '0901 234 567', required: true },
                      { key: 'addressLine', label: 'Địa chỉ *', placeholder: 'Số nhà, tên đường', required: true },
                      { key: 'ward', label: 'Xã / Phường', placeholder: 'Phường Bến Nghé', required: false },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                          {f.label}
                        </label>
                        <input
                          value={addrForm[f.key]}
                          onChange={e => setAddrForm({ ...addrForm, [f.key]: e.target.value })}
                          placeholder={f.placeholder}
                          required={f.required}
                          style={inp}
                          onFocus={e => (e.target.style.borderColor = 'var(--ink)')}
                          onBlur={e => (e.target.style.borderColor = '#e8e4df')}
                        />
                      </div>
                    ))}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Tỉnh / Thành phố *
                      </label>
                      <select
                        value={addrForm.city}
                        onChange={e => setAddrForm({ ...addrForm, city: e.target.value })}
                        required
                        style={{ ...inp, cursor: 'pointer' }}
                      >
                        <option value="">-- Chọn tỉnh/thành --</option>
                        {VIETNAM_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {!editingAddrId && addresses.length > 0 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={setAsDefault}
                          onChange={e => setSetAsDefault(e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: 'var(--ink)' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: '#767676' }}>Đặt làm địa chỉ mặc định</span>
                      </label>
                    )}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="submit" disabled={addrLoading} style={{
                        padding: '11px 24px', background: addrLoading ? '#ccc' : 'var(--ink)',
                        color: 'white', border: 'none',
                        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', cursor: addrLoading ? 'not-allowed' : 'pointer',
                      }}>
                        {addrLoading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                      <button type="button" onClick={closeAddrForm} style={{
                        padding: '11px 24px', background: 'transparent', color: '#767676',
                        border: '1.5px solid #e8e4df',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        Hủy
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddrForm ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
                    <i className="fas fa-map-marker-alt" style={{ fontSize: '1.5rem', marginBottom: 12, display: 'block' }}></i>
                    Chưa có địa chỉ giao hàng nào
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} style={{
                      padding: '18px 20px', marginBottom: 12,
                      border: `1.5px solid ${addr.isDefault ? 'var(--ink)' : '#e8e4df'}`,
                      background: addr.isDefault ? '#f9f6f2' : 'white',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{addr.fullName}</span>
                            {addr.isDefault && (
                              <span style={{
                                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                                color: '#065f46', background: '#f0fdf4', padding: '2px 8px',
                              }}>
                                MẶC ĐỊNH
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#767676', lineHeight: 1.6 }}>
                            {addr.phone}<br />
                            {addr.addressLine}{addr.ward ? `, ${addr.ward}` : ''}, {addr.city}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          {!addr.isDefault && (
                            <button type="button" onClick={() => handleSetDefault(addr.id)} disabled={addrLoading}
                              style={{ padding: '6px 12px', fontSize: '0.72rem', border: '1px solid #e8e4df', background: 'white', cursor: 'pointer', color: 'var(--ink)' }}>
                              Đặt mặc định
                            </button>
                          )}
                          <button type="button" onClick={() => openEditAddress(addr)} disabled={addrLoading}
                            style={{ padding: '6px 12px', fontSize: '0.72rem', border: '1px solid #e8e4df', background: 'white', cursor: 'pointer', color: 'var(--ink)' }}>
                            Sửa
                          </button>
                          <button type="button" onClick={() => handleDeleteAddress(addr.id)} disabled={addrLoading}
                            style={{ padding: '6px 12px', fontSize: '0.72rem', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', color: '#991b1b' }}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Đổi mật khẩu */}
            {tab === 'password' && (
              <form onSubmit={handlePwSubmit}>
                {[
                  { name: 'currentPassword', label: 'Mật khẩu hiện tại',     placeholder: '••••••••' },
                  { name: 'newPassword',     label: 'Mật khẩu mới',          placeholder: 'Ít nhất 6 ký tự' },
                  { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.name} style={{ marginBottom: 22 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 8 }}>
                      {f.label}
                    </label>
                    <input
                      type="password"
                      value={pwForm[f.name]}
                      onChange={e => setPwForm({ ...pwForm, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      required
                      style={inp}
                      onFocus={e => (e.target.style.borderColor = 'var(--ink)')}
                      onBlur={e => (e.target.style.borderColor = '#e8e4df')}
                    />
                  </div>
                ))}
                <div style={{ marginTop: 32 }}>
                  <button type="submit" disabled={loading} style={{
                    padding: '13px 32px', background: loading ? '#ccc' : 'var(--ink)',
                    color: 'white', border: 'none',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                    {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};

export default Profile;
