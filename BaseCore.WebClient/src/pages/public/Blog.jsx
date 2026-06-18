import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { blogApi, userApi } from '../../services/api';
import { toImg } from '../../utils/image';
import Pagination from '../../components/ui/Pagination';

const PER_PAGE = 5;
const CARD_HEIGHT = 180;

const CAT_STYLE = {
  'Tìm hiểu nghệ thuật':  { bg: '#f0ece8', color: 'var(--brand-dark)' },
  'Kỹ thuật & Chất liệu': { bg: '#e8f0ee', color: '#2d6a4f' },
  'Tin tức & Sự kiện':    { bg: '#e8edf8', color: '#2d3a8c' },
  'Câu chuyện nghệ sĩ':   { bg: '#f5e8f0', color: '#8c2d6a' },
  'Kỹ thuật vẽ':          { bg: '#e8f0ee', color: '#2d6a4f' },
  'Câu chuyện tác phẩm':  { bg: '#f5e8f0', color: '#8c2d6a' },
  'Nghệ sĩ & Cảm hứng':   { bg: '#fdf6ec', color: 'var(--brand-dark)' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

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

const buildArtistMap = (artists) => {
  const byId = {};
  const byName = {};
  (artists || []).forEach((a) => {
    const id = a.id || a.Id;
    const name = a.name || a.Name;
    const avatar = a.avatarUrl || a.AvatarUrl || '';
    if (id) byId[id] = avatar;
    if (name) byName[name] = avatar;
  });
  return { byId, byName };
};

const resolveAvatar = (post, artistMap) => {
  const fromPost = post.authorAvatarUrl || post.AuthorAvatarUrl || '';
  if (fromPost) return toImg(fromPost) || fromPost;
  const id = post.authorId || post.AuthorId;
  const name = post.authorName || post.AuthorName;
  if (id && artistMap.byId[id]) {
    const url = artistMap.byId[id];
    return toImg(url) || url;
  }
  if (name && artistMap.byName[name]) {
    const url = artistMap.byName[name];
    return toImg(url) || url;
  }
  return null;
};

const ArtistAvatar = ({ post, artistMap, size = 32 }) => {
  const [imgErr, setImgErr] = useState(false);
  const name = post.authorName || post.AuthorName || 'A';
  const initial = name.charAt(0).toUpperCase();
  const src = resolveAvatar(post, artistMap);
  const showImg = src && !imgErr;

  return (
    <div
      className="rounded-full shrink-0 overflow-hidden flex items-center justify-center border-2 border-[rgba(200,169,122,0.4)]"
      style={{
        width: size,
        height: size,
        background: showImg ? '#f0ece8' : 'linear-gradient(135deg, var(--brand-light), var(--brand))',
      }}
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span className="text-white font-bold" style={{ fontSize: size * 0.38 }}>{initial}</span>
      )}
    </div>
  );
};

const BlogPostCard = ({ post, artistMap }) => {
  const cover = toImg(post.coverImageUrl) || post.coverImageUrl;
  const date = post.publishedAt || post.createdAt || post.PublishedAt || post.CreatedAt;
  const authorName = post.authorName || post.AuthorName || 'Tác giả';

  return (
    <Link to={`/blog/${post.id}`} className="group no-underline text-inherit block">
      <div
        className="bg-white border border-[#e6d9c9] overflow-hidden flex flex-row shadow-[0_2px_14px_rgba(0,0,0,0.035)] transition-all duration-300 group-hover:shadow-[0_6px_28px_rgba(0,0,0,0.08)] group-hover:border-[#d4c5af]"
        style={{ height: CARD_HEIGHT }}
      >
        <div className="w-[38%] shrink-0 h-full overflow-hidden bg-[#f0ece8]">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover object-center"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[2rem] text-brand opacity-55">✦</span>
            </div>
          )}
        </div>

        <div className="w-[62%] min-w-0 h-full px-4 sm:px-5 py-3.5 flex flex-col overflow-hidden">
          <div className="flex gap-2 mb-2 flex-wrap items-center">
            <ArtistAvatar post={post} artistMap={artistMap} size={30} />
            <span className="text-[0.76rem] text-brand-dark font-semibold truncate max-w-[120px] sm:max-w-none">{authorName}</span>
            <CatBadge cat={post.category || post.Category} small />
            {date && <span className="text-[0.72rem] text-[#aaa]">{fmtDate(date)}</span>}
          </div>
          <h3 className="font-normal text-[0.95rem] sm:text-[1.02rem] text-ink mt-0 mb-1.5 leading-[1.38] line-clamp-2 group-hover:text-brand-dark transition-colors">
            {post.title || post.Title}
          </h3>
          {(post.excerpt || post.Excerpt) && (
            <p className="text-muted text-[0.8rem] font-light mt-0 mb-0 leading-[1.65] line-clamp-3 hidden sm:block">
              {post.excerpt || post.Excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [artistMap, setArtistMap] = useState({ byId: {}, byName: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.allSettled([
      blogApi.getAll({ pageSize: 100 }),
      userApi.getArtists(),
    ]).then(([blogRes, artistRes]) => {
      if (blogRes.status === 'fulfilled') {
        const data = blogRes.value.data?.items || blogRes.value.data || [];
        setPosts(Array.isArray(data) ? data : []);
      }
      if (artistRes.status === 'fulfilled') {
        setArtistMap(buildArtistMap(artistRes.value.data));
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      (p.title || p.Title || '').toLowerCase().includes(q)
      || (p.authorName || p.AuthorName || '').toLowerCase().includes(q)
      || (p.excerpt || p.Excerpt || '').toLowerCase().includes(q),
    );
  }, [posts, search]);

  const listPosts = filtered;

  const totalPages = Math.max(1, Math.ceil(listPosts.length / PER_PAGE));

  const pagedPosts = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return listPosts.slice(start, start + PER_PAGE);
  }, [listPosts, page]);

  const handlePageChange = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">

        <div className="bg-white border-b border-line pt-7 pb-6">
          <div className="max-w-[1140px] mx-auto px-4">
            <h1
              className="text-ink font-medium text-[clamp(1.9rem,4.2vw,2.7rem)] tracking-[0.01em] m-0 leading-[1.15]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              BÀI VIẾT NGHỆ THUẬT
            </h1>
          </div>
        </div>

        <div className="bg-cream py-4">
          <div className="max-w-[1000px] mx-auto px-4 flex justify-end">
            <div className="relative w-[280px]">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa] text-[0.78rem]" />
              <input
                type="text"
                placeholder="Tìm bài viết hoặc tác giả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-[34px] pr-8 py-2 border border-line focus:border-ink text-[0.82rem] outline-none text-ink bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#aaa] text-base p-0"
                >
                  ×
                </button>
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

          {search && !loading && (
            <div className="mb-6">
              <span className="text-[0.8rem] text-[#777]">
                {filtered.length} kết quả cho &ldquo;{search}&rdquo;
              </span>
            </div>
          )}

          {!loading && listPosts.length > 0 && (
            <section>
              <div className="flex flex-col gap-5">
                {pagedPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} artistMap={artistMap} />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            </section>
          )}

          {!loading && search && filtered.length === 0 && posts.length > 0 && (
            <div className="text-center py-16 bg-white border border-line">
              <p className="text-[2rem] text-line mb-3">✦</p>
              <p className="text-muted font-light">Không tìm thấy bài viết phù hợp</p>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
};

export default Blog;