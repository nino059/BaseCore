import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import { useCart } from './Cart';

const Profile = () => {
    const { user, login } = useAuth();
    const { count } = useCart();
    const [tab, setTab] = useState('info');
    const [form, setForm] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
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
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            return showMsg('error', 'Mật khẩu xác nhận không khớp!');
        }
        if (pwForm.newPassword.length < 6) {
            return showMsg('error', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
        }
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

    const tabStyle = (t) => ({
        padding: '10px 24px', border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: '0.9rem', borderRadius: 10,
        background: tab === t ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : 'transparent',
        color: tab === t ? 'white' : '#6b7280',
        transition: 'all 0.2s',
    });

    return (
        <PublicLayout cartCount={count}>
            <div className="container py-4" style={{ maxWidth: 680 }}>
                <h3 style={{ fontWeight: 800, marginBottom: 24 }}>
                    <i className="fas fa-user-circle mr-2" style={{ color: '#a78bfa' }}></i>
                    Hồ sơ cá nhân
                </h3>

                {/* Avatar + tên */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    borderRadius: 20, padding: '28px 32px',
                    display: 'flex', alignItems: 'center', gap: 20,
                    marginBottom: 24, color: 'white'
                }}>
                    <div style={{
                        width: 70, height: 70, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 800, flexShrink: 0
                    }}>
                        {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{user?.fullName || user?.username}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{user?.email}</div>
                        <span style={{
                            background: '#a78bfa', borderRadius: 10,
                            padding: '2px 12px', fontSize: '0.75rem',
                            fontWeight: 600, marginTop: 4, display: 'inline-block'
                        }}>{user?.role || 'Khách hàng'}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f3f4f6', padding: 6, borderRadius: 14 }}>
                    <button style={tabStyle('info')} onClick={() => setTab('info')}>
                        <i className="fas fa-id-card mr-2"></i>Thông tin
                    </button>
                    <button style={tabStyle('password')} onClick={() => setTab('password')}>
                        <i className="fas fa-lock mr-2"></i>Đổi mật khẩu
                    </button>
                </div>

                {/* Thông báo */}
                {msg.text && (
                    <div style={{
                        background: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: msg.type === 'success' ? '#065f46' : '#991b1b',
                        borderRadius: 10, padding: '12px 16px',
                        marginBottom: 16, fontSize: '0.9rem', fontWeight: 500
                    }}>
                        <i className={`fas fa-${msg.type === 'success' ? 'check' : 'exclamation'}-circle mr-2`}></i>
                        {msg.text}
                    </div>
                )}

                <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    {/* Tab thông tin */}
                    {tab === 'info' && (
                        <form onSubmit={handleInfoSubmit}>
                            <div className="mb-3">
                                <label style={labelStyle}>Họ và tên</label>
                                <input style={inputStyle} value={form.fullName}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                                    placeholder="Nguyễn Văn A" />
                            </div>
                            <div className="mb-3">
                                <label style={labelStyle}>Email</label>
                                <input style={{ ...inputStyle, background: '#f9fafb', color: '#9ca3af' }}
                                    value={form.email} disabled />
                                <small style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Email không thể thay đổi</small>
                            </div>
                            <div className="mb-4">
                                <label style={labelStyle}>Số điện thoại</label>
                                <input style={inputStyle} value={form.phone} type="tel"
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="0901 234 567" />
                            </div>
                            <button type="submit" disabled={loading} style={btnStyle}>
                                {loading
                                    ? <span className="spinner-border spinner-border-sm mr-2"></span>
                                    : <i className="fas fa-save mr-2"></i>
                                }
                                Lưu thay đổi
                            </button>
                        </form>
                    )}

                    {/* Tab đổi mật khẩu */}
                    {tab === 'password' && (
                        <form onSubmit={handlePwSubmit}>
                            {[
                                { name: 'currentPassword', label: 'Mật khẩu hiện tại' },
                                { name: 'newPassword', label: 'Mật khẩu mới' },
                                { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới' },
                            ].map(f => (
                                <div className="mb-3" key={f.name}>
                                    <label style={labelStyle}>{f.label}</label>
                                    <input type="password" style={inputStyle}
                                        value={pwForm[f.name]}
                                        onChange={e => setPwForm({ ...pwForm, [f.name]: e.target.value })}
                                        required />
                                </div>
                            ))}
                            <button type="submit" disabled={loading} style={btnStyle}>
                                {loading
                                    ? <span className="spinner-border spinner-border-sm mr-2"></span>
                                    : <i className="fas fa-key mr-2"></i>
                                }
                                Đổi mật khẩu
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
};

const labelStyle = { fontWeight: 600, fontSize: '0.9rem', color: '#374151', display: 'block', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.95rem', outline: 'none' };
const btnStyle = { padding: '12px 28px', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' };

export default Profile;