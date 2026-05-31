import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi, userApi } from '../services/api';
import PublicLayout from '../components/PublicLayout';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const ArtistCard = ({ artist }) => {
  const [imgErr, setImgErr] = useState(false);
  const initial = (artist.name || '?')[0].toUpperCase();
  const showImg = artist.avatarUrl && !imgErr;
  const cats = [...new Set(artist.products.map(p => p.categoryName).filter(Boolean))];

  return (
    <Link
      to={artist.sellerId ? `/artists/${artist.sellerId}` : `/shop?artist=${encodeURIComponent(artist.name)}`}
      className="artist-card-link"
    >
      {/* Portrait image */}
      <div className="artist-portrait">
        {showImg ? (
          <img
            src={artist.avatarUrl}
            alt={artist.name}
            loading="lazy"
            className="artist-portrait-img"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="artist-portrait-fallback">
            <span className="artist-portrait-initial">{initial}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="artist-overlay">
          <span className="artist-overlay-text">Xem hồ sơ</span>
        </div>
        {/* Work count badge */}
        <div className="artist-badge">{artist.products.length} tác phẩm</div>
      </div>

      {/* Info */}
      <div className="artist-info">
        {cats.length > 0 && (
          <p className="artist-cats">{cats.slice(0, 2).join(' · ')}</p>
        )}
        <h3 className="artist-name">{artist.name}</h3>
        {artist.bio && (
          <p className="artist-excerpt">{artist.bio.slice(0, 72)}{artist.bio.length > 72 ? '…' : ''}</p>
        )}
        <span className="artist-readmore">Xem thêm →</span>
      </div>
    </Link>
  );
};

const Artists = () => {
  const [products, setProducts]   = useState([]);
  const [artistMap, setArtistMap] = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    Promise.allSettled([
      productApi.getAll({ pageSize: 999 }),
      userApi.getArtists(),
    ]).then(([pRes, aRes]) => {
      const data = pRes.status === 'fulfilled'
        ? (pRes.value.data?.items || pRes.value.data?.data || pRes.value.data || [])
        : [];
      setProducts(Array.isArray(data) ? data : []);

      if (aRes.status === 'fulfilled') {
        const map = {};
        (aRes.value.data || []).forEach(a => { map[a.id] = a; });
        setArtistMap(map);
      }
      if (pRes.status === 'rejected') setError('Không thể tải danh sách nghệ sĩ.');
    }).finally(() => setLoading(false));
  }, []);

  const artists = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const name = p.artistName || p.artist;
      if (!name) return;
      if (!map[name]) {
        const profile = p.sellerId ? artistMap[p.sellerId] : null;
        map[name] = {
          name,
          products: [],
          sellerId: p.sellerId,
          avatarUrl: profile?.avatarUrl || null,
          bio: profile?.bio || '',
        };
      }
      map[name].products.push(p);
      if (!map[name].avatarUrl && p.sellerId) {
        const profile = artistMap[p.sellerId];
        if (profile?.avatarUrl) map[name].avatarUrl = profile.avatarUrl;
      }
    });
    return Object.values(map).sort((a, b) => b.products.length - a.products.length);
  }, [products, artistMap]);

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      <style>{`
        @keyframes shimmer { 0%{opacity:1}50%{opacity:.4}100%{opacity:1} }

        /* Card link reset */
        .artist-card-link {
          text-decoration: none !important;
          color: inherit;
          display: block;
        }

        /* Portrait container */
        .artist-portrait {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #f0ece8;
          margin-bottom: 16px;
        }
        .artist-portrait-img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.5s ease;
        }
        .artist-portrait-fallback {
          width: 100%; height: 100%;
          background: linear-gradient(160deg, #c8a97a 0%, #8b6c4a 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .artist-portrait-initial {
          color: white; font-weight: 200; font-size: clamp(2.5rem, 8vw, 4rem);
          letter-spacing: 0.05em;
        }

        /* Overlay on hover */
        .artist-overlay {
          position: absolute; inset: 0;
          background: rgba(26,26,26,0.45);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.35s ease;
        }
        .artist-overlay-text {
          color: white; font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.7);
          padding: 9px 22px;
        }

        /* Work-count badge */
        .artist-badge {
          position: absolute; bottom: 12px; left: 12px;
          background: rgba(200,169,122,0.92);
          color: white; font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 10px;
        }

        /* Info */
        .artist-info { padding: 0 2px; }
        .artist-cats {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.16em;
          color: #c8a97a; text-transform: uppercase;
          margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .artist-name {
          font-weight: 500; font-size: 1rem; color: #1a1a1a;
          margin: 0 0 6px; letter-spacing: 0.02em;
          transition: color 0.2s;
        }
        .artist-excerpt {
          font-size: 0.78rem; color: #767676; font-weight: 300;
          line-height: 1.55; margin: 0 0 10px;
        }
        .artist-readmore {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em;
          color: #c8a97a; text-transform: uppercase;
          opacity: 0; transition: opacity 0.2s;
        }

        /* Hover effects */
        .artist-card-link:hover .artist-portrait-img { transform: scale(1.05); }
        .artist-card-link:hover .artist-overlay { opacity: 1; }
        .artist-card-link:hover .artist-name { color: #8b6c4a !important; }
        .artist-card-link:hover .artist-readmore { opacity: 1; }

        /* Skeleton */
        .skel { background: #ede8e3; animation: shimmer 1.6s ease-in-out infinite; }
      `}</style>

      {/* Page header - chỉ còn 1 dòng */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8e4df', padding: '28px 0 24px' }}>
        <div className="container">
          <h1 style={{ 
            color: '#1a1a1a', 
            fontWeight: 500, 
            fontSize: 'clamp(1.9rem, 4.2vw, 2.7rem)', 
            letterSpacing: '0.01em', 
            margin: 0,
            lineHeight: 1.15,
            fontFamily: "'Playfair Display', serif"
          }}>
            NGƯỜI SÁNG TẠO NGHỆ THUẬT
          </h1>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ background: '#faf8f5', borderBottom: '1px solid #e8e4df', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '0.78rem' }} />
            <input
              type="text"
              placeholder="Tìm họa sĩ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 32px 8px 34px', border: '1px solid #e8e4df', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', color: '#1a1a1a', background: 'white' }}
              onFocus={e => e.target.style.borderColor = '#1a1a1a'}
              onBlur={e => e.target.style.borderColor = '#e8e4df'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem', padding: 0 }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Artist grid ── */}
      <div style={{ background: '#faf8f5', padding: '52px 0 80px' }}>
        <div className="container">

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '36px 24px' }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i}>
                  <div className="skel" style={{ aspectRatio: '3/4', marginBottom: 14 }} />
                  <div className="skel" style={{ height: 10, width: '45%', marginBottom: 8 }} />
                  <div className="skel" style={{ height: 15, width: '75%', marginBottom: 8 }} />
                  <div className="skel" style={{ height: 11, width: '90%' }} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: '#aaa', fontSize: '2rem', marginBottom: 12 }}>✦</p>
              <p style={{ color: '#991b1b', marginBottom: 20 }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ padding: '12px 28px', background: '#1a1a1a', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Thử lại
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && artists.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '2.5rem', color: '#e8e4df', marginBottom: 16 }}>✦</p>
              <p style={{ fontWeight: 300, color: '#767676' }}>Chưa có dữ liệu nghệ sĩ</p>
            </div>
          )}

          {/* No search results */}
          {!loading && !error && artists.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
              <p style={{ fontWeight: 300, color: '#767676' }}>Không tìm thấy họa sĩ phù hợp</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <>
              {search && (
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 32 }}>
                  {filtered.length} kết quả cho "{search}"
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '48px 24px' }}>
                {filtered.map(artist => (
                  <ArtistCard key={artist.name} artist={artist} />
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </PublicLayout>
  );
};

export default Artists;
