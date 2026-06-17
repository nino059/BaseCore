import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { blogApi } from '../../services/api';

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
    <span
      className={`font-bold ${small ? 'text-[0.68rem] px-2 py-0.5' : 'text-[0.72rem] px-[11px] py-[3px]'}`}
      style={{ background: s.bg, color: s.color }}
    >
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

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">

        {/* Page header */}
        <div className="bg-white border-b border-line pt-7 pb-6">
          <div className="max-w-[1140px] mx-auto px-4">
            <h1 className="text-ink font-medium text-[clamp(1.9rem,4.2vw,2.7rem)] tracking-[0.01em] m-0 leading-[1.15]" style={{ fontFamily: "'Playfair Display', serif" }}>
              BÀI VIẾT NGHỆ THUẬT
            </h1>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-cream py-4">
          <div className="max-w-[1140px] mx-auto px-4 flex justify-end">
            <div className="relative w-[280px]">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa] text-[0.78rem]" />
              <input
                type="text"
                placeholder="Tìm bài viết hoặc tác giả..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-[34px] pr-8 py-2 border border-line focus:border-ink text-[0.82rem] outline-none text-ink bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#aaa] text-base p-0">×</button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[1140px] mx-auto px-4 pt-0 pb-16">

          {loading && (
            <div className="text-center py-20 text-[#aaa]">
              <div className="w-9 h-9 mx-auto mb-4 rounded-full border-2 border-brand border-t-transparent animate-spin [animation-duration:0.8s]" />
              <p className="text-[0.9rem]">Đang tải bài viết...</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[2.5rem] text-line mb-4">✦</p>
              <p className="text-base font-light text-muted">Chưa có bài viết nào được đăng</p>
            </div>
          )}

          {/* Featured post */}
          {!loading && featured && (
            <Link to={`/blog/${featured.id}`} className="no-underline text-inherit block mb-10">
              <div className="bg-[#f9f6f1] border border-[#e6d9c9] overflow-hidden flex flex-wrap shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                {featured.coverImageUrl ? (
                  <div className="w-[260px] min-w-[180px] shrink-0 overflow-hidden">
                    <img src={featured.coverImageUrl} alt="" className="w-full h-full object-cover min-h-[200px]" onError={e => e.target.style.display = 'none'} />
                  </div>
                ) : (
                  <div className="w-[260px] min-w-[180px] shrink-0 bg-[#f0ece8] flex items-center justify-center min-h-[200px] p-5">
                    <div className="text-center">
                      <div className="text-[3rem] text-brand mb-2">✦</div>
                      <div className="text-[0.65rem] font-bold text-brand-dark tracking-[0.14em] uppercase">Bài nổi bật</div>
                    </div>
                  </div>
                )}
                <div className="flex-1 px-8 py-7 flex flex-col justify-center min-w-[240px]">
                  <div className="flex gap-2.5 mb-3.5 flex-wrap items-center">
                    <CatBadge cat={featured.category} />
                    <span className="text-[0.78rem] text-[#aaa]">{fmtDate(featured.publishedAt || featured.createdAt)}</span>
                    {featured.readTime && <span className="text-[0.78rem] text-[#bbb]">· {featured.readTime} đọc</span>}
                  </div>
                  <h2 className="font-normal text-[clamp(1rem,2.5vw,1.35rem)] text-ink mt-0 mb-3 leading-[1.45]">
                    {featured.title}
                  </h2>
                  <p className="text-muted text-[0.92rem] font-light mt-0 mb-5 leading-[1.85]">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[0.8rem] text-brand-dark font-semibold">
                      <i className="fas fa-user-circle mr-1" />{featured.authorName}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Result count (search only) */}
          {search && (
            <div className="mb-6">
              <span className="text-[0.8rem] text-[#777]">
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
