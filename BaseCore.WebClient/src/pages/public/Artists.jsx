import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productApi, userApi } from '../../services/api';
import PublicLayout from '../../components/layout/PublicLayout';
import { useFetch } from '../../hooks/useFetch';

const ArtistCard = ({ artist }) => {
  const [imgErr, setImgErr] = useState(false);
  const initial = (artist.name || '?')[0].toUpperCase();
  const showImg = artist.avatarUrl && !imgErr;
  const cats = [...new Set(artist.products.map(p => p.categoryName).filter(Boolean))];

  return (
    <Link
      to={artist.sellerId ? `/artists/${artist.sellerId}` : `/shop?artist=${encodeURIComponent(artist.name)}`}
      className="group no-underline text-inherit block"
    >
      {/* Portrait image */}
      <div className="relative aspect-3/4 overflow-hidden bg-[#f0ece8] mb-4">
        {showImg ? (
          <img
            src={artist.avatarUrl}
            alt={artist.name}
            loading="lazy"
            className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(160deg,var(--brand)_0%,var(--brand-dark)_100%)]">
            <span className="text-white font-extralight text-[clamp(2.5rem,8vw,4rem)] tracking-wider">{initial}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-ink/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-[0.75rem] font-bold tracking-[0.18em] uppercase border border-white/70 px-5.5 py-2.25">Xem hồ sơ</span>
        </div>
        {/* Work count badge */}
        <div className="absolute bottom-3 left-3 bg-[rgba(200,169,122,0.92)] text-white text-[0.6rem] font-bold tracking-widest uppercase px-2.5 py-0.75">{artist.products.length} tác phẩm</div>
      </div>

      {/* Info */}
      <div className="px-0.5">
        {cats.length > 0 && (
          <p className="text-[0.6rem] font-bold tracking-[0.16em] text-brand uppercase mt-0 mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{cats.slice(0, 2).join(' · ')}</p>
        )}
        <h3 className="font-medium text-base text-ink mt-0 mb-1.5 tracking-[0.02em] transition-colors group-hover:text-brand-dark">{artist.name}</h3>
        {artist.bio && (
          <p className="text-[0.78rem] text-muted font-light leading-[1.55] mt-0 mb-2.5">{artist.bio.slice(0, 72)}{artist.bio.length > 72 ? '…' : ''}</p>
        )}
        <span className="text-[0.68rem] font-bold tracking-[0.12em] text-brand uppercase opacity-0 group-hover:opacity-100 transition-opacity">Xem thêm →</span>
      </div>
    </Link>
  );
};

const Artists = () => {
  const [search, setSearch] = useState('');

  // Gọi song song sản phẩm + hồ sơ nghệ sĩ, gom về { products, artistMap } qua useFetch dùng chung
  const { data, loading, error } = useFetch(
    () => Promise.allSettled([
      productApi.getAll({ pageSize: 999 }),
      userApi.getArtists(),
    ]),
    [],
    {
      initialData: { products: [], artistMap: {} },
      select: ([pRes, aRes]) => {
        if (pRes.status === 'rejected') throw new Error('Không thể tải danh sách nghệ sĩ.');
        const raw = pRes.value.data?.items || pRes.value.data?.data || pRes.value.data || [];
        const artistMap = {};
        if (aRes.status === 'fulfilled') (aRes.value.data || []).forEach(a => { artistMap[a.id] = a; });
        return { products: Array.isArray(raw) ? raw : [], artistMap };
      },
    }
  );
  const artists = useMemo(() => {
    const products  = data?.products  || [];
    const artistMap = data?.artistMap || {};
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
  }, [data]);

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      {/* Page header */}
      <div className="bg-white border-b border-line pt-7 pb-6">
        <div className="max-w-285 mx-auto px-4">
          <h1 className="text-ink font-medium text-[clamp(1.9rem,4.2vw,2.7rem)] tracking-[0.01em] m-0 leading-[1.15]" style={{ fontFamily: "'Playfair Display', serif" }}>
            NGƯỜI SÁNG TẠO NGHỆ THUẬT
          </h1>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-cream py-4">
        <div className="max-w-250 mx-auto px-4 flex justify-end">
          <div className="relative w-70">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa] text-[0.78rem]" />
            <input
              type="text"
              placeholder="Tìm tên họa sĩ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-8 py-2 border border-line focus:border-ink text-[0.82rem] outline-none text-ink bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#aaa] text-base p-0">×</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Artist grid ── */}
      <div className="bg-cream pb-20">
        <div className="max-w-285 mx-auto px-4">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-9">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i}>
                  <div className="bg-[#ede8e3] animate-pulse aspect-3/4 mb-3.5" />
                  <div className="bg-[#ede8e3] animate-pulse h-2.5 w-[45%] mb-2" />
                  <div className="bg-[#ede8e3] animate-pulse h-3.75 w-[75%] mb-2" />
                  <div className="bg-[#ede8e3] animate-pulse h-2.75 w-[90%]" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-[#aaa] text-[2rem] mb-3">✦</p>
              <p className="text-[#991b1b] mb-5">{error?.message || 'Không thể tải danh sách nghệ sĩ.'}</p>
              <button onClick={() => window.location.reload()} className="px-7 py-3 bg-ink text-white border-none text-[0.75rem] font-bold tracking-[0.14em] uppercase cursor-pointer">
                Thử lại
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && artists.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[2.5rem] text-line mb-4">✦</p>
              <p className="font-light text-muted">Chưa có dữ liệu nghệ sĩ</p>
            </div>
          )}

          {/* No search results */}
          {!loading && !error && artists.length > 0 && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[2rem] text-line mb-3">✦</p>
              <p className="font-light text-muted">Không tìm thấy họa sĩ phù hợp</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <>
              {search && (
                <p className="text-[0.8rem] text-[#aaa] mb-8">
                  {filtered.length} kết quả cho "{search}"
                </p>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-12">
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
