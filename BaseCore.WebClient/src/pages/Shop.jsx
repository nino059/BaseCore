import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import PublicLayout from '../components/PublicLayout';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
const toImgUrl = (url) => !url ? null : url.startsWith('http') ? url : `http://localhost:5000${url}`;

const SORTS = [
  { label: 'Mặc định',     value: 'default'   },
  { label: 'Mới nhất',     value: 'newest'    },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc'},
];

const PRICE_PRESETS = [
  { label: 'Dưới 1 triệu',  min: '',         max: '1000000'  },
  { label: '1 – 3 triệu',   min: '1000000',  max: '3000000'  },
  { label: '3 – 5 triệu',   min: '3000000',  max: '5000000'  },
  { label: 'Trên 5 triệu',  min: '5000000',  max: ''         },
];

const SIZE_PRESETS = [
  { label: 'Nhỏ (< 30cm)',   min: '', max: '30'  },
  { label: 'Vừa (30–60cm)',  min: '30', max: '60' },
  { label: 'Lớn (> 60cm)',   min: '60', max: ''   },
];

const PER_PAGE = 12;

const getPageNums = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total]);
  for (let i = Math.max(2, cur - 2); i <= Math.min(total - 1, cur + 2); i++) s.add(i);
  return [...s].sort((a, b) => a - b).reduce((acc, n, i, arr) => {
    if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
    acc.push(n);
    return acc;
  }, []);
};

