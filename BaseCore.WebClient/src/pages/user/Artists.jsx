import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_ARTISTS = [
  { id: '1', name: 'Nguyễn Thanh Tùng', specialty: 'Tranh phong cảnh', bio: 'Họa sĩ chuyên về phong cảnh thiên nhiên Việt Nam với hơn 15 năm kinh nghiệm.', avatarUrl: 'https://picsum.photos/seed/artist1/400/300' },
  { id: '2', name: 'Trần Thị Lan',       specialty: 'Tranh chân dung',  bio: 'Nổi tiếng với các tác phẩm chân dung phụ nữ Việt đầy cảm xúc.',               avatarUrl: 'https://picsum.photos/seed/artist2/400/300' },
  { id: '3', name: 'Lê Minh Quân',       specialty: 'Tranh trừu tượng', bio: 'Phong cách hiện đại, màu sắc táo bạo, thể hiện nội tâm sâu sắc.',             avatarUrl: 'https://picsum.photos/seed/artist3/400/300' },
  { id: '4', name: 'Phạm Thị Hoa',       specialty: 'Tranh lụa',        bio: 'Chuyên gia tranh lụa truyền thống, lưu giữ hồn văn hóa Việt.',                avatarUrl: 'https://picsum.photos/seed/artist4/400/300' },
  { id: '5', name: 'Võ Văn Hùng',        specialty: 'Tranh sơn dầu',    bio: 'Tác phẩm thể hiện cuộc sống đời thường với góc nhìn tươi sáng.',              avatarUrl: 'https://picsum.photos/seed/artist5/400/300' },
  { id: '6', name: 'Đặng Thị Mai',       specialty: 'Tranh màu nước',   bio: 'Nhẹ nhàng, tinh tế — phong cách Đông Dương qua từng nét cọ.',                 avatarUrl: 'https://picsum.photos/seed/artist6/400/300' },
];

const SPECIALTIES = ['Tất cả', 'Tranh phong cảnh', 'Tranh chân dung', 'Tranh trừu tượng', 'Tranh lụa', 'Tranh sơn dầu', 'Tranh màu nước'];

const Artists = () => {
  const [artists, setArtists]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('Tất cả');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setTimeout(() => { setArtists(FALLBACK_ARTISTS); setLoading(false); }, 400);
  }, []);

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'Tất cả' || a.specialty === filter)
  );

  if (loading) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 28 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ height: 220, background: '#f3f4f6' }} />
            <div style={{ padding: 20 }}>
              <div style={{ height: 18, background: '#f3f4f6', borderRadius: 8, marginBottom: 10, width: '70%' }} />
              <div style={{ height: 14, background: '#f3f4f6', borderRadius: 8, width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 16px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 10 }}>Các Họa Sĩ</h1>
        <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>
          Gặp gỡ những nghệ sĩ tài năng đứng sau mỗi tác phẩm
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        <input
          type="text"
          placeholder="🔍 Tìm họa sĩ theo tên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 18px', border: '1.5px solid #e5e7eb',
            borderRadius: 14, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SPECIALTIES.map(sp => (
            <button key={sp} onClick={() => setFilter(sp)} style={{
              padding: '7px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
              background: filter === sp ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : '#f3f4f6',
              color: filter === sp ? 'white' : '#6b7280',
            }}>
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎨</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>Không tìm thấy họa sĩ</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 28 }}>
          {filtered.map(artist => (
            <div key={artist.id} onClick={() => setSelected(artist)}
              style={{
                background: 'white', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.25s, transform 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 12px 40px rgba(124,58,237,0.18)'; e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{ height: 220, overflow: 'hidden' }}>
                <img src={artist.avatarUrl} alt={artist.name} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '18px 20px' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>{artist.name}</h3>
                <span style={{
                  display: 'inline-block', padding: '3px 12px', borderRadius: 999,
                  background: '#ede9fe', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700, marginBottom: 10,
                }}>
                  {artist.specialty}
                </span>
                <p style={{
                  color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 12,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {artist.bio}
                </p>
                <div style={{ color: '#7c3aed', fontSize: '0.9rem', fontWeight: 700 }}>Xem tác phẩm →</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 24, maxWidth: 460, width: '100%',
            overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          }}>
            <div style={{ height: 220, position: 'relative' }}>
              <img src={selected.avatarUrl} alt={selected.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setSelected(null)} style={{
                position: 'absolute', top: 14, right: 14, background: 'white', border: 'none',
                borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>✕</button>
            </div>
            <div style={{ padding: '24px 28px 28px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>{selected.name}</h2>
              <span style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 999, marginBottom: 14,
                background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: 'white',
                fontSize: '0.8rem', fontWeight: 700,
              }}>
                {selected.specialty}
              </span>
              <p style={{ color: '#4b5563', lineHeight: 1.65, marginBottom: 22, fontSize: '0.95rem' }}>
                {selected.bio}
              </p>
              <Link
                to={`/shop?artist=${encodeURIComponent(selected.name)}`}
                onClick={() => setSelected(null)}
                style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: 'white',
                  padding: '13px 0', borderRadius: 14, fontWeight: 700, fontSize: '0.95rem',
                }}
              >
                Xem tranh của {selected.name.split(' ').pop()} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Artists;