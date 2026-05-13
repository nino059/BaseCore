import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';
import { useCart } from './Cart';

const fmt = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const SORTS = [
  { label: 'Mặc định', value: 'default' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'Mới nhất', value: 'newest' },
];

const PER_PAGE = 12;

const Shop = () => {
  const [all, setAll] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);

  const { addToCart } = useCart();
  const [toastId, setToastId] = useState(null);

  // Load danh mục
  useEffect(() => {
    categoryApi.getAll()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Load sản phẩm
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await productApi.getAll({ pageSize: 200 });
        const data = res.data?.items || res.data?.data || res.data || [];
        setAll(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError('Không thể tải danh sách tranh. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reset = () => setPage(1);

  // Filter + Sort + Khoảng giá
  const filtered = all
    .filter(p => {
      const name = (p.name || p.title || '').toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const matchCat = !categoryId || String(p.categoryId) === String(categoryId);

      // Lọc theo khoảng giá
      const price = p.discountPrice ?? p.price ?? 0;
      const matchMinPrice = !minPrice || price >= Number(minPrice);
      const matchMaxPrice = !maxPrice || price <= Number(maxPrice);

      return matchSearch && matchCat && matchMinPrice && matchMaxPrice;
    })
    .sort((a, b) => {
      const pa = a.discountPrice ?? a.price;
      const pb = b.discountPrice ?? b.price;
      if (sort === 'price_asc') return pa - pb;
      if (sort === 'price_desc') return pb - pa;
      if (sort === 'newest') return b.id - a.id;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product, 1);
    setToastId(product.id);
    setTimeout(() => setToastId(null), 2000);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setSort('default');
    reset();
  };

  // Skeleton
  if (loading) return (
    <PublicLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ height: 40, background: '#f3f4f6', borderRadius: 12, width: 280, margin: '0 auto 40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ height: 220, background: '#f3f4f6' }} />
              <div style={{ padding: 18 }}>
                <div style={{ height: 16, background: '#f3f4f6', borderRadius: 8, marginBottom: 10, width: '75%' }} />
                <div style={{ height: 14, background: '#f3f4f6', borderRadius: 8, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );

  if (error) return (
    <PublicLayout>
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
        <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{
          marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none',
          background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer',
        }}>Thử lại</button>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>🎨 Bộ Sưu Tập Tranh</h1>
          <p style={{ color: '#6b7280' }}>Khám phá {all.length} tác phẩm nghệ thuật độc đáo</p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Tìm tên tranh..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset(); }}
            style={{ flex: '1 1 200px', padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '0.9rem', outline: 'none', minWidth: 180 }}
          />

          <select
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); reset(); }}
            style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '0.9rem', background: 'white', cursor: 'pointer' }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Khoảng giá */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              placeholder="Giá từ"
              value={minPrice}
              onChange={e => { setMinPrice(e.target.value); reset(); }}
              style={{ width: 130, padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '0.9rem' }}
            />
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>đến</span>
            <input
              type="number"
              placeholder="Giá đến"
              value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); reset(); }}
              style={{ width: 130, padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '0.9rem' }}
            />
          </div>

          <select
            value={sort}
            onChange={e => { setSort(e.target.value); reset(); }}
            style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: '0.9rem', background: 'white', cursor: 'pointer' }}
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {(search || categoryId || minPrice || maxPrice || sort !== 'default') && (
            <button 
              onClick={resetFilters}
              style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}
            >
              Xóa lọc ✕
            </button>
          )}
        </div>

        <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 20 }}>
          Hiển thị {filtered.length} tác phẩm{page > 1 && ` — Trang ${page}/${totalPages}`}
        </p>

        {/* Grid sản phẩm */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🎨</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>Không tìm thấy tranh phù hợp với điều kiện</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
              {paged.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.25s, transform 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ position: 'relative', height: 240, overflow: 'hidden', background: '#f9fafb' }}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`}
                          alt={product.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ display: product.imageUrl ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', flexDirection: 'column' }}>
                        <span style={{ fontSize: '3rem' }}>🖼️</span>
                        <span style={{ fontSize: '0.8rem', marginTop: 8 }}>Chưa có ảnh</span>
                      </div>
                      {product.stock === 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem', background: '#ef4444', padding: '6px 16px', borderRadius: 20 }}>Hết hàng</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: 10 }}>
                        {product.categoryName || 'Tranh'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#7c3aed' }}>
                          {fmt(product.price)}
                        </span>
                        <button
                          onClick={e => handleAddToCart(e, product)}
                          disabled={product.stock === 0}
                          style={{
                            padding: '7px 14px', borderRadius: 10, border: 'none', cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                            fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s',
                            background: toastId === product.id ? '#10b981' : (product.stock > 0 ? '#7c3aed' : '#e5e7eb'),
                            color: product.stock > 0 ? 'white' : '#9ca3af',
                          }}
                        >
                          {toastId === product.id ? '✓ Đã thêm' : '+ Giỏ hàng'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', fontWeight: 600 }}>
                  ← Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700,
                      background: page === n ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : '#f3f4f6',
                      color: page === n ? 'white' : '#374151' }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#374151', fontWeight: 600 }}>
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
};

export default Shop;