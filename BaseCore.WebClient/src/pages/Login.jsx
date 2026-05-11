import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
            // ✅ Redirect đúng theo role
            const role = result.user?.role;
            if (role === 'Admin' || role === 'Staff') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="login-page" style={{ minHeight: '100vh' }}>
            <div className="login-box">
                <div className="login-logo">
                    <a href="/"><b>BaseCore</b> Sales</a>
                </div>
                <div className="card">
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">Đăng nhập để tiếp tục</p>

                        {error && (
                            <div className="alert alert-danger alert-dismissible">
                                <button type="button" className="close" onClick={() => setError('')}>
                                    &times;
                                </button>
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Tên đăng nhập"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required autoFocus
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">
                                        <span className="fas fa-user"></span>
                                    </div>
                                </div>
                            </div>

                            <div className="input-group mb-3">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="input-group-append">
                                    <div
                                        className="input-group-text"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></span>
                                    </div>
                                </div>
                            </div>

                            <div className="row align-items-center mb-2">
                                <div className="col-7">
                                    <div className="icheck-primary">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                        />
                                        <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                                    </div>
                                </div>
                                <div className="col-5">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? <span className="spinner-border spinner-border-sm"></span>
                                            : <><i className="fas fa-sign-in-alt mr-1"></i> Đăng nhập</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </form>

                        <p className="mb-1 text-center">
                            <Link to="/forgot-password">Quên mật khẩu?</Link>
                        </p>
                        <p className="mb-0 text-center">
                            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;