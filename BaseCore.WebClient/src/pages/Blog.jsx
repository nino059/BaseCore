import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { blogApi } from '../services/api';

const CAT_STYLE = {
  'Tìm hiểu nghệ thuật':  { bg: '#f0ece8', color: '#8b6c4a' },
  'Kỹ thuật & Chất liệu': { bg: '#e8f0ee', color: '#2d6a4f' },
  'Tin tức & Sự kiện':    { bg: '#e8edf8', color: '#2d3a8c' },
  'Câu chuyện nghệ sĩ':   { bg: '#f5e8f0', color: '#8c2d6a' },
  'Kỹ thuật vẽ':          { bg: '#e8f0ee', color: '#2d6a4f' },
  'Câu chuyện tác phẩm':  { bg: '#f5e8f0', color: '#8c2d6a' },
  'Nghệ sĩ & Cảm hứng':   { bg: '#fdf6ec', color: '#8b6c4a' },
};

const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

const CatBadge = ({ cat, small }) => {
  const s = CAT_STYLE[cat] || { bg: '#f0ece8', color: '#8b6c4a' };
  return (
    <span style={{ fontSize: small ? '0.68rem' : '0.72rem', fontWeight: 700, padding: small ? '2px 8px' : '3px 11px', background: s.bg, color: s.color }}>
      {cat || 'Khác'}
    </span>
  );
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('Tất cả');

  useEffect(() => {
    blogApi.getAll({ pageSize: 100 })
      .then(res => {
        const data = res.data?.items || res.data || [];
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cats = ['Tất cả', ...new Set(posts.map(p => p.category).filter(Boolean))];
  const featured = posts[0] || null;
  const rest = posts.slice(1);
  const filtered = activeCat === 'Tất cả' ? rest : rest.filter(p => p.category === activeCat);

  return (
    <PublicLayout>
      <style>{`
        .blog-card { transition: box-shadow .25s, transform .25s; cursor: pointer; }
        .blog-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,.1) !important; transform: translateY(-3px) !important; }
        .cat-btn:hover { border-color: #1a1a1a !important; color: #1a1a1a !important; }
      `}</style>

      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>

        {/* Page header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e8e4df', padding: '36px 0 28px' }}>
          <div className="container">
            <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: 10 }}>
              <Link to="/" style={{ color: '#aaa', textDecoration: 'none' }}>Trang chủ</Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: '#1a1a1a' }}>Bài viết</span>
            </div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#c8a97a', textTransform: 'uppercase', margin: '0 0 8px' }}>Tạp chí nghệ thuật</p>
            <h1 style={{ fontWeight: 200, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#1a1a1a', letterSpacing: '0.04em', margin: '0 0 10px' }}>Bài Viết Nghệ Thuật</h1>
            <p style={{ color: '#767676', fontSize: '0.95rem', fontWeight: 300, margin: 0 }}>
              {loading ? 'Đang tải...' : `${posts.length} bài viết từ các họa sĩ`}
            </p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>
              <div style={{ width: 36, height: 36, border: '2px solid #c8a97a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
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

          {!loading && featured && (
            <>
              {/* Featured post */}
              <div style={{ background: 'white', border: '1px solid #e8e4df', overflow: 'hidden', marginBottom: 40, display: 'flex', flexWrap: 'wrap' }}>
                {featured.coverImageUrl ? (
                  <div style={{ width: 260, minWidth: 180, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={featured.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 200 }} onError={e => e.target.style.display = 'none'} />
                  </div>
                ) : (
                  <div style={{ width: 260, minWidth: 180, flexShrink: 0, background: '#f0ece8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, padding: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', color: '#c8a97a', marginBottom: 8 }}>✦</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8b6c4a', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Bài nổi bật</div>
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 240 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <CatBadge cat={featured.category} />
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{fmtDate(featured.publishedAt || featured.createdAt)}</span>
                    {featured.readTime && <span style={{ fontSize: '0.78rem', color: '#bbb' }}>· {featured.readTime} đọc</span>}
                  </div>
                  <h2 style={{ fontWeight: 400, fontSize: 'clamp(1rem,2.5vw,1.35rem)', color: '#1a1a1a', margin: '0 0 12px', lineHeight: 1.45 }}>
                    {featured.title}
                  </h2>
                  <p style={{ color: '#767676', fontSize: '0.92rem', fontWeight: 300, margin: '0 0 20px', lineHeight: 1.85 }}>
                    {featured.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#8b6c4a', fontWeight: 600 }}>
                      <i className="fas fa-user-circle mr-1" />{featured.authorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category filter */}
              {cats.length > 1 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginRight: 4 }}>Chủ đề:</span>
                  {cats.map(cat => {
                    const active = activeCat === cat;
                    return (
                      <button key={cat} className="cat-btn" onClick={() => setActiveCat(cat)}
                        style={{
                          padding: '6px 16px', border: `1.5px solid ${active ? '#1a1a1a' : '#e8e4df'}`,
                          background: active ? '#1a1a1a' : 'white',
                          color: active ? 'white' : '#767676',
                          cursor: 'pointer', fontSize: '0.8rem',
                          fontWeight: active ? 700 : 400, letterSpacing: '0.04em',
                          transition: 'all 0.15s',
                        }}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Posts grid */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontWeight: 300, fontSize: '0.95rem' }}>
                  <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
                  Không có bài viết nào trong chủ đề này
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 22 }}>
                  {filtered.map(post => (
                    <div key={post.id} className="blog-card"
                      style={{ background: 'white', border: '1px solid #e8e4df', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {post.coverImageUrl ? (
                        <div style={{ height: 150, overflow: 'hidden' }}>
                          <img src={post.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                        </div>
                      ) : (
                        <div style={{ height: 150, background: `hsl(${(post.id * 47) % 360}, 20%, 92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '2rem', color: `hsl(${(post.id * 47) % 360}, 35%, 60%)` }}>✦</span>
                        </div>
                      )}
                      <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <CatBadge cat={post.category} small />
                          {post.readTime && <span style={{ fontSize: '0.72rem', color: '#bbb' }}>{post.readTime} đọc</span>}
                        </div>
                        <h3 style={{ fontWeight: 500, fontSize: '0.97rem', color: '#1a1a1a', margin: '0 0 10px', lineHeight: 1.55 }}>
                          {post.title}
                        </h3>
                        <p style={{ color: '#767676', fontSize: '0.85rem', fontWeight: 300, margin: '0 0 16px', lineHeight: 1.75, flex: 1,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #f0ece8' }}>
                          <span style={{ fontSize: '0.78rem', color: '#8b6c4a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                            <i className="fas fa-user-circle mr-1" />{post.authorName}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#bbb', flexShrink: 0 }}>{fmtDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Footer notice */}
          {!loading && posts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 52, padding: '20px', background: 'white', border: '1px solid #e8e4df' }}>
              <p style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 300, margin: 0, letterSpacing: '0.04em' }}>
                ✦ &nbsp; Nội dung mới được cập nhật thường xuyên &nbsp; ✦
              </p>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
};

export default Blog;
