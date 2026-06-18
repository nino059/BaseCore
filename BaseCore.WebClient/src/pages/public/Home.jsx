import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi } from '../../services/api';
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
const ArtCard = ({ product, addedId, onAdd }) => {FileList
  const [hov, setHov] = useState(false);
  const { isArtist } = useAuth();
  const hasDisc = product.discountPrice && product.discountPrice < product.price;
  const price   = product.discountPrice ?? product.price ?? 0;
  const imgUrl  = toImg(product.imageUrl);

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
          {product.status === 'ForSale' ? (
            <div style={{ position: 'absolute', top: 10, left: 10, background: '#065f46', color: 'white', padding: '3px 10px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em' }}>ĐANG BÁN</div>
          ) : product.status === 'Ordered' ? (
            <div style={{ position: 'absolute', top: 10, left: 10, background: '#92400e', color: 'white', padding: '3px 10px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em' }}>ĐÃ ĐẶT</div>
          ) : (
            <div style={{ position: 'absolute', top: 10, left: 10, background: '#1a1a1a', color: 'white', padding: '3px 10px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em' }}>ĐÃ BÁN</div>
          )}
          {hasDisc && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: '#c0392b', color: 'white', padding: '3px 8px', fontSize: '0.66rem', fontWeight: 800 }}>
              -{Math.round((1 - product.discountPrice / product.price) * 100)}%
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
        <div style={{ fontWeight: 500, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: product.status === 'ForSale' ? '#1a1a1a' : '#9ca3af' }}>
          {fmt(price)}
          {hasDisc && product.status === 'ForSale' && (
            <span style={{ fontSize: '0.75rem', color: '#aaa', textDecoration: 'line-through', marginLeft: 8, fontWeight: 400 }}>{fmt(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─── Section heading artnam style ─── */
const SecHead = ({ label, title, linkTo, linkText = 'Xem tất cả' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
    <div>
      {label && <p style={{ color: '#8b6c4a', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>}
      <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.4rem,3vw,1.9rem)', color: '#1a1a1a', margin: 0, letterSpacing: '0.02em' }}>{title}</h2>
    </div>
    {linkTo && (
      <Link to={linkTo} style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a', paddingBottom: 1, whiteSpace: 'nowrap' }}>
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
    Promise.all([categoryApi.getAll(), productApi.getAll({ pageSize: 999 })])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data || []);
        const data = prodRes.data?.items || prodRes.data?.data || prodRes.data || [];
        setAllProducts(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const newest  = useMemo(() => [...allProducts].sort((a, b) => b.id - a.id).slice(0, 8),  [allProducts]);
  const popular = useMemo(() => [...allProducts].sort((a, b) => b.id - a.id).slice(8, 16), [allProducts]);

  const artists = useMemo(() => {
    const map = {};
    allProducts.forEach(p => {
      const name = p.artistName || p.artist;
      if (!name) return;
      if (!map[name]) map[name] = { name, count: 0, cover: null, sellerId: p.sellerId || null };
      map[name].count++;
      if (!map[name].cover && p.imageUrl) map[name].cover = toImg(p.imageUrl);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [allProducts]);

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
        .art-artist { display: block; text-decoration: none; color: inherit; }
        .art-artist-img { overflow: hidden; }
        .art-artist-img img { transition: transform .5s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .art-artist:hover .art-artist-img img { transform: scale(1.04); }
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
                  <h3 className="cat3-title" style={{ fontWeight: 400, fontSize: '1.05rem', color: '#1a1a1a', marginBottom: 10, letterSpacing: '0.02em' }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a', paddingBottom: 1 }}>
                    Khám phá ngay →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════ SECTION 2: STRIP 6 CỘT DANH MỤC NHỎ ══════════════
          Giống artnam "Tranh theo đề tài": ảnh nhỏ + tên bên dưới, scroll ngang
      ════════════════════════════════════════════════════════════════════════ */}
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
                  <p style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a1a', textAlign: 'center', margin: 0, letterSpacing: '0.02em' }}>
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ SECTION 3: TRANH MỚI NHẤT – 4 cột ══════════════════ */}
      <section style={{ background: 'white', padding: '72px 0' }}>
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

      {/* ══════════════════ SECTION 4: THƯỞNG LÃM NHIỀU NHẤT – 4 cột ═════════ */}
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

      {/* ══════════════════ SECTION 5: HỌA SĨ NỔI BẬT – 4 cột portrait ═══════
          Giống artnam: ảnh portrait + tên + số tranh bên dưới (không hình tròn)
      ════════════════════════════════════════════════════════════════════════ */}
      {!loading && artists.length > 0 && (
        <section style={{ background: 'white', padding: '72px 0' }}>
          <div className="container">
            <SecHead label="Nghệ sĩ" title="Họa Sĩ Nổi Bật" linkTo="/artists" linkText="Tất cả họa sĩ" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 28 }}>
              {artists.map(artist => (
                <Link key={artist.name} to={artist.sellerId ? `/artists/${artist.sellerId}` : '/artists'} className="art-artist" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="art-artist-img" style={{ paddingBottom: '120%', position: 'relative', background: '#f2ede8', marginBottom: 14 }}>
                    {artist.cover ? (
                      <img src={artist.cover} alt={artist.name} loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 200, color: '#c8b8a8' }}>{artist.name[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <p style={{ color: '#8b6c4a', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
                    {artist.count} tác phẩm
                  </p>
                  <h3 style={{ fontWeight: 500, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: 8, letterSpacing: '0.02em' }}>
                    {artist.name}
                  </h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #1a1a1a', paddingBottom: 1 }}>
                    Xem tranh →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════ VỀ ARTHENTIC ══════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#1a1a1a', color: 'white' }}>
        <div className="container" style={{ paddingInline: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 48 }}>
            <div>
              <p style={{ color: '#c8a97a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Về chúng tôi</p>
              <h2 style={{ fontWeight: 200, fontSize: '1.9rem', color: 'white', marginBottom: 20, lineHeight: 1.3, letterSpacing: '0.02em' }}>
                <em style={{ fontStyle: 'italic' }}>Arthentic</em> —<br />nơi nghệ thuật<br />có giá trị thật
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.85, marginBottom: 28 }}>
                Chúng tôi tin rằng nghệ thuật không phải là xa xỉ phẩm — đó là ngôn ngữ chữa lành, kết nối, và nâng tầm tinh thần con người.
              </p>
              <Link to="/artists" style={{ color: '#c8a97a', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #c8a97a', paddingBottom: 2 }}>
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
                  <i className={`fas ${f.icon}`} style={{ color: '#c8a97a', fontSize: '1rem' }} />
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
          <p style={{ color: '#8b6c4a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Dành cho họa sĩ</p>
          <h2 style={{ fontWeight: 200, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#1a1a1a', marginBottom: 16, lineHeight: 1.2, letterSpacing: '0.02em' }}>
            Bạn là nghệ sĩ?<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Hãy đưa tác phẩm ra thế giới.</em>
          </h2>
          <p style={{ color: '#767676', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.85, fontSize: '0.95rem' }}>
            Tham gia cùng hàng chục họa sĩ đang bán tác phẩm trực tiếp trên Arthentic — không qua trung gian, không ẩn phí.
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
