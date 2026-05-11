import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paintingService } from '../services/paintingService';

const fmt = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const PRICE_RANGES = [
  { label: 'Tất cả giá',       min: 0,          max: Infinity },
  { label: 'Dưới 2 triệu',     min: 0,          max: 2_000_000 },
  { label: '2 – 5 triệu',      min: 2_000_000,  max: 5_000_000 },
  { label: '5 – 10 triệu',     min: 5_000_000,  max: 10_000_000 },
  { label: 'Trên 10 triệu',    min: 10_000_000, max: Infinity },
];

const SORTS = [
  { label: 'Mặc định',       value: 'default' },
  { label: 'Giá tăng dần',   value: 'price_asc' },
  { label: 'Giá giảm dần',   value: 'price_desc' },
  { label: 'Mới nhất',       value: 'newest' },
];

const PER_PAGE = 12;

const sortFn = (sort) => (a, b) => {
  const pa = a.discountPrice ?? a.price;
  const pb = b.discountPrice ?? b.price;
  if (sort === 'price_asc')  return pa - pb;
  if (sort === 'price_desc') return pb - pa;
  if (sort === 'newest')     return (b.yearCreated || 0) - (a.yearCreated || 0);
  return 0;
};

const Shop = () => {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [priceIdx, setPriceIdx] = useState(0);
  const [sort, setSort]       = useState('default');
  const [saleOnly, setSaleOnly] = useState(false);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const res = await paintingService.getAll(1, 200);
        setAll(Array.isArray(res) ? res : res.items || res.data || []);
      } catch (e) {
        console.error(e);
        setError('Không thể tải danh sách tranh. Vui lòng thử lại.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const range = PRICE_RANGES[priceIdx];

  const filtered = all
    .filter(p => {
      const price = p.discountPrice ?? p.price;
      return (
        p.title.toLowerCase().includes(search.toLowerCase()) &&
        price >= range.min && price <= range.max &&
        (!saleOnly || !!p.discountPrice)
      );
    })
    .sort(sortFn(sort));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const reset = () => setPage(1);

  // ---- Skeleton ----
  if (loading) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px' }}>
      <div style={{ height: 40, background: '#f3f4f6', borderRadius: 12, width: 280, margin: '0 auto 10px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 20, background: '#f3f4f6', borderRadius: 8, width: 200, margin: '0 auto 40px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ height: 220, background: '#f3f4f6', animation: 'pulse 1.5s infinite' }} />
            <div style={{ padding: 18 }}>
              <div style={{ height: 16, background: '#f3f4f6', borderRadius: 8, marginBottom: 10, width: '75%' }} />
              <div style={{ height: 14, background: '#f3f4f6', borderRadius: 8, width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 16px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
      <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '1rem' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{
        marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none',
        background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer',
      }}>
        Thử lại
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>Bộ Sưu Tập Tranh</h1>
        <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>
          Khám phá {all.length}+ tác phẩm nghệ thuật độc đáo
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Tìm tranh..."
          value={search}
          onChange={e => { setSearch(e.target.value); reset(); }}
          style={{
            flex: '1 1 200px', padding: '10px 16px', border: '1.5px solid #e5e7eb',
            borderRadius: 12, fontSize: '0.9rem', outline: 'none', minWidth: 180,
          }}
        />

        {/* Lọc giá */}
        <select
          value={priceIdx}
          onChange={e => { setPriceIdx(+e.target.value); reset(); }}
          style={{
            padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12,
            fontSize: '0.9rem', outline: 'none', cursor: 'pointer', background: 'white',
          }}
        >
          {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
        </select>

        {/* Sắp xếp */}
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); reset(); }}
          style={{
            padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12,
            fontSize: '0.9rem', outline: 'none', cursor: 'pointer', background: 'white',
          }}
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Sale toggle */}
        <button
          onClick={() => { setSaleOnly(s => !s); reset(); }}
          style={{
            padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
            background: saleOnly ? '#dc2626' : '#f3f4f6',
            color: saleOnly ? 'white' : '#6b7280',
          }}
        >
          🏷️ SALE
        </button>
      </div>

      {/* Kết quả + Xóa filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
          {filtered.length} tác phẩm
          {page > 1 && ` — Trang ${page}/${totalPages}`}
        </p>
        {(search || priceIdx > 0 || saleOnly || sort !== 'default') && (
          <button onClick={() => { setSearch(''); setPriceIdx(0); setSort('default'); setSaleOnly(false); reset(); }}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            Xóa bộ lọc ✕
          </button>
        )}
      </div>

      {/* Empty */}
      {paged.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🎨</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>Không tìm thấy tranh</p>
          <p style={{ marginTop: 6 }}>Thử từ khóa hoặc bộ lọc khác</p>
        </div>
      ) : (
        <>
          {/* Grid tranh */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
            {paged.map(painting => (
              <Link
                key={painting.id}
                to={`/product/${painting.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    background: 'white', borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.25s, transform 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 12px 40px rgba(124,58,237,0.18)'; e.currentTarget.style.transform='translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}
                >
                  {/* Ảnh */}
                  <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
                    <img
                      src={painting.mainImageUrl || painting.imageUrl || `https://picsum.photos/seed/${painting.id}/400/300`}
                      alt={painting.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {painting.discountPrice && (
                      <span style={{
                        position: 'absolute', top: 12, right: 12,
                        background: '#dc2626', color: 'white',
                        padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        SALE
                      </span>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.95rem', marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {painting.title}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: 12 }}>
                      {painting.artistName || 'Nghệ sĩ'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        {painting.discountPrice ? (
                          <>
                            <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                              {fmt(painting.discountPrice)}
                            </span>
                            <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#9ca3af', marginLeft: 6 }}>
                              {fmt(painting.price)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                            {fmt(painting.price)}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.78rem', background: '#ede9fe', color: '#7c3aed',
                        padding: '3px 10px', borderRadius: 999, fontWeight: 600,
                      }}>
                        {painting.medium || 'Tranh'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                  background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#d1d5db' : '#374151', fontWeight: 600,
                }}
              >
                ← Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '...' ? (
                    <span key={`dot-${i}`} style={{ padding: '9px 6px', color: '#9ca3af' }}>…</span>
                  ) : (
                    <button key={n} onClick={() => setPage(n)} style={{
                      padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                      background: page === n ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : '#f3f4f6',
                      color: page === n ? 'white' : '#374151',
                    }}>
                      {n}
                    </button>
                  )
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                  background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? '#d1d5db' : '#374151', fontWeight: 600,
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shop;