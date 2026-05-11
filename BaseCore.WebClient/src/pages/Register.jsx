// BaseCore.WebClient/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const Register = () => {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp');
        }
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
        <div className="login-page" style={{ minHeight: '100vh' }}>
            <div className="login-box">
                <div className="login-logo"><a href="/"><b>BaseCore</b> Sales</a></div>
                <div className="card">
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">Tạo tài khoản mới</p>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            {[
                                { name: 'username', placeholder: 'Tên đăng nhập', icon: 'fa-user' },
                                { name: 'email', placeholder: 'Email', icon: 'fa-envelope', type: 'email' },
                                { name: 'password', placeholder: 'Mật khẩu', icon: 'fa-lock', type: 'password' },
                                { name: 'confirmPassword', placeholder: 'Xác nhận mật khẩu', icon: 'fa-lock', type: 'password' },
                            ].map(({ name, placeholder, icon, type = 'text' }) => (
                                <div className="input-group mb-3" key={name}>
                                    <input
                                        type={type} name={name} className="form-control"
                                        placeholder={placeholder} value={form[name]}
                                        onChange={handleChange} required
                                    />
                                    <div className="input-group-append">
                                        <div className="input-group-text"><span className={`fas ${icon}`}></span></div>
                                    </div>
                                </div>
                            ))}
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Đăng ký'}
                            </button>
                        </form>
                        <p className="mt-2 text-center">
                            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;