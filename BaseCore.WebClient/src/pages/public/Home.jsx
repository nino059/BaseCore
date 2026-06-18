import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi, userApi } from '../../services/api';
import PublicLayout from '../../components/layout/PublicLayout';
import { useCart } from '../../contexts/CartContext';
import hero1 from '../../assets/images/hero-1.jpg';
import hero2 from '../../assets/images/hero-2.jpg';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { formatVND as fmt } from '../../utils/format';
import { toImg } from '../../utils/image';

const heroImages = [hero1, hero2];

/* ─── Product card – 4 col artnam style ─── */
const ArtCard = ({ product, addedId, onAdd, showArtist = true, dark = false, showPrice = true }) => {
  const [hov, setHov] = useState(false);
  const { isArtist } = useAuth();
  const price   = product.price ?? 0;
  const imgUrl  = toImg(product.imageUrl);
  const nameColor  = dark ? 'rgba(255,255,255,0.92)' : '#1a1a1a';
  const priceColor = dark ? '#c8a97a' : (product.status === 'ForSale' ? '#1a1a1a' : '#9ca3af');

  return (
    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div style={{ position: 'relative', paddingBottom: '125%', overflow: 'hidden', background: '#f2ede8', marginBottom: 12 }}>
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: hov ? 1 : 0, transition: 'opacity .25s' }}>
            <span style={{ background: 'white', color: '#1a1a1a', padding: '8px 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em' }}>XEM NGAY</span>
            {product.status === 'ForSale' && !isArtist && (
              <button onClick={e => onAdd(e, product)} style={{ background: addedId === product.id ? '#27ae60' : '#1a1a1a', color: 'white', border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, transition: 'background .2s' }}>
                {addedId === product.id ? <i className="fas fa-check" /> : <i className="fas fa-cart-plus" />}
              </button>
            )}
          </div>
        </div>
        {showArtist && (
          <div style={{ fontSize: '0.72rem', color: '#8b6c4a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
            {(product.artistName || product.artist)
              ? <Link
                  to={product.sellerId ? `/artists/${product.sellerId}` : '/artists'}
                  onClick={e => e.stopPropagation()}
                  style={{ color: '#8b6c4a', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >{product.artistName || product.artist}</Link>
              : ' '
            }
          </div>
        )}
        <div style={{ fontWeight: 500, fontSize: '0.88rem', color: nameColor, marginBottom: showPrice ? 5 : 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: dark ? 'center' : 'left' }}>
          {product.name}
        </div>
        {showPrice && (
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: priceColor }}>
            {fmt(price)}
          </div>
        )}
      </div>
    </Link>
  );
};

