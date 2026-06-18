import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { productApi } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { toImg } from '../../utils/image';
import { formatVND as fmt } from '../../utils/format';
import { normCartId } from '../../utils/cart';

const sqBtn = (active = true) => ({
  padding: '13px 28px',
  background: active ? 'var(--ink)' : '#e5e7eb',
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
  const [addedMsg, setAddedMsg] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addToCart, items } = useCart();
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

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox]);

  const handleAddToCart = () => {
    if (!user) { openLogin(); return; }
    if (product?.status !== 'ForSale') return;

    const alreadyInCart = items.some(i => normCartId(i.id) === normCartId(product.id));
    if (alreadyInCart) {
      setAddedMsg(`Tranh "${product.name}" đã có trong giỏ hàng.`);
      setTimeout(() => setAddedMsg(''), 2500);
      return;
    }

    addToCart(product, 1);
    setAddedMsg('Đã thêm vào giỏ hàng');
    setTimeout(() => setAddedMsg(''), 3000);
  };

  if (loading) return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
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

  const imgSrc = toImg(product.imageUrl);

  const inStock = product.status === 'ForSale';
  const isSold = product.status === 'Sold';
  const isOrdered = product.status === 'Ordered';

  return (
    <PublicLayout>
      <div style={{ background: '#faf8f5', minHeight: '80vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
          <div className="grid grid-cols-12">
            <div className="col-span-5" style={{ marginBottom: 32 }}>
              <div
                role={imgSrc ? 'button' : undefined}
                tabIndex={imgSrc ? 0 : undefined}
                onClick={imgSrc ? () => setLightboxOpen(true) : undefined}
                onKeyDown={imgSrc ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxOpen(true); } } : undefined}
                title={imgSrc ? 'Nhấn để xem toàn màn hình' : undefined}
                style={{
                  background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  aspectRatio: '3/4', overflow: 'hidden', position: 'relative',
                  cursor: imgSrc ? 'zoom-in' : 'default',
                }}
              >
                {imgSrc
                  ? <>
                      <img src={imgSrc} alt={product.name} onError={e => { e.target.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                        padding: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 45%)',
                        pointerEvents: 'none',
                      }}>
                      </div>
                    </>
                  : <div style={{ textAlign: 'center', color: '#ccc' }}>
                      <i className="fas fa-image" style={{ fontSize: '3rem', display: 'block', marginBottom: 8 }}></i>
                      <span style={{ fontSize: '0.8rem' }}>Chưa có ảnh</span>
                    </div>
                }
              </div>
            </div>

            <div className="col-span-7" style={{ paddingLeft: 40 }}>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {product.categoryName && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
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

              <h1 style={{ fontWeight: 300, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'var(--ink)', letterSpacing: '0.02em', lineHeight: 1.3, marginBottom: 24 }}>
                {product.name}
              </h1>

              {/* Thông số kỹ thuật – Material + Theme + Width/Height */}
              {(product.material || product.theme || product.width || product.height) && (
                <div style={{ display: 'flex', gap: 24, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e8e4df', flexWrap: 'wrap' }}>
                  {product.material && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Chất liệu</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>{product.material}</div>
                    </div>
                  )}
                  {product.theme && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Chủ đề</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>{product.theme}</div>
                    </div>
                  )}
                  {(product.width || product.height) && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Kích thước</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>
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
                <span style={{ fontSize: '1.7rem', fontWeight: 300, color: 'var(--ink)', letterSpacing: '0.02em' }}>
                  {fmt(product.price)}
                </span>
              </div>

              {product.description && (
                <p style={{ color: '#767676', lineHeight: 1.9, marginBottom: 28, fontSize: '0.95rem', fontWeight: 300 }}>
                  {product.description}
                </p>
              )}

              <div style={{ marginBottom: 28 }}>
                {product.status === 'ForSale' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', color: '#2d6a4f' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#52b788', display: 'inline-block' }}></span>
                    Còn hàng
                  </span>
                ) : product.status === 'Ordered' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', color: '#92400e' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                    Đã có người đặt
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', color: '#991b1b' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                    Đã bán
                  </span>
                )}
              </div>

              {addedMsg && (
                <div style={{
                  background: addedMsg.includes('đã có') ? '#fef3c7' : '#f0fdf4',
                  border: addedMsg.includes('đã có') ? '1px solid #fcd34d' : '1px solid #bbf7d0',
                  color: addedMsg.includes('đã có') ? '#92400e' : '#166534',
                  padding: '11px 16px',
                  fontSize: '0.85rem',
                  marginBottom: 20,
                  letterSpacing: '0.01em'
                }}>
                  <i className={`fas ${addedMsg.includes('đã có') ? 'fa-exclamation-circle' : 'fa-check'} mr-2`}></i>{addedMsg}
                </div>
              )}

              {!isArtist && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type="button" onClick={handleAddToCart} disabled={!inStock}
                  style={{ ...sqBtn(inStock), flex: 1, minWidth: 160, padding: '14px 0', cursor: inStock ? 'pointer' : 'not-allowed' }}>
                  <i className={`fas ${inStock ? 'fa-cart-plus' : 'fa-ban'} mr-2`}></i>
                  {inStock ? 'Thêm vào giỏ' : isSold ? 'Đã bán' : isOrdered ? 'Đã có người đặt' : 'Không thể mua'}
                </button>
                <button type="button"
                  onClick={() => { if (inStock) { handleAddToCart(); navigate('/checkout'); } }}
                  disabled={!inStock}
                  style={{ ...sqBtn(inStock), flex: 1, minWidth: 160, padding: '14px 0', background: inStock ? 'transparent' : '#e5e7eb', border: inStock ? '1.5px solid var(--ink)' : 'none', color: inStock ? 'var(--ink)' : '#9ca3af', cursor: inStock ? 'pointer' : 'not-allowed' }}>
                  Mua ngay
                </button>
              </div>
              )}

              {!isArtist && (
              <Link to="/cart" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 14, fontSize: '0.82rem', color: '#aaa', textDecoration: 'none', letterSpacing: '0.04em' }}>
                Xem giỏ hàng <i className="fas fa-arrow-right"></i>
              </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && imgSrc && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.96)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: 24,
          }}
        >
          <img
            src={imgSrc}
            alt={product.name}
            style={{
              maxWidth: '94%', maxHeight: '92vh', objectFit: 'contain',
              borderRadius: 4, boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Đóng"
            style={{
              position: 'absolute', top: 28, right: 32,
              background: 'rgba(255,255,255,0.08)', color: '#ddd',
              border: '1px solid rgba(255,255,255,0.25)', width: 46, height: 46,
              borderRadius: '50%', fontSize: '1.55rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}
    </PublicLayout>
  );
};

export default ProductDetail;
