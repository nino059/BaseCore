import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productApi, categoryApi, userApi } from '../services/api';
import PublicLayout from '../components/PublicLayout';
import { useCart } from '../contexts/CartContext';
import hero1 from '../assets/images/hero-1.jpg';
import hero2 from '../assets/images/hero-2.jpg';
import hero3 from '../assets/images/hero-3.jpg';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { toImg } from '../utils/image';

const heroImages = [hero1, hero2, hero3];

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

/* ─── Product card – 4 col artnam style ─── */
const ArtCard = ({ product, addedId, onAdd }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const { user, isArtist } = useAuth();

  // Logic hiển thị nút "Thêm giỏ hàng":
  // - Chỉ hiện khi sản phẩm đang bán (ForSale)
  // - Ẩn với tài khoản Artist (họa sĩ không thêm sản phẩm vào giỏ như khách mua)
  // - Hiện bình thường với khách vãng lai (chưa đăng nhập) và user thường
  const canShowAddToCart = product.status === 'ForSale' && !isArtist;

  // Xử lý click vào card (trừ nút và link con)
  const handleCardClick = (e) => {
    // Nếu click vào button hoặc link con thì không navigate
    if (
      e.target.closest('button') || 
      e.target.closest('a')
    ) {
      return;
    }
    navigate(`/product/${product.id}`);
  };
  const hasDisc = product.discountPrice && product.discountPrice < product.price;
  const price   = product.discountPrice ?? product.price ?? 0;
  const imgUrl  = toImg(product.imageUrl);

  return (
    <div 
      onClick={handleCardClick}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
    >
      <div 
        onMouseEnter={() => setHov(true)} 
        onMouseLeave={() => setHov(false)}
        style={{ cursor: 'default' }}
      >
        <div style={{ position: 'relative', paddingBottom: '125%', overflow: 'hidden', background: '#f2ede8', marginBottom: 12, cursor: 'pointer' }}>
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform .5s ease', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
              onError={e => e.target.style.display = 'none'}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8b8a8', flexDirection: 'column', gap: 8 }}>
              <i className="fas fa-image" style={{ fontSize: '2rem' }} />
            </div>
          )}
          {product.status === 'ForSale' ? (
            <div style={{ position: 'absolute', top: 10, left: 10, background: '#065f46', color: 'white', padding: '3px 10px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em' }}>ĐANG BÁN</div>
          ) : product.status === 'Ordered' ? (
            <div style={{ position: 'absolute', top: 10, left: 10, background: '#92400e', color: 'white', padding: '3px 10px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em' }}>ĐÃ ĐẶT</div>
          ) : (
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--ink)', color: 'white', padding: '3px 10px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em' }}>ĐÃ BÁN</div>
          )}
          {hasDisc && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: '#c0392b', color: 'white', padding: '3px 8px', fontSize: '0.66rem', fontWeight: 800 }}>
              -{Math.round((1 - product.discountPrice / product.price) * 100)}%
            </div>
          )}
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'rgba(0,0,0,0.28)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
              opacity: hov ? 1 : 0, 
              transition: 'opacity .25s',
              pointerEvents: hov ? 'auto' : 'none',   // chỉ nhận pointer khi đang hover
              cursor: 'default'
            }}
          >
            {/* "XEM NGAY" không nên bắt event, để Link hoạt động bình thường */}
            <span 
              style={{ 
                background: 'white', 
                color: 'var(--ink)', 
                padding: '8px 16px', 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                letterSpacing: '0.06em',
                pointerEvents: 'none' 
              }}
            >
              XEM NGAY
            </span>

            {canShowAddToCart && (
              <div 
                className="home-cart-wrapper" 
                style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.cursor = 'pointer';
                  e.currentTarget.style.setProperty('cursor', 'pointer', 'important');
                }}
              >
                <button
                  type="button"
                  className="home-add-cart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(e, product);
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget;
                    btn.style.cursor = 'pointer';
                    btn.style.setProperty('cursor', 'pointer', 'important');
                  }}
                  onMouseMove={(e) => {
                    const btn = e.currentTarget;
                    if (btn.style.cursor !== 'pointer') {
                      btn.style.cursor = 'pointer';
                      btn.style.setProperty('cursor', 'pointer', 'important');
                    }
                  }}
                  style={{
                    background: addedId === product.id ? '#27ae60' : 'var(--ink)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    transition: 'background .2s',
                    pointerEvents: 'auto',
                    zIndex: 2
                  }}
                >
                  {addedId === product.id ? <i className="fas fa-check" /> : <i className="fas fa-cart-plus" />}
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--brand-dark)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
          {(product.artistName || product.artist)
            ? <Link
                to={product.sellerId ? `/artists/${product.sellerId}` : '/artists'}
                onClick={e => e.stopPropagation()}
                style={{ color: 'var(--brand-dark)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-dark)'}
              >{product.artistName || product.artist}</Link>
            : ' '
          }
        </div>
        <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: product.status === 'ForSale' ? 'var(--ink)' : '#9ca3af' }}>
          {fmt(price)}
          {hasDisc && product.status === 'ForSale' && (
            <span style={{ fontSize: '0.75rem', color: '#aaa', textDecoration: 'line-through', marginLeft: 8, fontWeight: 400 }}>{fmt(product.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Section heading artnam style ─── */
const SecHead = ({ label, title, linkTo, linkText = 'Xem tất cả' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
    <div>
      {label && <p style={{ color: 'var(--brand-dark)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>}
      <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.4rem,3vw,1.9rem)', color: 'var(--ink)', margin: 0, letterSpacing: '0.02em' }}>{title}</h2>
    </div>
    {linkTo && (
      <Link
        to={linkTo}
        style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}
      >
        {linkText} →
      </Link>
    )}
  </div>
);

/* ─── Skeleton ─── */
const Sk = ({ ratio = '125%' }) => (
  <div>
    <div style={{ paddingBottom: ratio, background: '#f2ede8', animation: 'artpulse 1.6s ease-in-out infinite', marginBottom: 12 }} />
    <div style={{ height: 11, background: '#ede8e3', width: '60%', marginBottom: 6, animation: 'artpulse 1.6s ease-in-out infinite' }} />
    <div style={{ height: 13, background: '#ede8e3', width: '80%', marginBottom: 6, animation: 'artpulse 1.6s ease-in-out infinite' }} />
    <div style={{ height: 11, background: '#ede8e3', width: '40%', animation: 'artpulse 1.6s ease-in-out infinite' }} />
  </div>
);

/* ═══════════════════════════════════════ HOME ═══════════════════════════════════════ */
const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [artistProfiles, setArtistProfiles] = useState([]);   // thêm để lấy ảnh đại diện thật của họa sĩ
  const [loading,     setLoading]     = useState(true);
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const [addedId, setAddedId] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);

  /* ─── Hero Carousel (3 ảnh tự động chuyển 4s, fade) ─── */
  const [currentSlide, setCurrentSlide] = useState(0);

  // Tự động chuyển slide mỗi 4 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      categoryApi.getAll(),
      productApi.getAll({ pageSize: 999 }),
      userApi.getArtists()
    ])
      .then(([catRes, prodRes, artistRes]) => {
        setCategories(catRes.data || []);

        const prodData = prodRes.data?.items || prodRes.data?.data || prodRes.data || [];
        setAllProducts(Array.isArray(prodData) ? prodData : []);

        // Lưu danh sách họa sĩ có avatar thật
        const artistsData = artistRes?.data || [];
        setArtistProfiles(Array.isArray(artistsData) ? artistsData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const newest  = useMemo(() => [...allProducts].sort((a, b) => b.id - a.id).slice(0, 8),  [allProducts]);
  const popular = useMemo(() => [...allProducts].sort((a, b) => b.id - a.id).slice(8, 16), [allProducts]);

  const artists = useMemo(() => {
    // Tạo map từ artistProfiles để tra cứu nhanh theo id
    const profileMap = {};
    artistProfiles.forEach(a => {
      profileMap[a.id] = a;
    });

    const map = {};
    allProducts.forEach(p => {
      const name = p.artistName || p.artist;
      if (!name) return;

      if (!map[name]) {
        const profile = p.sellerId ? profileMap[p.sellerId] : null;

        map[name] = {
          name,
          count: 0,
          cover: null,                    // giữ lại ảnh tranh (dùng làm fallback)
          avatarUrl: profile?.avatarUrl ? toImg(profile.avatarUrl) : null,
          sellerId: p.sellerId || null,
        };
      }

      map[name].count++;

      // Chỉ lấy ảnh tranh làm fallback nếu chưa có avatar
      if (!map[name].avatarUrl && !map[name].cover && p.imageUrl) {
        map[name].cover = toImg(p.imageUrl);
      }
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [allProducts, artistProfiles]);

  /* Lấy 3 danh mục lớn (cho section 3 cột) */
  const cats3 = useMemo(() =>
    categories.slice(0, 3).map(c => ({
      ...c,
      coverUrl: toImg(allProducts.find(p => String(p.categoryId) === String(c.id) && p.imageUrl)?.imageUrl),
      count: allProducts.filter(p => String(p.categoryId) === String(c.id)).length,
    })),
  [categories, allProducts]);

  /* Lấy các danh mục còn lại (cho strip 5 cột) */
  const catsStrip = useMemo(() =>
    categories.slice(0, 6).map(c => ({
      ...c,
      coverUrl: toImg(allProducts.find(p => String(p.categoryId) === String(c.id) && p.imageUrl)?.imageUrl),
    })),
  [categories, allProducts]);

  const handleAdd = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { openLogin(); return; }

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

  const stats = [
    { num: loading ? '—' : `${allProducts.length}+`, label: 'Tác phẩm' },
    { num: loading ? '—' : `${artists.length || '50'}+`, label: 'Họa sĩ' },
    { num: loading ? '—' : `${categories.length}+`, label: 'Thể loại' },
    { num: '7', label: 'Năm kinh nghiệm' },
  ];

  return (
    <PublicLayout>
      <style>{`
        @keyframes artpulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes artfade  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .art-fade { animation: artfade .7s ease forwards; }

        /* 3-col category cards */
        .cat3 { display: block; text-decoration: none; color: inherit; }
        .cat3-img-wrap { overflow: hidden; }
        .cat3-img-wrap img { transition: transform .55s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .cat3:hover .cat3-img-wrap img { transform: scale(1.04); }
        .cat3:hover .cat3-title { color: var(--brand-dark); }
        .cat3:hover .view-more,
        .art-artist:hover .view-more { color: var(--brand); }

        /* strip category */
        .cat-strip { display: block; text-decoration: none; color: inherit; }
        .cat-strip-img { overflow: hidden; }
        .cat-strip-img img { transition: transform .45s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .cat-strip:hover .cat-strip-img img { transform: scale(1.05); }

        /* artist card */
        .art-artist { display: block; text-decoration: none; color: inherit; }
        .art-artist-img { overflow: hidden; }
        .art-artist-img img { transition: transform .5s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .art-artist:hover .art-artist-img img { transform: scale(1.04); }

        /* Force normal cursor cho nút thêm giỏ hàng - override mọi inheritance */
        .home-add-cart-btn,
        .home-add-cart-btn:hover,
        .home-cart-wrapper,
        .home-cart-wrapper:hover,
        .home-cart-wrapper *,
        .home-cart-wrapper button,
        .home-cart-wrapper button:hover {
          cursor: pointer !important;
        }
      `}</style>

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

      {/* ══════════════════════════════ HERO CAROUSEL (fade, 4s/ảnh) ══════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 0 60px',
          position: 'relative',
          overflow: 'hidden',
          marginTop: -64
        }}
      >
        {/* 3 ảnh nền — hiệu ứng fade (mờ dần) */}
        {heroImages.map((img, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 1.1s ease-in-out',
              zIndex: 0
            }}
          />
        ))}

        {/* Dark overlay để chữ dễ đọc */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 1 }} />

        {/* Watermark lớn ARTHENTIC */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(8rem,20vw,18rem)', fontWeight: 800, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', zIndex: 1 }}>
          ARTHENTIC
        </div>

        {/* Nội dung chữ + nút + stats */}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }} className="art-fade">

              <h1 style={{ margin: '0 0 32px', lineHeight: 1.15 }}>
                <span style={{
                  fontSize: 100,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                }}>Nơi</span>
                {/* Dòng chính — 1 dòng, không xuống hàng */}
                <span style={{ display: 'block', whiteSpace: 'nowrap', fontWeight: 400, fontSize: 'clamp(1.4rem,3.8vw,4rem)', color: 'white', letterSpacing: '0.04em', fontFamily: "'Playfair Display', serif", lineHeight: 1.15 }}>
                  Nghệ Thuật{' '}<em style={{ fontWeight: 700, color: 'var(--brand)', fontStyle: 'italic' }}>Gặp Gỡ</em>{' '}Tâm Hồn
                </span>
              </h1>

              {/* 2 dòng phụ — cùng kiểu serif italic, opacity khác nhau */}
              <div style={{ marginBottom: 36 }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(0.92rem,1.8vw,1.08rem)', color: 'rgba(255,255,255,0.78)', letterSpacing: '0.02em', margin: '0 0 8px' }}>
                  Khám phá bộ sưu tập tranh gốc từ các họa sĩ tài năng Việt Nam
                </p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(0.82rem,1.5vw,0.95rem)', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.02em', margin: 0 }}>
                  Nơi mỗi tác phẩm là một khung cảm xúc, một câu chuyện riêng
                </p>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 180, background: 'var(--brand)', color: 'white', textDecoration: 'none', padding: '13px 0', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--brand)', transition: 'background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-dark)'; e.currentTarget.style.borderColor = 'var(--brand-dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.borderColor = 'var(--brand)'; }}>
                  Khám Phá
                </Link>
                <Link to="/artists" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 180, background: 'transparent', color: 'white', textDecoration: 'none', padding: '13px 0', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.5)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}>
                  Nghệ Sĩ
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 36, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 32, marginTop: 48, justifyContent: 'center' }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Chấm tròn chọn slide (dots) */}
        <div style={{
          position: 'absolute',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 10,
          zIndex: 3
        }}>
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                border: 'none',
                background: currentSlide === index ? 'var(--brand)' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════ TRUST STRIP ══════════════════════════ */}
      <div style={{ background: 'var(--ink)', padding: '14px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {[
              { icon: 'fa-certificate',  text: 'Tác phẩm gốc có chứng nhận' },
              { icon: 'fa-truck',        text: 'Giao hàng toàn quốc' },
              { icon: 'fa-undo-alt',     text: 'Đổi trả trong 7 ngày' },
              { icon: 'fa-palette',      text: 'Trực tiếp từ họa sĩ' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                <i className={`fas ${f.icon}`} style={{ color: 'var(--brand)', fontSize: '0.9rem' }} />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ ARTHENTIC ĐỀ XUẤT (ƯU TIÊN) ══════════════════ */}
      {!loading && popular.length > 0 && (
        <section style={{ background: '#faf8f5', padding: '72px 0' }}>
          <div className="container">
            <SecHead label="Arthentic đề xuất" title="Được Yêu Thích Nhất" linkTo="/shop" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 24 }}>
              {popular.map(p => <ArtCard key={p.id} product={p} addedId={addedId} onAdd={handleAdd} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ BỘ SƯU TẬP ══════════════════ */}
      <section style={{ background: 'white', padding: '80px 0' }}>
        <div className="container">
          <SecHead label="Bộ sưu tập" title="Tranh Theo Thể Loại" linkTo="/shop" />

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
              {[1,2,3].map(i => <Sk key={i} ratio="130%" />)}
            </div>
          ) : cats3.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>Chưa có danh mục</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
              {cats3.map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.id}`} className="cat3" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {/* Ảnh portrait */}
                  <div className="cat3-img-wrap" style={{ paddingBottom: '130%', position: 'relative', background: '#f2ede8', marginBottom: 16 }}>
                    {cat.coverUrl ? (
                      <img src={cat.coverUrl} alt={cat.name} loading="lazy"
                        style={{ position: 'absolute', inset: 0 }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8b8a8' }}>
                        <i className="fas fa-image" style={{ fontSize: '3rem' }} />
                      </div>
                    )}
                  </div>
                  {/* Text bên dưới ảnh – giống artnam */}
                  <p style={{ color: '#aaa', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {cat.count} tác phẩm
                  </p>
                  <h3 className="cat3-title" style={{ fontWeight: 400, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: 10, letterSpacing: '0.02em' }}>
                    {cat.name}
                  </h3>
                  <span className="view-more" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Khám phá ngay →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════ VỪA CẬP NHẬT ══════════════════ */}
      <section style={{ background: '#faf8f5', padding: '72px 0' }}>
        <div className="container">
          <SecHead label="Vừa cập nhật" title="Tranh Mới Nhất" linkTo="/shop" />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
              {Array.from({ length: 8 }).map((_, i) => <Sk key={i} />)}
            </div>
          ) : newest.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
              <i className="fas fa-image" style={{ fontSize: '3rem', marginBottom: 12, display: 'block' }} />
              <p style={{ fontWeight: 300 }}>Chưa có tác phẩm nào</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 24 }}>
              {newest.map(p => <ArtCard key={p.id} product={p} addedId={addedId} onAdd={handleAdd} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════ NGHỆ SĨ NỔI BẬT ══════════════════ */}
      {!loading && artists.length > 0 && (
        <section style={{ background: 'white', padding: '72px 0' }}>
          <div className="container">
            <SecHead label="Nghệ sĩ" title="Họa Sĩ Nổi Bật" linkTo="/artists" linkText="Tất cả họa sĩ" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 28 }}>
              {artists.map(artist => (
                <Link key={artist.name} to={artist.sellerId ? `/artists/${artist.sellerId}` : '/artists'} className="art-artist" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="art-artist-img" style={{ paddingBottom: '120%', position: 'relative', background: '#f2ede8', marginBottom: 14 }}>
                    {artist.avatarUrl || artist.cover ? (
                      <img
                        src={artist.avatarUrl || artist.cover}
                        alt={artist.name}
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 200, color: '#c8b8a8' }}>{artist.name[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <p style={{ color: 'var(--brand-dark)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
                    {artist.count} tác phẩm
                  </p>
                  <h3 style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 8, letterSpacing: '0.02em' }}>
                    {artist.name}
                  </h3>
                  <span className="view-more" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Xem tranh →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ CHỦ ĐỀ ══════════════════ */}
      {!loading && catsStrip.length > 0 && (
        <section style={{ background: '#faf8f5', padding: '64px 0' }}>
          <div className="container">
            <SecHead label="Chủ đề" title="Tranh Theo Đề Tài" linkTo="/shop" />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(catsStrip.length, 6)}, 1fr)`, gap: 16 }}>
              {catsStrip.map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.id}`} className="cat-strip" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="cat-strip-img" style={{ paddingBottom: '100%', position: 'relative', background: '#f2ede8', marginBottom: 12 }}>
                    {cat.coverUrl ? (
                      <img src={cat.coverUrl} alt={cat.name} loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8b8a8' }}>
                        <i className="fas fa-palette" style={{ fontSize: '2rem' }} />
                      </div>
                    )}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ink)', textAlign: 'center', margin: 0, letterSpacing: '0.02em' }}>
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════ VỀ ARTHENTIC ══════════════════════════ */}
      <section style={{ padding: '80px 0', background: 'var(--ink)', color: 'white' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 48 }}>
            <div>
              <p style={{ color: 'var(--brand)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Về chúng tôi</p>
              <h2 style={{ fontWeight: 200, fontSize: '1.9rem', color: 'white', marginBottom: 20, lineHeight: 1.3, letterSpacing: '0.02em' }}>
                <em style={{ fontStyle: 'italic' }}>Arthentic</em> —<br />nơi nghệ thuật<br />có giá trị thật
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.85, marginBottom: 28 }}>
                Chúng tôi tin rằng nghệ thuật không phải là xa xỉ phẩm — đó là ngôn ngữ chữa lành, kết nối, và nâng tầm tinh thần con người.
              </p>
              <Link to="/artists" style={{ color: 'var(--brand)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Gặp gỡ họa sĩ →
              </Link>
            </div>
            {[
              { icon: 'fa-award',     title: 'Nâng tầm nghệ thuật bản địa',   desc: 'Tôn vinh và lan tỏa giá trị của nghệ thuật tạo hình Việt Nam đến người yêu tranh trong nước và quốc tế.' },
              { icon: 'fa-handshake', title: 'Kết nối họa sĩ và công chúng',  desc: 'Tạo nền tảng minh bạch, tin cậy để họa sĩ bán tranh trực tiếp, không qua trung gian.' },
              { icon: 'fa-heart',     title: 'Chữa lành bằng nghệ thuật',     desc: 'Mỗi tác phẩm là một câu chuyện — chúng tôi giúp bạn tìm đúng tác phẩm chạm đến tâm hồn mình.' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ width: 44, height: 44, border: '1px solid rgba(200,169,122,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <i className={`fas ${f.icon}`} style={{ color: 'var(--brand)', fontSize: '1rem' }} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white', marginBottom: 12, letterSpacing: '0.02em' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ══════════════════════ */}
      <section style={{ padding: '80px 0', background: '#f9f6f2', textAlign: 'center' }}>
        <div className="container">
          <p style={{ color: 'var(--brand-dark)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Dành cho họa sĩ</p>
          <h2 style={{ fontWeight: 200, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--ink)', marginBottom: 16, lineHeight: 1.2, letterSpacing: '0.02em' }}>
            Bạn là nghệ sĩ?<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Hãy đưa tác phẩm ra thế giới.</em>
          </h2>
          <p style={{ color: '#767676', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.85, fontSize: '0.95rem' }}>
            Tham gia cùng hàng chục họa sĩ đang bán tác phẩm trực tiếp trên Arthentic — không qua trung gian, không ẩn phí.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={openRegister} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink)', color: 'white', border: 'none', cursor: 'pointer', padding: '13px 32px', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Đăng ký ngay
            </button>
            <Link to="/artists" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--ink)', textDecoration: 'none', padding: '12px 30px', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1.5px solid var(--ink)' }}>
              Xem họa sĩ
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Home;