/* ─── Section heading artnam style ─── */
const SecHead = ({ label, title, linkTo, linkText = 'Xem tất cả', dark = false }) => {
  const c = dark ? 'rgba(255,255,255,0.9)' : '#1a1a1a';
  const accent = dark ? '#c8a97a' : '#8b6c4a';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 48 }}>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center' }}>
        {label && (
          <p style={{ color: accent, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 12 }}>
            {label}
          </p>
        )}
        <h2 style={{ fontWeight: 400, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', color: c, margin: 0, letterSpacing: '0.03em', fontFamily: "'Playfair Display', serif" }}>
          {title}
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
        {linkTo && (
          <Link to={linkTo} style={{ color: accent, textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {linkText} →
          </Link>
        )}
      </div>
    </div>
  );
};

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
  const [artistProfiles, setArtistProfiles] = useState({});
  const [loading,     setLoading]     = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const [addedId, setAddedId] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const heroBg = heroImages[heroIdx];

  // Tự động luân phiên ảnh hero mỗi 6 giây
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.allSettled([
      categoryApi.getAll(),
      productApi.getAll({ pageSize: 999 }),
      userApi.getArtists(),
    ])
      .then(([catRes, prodRes, artRes]) => {
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data || []);
        if (prodRes.status === 'fulfilled') {
          const data = prodRes.value.data?.items || prodRes.value.data?.data || prodRes.value.data || [];
          setAllProducts(Array.isArray(data) ? data : []);
        }
        if (artRes.status === 'fulfilled') {
          const map = {};
          (artRes.value.data || []).forEach(a => { map[a.id] = a; });
          setArtistProfiles(map);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const newest  = useMemo(() => [...allProducts].sort((a, b) => b.id - a.id).slice(0, 10), [allProducts]);
  const popular = useMemo(() =>
    [...allProducts]
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      .slice(0, 10),
  [allProducts]);

  const artists = useMemo(() => {
    const map = {};
    allProducts.forEach(p => {
      const name = p.artistName || p.artist;
      const sellerId = p.sellerId;
      if (!name && !sellerId) return;
      const key = sellerId ? `id:${sellerId}` : `name:${name}`;
      if (!map[key]) {
        const profile = sellerId ? artistProfiles[sellerId] : null;
        map[key] = {
          name: profile?.name || profile?.fullName || name || 'Nghệ sĩ',
          count: 0,
          avatarUrl: profile?.avatarUrl ? toImg(profile.avatarUrl) : null,
          sellerId: sellerId || null,
        };
      }
      map[key].count++;
      if (sellerId && artistProfiles[sellerId]) {
        const profile = artistProfiles[sellerId];
        map[key].name = profile.name || profile.fullName || map[key].name;
        if (!map[key].avatarUrl && profile.avatarUrl) {
          map[key].avatarUrl = toImg(profile.avatarUrl);
        }
      }
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'))
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

  /* Lấy chủ đề từ sản phẩm (cho strip 6 cột) */
  const themesStrip = useMemo(() => {
    const map = {};
    allProducts.forEach(p => {
      if (!p.theme) return;
      if (!map[p.theme]) map[p.theme] = { name: p.theme, coverUrl: null, count: 0 };
      map[p.theme].count++;
      if (!map[p.theme].coverUrl && p.imageUrl) map[p.theme].coverUrl = toImg(p.imageUrl);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [allProducts]);

  const handleAdd = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { openLogin(); return; }
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
        .cat3:hover .cat3-title { text-decoration: underline; text-underline-offset: 3px; }

        /* strip category */
        .cat-strip { display: block; text-decoration: none; color: inherit; }
        .cat-strip-img { overflow: hidden; }
        .cat-strip-img img { transition: transform .45s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .cat-strip:hover .cat-strip-img img { transform: scale(1.05); }

        /* artist card */
        .art-artist { display: block; text-decoration: none; color: inherit; text-align: center; }
        .art-artist-avatar { overflow: hidden; border-radius: 50%; margin: 0 auto 14px; }
        .art-artist-avatar img { transition: transform .5s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .art-artist:hover .art-artist-avatar img { transform: scale(1.06); }
        .art-artist-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 992px) {
          .art-artist-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .art-artist-grid { grid-template-columns: 1fr; }
        }
        .about-title-row { margin-bottom: 48px; }
        .about-title-row h2 { white-space: nowrap; }
        .about-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; align-items: start; }
        @media (max-width: 992px) {
          .about-title-row h2 { white-space: normal; }
        }
        @media (max-width: 768px) {
          .about-features-grid { grid-template-columns: 1fr; gap: 36px; }
        }
      `}</style>

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section style={{ backgroundImage: `url(${heroBg})`, backgroundSize:'cover', backgroundPosition:'center', transition: 'background-image 0.8s ease-in-out', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 0 60px', position: 'relative', overflow: 'hidden', marginTop: -64 }}>
        {/* Dark overlay để chữ dễ đọc */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 1 }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '100%', margin: '0 auto', textAlign: 'center' }} className="art-fade">

              <h1 style={{ margin: '-100px 0 32px', lineHeight: 1.15, textAlign: 'center' }}>
                <span style={{
                  display: 'block',
                  fontSize: 'clamp(3rem,9vw,100px)',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                }}>Nơi</span>
                {/* Dòng chính — luôn 1 dòng, căn giữa */}
                <span style={{ display: 'block', whiteSpace: 'nowrap', fontWeight: 200, fontSize: 'clamp(1.2rem,3.5vw,4rem)', color: 'white', letterSpacing: '0.04em', fontFamily: "'Playfair Display', serif", lineHeight: 1.15, textAlign: 'center' }}>
                  Nghệ Thuật{' '}<em style={{ fontWeight: 700, color: '#c8a97a', fontStyle: 'italic' }}>Gặp Gỡ</em>{' '}Tâm Hồn
                </span>
              </h1>

              {/* 2 dòng phụ — luôn 1 dòng, căn giữa */}
              <div style={{ marginBottom: 36 }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(0.72rem,1.5vw,1.08rem)', color: 'rgba(255,255,255,0.78)', letterSpacing: '0.02em', margin: '0 0 8px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  Khám phá bộ sưu tập tranh gốc từ các họa sĩ tài năng Việt Nam
                </p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(0.65rem,1.3vw,0.95rem)', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.02em', margin: 0, whiteSpace: 'nowrap', textAlign: 'center' }}>
                  Nơi mỗi tác phẩm là một khung cảm xúc, một câu chuyện riêng
                </p>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 180, background: '#c8a97a', color: 'white', textDecoration: 'none', padding: '13px 0', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid #c8a97a', transition: 'background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#8b6c4a'; e.currentTarget.style.borderColor = '#8b6c4a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#c8a97a'; e.currentTarget.style.borderColor = '#c8a97a'; }}>
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
      </section>

      {/* ══════════════════════════ TRUST STRIP ══════════════════════════ */}
      <div style={{ background: '#1a1a1a', padding: '14px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {[
              { icon: 'fa-certificate',  text: 'Tác phẩm gốc có chứng nhận' },
              { icon: 'fa-truck',        text: 'Giao hàng toàn quốc' },
              { icon: 'fa-undo-alt',     text: 'Đổi trả trong 7 ngày' },
              { icon: 'fa-palette',      text: 'Trực tiếp từ họa sĩ' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                <i className={`fas ${f.icon}`} style={{ color: '#c8a97a', fontSize: '0.9rem' }} />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ SECTION 1: 3 CỘT DANH MỤC LỚN ══════════════════
          Giống artnam: ảnh dọc portrait, text bên dưới (không phải overlay)
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '30px 0' }}>
        <div className="container">
          <SecHead title="Tranh Theo Thể Loại" linkTo="/shop" />

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
                  <div className="cat3-img-wrap" style={{ paddingBottom: '90%', position: 'relative', background: '#f2ede8', marginBottom: 16 }}>
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
                  {/* Text bên dưới ảnh */}
                  
                  <h3 className="cat3-title" style={{ fontWeight: 400, fontSize: '2rem', color: '#1a1a1a', marginBottom: 10, letterSpacing: '0.02em', textAlign: 'center' }}>
                    {cat.name}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════ SECTION 2: STRIP 6 CỘT CHỦ ĐỀ ══════════════════════
          Gom theo product.theme: ảnh nhỏ + tên chủ đề bên dưới
      ════════════════════════════════════════════════════════════════════════ */}
      {(loading || themesStrip.length > 0) && (
        <section style={{ background: '#1a1a1a', padding: '64px 0' }}>
          <div className="container">
            <SecHead label="Chủ đề" title="Tranh Theo Chủ Đề" linkTo="/shop" dark />
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                {[1, 2, 3, 4, 5, 6].map(i => <Sk key={i} ratio="100%" />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(themesStrip.length, 6)}, 1fr)`, gap: 16 }}>
                {themesStrip.map(theme => (
                  <Link key={theme.name} to={`/shop?theme=${encodeURIComponent(theme.name)}`} className="cat-strip" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="cat-strip-img" style={{ paddingBottom: '100%', position: 'relative', background: '#2a2a2a', marginBottom: 12 }}>
                      {theme.coverUrl ? (
                        <img src={theme.coverUrl} alt={theme.name} loading="lazy"
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8b8a8' }}>
                          <i className="fas fa-palette" style={{ fontSize: '2rem' }} />
                        </div>
                      )}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', textAlign: 'center', margin: 0, letterSpacing: '0.02em' }}>
                      {theme.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════ SECTION 3: TRANH MỚI NHẤT – 4 cột ══════════════════ */}
      <section style={{ background: 'white', padding: '72px 0' }}>
        <div className="container">
          <SecHead label="Vừa cập nhật" title="Tranh Mới Nhất" linkTo="/shop" />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
              {Array.from({ length: 10 }).map((_, i) => <Sk key={i} />)}
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

      {/* ══════════════════ SECTION 4: THƯỞNG LÃM NHIỀU NHẤT – 4 cột ═════════ */}
      {!loading && popular.length > 0 && (
        <section style={{ background: '#1a1a1a', padding: '72px 0' }}>
          <div className="container">
            <SecHead label="Arthentic đề xuất" title="Được Yêu Thích Nhất" linkTo="/shop" dark />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 24 }}>
              {popular.map(p => (
                <ArtCard
                  key={p.id}
                  product={p}
                  addedId={addedId}
                  onAdd={handleAdd}
                  showArtist={false}
                  showPrice={false}
                  dark
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ SECTION 5: HỌA SĨ NỔI BẬT – avatar tròn ══════════════════ */}
      {!loading && artists.length > 0 && (
        <section style={{ background: 'white', padding: '72px 0' }}>
          <div className="container">
            <SecHead label="Nghệ sĩ" title="Vẽ nên kiệt tác" linkTo="/artists" linkText="Tất cả họa sĩ" />
            <div className="art-artist-grid">
              {artists.map(artist => (
                <Link key={artist.sellerId || artist.name} to={artist.sellerId ? `/artists/${artist.sellerId}` : '/artists'} className="art-artist" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="art-artist-avatar" style={{ width: 200, height: 200, background: '#f2ede8' }}>
                    {artist.avatarUrl ? (
                      <img src={artist.avatarUrl} alt={artist.name} loading="lazy"
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #c8a97a 0%, #8b6c4a 100%)' }}>
                        <span style={{ fontSize: '3.2rem', fontWeight: 200, color: 'white' }}>{artist.name[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <p style={{ color: '#8b6c4a', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
                    {artist.count} tác phẩm
                  </p>
                  <h3 style={{ fontWeight: 500, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: 8, letterSpacing: '0.02em' }}>
                    {artist.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════ VỀ ARTHENTIC ══════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#1a1a1a', color: 'white' }}>
        <div className="container" style={{ paddingInline: 32 }}>
          <div className="about-title-row">
            <p style={{ color: '#c8a97a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Về chúng tôi</p>
            <h2 style={{ fontWeight: 200, fontSize: 'clamp(1.7rem, 3.8vw, 2.4rem)', textAlign: 'center', color: 'white', margin: 0, lineHeight: 1.3, letterSpacing: '0.02em', fontFamily: "'Playfair Display', serif" }}>
              <em style={{ fontStyle: 'italic' }}>Arthentic</em> — nơi nghệ thuật có giá trị thật
            </h2>
          </div>

          <div className="about-features-grid">
            {[
              { icon: 'fa-award',     title: 'Nâng tầm nghệ thuật bản địa',   desc: 'Tôn vinh và lan tỏa giá trị của nghệ thuật tạo hình Việt Nam đến người yêu tranh trong nước và quốc tế.' },
              { icon: 'fa-handshake', title: 'Kết nối họa sĩ và công chúng',  desc: 'Tạo nền tảng minh bạch, tin cậy để họa sĩ bán tranh trực tiếp, không qua trung gian.' },
              { icon: 'fa-heart',     title: 'Chữa lành bằng nghệ thuật',     desc: 'Mỗi tác phẩm là một câu chuyện — chúng tôi giúp bạn tìm đúng tác phẩm chạm đến tâm hồn mình.' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ width: 44, height: 44, border: '1px solid rgba(200,169,122,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <i className={`fas ${f.icon}`} style={{ color: '#c8a97a', fontSize: '1rem' }} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white', marginBottom: 12, letterSpacing: '0.02em' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, maxWidth: 520 }}>
            <Link to="/artists" style={{ color: '#c8a97a', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #c8a97a', paddingBottom: 2,textAlign: 'right'}}>
              Gặp gỡ họa sĩ →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ══════════════════════ */}
      <section style={{ padding: '80px 0', background: '#f9f6f2', textAlign: 'center' }}>
        <div className="container">
          <p style={{ color: '#c8a97a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Dành cho họa sĩ</p>
            <h2 style={{ fontWeight: 200, fontSize: 'clamp(1.7rem, 3.8vw, 2.4rem)', textAlign: 'center', color: '#1a1a1a', margin: 0, lineHeight: 1.3, letterSpacing: '0.02em', fontFamily: "'Playfair Display', serif" }}>
              Hãy đưa tác phẩm của bạn đến với những người yêu nghệ thuật
            </h2>
          <p style={{ color: '#767676', maxWidth: 920, margin: '0 auto 15px', lineHeight: 1.85, fontSize: '1.15rem' }}>
            <em style={{ fontStyle: 'italic' }}>Tham gia cùng hàng chục họa sĩ đang bán tác phẩm trực tiếp trên Arthentic không qua trung gian, không ẩn phí</em>
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={openRegister} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a1a1a', color: 'white', border: 'none', cursor: 'pointer', padding: '13px 32px', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Đăng ký ngay
            </button>
            <Link to="/artists" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#1a1a1a', textDecoration: 'none', padding: '12px 30px', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1.5px solid #1a1a1a' }}>
              Xem họa sĩ
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Home;
