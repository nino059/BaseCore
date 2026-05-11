import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?pageSize=8')
        ]);
        setCategories(catRes.data || []);
        setFeatured(prodRes.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const placeholderProducts = [
    { id: 1, name: 'Sơn Dầu Mùa Thu', theme: 'Phong cảnh', price: 2500000 },
    { id: 2, name: 'Tĩnh Vật Hoa Sen', theme: 'Tĩnh vật', price: 1800000 },
    { id: 3, name: 'Chân Dung Thiếu Nữ', theme: 'Chân dung', price: 3200000 },
    { id: 4, name: 'Làng Quê Việt', theme: 'Phong cảnh', price: 2100000 },
  ];

  const displayProducts = featured.length > 0 ? featured : placeholderProducts;

  return (
    <PublicLayout>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.15), transparent)',
        }} />
        <div className="container text-center text-white" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ letterSpacing: '0.4em', color: '#a78bfa', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 20 }}>
            Bộ sưu tập nghệ thuật 2026
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 300, letterSpacing: '0.1em', lineHeight: 1.1, marginBottom: 24 }}>
            NGHỆ THUẬT<br />
            <em style={{ fontStyle: 'italic', fontWeight: 200 }}>KHÔNG GIỚI HẠN</em>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.8 }}>
            Khám phá những tác phẩm tranh độc đáo từ các nghệ sĩ tài năng Việt Nam
          </p>
          <div className="d-flex justify-content-center flex-wrap" style={{ gap: 16 }}>
            <Link to="/shop" className="btn btn-lg" style={{
              background: 'white', color: '#1a1a2e', borderRadius: 50,
              padding: '12px 36px', fontWeight: 700, border: 'none'
            }}>
              <i className="fas fa-store mr-2"></i>KHÁM PHÁ NGAY
            </Link>
            <Link to="/artists" className="btn btn-lg" style={{
              background: 'transparent', color: 'white', borderRadius: 50,
              padding: '12px 36px', fontWeight: 600, border: '2px solid rgba(255,255,255,0.5)'
            }}>
              <i className="fas fa-users mr-2"></i>VỀ CHÚNG TÔI
            </Link>
          </div>
          <div className="row justify-content-center mt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 40 }}>
            {[{ num: '500+', label: 'Tác phẩm' }, { num: '50+', label: 'Nghệ sĩ' }, { num: '1000+', label: 'Khách hàng' }].map((s, i) => (
              <div key={i} className="col-4 col-md-2">
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa' }}>{s.num}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '80px 0', background: 'white' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 style={{ fontWeight: 300, fontSize: '2rem' }}>Khám Phá Theo Chủ Đề</h2>
            <p className="text-muted">Chọn phong cách nghệ thuật phù hợp với không gian của bạn</p>
          </div>
          <div className="row">
            {(categories.length > 0 ? categories.slice(0, 4) : ['Sơn Dầu', 'Màu Nước', 'Tranh Lụa', 'Điêu Khắc'].map((n, i) => ({ id: i + 1, name: n }))).map((cat, i) => (
              <div key={cat.id} className="col-6 col-md-3 mb-4">
                <Link to={`/shop?category=${cat.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    borderRadius: 16, height: 260,
                    background: `linear-gradient(135deg, hsl(${250 + i * 25}, 50%, ${25 + i * 5}%), hsl(${270 + i * 20}, 60%, ${35 + i * 5}%))`,
                    display: 'flex', alignItems: 'flex-end', padding: 20,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    transition: 'transform 0.3s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <h5 style={{ color: 'white', margin: 0, fontWeight: 600 }}>{cat.name}</h5>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: '80px 0', background: '#f8f9fa' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <h2 style={{ fontWeight: 300, fontSize: '2rem', marginBottom: 6 }}>Tranh Nổi Bật</h2>
              <p className="text-muted mb-0">Những tác phẩm được yêu thích nhất</p>
            </div>
            <Link to="/shop" style={{ color: '#533483', fontWeight: 600, textDecoration: 'none' }}>
              Xem tất cả <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
          <div className="row">
            {displayProducts.slice(0, 4).map((product) => (
              <div key={product.id} className="col-6 col-md-3 mb-4">
                <div style={{
                  background: 'white', borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  height: '100%', display: 'flex', flexDirection: 'column'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)'; }}
                >
                  <div style={{
                    height: 200,
                    background: `linear-gradient(135deg, hsl(${240 + product.id * 30}, 40%, 30%), hsl(${260 + product.id * 20}, 50%, 45%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fas fa-image" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.4)' }}></i>
                    }
                  </div>
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h6 style={{ fontWeight: 600, marginBottom: 4 }}>{product.name}</h6>
                    <p style={{ color: '#6c757d', fontSize: '0.82rem', marginBottom: 'auto' }}>
                      <i className="fas fa-tag mr-1" style={{ color: '#a78bfa' }}></i>
                      {product.theme || 'Tranh nghệ thuật'}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span style={{ fontWeight: 700, color: '#533483' }}>
                        {(product.price || 0).toLocaleString('vi-VN')}₫
                      </span>
                      <button className="btn btn-sm" style={{
                        background: '#1a1a2e', color: 'white', borderRadius: 20, padding: '5px 14px'
                      }}>
                        <i className="fas fa-cart-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #533483, #0f3460)',
        padding: '80px 0', color: 'white', textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontWeight: 300, fontSize: '2rem', marginBottom: 16 }}>Bạn Là Nghệ Sĩ?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.8 }}>
            Tham gia cùng 50+ nghệ sĩ đang bán tác phẩm trên Arthentic và tiếp cận hàng nghìn khách hàng.
          </p>
          <Link to="/register" className="btn btn-lg" style={{
            background: 'white', color: '#533483', borderRadius: 50,
            padding: '12px 40px', fontWeight: 700
          }}>
            <i className="fas fa-brush mr-2"></i>Đăng ký ngay
          </Link>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Home;