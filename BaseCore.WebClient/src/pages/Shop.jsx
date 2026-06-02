import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import PublicLayout from '../components/PublicLayout';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toImg as toImgUrl } from '../utils/image';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const SORTS = [
  { label: 'Mặc định',     value: 'default'   },
  { label: 'Tên A → Z',    value: 'name_asc'  },
  { label: 'Tên Z → A',    value: 'name_desc' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc'},
];

const PRICE_PRESETS = [
  { label: 'Dưới 10 triệu',   min: '',           max: '10000000'   },
  { label: '10 đến 100 triệu',  min: '10000000',   max: '100000000'  },
  { label: '100 triệu đến 1 tỷ', min: '100000000',  max: '1000000000' },
  { label: 'Trên 1 tỷ',       min: '1000000000', max: ''           },
];

const SIZE_PRESETS = [
  { label: 'Nhỏ (< 50cm)',  min: '',  max: '50'  },
  { label: 'Lớn (≥ 50cm)',  min: '50', max: ''   },
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

  // Unified search draft
  const [searchDraft, setSearchDraft] = useState('');

  const { addToCart, items } = useCart();
  const { user, isArtist } = useAuth();
  const [addedId, setAddedId] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);

  useEffect(() => {
    const c  = searchParams.get('category');
    const kw = searchParams.get('q');
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

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    return all
      .filter(p => {
        const name   = (p.name || '').toLowerCase();
        const art    = (p.artistName || p.artist || '').toLowerCase();
        const price  = p.discountPrice ?? p.price ?? 0;
        const w      = Number(p.width  || 0);
        const h      = Number(p.height || 0);
        const maxDim = Math.max(w, h);
        const matchesSearch = !q || name.includes(q) || art.includes(q);
        return (
          matchesSearch &&
          (!categoryId || String(p.categoryId) === String(categoryId)) &&
          (!minPrice || price >= Number(minPrice)) &&
          (!maxPrice || price <= Number(maxPrice)) &&
          (!minSize || maxDim >= Number(minSize)) &&
          (!maxSize || maxDim <= Number(maxSize))
        );
      })
      .sort((a, b) => {
        const pa = a.discountPrice ?? a.price ?? 0;
        const pb = b.discountPrice ?? b.price ?? 0;

        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();

        if (sort === 'price_asc')   return pa - pb;
        if (sort === 'price_desc')  return pb - pa;
        if (sort === 'name_asc')    return nameA.localeCompare(nameB, 'vi');
        if (sort === 'name_desc')   return nameB.localeCompare(nameA, 'vi');
        return 0;
      });
  }, [all, search, categoryId, minPrice, maxPrice, minSize, maxSize, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageNums = getPageNums(page, totalPages);

  const catsWithCount = useMemo(() =>
    categories.map(c => ({ ...c, count: all.filter(p => String(p.categoryId) === String(c.id)).length })),
  [categories, all]);

  const handleAdd = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate('/login'); return; }

    // Kiểm tra xem tranh đã có trong giỏ hàng chưa (dựa trên dữ liệu thực)
    const alreadyInCart = items.some(i => i.id === product.id);
    if (alreadyInCart) {
      setCartMessage(`Tranh "${product.name}" đã có trong giỏ hàng.`);
      setTimeout(() => setCartMessage(null), 2500);
      return;
    }

    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const clearAll = () => {
    setSearch(''); setSearchDraft('');
    setCategoryId('');
    setMinPrice(''); setMaxPrice('');
    setMinSize(''); setMaxSize('');
    setSort('default');
    reset();
  };

  const activeCount = [search, categoryId, minPrice || maxPrice, minSize || maxSize].filter(Boolean).length + (sort !== 'default' ? 1 : 0);

  const chips = [
    search     && { key: 'search', icon: 'fa-search',      label: `"${search}"`,        clear: () => { setSearch(''); setSearchDraft(''); reset(); } },
    categoryId && { key: 'cat',    icon: 'fa-layer-group', label: catsWithCount.find(c => String(c.id) === String(categoryId))?.name || 'Danh mục', clear: () => { setCategoryId(''); reset(); } },
    (minPrice || maxPrice) && { key: 'price', icon: 'fa-tag',   label: `Giá: ${minPrice ? fmt(minPrice) : '0'} – ${maxPrice ? fmt(maxPrice) : '∞'}`, clear: () => { setMinPrice(''); setMaxPrice(''); reset(); } },
    (minSize  || maxSize)  && { key: 'size',  icon: 'fa-ruler', label: `Kích thước: ${minSize || '0'} – ${maxSize || '∞'} cm`, clear: () => { setMinSize(''); setMaxSize(''); reset(); } },
    sort !== 'default' && { key: 'sort', icon: 'fa-sort', label: SORTS.find(s => s.value === sort)?.label, clear: () => { setSort('default'); reset(); } },
  ].filter(Boolean);

  const LeftFilters = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Sắp xếp - phía trên danh mục (cột bên trái) */}
      <div style={{ padding: '14px 20px 8px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--brand-dark)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          <i className="fas fa-sort" style={{ color: 'var(--brand)', fontSize: '0.88rem' }} /> SẮP XẾP
        </div>
        <select 
          value={sort} 
          onChange={e => { setSort(e.target.value); reset(); }}
          style={{ 
            width: '100%',
            padding: '8px 10px', 
            border: '1.5px solid #e8e4df', 
            fontSize: '0.82rem', 
            background: 'white', 
            color: 'var(--ink)', 
            cursor: 'pointer', 
            outline: 'none'
          }}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Danh mục */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--brand-dark)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          <i className="fas fa-layer-group" style={{ color: 'var(--brand)', fontSize: '0.88rem' }} /> DANH MỤC
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => { setCategoryId(''); reset(); }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: !categoryId ? 700 : 400, fontSize: '0.88rem', background: !categoryId ? '#f0ece8' : 'transparent', color: !categoryId ? 'var(--ink)' : '#767676' }}
          >
            <span>Tất cả</span>
            <span style={{ fontSize: '0.75rem', color: !categoryId ? 'var(--brand-dark)' : '#aaa', background: !categoryId ? '#e8e4df' : '#f5f5f5', padding: '1px 8px', fontWeight: 600 }}>{all.length}</span>
          </button>
          {catsWithCount.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(String(cat.id) === categoryId ? '' : String(cat.id)); reset(); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: String(cat.id) === categoryId ? 700 : 400, fontSize: '0.88rem', background: String(cat.id) === categoryId ? '#f0ece8' : 'transparent', color: String(cat.id) === categoryId ? 'var(--ink)' : '#767676' }}
            >
              <span>{cat.name}</span>
              <span style={{ fontSize: '0.75rem', color: String(cat.id) === categoryId ? 'var(--brand-dark)' : '#aaa', background: String(cat.id) === categoryId ? '#e8e4df' : '#f5f5f5', padding: '1px 8px', fontWeight: 600 }}>{cat.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

const RightFilters = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Khoảng giá */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--brand-dark)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          <i className="fas fa-sliders-h" style={{ color: 'var(--brand)', fontSize: '0.88rem' }} /> KHOẢNG GIÁ
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
          {PRICE_PRESETS.map(preset => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button key={preset.label}
                onClick={() => { setMinPrice(active ? '' : preset.min); setMaxPrice(active ? '' : preset.max); reset(); }}
                style={{ padding: '5px 10px', border: `1.5px solid ${active ? 'var(--ink)' : '#e8e4df'}`, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, background: active ? 'var(--ink)' : 'white', color: active ? 'white' : '#767676' }}
              >{preset.label}</button>
            );
          })}
        </div>

        {/* Giá - 2 dòng + chức năng +/- , nhãn ra ngoài bên trái */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Từ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: '#888', width: 32 }}>Từ</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button 
                onClick={() => { 
                  const current = Number(minPrice) || 0; 
                  setMinPrice(Math.max(0, current - 100000)); 
                  reset(); 
                }}
                style={{ width: 20, height: 20, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 3 }}
              >−</button>
              <input 
                type="number" 
                value={minPrice} 
                onChange={e => { setMinPrice(e.target.value); reset(); }}
                style={{ width: '90px', padding: '5px 6px', border: '1.5px solid #e8e4df', fontSize: '0.82rem', outline: 'none', background: '#faf8f5' }} 
              />
              <button 
                onClick={() => { 
                  const current = Number(minPrice) || 0; 
                  setMinPrice(current + 100000); 
                  reset(); 
                }}
                style={{ width: 20, height: 20, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 3 }}
              >+</button>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>đ</span>
            </div>
          </div>

          {/* Đến */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: '#888', width: 32 }}>đến</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button 
                onClick={() => { 
                  const current = Number(maxPrice) || 0; 
                  setMaxPrice(Math.max(0, current - 100000)); 
                  reset(); 
                }}
                style={{ width: 20, height: 20, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 3 }}
              >−</button>
              <input 
                type="number" 
                value={maxPrice} 
                onChange={e => { setMaxPrice(e.target.value); reset(); }}
                style={{ width: '90px', padding: '5px 6px', border: '1.5px solid #e8e4df', fontSize: '0.82rem', outline: 'none', background: '#faf8f5' }} 
              />
              <button 
                onClick={() => { 
                  const current = Number(maxPrice) || 0; 
                  setMaxPrice(current + 100000); 
                  reset(); 
                }}
                style={{ width: 20, height: 20, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 3 }}
              >+</button>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kích thước - 1 dòng, 2 ô cạnh nhau */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--brand-dark)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          <i className="fas fa-ruler-combined" style={{ color: 'var(--brand)', fontSize: '0.88rem' }} /> KÍCH THƯỚC
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {SIZE_PRESETS.map(preset => {
            const active = minSize === preset.min && maxSize === preset.max;
            return (
              <button key={preset.label}
                onClick={() => { setMinSize(active ? '' : preset.min); setMaxSize(active ? '' : preset.max); reset(); }}
                style={{ 
                  flex: 1, 
                  padding: '5px 7px', 
                  border: `1.5px solid ${active ? 'var(--ink)' : '#e8e4df'}`, 
                  cursor: 'pointer', 
                  fontSize: '0.76rem', 
                  fontWeight: 600, 
                  background: active ? 'var(--ink)' : 'white', 
                  color: active ? 'white' : '#767676',
                  whiteSpace: 'nowrap'
                }}
              >{preset.label}</button>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.7rem', color: '#666' }}>Từ</span>
          {/* Từ - có cả - và + */}
          <button 
            onClick={() => { 
              const current = Number(minSize) || 0; 
              setMinSize(Math.max(0, current - 5)); 
              reset(); 
            }}
            style={{ width: 16, height: 16, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 3, lineHeight: 1 }}
          >−</button>
          <input 
            type="number" 
            placeholder="" 
            value={minSize} 
            onChange={e => { setMinSize(e.target.value); reset(); }}
            style={{ width: '30px', padding: '4px 4px', border: '1.5px solid #e8e4df', fontSize: '0.75rem', outline: 'none', background: '#faf8f5' }} 
          />
          <button 
            onClick={() => { 
              const current = Number(minSize) || 0; 
              setMinSize(current + 5); 
              reset(); 
            }}
            style={{ width: 16, height: 16, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 3, lineHeight: 1 }}
          >+</button>

          <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: 4, marginRight: 2 }}>đến</span>

          {/* Đến - có cả - và + */}
          <button 
            onClick={() => { 
              const current = Number(maxSize) || 0; 
              setMaxSize(Math.max(0, current - 10)); 
              reset(); 
            }}
            style={{ width: 16, height: 16, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 3, lineHeight: 1 }}
          >−</button>
          <input 
            type="number" 
            placeholder="" 
            value={maxSize} 
            onChange={e => { setMaxSize(e.target.value); reset(); }}
            style={{ width: '30px', padding: '4px 4px', border: '1.5px solid #e8e4df', fontSize: '0.75rem', outline: 'none', background: '#faf8f5' }} 
          />
          <button 
            onClick={() => { 
              const current = Number(maxSize) || 0; 
              setMaxSize(current + 10); 
              reset(); 
            }}
            style={{ width: 16, height: 16, padding: 0, border: '1px solid #e8e4df', background: '#faf8f5', color: 'var(--brand-dark)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 3, lineHeight: 1 }}
          >+</button>
          <span style={{ fontSize: '0.65rem', color: '#666' }}>cm</span>
        </div>
      </div>
    </div>
  );

  return (
    <PublicLayout>
      <style>{`
        .sp-card { transition: box-shadow .26s, transform .26s; }
        .sp-card:hover { box-shadow: 0 18px 48px rgba(0,0,0,.12) !important; transform: translateY(-4px) !important; }
        .sp-add { transition: all .2s; }
        .sp-add:hover { opacity: 0.85; }
        .sp-artist-link { color: var(--brand-dark); text-decoration: none; }
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

        /* Ẩn mũi tên lên xuống ở input type=number (4 ô giá và kích thước) */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

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
            BỘ SƯU TẬP TRANH NGHỆ THUẬT 
          </h1>
        </div>
      </div>

      <div style={{ background: '#faf8f5', minHeight: '70vh', paddingBottom: 60 }}>
        <div className="container" style={{ paddingTop: 16 }}>

          <div className="sp-mobile-bar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', border: '1.5px solid #e8e4df', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', letterSpacing: '0.06em' }}>
              <i className="fas fa-sliders-h" style={{ color: 'var(--brand)' }} />
              Bộ lọc {activeCount > 0 && <span style={{ background: 'var(--ink)', color: 'white', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{activeCount}</span>}
            </button>
            <select value={sort} onChange={e => { setSort(e.target.value); reset(); }}
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e8e4df', background: 'white', fontSize: '0.88rem', cursor: 'pointer', outline: 'none', color: 'var(--ink)' }}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {sidebarOpen && (
            <div className="sp-mobile-drawer" style={{ display: 'block', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: 20, overflow: 'hidden', border: '1px solid #f0ece8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0ece8' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-dark)' }}>Bộ lọc</span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#aaa' }}>×</button>
              </div>
              <LeftFilters />
              <div style={{ height: 1, background: '#f0ece8', margin: '8px 16px' }} />
              <RightFilters />
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

            {/* Left: Danh mục */}
            <aside className="sp-sidebar-desktop" style={{ width: 200, flexShrink: 0, background: 'white', overflow: 'hidden', border: '1px solid #f0ece8', position: 'sticky', top: 84, alignSelf: 'flex-start' }}>
              <LeftFilters />
            </aside>

            {/* Center: Sản phẩm (full width) */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Ô tìm kiếm full ở cột giữa */}
              <div style={{ 
                background: 'white', 
                border: '1px solid #e8e4df', 
                padding: '10px 12px', 
                marginBottom: 12
              }}>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand)', fontSize: '0.9rem' }} />
                  <input
                    value={searchDraft}
                    onChange={e => {
                      const val = e.target.value;
                      setSearchDraft(val);
                      setSearch(val);
                      reset();
                    }}
                    placeholder="Tìm tên tác phẩm hoặc nghệ sĩ..."
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      border: '1.5px solid #e8e4df',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#faf8f5',
                      borderRadius: 6
                    }}
                  />
                  {searchDraft && (
                    <button
                      onClick={() => { setSearchDraft(''); setSearch(''); reset(); }}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {chips.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                  {chips.map(chip => (
                    <span key={chip.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', background: '#f0ece8', border: '1px solid #e8e4df', color: 'var(--brand-dark)', fontSize: '0.82rem', fontWeight: 600 }}>
                      <i className={`fas ${chip.icon}`} style={{ fontSize: '0.7rem' }} />
                      {chip.label}
                      <button onClick={chip.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1rem', padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
                    </span>
                  ))}
                  {chips.length > 1 && (
                    <button onClick={clearAll} style={{ padding: '5px 12px', border: 'none', background: 'var(--ink)', color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                      Xóa tất cả
                    </button>
                  )}
                </div>
              )}

              {cartMessage && (
                <div style={{
                  position: 'fixed',
                  bottom: 24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#92400e',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <i className="fas fa-exclamation-circle"></i>
                  {cartMessage}
                </div>
              )}

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ background: 'white', overflow: 'hidden' }}>
                      <div style={{ paddingBottom: '133%', background: '#f0ece8' }} />
                      <div style={{ padding: 12 }}>
                        <div style={{ height: 14, background: '#f0ece8', marginBottom: 8, width: '75%' }} />
                        <div style={{ height: 12, background: '#f0ece8', marginBottom: 12, width: '50%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ color: '#991b1b', fontWeight: 300, marginBottom: 16 }}>{error}</p>
                  <button onClick={() => window.location.reload()} style={{ padding: '12px 28px', border: 'none', background: 'var(--ink)', color: 'white', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.78rem' }}>Thử lại</button>
                </div>
              ) : paged.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white' }}>
                  <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 16 }}>✦</p>
                  <p style={{ fontWeight: 300, fontSize: '1rem', color: '#767676', marginBottom: 8 }}>Không tìm thấy tác phẩm phù hợp</p>
                  <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: 20 }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  <button onClick={clearAll} style={{ padding: '12px 28px', border: 'none', background: 'var(--ink)', color: 'white', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.78rem' }}>Xóa bộ lọc</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 16 }}>
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
                              <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--ink)', color: 'white', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 800 }}>
                                -{Math.round((1 - p.discountPrice / p.price) * 100)}%
                              </div>
                            )}
                            {p.stock === 0 && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ background: 'white', color: 'var(--ink)', padding: '6px 16px', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hết hàng</span>
                              </div>
                            )}
                          </div>

                          <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                              <div style={{ fontSize: '0.72rem', color: 'var(--brand-dark)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>
                                {p.width && p.height ? `${p.width} × ${p.height} cm` : p.width ? `${p.width} cm` : `${p.height} cm`}
                              </div>
                            )}
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.92rem', lineHeight: 1.1 }}>
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
                                onMouseEnter={e => {
                                  e.currentTarget.style.cursor = 'pointer';
                                  e.currentTarget.style.setProperty('cursor', 'pointer', 'important');
                                }}
                                style={{ padding: '7px 12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap', letterSpacing: '0.06em',
                                  background: inCart ? '#2d6a4f' : 'var(--ink)',
                                  color: 'white',
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
                    style={{ padding: '8px 16px', border: '1.5px solid #e8e4df', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#ddd' : 'var(--ink)', fontWeight: 600, fontSize: '0.85rem' }}>
                    ← Trước
                  </button>
                  {pageNums.map((n, i) => n === '…' ? (
                    <span key={`e${i}`} style={{ padding: '8px 4px', color: '#aaa', fontSize: '0.85rem' }}>…</span>
                  ) : (
                    <button key={n} onClick={() => setPage(n)}
                      style={{ width: 38, height: 38, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                        background: page === n ? 'var(--ink)' : 'white',
                        color: page === n ? 'white' : 'var(--ink)',
                        outline: page !== n ? '1.5px solid #e8e4df' : 'none',
                      }}>{n}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '8px 16px', border: '1.5px solid #e8e4df', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#ddd' : 'var(--ink)', fontWeight: 600, fontSize: '0.85rem' }}>
                    Sau →
                  </button>
                </div>
              )}

            </div>

            {/* Right: Giá + Kích thước */}
            <aside className="sp-sidebar-desktop" style={{ width: 220, flexShrink: 0, background: 'white', overflow: 'hidden', border: '1px solid #f0ece8', position: 'sticky', top: 84, alignSelf: 'flex-start' }}>
              <RightFilters />
            </aside>

          </div>  
        </div>
      </div>
    </PublicLayout>
  );
};

export default Shop;
