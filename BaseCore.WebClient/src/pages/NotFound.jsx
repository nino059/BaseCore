import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <PublicLayout>
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{
                    fontSize: '7rem', fontWeight: 900, lineHeight: 1,
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 8,
                }}>404</div>
                <h4 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                    Trang không tồn tại
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                    Trang bạn đang tìm không tồn tại hoặc đã bị xóa. Hãy quay về trang chủ nhé!
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(-1)} style={{
                        padding: '12px 28px', border: '2px solid #a78bfa',
                        color: '#7c3aed', background: 'white',
                        borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
                    }}>
                        <i className="fas fa-arrow-left mr-2"></i>Quay lại
                    </button>
                    <Link to="/" style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        color: 'white', textDecoration: 'none',
                        borderRadius: 12, fontWeight: 700, fontSize: '0.95rem'
                    }}>
                        <i className="fas fa-home mr-2"></i>Trang chủ
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
};

export default NotFound;