const Shop = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [all, setAll]           = useState([]);
  const [categories, setCats]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Applied filters
  const [search,     setSearch]     = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [artist,     setArtist]     = useState('');
  const [minPrice,   setMinPrice]   = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [minSize,    setMinSize]    = useState('');
  const [maxSize,    setMaxSize]    = useState('');
  const [sort,       setSort]       = useState('default');
  const [page,       setPage]       = useState(1);

  // Draft inputs (chưa apply, chờ Enter/click)
  const [searchDraft, setSearchDraft] = useState('');
  const [artistDraft, setArtistDraft] = useState('');

  const { addToCart } = useCart();
  const { user, isArtist } = useAuth();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    const a  = searchParams.get('artist');
    const c  = searchParams.get('category');
    const kw = searchParams.get('q');
    if (a)  { setArtist(a);  setArtistDraft(a); }
    if (c)  setCategoryId(c);
    if (kw) { setSearch(kw); setSearchDraft(kw); }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      categoryApi.getAll(),
      productApi.getAll({ pageSize: 999 }),
    ]).then(([catRes, prodRes]) => {
      setCats(catRes.data || []);
      const data = prodRes.data?.items || prodRes.data?.data || prodRes.data || [];
      setAll(Array.isArray(data) ? data : []);
    }).catch(() => setError('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  const reset = () => setPage(1);

  const applySearch = () => { setSearch(searchDraft); reset(); };
  const applyArtist = () => { setArtist(artistDraft);  reset(); };

  const filtered = useMemo(() => {
    return all
      .filter(p => {
        const name   = (p.name || '').toLowerCase();
        const art    = (p.artistName || p.artist || '').toLowerCase();
        const price  = p.discountPrice ?? p.price ?? 0;
        const w      = Number(p.width  || 0);
        const h      = Number(p.height || 0);
        const maxDim = Math.max(w, h);
        return (
          (!search || name.includes(search.toLowerCase())) &&
          (!categoryId || String(p.categoryId) === String(categoryId)) &&
          (!artist || art.includes(artist.toLowerCase())) &&
          (!minPrice || price >= Number(minPrice)) &&
          (!maxPrice || price <= Number(maxPrice)) &&
          (!minSize || maxDim >= Number(minSize)) &&
          (!maxSize || maxDim <= Number(maxSize))
        );
      })
      .sort((a, b) => {
        const pa = a.discountPrice ?? a.price ?? 0;
        const pb = b.discountPrice ?? b.price ?? 0;
        if (sort === 'price_asc')  return pa - pb;
        if (sort === 'price_desc') return pb - pa;
        if (sort === 'newest')     return b.id - a.id;
        return 0;
      });
  }, [all, search, categoryId, artist, minPrice, maxPrice, minSize, maxSize, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageNums = getPageNums(page, totalPages);

  const catsWithCount = useMemo(() =>
    categories.map(c => ({ ...c, count: all.filter(p => String(p.categoryId) === String(c.id)).length })),
  [categories, all]);

  const handleAdd = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const clearAll = () => {
    setSearch(''); setSearchDraft('');
    setCategoryId('');
    setArtist(''); setArtistDraft('');
    setMinPrice(''); setMaxPrice('');
    setMinSize(''); setMaxSize('');
    setSort('default');
    reset();
  };

  const activeCount = [search, categoryId, artist, minPrice || maxPrice, minSize || maxSize].filter(Boolean).length + (sort !== 'default' ? 1 : 0);

  const chips = [
    search     && { key: 'search', icon: 'fa-search',      label: `"${search}"`,        clear: () => { setSearch(''); setSearchDraft(''); reset(); } },
    categoryId && { key: 'cat',    icon: 'fa-layer-group', label: catsWithCount.find(c => String(c.id) === String(categoryId))?.name || 'Danh mục', clear: () => { setCategoryId(''); reset(); } },
    artist     && { key: 'artist', icon: 'fa-user-circle', label: `Nghệ sĩ: ${artist}`, clear: () => { setArtist(''); setArtistDraft(''); reset(); } },
    (minPrice || maxPrice) && { key: 'price', icon: 'fa-tag',   label: `Giá: ${minPrice ? fmt(minPrice) : '0'} – ${maxPrice ? fmt(maxPrice) : '∞'}`, clear: () => { setMinPrice(''); setMaxPrice(''); reset(); } },
    (minSize  || maxSize)  && { key: 'size',  icon: 'fa-ruler', label: `Kích thước: ${minSize || '0'} – ${maxSize || '∞'} cm`, clear: () => { setMinSize(''); setMaxSize(''); reset(); } },
    sort !== 'default' && { key: 'sort', icon: 'fa-sort', label: SORTS.find(s => s.value === sort)?.label, clear: () => { setSort('default'); reset(); } },
  ].filter(Boolean);

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Tìm kiếm tên tác phẩm */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#8b6c4a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Tìm kiếm</div>
        <div style={{ position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c8a97a', fontSize: '0.82rem' }} />
          <input
            value={searchDraft}
            onChange={e => setSearchDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applySearch(); }}
            placeholder="Tên tác phẩm..."
            style={{ width: '100%', padding: '9px 64px 9px 32px', border: '1.5px solid #e8e4df', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#faf8f5' }}
          />
          <button
            onClick={applySearch}
            title="Tìm kiếm"
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, padding: '0 12px', background: '#1a1a1a', border: 'none', cursor: 'pointer', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}
          >
            Tìm
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: '#f0ece8', margin: '0 16px' }} />

      {/* Danh mục */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#8b6c4a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Danh mục</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => { setCategoryId(''); reset(); }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: !categoryId ? 700 : 400, fontSize: '0.88rem', background: !categoryId ? '#f0ece8' : 'transparent', color: !categoryId ? '#1a1a1a' : '#767676' }}
          >
            <span>Tất cả</span>
            <span style={{ fontSize: '0.75rem', color: !categoryId ? '#8b6c4a' : '#aaa', background: !categoryId ? '#e8e4df' : '#f5f5f5', padding: '1px 8px', fontWeight: 600 }}>{all.length}</span>
          </button>
          {catsWithCount.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(String(cat.id) === categoryId ? '' : String(cat.id)); reset(); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: String(cat.id) === categoryId ? 700 : 400, fontSize: '0.88rem', background: String(cat.id) === categoryId ? '#f0ece8' : 'transparent', color: String(cat.id) === categoryId ? '#1a1a1a' : '#767676' }}
            >
              <span>{cat.name}</span>
              <span style={{ fontSize: '0.75rem', color: String(cat.id) === categoryId ? '#8b6c4a' : '#aaa', background: String(cat.id) === categoryId ? '#e8e4df' : '#f5f5f5', padding: '1px 8px', fontWeight: 600 }}>{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: '#f0ece8', margin: '0 16px' }} />

      {/* Nghệ sĩ */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#8b6c4a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Nghệ sĩ</div>
        <div style={{ position: 'relative' }}>
          <i className="fas fa-user-circle" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c8a97a', fontSize: '0.82rem' }} />
          <input
            value={artistDraft}
            onChange={e => setArtistDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyArtist(); }}
            placeholder="Tên nghệ sĩ..."
            style={{ width: '100%', padding: '9px 64px 9px 32px', border: '1.5px solid #e8e4df', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#faf8f5' }}
          />
          <button
            onClick={applyArtist}
            title="Tìm nghệ sĩ"
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, padding: '0 12px', background: '#1a1a1a', border: 'none', cursor: 'pointer', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}
          >
            Tìm
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: '#f0ece8', margin: '0 16px' }} />

      {/* Khoảng giá */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#8b6c4a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Khoảng giá</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {PRICE_PRESETS.map(preset => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button key={preset.label}
                onClick={() => { setMinPrice(active ? '' : preset.min); setMaxPrice(active ? '' : preset.max); reset(); }}
                style={{ padding: '5px 10px', border: `1.5px solid ${active ? '#1a1a1a' : '#e8e4df'}`, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, background: active ? '#1a1a1a' : 'white', color: active ? 'white' : '#767676' }}
              >{preset.label}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="number" placeholder="Từ" value={minPrice} onChange={e => { setMinPrice(e.target.value); reset(); }}
            style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e8e4df', fontSize: '0.82rem', outline: 'none', background: '#faf8f5', minWidth: 0 }} />
          <span style={{ color: '#aaa', fontWeight: 500, fontSize: '0.8rem' }}>–</span>
          <input type="number" placeholder="Đến" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); reset(); }}
            style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e8e4df', fontSize: '0.82rem', outline: 'none', background: '#faf8f5', minWidth: 0 }} />
        </div>
      </div>

      <div style={{ height: 1, background: '#f0ece8', margin: '0 16px' }} />

      {/* Kích thước */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#8b6c4a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Kích thước (cạnh lớn nhất)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {SIZE_PRESETS.map(preset => {
            const active = minSize === preset.min && maxSize === preset.max;
            return (
              <button key={preset.label}
                onClick={() => { setMinSize(active ? '' : preset.min); setMaxSize(active ? '' : preset.max); reset(); }}
                style={{ padding: '5px 10px', border: `1.5px solid ${active ? '#1a1a1a' : '#e8e4df'}`, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, background: active ? '#1a1a1a' : 'white', color: active ? 'white' : '#767676' }}
              >{preset.label}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="number" placeholder="Từ (cm)" value={minSize} onChange={e => { setMinSize(e.target.value); reset(); }}
            style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e8e4df', fontSize: '0.82rem', outline: 'none', background: '#faf8f5', minWidth: 0 }} />
          <span style={{ color: '#aaa', fontWeight: 500, fontSize: '0.8rem' }}>–</span>
          <input type="number" placeholder="Đến (cm)" value={maxSize} onChange={e => { setMaxSize(e.target.value); reset(); }}
            style={{ flex: 1 , padding: '8px 10px', border: '1.5px solid #e8e4df', fontSize: '0.82rem', outline: 'none', background: '#faf8f5', minWidth: 0 }} />
        </div>
      </div>

      {activeCount > 0 && (
        <div style={{ padding: '8px 20px 20px' }}>
          <button onClick={clearAll} style={{ width: '100%', padding: '9px', border: '1.5px solid #e8e4df', background: 'white', color: '#767676', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: '0.06em' }}>
            <i className="fas fa-times" /> Xóa bộ lọc ({activeCount})
          </button>
        </div>
      )}
    </div>
  );

  return (
    <PublicLayout>
      <style>{`
        .sp-card { transition: box-shadow .26s, transform .26s; }
        .sp-card:hover { box-shadow: 0 18px 48px rgba(0,0,0,.12) !important; transform: translateY(-4px) !important; }
        .sp-add { transition: all .2s; }
        .sp-add:hover { opacity: 0.85; }
        .sp-artist-link { color: #8b6c4a; text-decoration: none; }
        .sp-artist-link:hover { text-decoration: underline; text-underline-offset: 2px; }
        @media (max-width: 768px) {
          .sp-sidebar-desktop { display: none !important; }
          .sp-mobile-bar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .sp-sidebar-desktop { display: block !important; }
          .sp-mobile-bar { display: none !important; }
          .sp-mobile-drawer { display: none !important; }
        }
      `}</style>

      <div style={{ background: '#faf8f5', borderBottom: '1px solid #e8e4df', padding: '32px 0 28px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: 8 }}>
                <Link to="/" style={{ color: '#aaa', textDecoration: 'none' }}>Trang chủ</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: '#1a1a1a' }}>Cửa hàng</span>
              </div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#c8a97a', textTransform: 'uppercase', marginBottom: 6 }}>Bộ sưu tập</p>
              <h1 style={{ color: '#1a1a1a', fontWeight: 200, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '0.04em', margin: 0 }}>Tranh nghệ thuật</h1>
              <p style={{ color: '#767676', margin: '6px 0 0', fontSize: '0.88rem', fontWeight: 300 }}>
                {loading ? 'Đang tải…' : `${all.length} tác phẩm độc đáo`}
              </p>
            </div>
            <div className="d-none d-md-flex" style={{ alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: 300 }}>Sắp xếp:</span>
              <select value={sort} onChange={e => { setSort(e.target.value); reset(); }}
                style={{ padding: '9px 14px', border: '1.5px solid #e8e4df', fontSize: '0.88rem', background: 'white', color: '#1a1a1a', cursor: 'pointer', outline: 'none' }}>
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#faf8f5', minHeight: '70vh', paddingBottom: 60 }}>
        <div className="container" style={{ paddingTop: 28 }}>

          <div className="sp-mobile-bar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', border: '1.5px solid #e8e4df', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', letterSpacing: '0.06em' }}>
              <i className="fas fa-sliders-h" style={{ color: '#c8a97a' }} />
              Bộ lọc {activeCount > 0 && <span style={{ background: '#1a1a1a', color: 'white', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{activeCount}</span>}
            </button>
            <select value={sort} onChange={e => { setSort(e.target.value); reset(); }}
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e8e4df', background: 'white', fontSize: '0.88rem', cursor: 'pointer', outline: 'none', color: '#1a1a1a' }}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {sidebarOpen && (
            <div className="sp-mobile-drawer" style={{ display: 'block', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: 20, overflow: 'hidden', border: '1px solid #f0ece8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0ece8' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8b6c4a' }}>Bộ lọc</span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#aaa' }}>×</button>
              </div>
              <SidebarContent />
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            <aside className="sp-sidebar-desktop" style={{ width: 240, flexShrink: 0, background: 'white', overflow: 'hidden', border: '1px solid #f0ece8', position: 'sticky', top: 84 }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0ece8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-sliders-h" style={{ color: '#c8a97a', fontSize: '0.88rem' }} />
                <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b6c4a' }}>Bộ lọc</span>
                {activeCount > 0 && <span style={{ marginLeft: 'auto', background: '#1a1a1a', color: 'white', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{activeCount}</span>}
              </div>
              <SidebarContent />
            </aside>

            <div style={{ flex: 1, minWidth: 0 }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: '#767676', fontSize: '0.88rem', fontWeight: 300 }}>
                  {loading ? 'Đang tải…' : (
                    filtered.length === all.length
                      ? <><strong style={{ color: '#1a1a1a', fontWeight: 600 }}>{all.length}</strong> tác phẩm</>
                      : <><strong style={{ color: '#c8a97a', fontWeight: 700 }}>{filtered.length}</strong> kết quả trong <strong style={{ color: '#1a1a1a' }}>{all.length}</strong> tác phẩm</>
                  )}
                </span>
                {filtered.length > 0 && (
                  <span style={{ color: '#aaa', fontSize: '0.82rem' }}>Trang {page}/{totalPages}</span>
                )}
              </div>

              {chips.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                  {chips.map(chip => (
                    <span key={chip.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', background: '#f0ece8', border: '1px solid #e8e4df', color: '#8b6c4a', fontSize: '0.82rem', fontWeight: 600 }}>
                      <i className={`fas ${chip.icon}`} style={{ fontSize: '0.7rem' }} />
                      {chip.label}
                      <button onClick={chip.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8a97a', fontSize: '1rem', padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
                    </span>
                  ))}
                  {chips.length > 1 && (
                    <button onClick={clearAll} style={{ padding: '5px 12px', border: 'none', background: '#1a1a1a', color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                      Xóa tất cả
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ background: 'white', overflow: 'hidden' }}>
                      <div style={{ paddingBottom: '133%', background: '#f0ece8' }} />
                      <div style={{ padding: 16 }}>
                        <div style={{ height: 14, background: '#f0ece8', marginBottom: 8, width: '75%' }} />
                        <div style={{ height: 12, background: '#f0ece8', marginBottom: 12, width: '50%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ color: '#991b1b', fontWeight: 300, marginBottom: 16 }}>{error}</p>
                  <button onClick={() => window.location.reload()} style={{ padding: '12px 28px', border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.78rem' }}>Thử lại</button>
                </div>
              ) : paged.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white' }}>
                  <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 16 }}>✦</p>
                  <p style={{ fontWeight: 300, fontSize: '1rem', color: '#767676', marginBottom: 8 }}>Không tìm thấy tác phẩm phù hợp</p>
                  <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: 20 }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  <button onClick={clearAll} style={{ padding: '12px 28px', border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.78rem' }}>Xóa bộ lọc</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
                  {paged.map(p => {
                    const imgUrl  = toImgUrl(p.imageUrl);
                    const inCart  = addedId === p.id;
                    const price   = p.discountPrice ?? p.price ?? 0;
                    const hasDisc = p.discountPrice && p.discountPrice < p.price;
                    return (
                      <Link key={p.id} to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="sp-card" style={{ background: 'white', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', height: '100%', display: 'flex', flexDirection: 'column' }}>

                          <div style={{ paddingBottom: '133%', position: 'relative', background: '#f0ece8', overflow: 'hidden', flexShrink: 0 }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} loading="lazy"
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s ease' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ece8', flexDirection: 'column', gap: 8 }}>
                                <i className="fas fa-image" style={{ fontSize: '2rem', color: '#d4c4b0' }} />
                              </div>
                            )}
                            {p.categoryName && (
                              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(26,26,26,0.6)', color: 'white', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700, backdropFilter: 'blur(4px)', letterSpacing: '0.04em' }}>
                                {p.categoryName}
                              </div>
                            )}
                            {hasDisc && (
                              <div style={{ position: 'absolute', top: 10, right: 10, background: '#1a1a1a', color: 'white', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 800 }}>
                                -{Math.round((1 - p.discountPrice / p.price) * 100)}%
                              </div>
                            )}
                            {p.stock === 0 && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ background: 'white', color: '#1a1a1a', padding: '6px 16px', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hết hàng</span>
                              </div>
                            )}
                          </div>

                          <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </div>
                            {(p.artistName || p.artist) && (
                              <Link
                                to="/artists"
                                onClick={e => e.stopPropagation()}
                                className="sp-artist-link"
                                style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.04em', display: 'block' }}
                              >
                                {p.artistName || p.artist}
                              </Link>
                            )}
                            {p.material && (
                              <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.material}
                              </div>
                            )}
                            {(p.width || p.height) && (
                              <div style={{ fontSize: '0.72rem', color: '#8b6c4a', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>
                                {p.width && p.height ? `${p.width} × ${p.height} cm` : p.width ? `${p.width} cm` : `${p.height} cm`}
                              </div>
                            )}
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.92rem', lineHeight: 1.1 }}>
                                  {fmt(price)}
                                </div>
                                {hasDisc && (
                                  <div style={{ fontSize: '0.73rem', color: '#aaa', textDecoration: 'line-through', lineHeight: 1 }}>
                                    {fmt(p.price)}
                                  </div>
                                )}
                              </div>
                              {!isArtist && (
                              <button className="sp-add"
                                onClick={e => handleAdd(e, p)}
                                disabled={p.stock === 0}
                                style={{ padding: '7px 12px', border: 'none', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap', letterSpacing: '0.06em',
                                  background: inCart ? '#2d6a4f' : (p.stock > 0 ? '#1a1a1a' : '#e5e7eb'),
                                  color: p.stock > 0 ? 'white' : '#9ca3af',
                                }}>
                                {inCart ? <><i className="fas fa-check mr-1" />Đã thêm</> : <><i className="fas fa-cart-plus mr-1" />Thêm</>}
                              </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {!loading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 40, flexWrap: 'wrap' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: '8px 16px', border: '1.5px solid #e8e4df', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#ddd' : '#1a1a1a', fontWeight: 600, fontSize: '0.85rem' }}>
                    ← Trước
                  </button>
                  {pageNums.map((n, i) => n === '…' ? (
                    <span key={`e${i}`} style={{ padding: '8px 4px', color: '#aaa', fontSize: '0.85rem' }}>…</span>
                  ) : (
                    <button key={n} onClick={() => setPage(n)}
                      style={{ width: 38, height: 38, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                        background: page === n ? '#1a1a1a' : 'white',
                        color: page === n ? 'white' : '#1a1a1a',
                        outline: page !== n ? '1.5px solid #e8e4df' : 'none',
                      }}>{n}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '8px 16px', border: '1.5px solid #e8e4df', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#ddd' : '#1a1a1a', fontWeight: 600, fontSize: '0.85rem' }}>
                    Sau →
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Shop;
