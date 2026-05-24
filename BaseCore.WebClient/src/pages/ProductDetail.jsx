import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { productApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const sqBtn = (active = true) => ({
  padding: '13px 28px',
  background: active ? '#1a1a1a' : '#e5e7eb',
  color: active ? 'white' : '#9ca3af',
  border: 'none',
  fontSize: '0.78rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  cursor: active ? 'pointer' : 'not-allowed',
  transition: 'background 0.2s',
});

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');
  const { addToCart } = useCart();
  const { user, isArtist } = useAuth();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productApi.getById(id);
        setProduct(res.data);
      } catch {
        setError('Không tìm thấy sản phẩm.');
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!user) { openLogin(); return; }
    addToCart(product, qty);
    setAddedMsg(`Đã thêm ${qty} sản phẩm vào giỏ hàng`);
    setTimeout(() => setAddedMsg(''), 3000);
  };

  if (loading) return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '2px solid #c8a97a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#767676', fontSize: '0.9rem', letterSpacing: '0.08em' }}>Đang tải tác phẩm...</p>
        </div>
      </div>
    </PublicLayout>
  );

  if (error) return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: '2rem', color: '#ccc', marginBottom: 16 }}>✦</p>
          <p style={{ color: '#767676', marginBottom: 24, fontWeight: 300 }}>{error}</p>
          <Link to="/shop" style={{ ...sqBtn(), display: 'inline-block', textDecoration: 'none', padding: '13px 32px' }}>
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    </PublicLayout>
  );

  const imgSrc = product.imageUrl
    ? (product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`)
    : null;

  const inStock = product.stock > 0;

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>

          <nav style={{ marginBottom: 40 }}>
            <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: '#aaa', flexWrap: 'wrap', alignItems: 'center' }}>
              <li><Link to="/" style={{ color: '#767676', textDecoration: 'none' }}>Trang chủ</Link></li>
              <li style={{ color: '#ddd' }}>/</li>
              <li><Link to="/shop" style={{ color: '#767676', textDecoration: 'none' }}>Cửa hàng</Link></li>
              <li style={{ color: '#ddd' }}>/</li>
              <li style={{ color: '#1a1a1a' }}>{product.name}</li>
            </ol>
          </nav>

          <div className="row" style={{ gap: 0 }}>
            <div className="col-md-5" style={{ marginBottom: 32 }}>
              <div style={{ background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '3/4', overflow: 'hidden' }}>
                {imgSrc
                  ? <img src={imgSrc} alt={product.name} onError={e => { e.target.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center', color: '#ccc' }}>
                      <i className="fas fa-image" style={{ fontSize: '3rem', display: 'block', marginBottom: 8 }}></i>
                      <span style={{ fontSize: '0.8rem' }}>Chưa có ảnh</span>
                    </div>
                }
              </div>
            </div>

            <div className="col-md-7" style={{ paddingLeft: 40 }}>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {product.categoryName && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', color: '#c8a97a', textTransform: 'uppercase' }}>
                    {product.categoryName}
                  </span>
                )}
                {product.artistName && (
                  <>
                    {product.categoryName && <span style={{ color: '#ddd' }}>·</span>}
                    <Link to="/artists" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', color: '#767676', textTransform: 'uppercase', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {product.artistName}
                    </Link>
                  </>
                )}
              </div>

              <h1 style={{ fontWeight: 300, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#1a1a1a', letterSpacing: '0.02em', lineHeight: 1.3, marginBottom: 24 }}>
                {product.name}
              </h1>

              {/* Thông số kỹ thuật – Material + Theme + Width/Height */}
              {(product.material || product.theme || product.width || product.height) && (
                <div style={{ display: 'flex', gap: 24, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e8e4df', flexWrap: 'wrap' }}>
                  {product.material && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Chất liệu</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>{product.material}</div>
                    </div>
                  )}
                  {product.theme && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Chủ đề</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>{product.theme}</div>
                    </div>
                  )}
                  {(product.width || product.height) && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Kích thước</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>
                        {product.width && product.height
                          ? `${product.width} × ${product.height} cm`
                          : product.width ? `${product.width} cm (rộng)` : `${product.height} cm (cao)`
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e8e4df' }}>
                <span style={{ fontSize: '1.7rem', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.02em' }}>
                  {fmt(product.price)}
                </span>
              </div>

              {product.description && (
                <p style={{ color: '#767676', lineHeight: 1.9, marginBottom: 28, fontSize: '0.95rem', fontWeight: 300 }}>
                  {product.description}
                </p>
              )}

              <div style={{ marginBottom: 28 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', color: inStock ? '#2d6a4f' : '#991b1b' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: inStock ? '#52b788' : '#ef4444', display: 'inline-block' }}></span>
                  {inStock ? `Còn ${product.stock} tác phẩm` : 'Hết hàng'}
                </span>
              </div>

              {inStock && !isArtist && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', color: '#8b6c4a', textTransform: 'uppercase' }}>
                    Số lượng
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e8e4df' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#1a1a1a' }}>−</button>
                    <span style={{ width: 36, textAlign: 'center', fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#1a1a1a' }}>+</button>
                  </div>
                </div>
              )}

              {addedMsg && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '11px 16px', fontSize: '0.85rem', marginBottom: 20, letterSpacing: '0.01em' }}>
                  <i className="fas fa-check mr-2"></i>{addedMsg}
                </div>
              )}

              {!isArtist && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleAddToCart} disabled={!inStock} style={{ ...sqBtn(inStock), flex: 1, minWidth: 160, padding: '14px 0' }}>
                  <i className="fas fa-cart-plus mr-2"></i>Thêm vào giỏ
                </button>
                <button
                  onClick={() => { if (inStock) { handleAddToCart(); navigate('/checkout'); } }}
                  disabled={!inStock}
                  style={{ ...sqBtn(inStock), flex: 1, minWidth: 160, padding: '14px 0', background: inStock ? 'transparent' : '#e5e7eb', border: inStock ? '1.5px solid #1a1a1a' : 'none', color: inStock ? '#1a1a1a' : '#9ca3af' }}>
                  Mua ngay
                </button>
              </div>
              )}

              {!isArtist && (
              <Link to="/cart" style={{ display: 'block', marginTop: 14, textAlign: 'center', fontSize: '0.82rem', color: '#aaa', textDecoration: 'none', letterSpacing: '0.04em' }}>
                <i className="fas fa-arrow-left mr-1"></i> Xem giỏ hàng
              </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProductDetail;
