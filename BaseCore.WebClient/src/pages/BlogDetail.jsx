import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { blogApi } from '../services/api';
import BlogRenderer from '../components/BlogRenderer';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    blogApi.getById(id)
      .then(res => {
        setPost(res.data);
      })
      .catch(() => {
        setError('Không tìm thấy bài viết hoặc bài viết chưa được công khai.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 42, height: 42, border: '3px solid #e8e4df', borderTopColor: '#c8a97a', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 18px' }} />
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Đang tải bài viết...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !post) {
    return (
      <PublicLayout>
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: '3.2rem', color: '#e8e4df', marginBottom: 12 }}>✦</div>
            <h2 style={{ fontWeight: 400, color: '#333', marginBottom: 10 }}>Bài viết không tồn tại</h2>
            <p style={{ color: '#777', marginBottom: 28 }}>{error}</p>
            <Link to="/blog" style={{ color: '#8b6c4a', fontWeight: 600, textDecoration: 'none' }}>
              ← Quay lại trang Bài viết
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div style={{ background: '#f5f1e9', minHeight: '100vh', paddingBottom: 80 }}>
        {/* Elegant top navigation bar */}
        <div style={{ background: '#f9f6f1', borderBottom: '1px solid #e6d9c9' }}>
          <div className="container" style={{ padding: '13px 0' }}>
            <Link
              to="/blog"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                fontSize: '0.83rem', color: '#5c4630', textDecoration: 'none',
                fontWeight: 500, padding: '4px 0',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
              onMouseLeave={e => e.currentTarget.style.color = '#5c4630'}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: '0.78rem' }} />
              <span>Quay lại Tạp chí Nghệ thuật</span>
            </Link>
          </div>
        </div>

        {/* The beautiful article */}
        <div style={{ paddingTop: 8, paddingBottom: 20 }}>
          <BlogRenderer post={post} />
        </div>

        {/* Elegant bottom navigation */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px 60px' }}>
          <div style={{
            borderTop: '1px solid #e6d9c9',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            <Link
              to="/blog"
              style={{
                color: '#8b6c4a', fontWeight: 600, fontSize: '0.93rem',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
              }}
            >
              ← Xem thêm bài viết khác
            </Link>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                background: 'transparent', border: '1px solid #d4c5af',
                color: '#8b6c4a', padding: '8px 18px', borderRadius: 999,
                fontSize: '0.81rem', fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f9f6f1';
                e.currentTarget.style.borderColor = '#c8a97a';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#d4c5af';
              }}
            >
              Lên đầu trang ↑
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default BlogDetail;
