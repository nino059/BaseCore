import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import PublicLayout from '../components/PublicLayout';
import { useCart } from './Cart';

const Shop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: queryParams.get('search') || '',
    categoryId: queryParams.get('category') || '',
    sortBy: 'newest',
    minPrice: '',
    maxPrice: '',
    page: 1,
    pageSize: 12,
  });
  
  const { addToCart, count } = useCart();

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        status: 'Available',
        pageNumber: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.search) params.name = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sortBy === 'price_asc') params.sortBy = 'price';
      if (filters.sortBy === 'price_desc') { params.sortBy = 'price'; params.sortDesc = true; }

      const res = await productApi.getAll(params);
      setProducts(res.data?.items || res.data || []);
      setTotalCount(res.data?.totalCount || (res.data?.length ?? 0));
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
  };

  const totalPages = Math.ceil(totalCount / filters.pageSize) || 1;

  // Placeholder khi chưa có data
  const placeholders = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, name: `Tranh mẫu ${i + 1}`,
    theme: ['Phong cảnh', 'Chân dung', 'Tĩnh vật', 'Trừu tượng'][i % 4],
    price: [1500000, 2000000, 2800000, 3500000][i % 4],
    imageUrl: null,
  }));

  const displayProducts = products.length > 0 ? products : placeholders;

  return (
    <PublicLayout cartCount={count}>

      {/* HERO NHỎ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #533483)',
        padding: '60px 0 40px', color: 'white', textAlign: 'center'
      }}>
        <h1 style={{ fontWeight: 300, fontSize: '2.5rem', marginBottom: 8 }}>Cửa Hàng Tranh</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          Khám phá {totalCount > 0 ? totalCount : 'hàng trăm'} tác phẩm từ các nghệ sĩ Việt Nam
        </p>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="d-flex justify-content-center mt-4" style={{ gap: 0 }}>
          <div style={{ width: '100%', maxWidth: 500, display: 'flex' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm tranh, nghệ sĩ..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ borderRadius: '30px 0 0 30px', padding: '12px 20px', border: 'none', fontSize: '0.95rem' }}
            />
            <button type="submit" className="btn" style={{
              background: '#a78bfa', color: 'white',
              borderRadius: '0 30px 30px 0', padding: '0 24px', border: 'none', fontWeight: 600
            }}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>
      </div>

      <div className="container py-5">
        <div className="row">

          {/* ===== SIDEBAR FILTER ===== */}
          <div className="col-md-3 mb-4">
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', position: 'sticky', top: 80 }}>

              {/* Category filter */}
              <h6 style={{ fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>
                <i className="fas fa-layer-group mr-2" style={{ color: '#a78bfa' }}></i>Thể loại
              </h6>
              <div className="list-group list-group-flush mb-4">
                <button
                  className={`list-group-item list-group-item-action ${!filters.categoryId ? 'active' : ''}`}
                  onClick={() => setFilters(f => ({ ...f, categoryId: '', page: 1 }))}
                  style={{
                    borderRadius: 8, marginBottom: 4, border: 'none',
                    background: !filters.categoryId ? '#533483' : 'transparent',
                    color: !filters.categoryId ? 'white' : '#333',
                  }}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className="list-group-item list-group-item-action"
                    onClick={() => setFilters(f => ({ ...f, categoryId: cat.id, page: 1 }))}
                    style={{
                      borderRadius: 8, marginBottom: 4, border: 'none',
                      background: filters.categoryId == cat.id ? '#533483' : 'transparent',
                      color: filters.categoryId == cat.id ? 'white' : '#333',
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <h6 style={{ fontWeight: 700, marginBottom: 12, color: '#1a1a2e' }}>
                <i className="fas fa-sort mr-2" style={{ color: '#a78bfa' }}></i>Sắp xếp
              </h6>
              <select
                className="form-control mb-4"
                value={filters.sortBy}
                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value, page: 1 }))}
                style={{ borderRadius: 8 }}
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>

              {/* Price range */}
              <h6 style={{ fontWeight: 700, marginBottom: 12, color: '#1a1a2e' }}>
                <i className="fas fa-tag mr-2" style={{ color: '#a78bfa' }}></i>Khoảng giá (₫)
              </h6>
              <div className="d-flex" style={{ gap: 8 }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Từ"
                  value={filters.minPrice}
                  onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                  style={{ borderRadius: 8 }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Đến"
                  value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <button
                className="btn btn-block mt-3"
                onClick={() => setFilters(f => ({ ...f, page: 1 }))}
                style={{ background: '#1a1a2e', color: 'white', borderRadius: 8 }}
              >
                Áp dụng
              </button>

              {/* Reset */}
              <button
                className="btn btn-block btn-outline-secondary mt-2"
                onClick={() => setFilters({ search: '', categoryId: '', sortBy: 'newest', minPrice: '', maxPrice: '', page: 1, pageSize: 12 })}
                style={{ borderRadius: 8 }}
              >
                <i className="fas fa-undo mr-1"></i> Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* ===== PRODUCT GRID ===== */}
          <div className="col-md-9">

            {/* Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                {loading ? 'Đang tải...' : `Hiển thị ${displayProducts.length} tác phẩm`}
              </p>
              <div className="d-flex" style={{ gap: 8 }}>
                <span className="badge" style={{ background: '#533483', color: 'white', padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem' }}>
                  {filters.categoryId ? categories.find(c => c.id == filters.categoryId)?.name || 'Đã lọc' : 'Tất cả'}
                </span>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: '#533483', width: '3rem', height: '3rem' }}></div>
                <p className="mt-3 text-muted">Đang tải tranh...</p>
              </div>
            ) : (
              <>
                {/* Product cards */}
                <div className="row">
                  {displayProducts.map(product => (
                    <div key={product.id} className="col-6 col-lg-4 mb-4">
                      <div style={{
                        background: 'white', borderRadius: 16,
                        overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        height: '100%', display: 'flex', flexDirection: 'column'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)'; }}
                      >
                        {/* ✅ Ảnh bấm vào → ProductDetail */}
                        <Link to={`/shop/${product.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ position: 'relative', overflow: 'hidden', height: 220 }}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              />
                            ) : (
                              <div style={{
                                height: '100%',
                                background: `linear-gradient(135deg, hsl(${240 + product.id * 30}, 45%, 28%), hsl(${260 + product.id * 20}, 55%, 42%))`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <i className="fas fa-image" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }}></i>
                              </div>
                            )}
                            <div style={{
                              position: 'absolute', top: 12, left: 12,
                              background: 'rgba(83,52,131,0.9)', color: 'white',
                              borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600
                            }}>
                              {product.theme || product.categoryName || 'Nghệ thuật'}
                            </div>
                          </div>
                        </Link>

                        {/* Info */}
                        <div style={{ padding: '16px 16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* ✅ Tên bấm vào → ProductDetail */}
                          <Link to={`/shop/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h6 style={{ fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{product.name}</h6>
                          </Link>

                          {product.artistName && (
                            <p style={{ color: '#6c757d', fontSize: '0.82rem', marginBottom: 8 }}>
                              <i className="fas fa-palette mr-1" style={{ color: '#a78bfa' }}></i>
                              {product.artistName}
                            </p>
                          )}

                          <div className="d-flex justify-content-between align-items-center mt-auto">
                            <span style={{ fontWeight: 700, color: '#533483', fontSize: '1.05rem' }}>
                              {(product.price || 0).toLocaleString('vi-VN')}₫
                            </span>
                            {/* ✅ Nút Thêm → addToCart */}
                            <button
                              onClick={() => addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                imageUrl: product.imageUrl,
                                categoryName: product.categoryName,
                              })}
                              className="btn btn-sm"
                              style={{
                                background: '#1a1a2e', color: 'white',
                                borderRadius: 20, padding: '6px 16px', fontSize: '0.8rem'
                              }}>
                              <i className="fas fa-cart-plus mr-1"></i>Thêm
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <ul className="pagination">
                      <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                          <i className="fas fa-chevron-left"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <li key={p} className={`page-item ${filters.page === p ? 'active' : ''}`}>
                          <button className="page-link"
                            onClick={() => setFilters(f => ({ ...f, page: p }))}
                            style={filters.page === p ? { background: '#533483', borderColor: '#533483' } : {}}
                          >{p}</button>
                        </li>
                      ))}
                      <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Shop;