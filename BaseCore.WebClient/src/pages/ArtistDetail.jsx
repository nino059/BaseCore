import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi, userApi } from '../services/api';
import PublicLayout from '../components/PublicLayout';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

/* ── Painting card ─────────────────────────────────────── */
const PaintingCard = ({ p }) => {
  const [hover, setHover] = useState(false);
  const price = p.discountPrice ?? p.price;

  return (
    <Link
      to={`/product/${p.id}`}
      className="paint-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Image */}
      <div className="paint-img-wrap">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            className={`paint-img${hover ? ' hovered' : ''}`}
          />
        ) : (
          <div className="paint-img-placeholder">
            <i className="fas fa-image" style={{ color: '#d4c4b0', fontSize: '2rem' }} />
          </div>
        )}
        {/* Hover overlay */}
        <div className={`paint-overlay${hover ? ' visible' : ''}`}>
          <span className="paint-overlay-btn">Xem tác phẩm</span>
        </div>
        {/* Status badge */}
        {p.status && p.status !== 'ForSale' && (
          <div className="paint-status-badge">
            {p.status === 'Ordered' ? 'Đã đặt' : 'Đã bán'}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="paint-meta">
        {p.categoryName && (
          <p className="paint-cat">{p.categoryName}</p>
        )}
        <h3 className={`paint-name${hover ? ' hovered' : ''}`}>{p.name}</h3>
        <div className="paint-footer">
          {price > 0 ? (
            <span className="paint-price">{fmt(price)}</span>
          ) : (
            <span className="paint-price-contact">Liên hệ</span>
          )}
          {p.material && (
            <span className="paint-material">{p.material}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ── Main page ─────────────────────────────────────────── */
const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([
      userApi.getArtists(),
      productApi.getAll({ pageSize: 999 }),
    ]).then(([aRes, pRes]) => {
      if (aRes.status === 'fulfilled') {
        const found = (aRes.value.data || []).find(a => a.id === id);
        if (!found) { setError('Không tìm thấy họa sĩ'); setLoading(false); return; }
        setArtist(found);
      } else {
        setError('Không thể tải thông tin họa sĩ');
        setLoading(false);
        return;
      }
      if (pRes.status === 'fulfilled') {
        const all = pRes.value.data?.items || pRes.value.data?.data || pRes.value.data || [];
        setProducts((Array.isArray(all) ? all : []).filter(p => p.sellerId === id));
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const cats = useMemo(() =>
    [...new Set(products.map(p => p.categoryName).filter(Boolean))],
    [products]
  );

  const initial = (artist?.name || '?')[0].toUpperCase();

  /* Loading */
  if (loading) return (
    <PublicLayout>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '2px solid #e8e4df', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 300 }}>Đang tải…</p>
        </div>
      </div>
    </PublicLayout>
  );

  /* Error */
  if (error || !artist) return (
    <PublicLayout>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
          <p style={{ color: '#767676', marginBottom: 24, fontWeight: 300 }}>{error || 'Không tìm thấy họa sĩ'}</p>
          <button onClick={() => navigate('/artists')} style={{ padding: '12px 32px', background: 'var(--ink)', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    </PublicLayout>
  );

  const longBio = artist.bio && artist.bio.length > 300;
  const bioText = longBio && !bioExpanded ? artist.bio.slice(0, 300) + '…' : artist.bio;

  return (
    <PublicLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        /* ── Painting card ── */
        .paint-card { text-decoration: none !important; color: inherit; display: block; }
        .paint-img-wrap {
          position: relative; overflow: hidden; background: #f0ece8;
          aspect-ratio: 4/3; margin-bottom: 14px;
        }
        .paint-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.5s ease;
        }
        .paint-img.hovered { transform: scale(1.05); }
        .paint-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .paint-overlay {
          position: absolute; inset: 0;
          background: rgba(26,26,26,0.48);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s ease;
        }
        .paint-overlay.visible { opacity: 1; }
        .paint-overlay-btn {
          color: white; font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.65); padding: 8px 20px;
        }
        .paint-status-badge {
          position: absolute; top: 10px; right: 10px;
          background: var(--ink); color: white;
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 3px 9px;
        }
        .paint-meta { padding: 0 2px; }
        .paint-cat {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.15em;
          color: var(--brand); text-transform: uppercase; margin: 0 0 5px;
        }
        .paint-name {
          font-weight: 500; font-size: 0.88rem; color: var(--ink);
          margin: 0 0 8px; line-height: 1.35; transition: color 0.2s;
        }
        .paint-name.hovered { color: var(--brand-dark); }
        .paint-footer {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .paint-price {
          font-size: 0.82rem; color: var(--brand-dark); font-weight: 700;
        }
        .paint-price-contact {
          font-size: 0.78rem; color: #aaa; font-style: italic;
        }
        .paint-material {
          font-size: 0.62rem; color: #aaa; font-weight: 400;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;
        }

        /* ── Divider ── */
        .section-divider {
          display: flex; align-items: center; gap: 18; margin-bottom: 36px;
        }
        .section-divider-line {
          flex: 1; height: 1px; background: #e8e4df;
        }
      `}</style>

      {/* ═══════════════════════════════════════════
          HERO — dark banner with blurred avatar bg
      ═══════════════════════════════════════════ */}
      <div style={{ position: 'relative', background: 'var(--ink)', overflow: 'hidden', marginTop: -64 }}>
        {/* Blurred background image */}
        {artist.avatarUrl && (
          <img
            src={artist.avatarUrl}
            alt=""
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: 0.18,
              filter: 'blur(14px) saturate(1.2)',
              transform: 'scale(1.08)',
            }}
          />
        )}
        {/* Decorative grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(200,169,122,0.05) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(200,169,122,0.05) 40px)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', padding: '80px 0 72px', animation: 'fadeUp 0.6s ease' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
            {/* Label */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <p style={{ fontSize: 50, fontWeight: 700, letterSpacing: '0.28em', color: 'var(--brand)', textTransform: 'uppercase', margin: '0 0 12px' }}>
                ✦&nbsp;Họa Sĩ
              </p>
              <h1 style={{ fontWeight: 200, fontSize: 'clamp(2rem, 5vw, 3.8rem)', color: 'white', letterSpacing: '0.06em', margin: '0 0 20px', lineHeight: 1.1 }}>
                {artist.name}
              </h1>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 36 }}>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 200, color: 'var(--brand)', lineHeight: 1 }}>{products.length}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 3 }}>Tác phẩm</div>
                </div>
                {cats.length > 0 && (
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 200, color: 'var(--brand)', lineHeight: 1 }}>{cats.length}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 3 }}>Chủ đề</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          BIO — 2 col: portrait (left) + info (right)
      ═══════════════════════════════════════════ */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8e4df' }}>
        <div className="container" style={{ padding: '64px 0 60px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)',
            gap: '56px 64px',
            alignItems: 'start',
          }}>

            {/* ── Portrait ── */}
            <div>
              <div style={{
                aspectRatio: '3/4',
                overflow: 'hidden',
                background: artist.avatarUrl ? '#f0ece8' : 'linear-gradient(160deg, var(--brand) 0%, var(--brand-dark) 100%)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              }}>
                {artist.avatarUrl ? (
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 200, fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '0.04em' }}>
                      {initial}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Info ── */}
            <div style={{ paddingTop: 8 }}>
              {/* Sub-label */}
              <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.24em', color: 'var(--brand)', textTransform: 'uppercase', margin: '0 0 14px' }}>
                Tiểu Sử
              </p>
              <h2 style={{ fontWeight: 300, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'var(--ink)', letterSpacing: '0.04em', margin: '0 0 24px', lineHeight: 1.2 }}>
                {artist.name}
              </h2>

              {/* Decorative separator */}
              <div style={{ width: 48, height: 1, background: 'var(--brand)', marginBottom: 24 }} />

              {/* Category tags */}
              {cats.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                  {cats.map(c => (
                    <span key={c} style={{
                      padding: '4px 14px', fontSize: '0.62rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      border: '1px solid #e8e4df', color: '#767676', background: '#faf8f5',
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio text */}
              {artist.bio ? (
                <div>
                  <p style={{ fontSize: '0.95rem', color: '#4a4a4a', lineHeight: 1.85, fontWeight: 300, margin: '0 0 14px', whiteSpace: 'pre-line' }}>
                    {bioText}
                  </p>
                  {longBio && (
                    <button
                      onClick={() => setBioExpanded(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand)', textTransform: 'uppercase' }}
                    >
                      {bioExpanded ? '← Thu gọn' : 'Xem đầy đủ →'}
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.88rem', color: '#bbb', fontStyle: 'italic', lineHeight: 1.7 }}>
                  Họa sĩ chưa cập nhật thông tin giới thiệu.
                </p>
              )}

              {/* Stats boxes */}
              <div style={{ display: 'flex', gap: 0, marginTop: 40, borderTop: '1px solid #e8e4df', borderLeft: '1px solid #e8e4df' }}>
                {[
                  { value: products.length, label: 'Tác phẩm' },
                  { value: cats.length || '—', label: 'Chủ đề' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: '20px 24px', borderRight: '1px solid #e8e4df', borderBottom: '1px solid #e8e4df', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 200, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          WORKS — painting grid
      ═══════════════════════════════════════════ */}
      <div style={{ background: '#faf8f5', padding: '64px 0 88px' }}>
        <div className="container">

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.22em', color: 'var(--brand)', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Bộ sưu tập
              </p>
              <h2 style={{ fontWeight: 200, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--ink)', letterSpacing: '0.04em', margin: 0 }}>
                Tác Phẩm
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 300 }}>
              {products.length} tranh
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#e8e4df', marginBottom: 40 }} />

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 0' }}>
              <p style={{ fontSize: '2.5rem', color: '#e8e4df', marginBottom: 16 }}>✦</p>
              <p style={{ color: '#aaa', fontWeight: 300, fontSize: '0.9rem' }}>Chưa có tác phẩm nào được đăng</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px 24px' }}>
              {products.map(p => <PaintingCard key={p.id} p={p} />)}
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Footer CTA — back to artists
      ═══════════════════════════════════════════ */}
      <div style={{ background: 'white', borderTop: '1px solid #e8e4df', padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--brand)', textTransform: 'uppercase', margin: '0 0 6px' }}>Khám phá thêm</p>
            <p style={{ fontWeight: 300, color: 'var(--ink)', fontSize: '1.05rem', margin: 0 }}>Các họa sĩ khác trong gallery</p>
          </div>
          <Link
            to="/artists"
            style={{
              display: 'inline-block',
              padding: '13px 32px',
              background: 'var(--ink)', color: 'white',
              textDecoration: 'none',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
          >
            Tất cả họa sĩ →
          </Link>
        </div>
      </div>

    </PublicLayout>
  );
};

export default ArtistDetail;
