import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { blogApi } from '../services/api';

const CAT_STYLE = {
  'Tìm hiểu nghệ thuật':  { bg: '#f0ece8', color: 'var(--brand-dark)' },
  'Kỹ thuật & Chất liệu': { bg: '#e8f0ee', color: '#2d6a4f' },
  'Tin tức & Sự kiện':    { bg: '#e8edf8', color: '#2d3a8c' },
  'Câu chuyện nghệ sĩ':   { bg: '#f5e8f0', color: '#8c2d6a' },
  'Kỹ thuật vẽ':          { bg: '#e8f0ee', color: '#2d6a4f' },
  'Câu chuyện tác phẩm':  { bg: '#f5e8f0', color: '#8c2d6a' },
  'Nghệ sĩ & Cảm hứng':   { bg: '#fdf6ec', color: 'var(--brand-dark)' },
};

const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

const CatBadge = ({ cat, small }) => {
  const s = CAT_STYLE[cat] || { bg: '#f0ece8', color: 'var(--brand-dark)' };
  return (
    <span style={{ fontSize: small ? '0.68rem' : '0.72rem', fontWeight: 700, padding: small ? '2px 8px' : '3px 11px', background: s.bg, color: s.color }}>
      {cat || 'Khác'}
    </span>
  );
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    blogApi.getAll({ pageSize: 100 })
      .then(res => {
        const data = res.data?.items || res.data || [];
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = posts;

    // Search by title or author name
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.authorName || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [posts, search]);

  const featured = (!search && posts.length > 0) ? posts[0] : null;
  const listPosts = featured ? filtered.filter(p => p.id !== featured.id) : filtered;

  return (
    <PublicLayout>
      <style>{`
        .blog-card { transition: box-shadow .3s cubic-bezier(0.23,1,0.32,1), transform .3s cubic-bezier(0.23,1,0.32,1); cursor: pointer; }
        .blog-card:hover { box-shadow: 0 18px 48px rgba(0,0,0,.11) !important; transform: translateY(-4px) !important; }
        .cat-btn:hover { border-color: var(--ink) !important; color: var(--ink) !important; }
      `}</style>

      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>

        {/* Page header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e8e4df', padding: '28px 0 24px' }}>
          <div className="container">
            <h1 style={{ 
              color: 'var(--ink)', 
              fontWeight: 500, 
              fontSize: 'clamp(1.9rem, 4.2vw, 2.7rem)', 
              letterSpacing: '0.01em', 
              margin: 0,
              lineHeight: 1.15,
              fontFamily: "'Playfair Display', serif"
            }}>
              BÀI VIẾT NGHỆ THUẬT
            </h1>
          </div>
        </div>

      {/* Search bar - giống hệt trang Artists (tìm theo tên bài viết hoặc tác giả) */}
      <div style={{ background: '#faf8f5', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '0.78rem' }} />
            <input
              type="text"
              placeholder="Tìm bài viết hoặc tác giả..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 32px 8px 34px', border: '1px solid #e8e4df', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', color: 'var(--ink)', background: 'white' }}
              onFocus={e => e.target.style.borderColor = 'var(--ink)'}
              onBlur={e => e.target.style.borderColor = '#e8e4df'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem', padding: 0 }}>×</button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 0, paddingBottom: 64 }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>
              <div style={{ width: 36, height: 36, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: '0.9rem' }}>Đang tải bài viết...</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '2.5rem', color: '#e8e4df', marginBottom: 16 }}>✦</p>
              <p style={{ fontSize: '1rem', fontWeight: 300, color: '#767676' }}>Chưa có bài viết nào được đăng</p>
            </div>
          )}

          {/* Featured post */}
          {!loading && featured && (
            <Link
              to={`/blog/${featured.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 40 }}
            >
              <div style={{ background: '#f9f6f1', border: '1px solid #e6d9c9', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                {featured.coverImageUrl ? (
                  <div style={{ width: 260, minWidth: 180, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={featured.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 200 }} onError={e => e.target.style.display = 'none'} />
                  </div>
                ) : (
                  <div style={{ width: 260, minWidth: 180, flexShrink: 0, background: '#f0ece8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, padding: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', color: 'var(--brand)', marginBottom: 8 }}>✦</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--brand-dark)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Bài nổi bật</div>
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 240 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <CatBadge cat={featured.category} />
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{fmtDate(featured.publishedAt || featured.createdAt)}</span>
                    {featured.readTime && <span style={{ fontSize: '0.78rem', color: '#bbb' }}>· {featured.readTime} đọc</span>}
                  </div>
                  <h2 style={{ fontWeight: 400, fontSize: 'clamp(1rem,2.5vw,1.35rem)', color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    {featured.title}
                  </h2>
                  <p style={{ color: '#767676', fontSize: '0.92rem', fontWeight: 300, margin: '0 0 20px', lineHeight: 1.85 }}>
                    {featured.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--brand-dark)', fontWeight: 600 }}>
                      <i className="fas fa-user-circle mr-1" />{featured.authorName}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Result count (search only) */}
          {search && (
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '0.8rem', color: '#777' }}>
                {filtered.length} kết quả cho "{search}"
              </span>
            </div>
          )}


        </div>
      </div>
    </PublicLayout>
  );
};

export default Blog;
