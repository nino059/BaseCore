import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import { productApi } from '../../services/api';
import { useCart } from './Cart';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [qty, setQty] = useState(1);
    const [addedMsg, setAddedMsg] = useState('');
    const { addToCart, count } = useCart();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await productApi.getById(id);
                setProduct(res.data);
            } catch {
                setError('Không tìm thấy sản phẩm.');
            }
            setLoading(false);
        };
        fetch();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product, qty);
        setAddedMsg(`Đã thêm ${qty} sản phẩm vào giỏ!`);
        setTimeout(() => setAddedMsg(''), 3000);
    };

    if (loading) return (
        <PublicLayout cartCount={count}>
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div className="spinner-border" style={{ color: '#a78bfa', width: 48, height: 48 }}></div>
                <p style={{ marginTop: 16, color: '#6b7280' }}>Đang tải sản phẩm...</p>
            </div>
        </PublicLayout>
    );

    if (error) return (
        <PublicLayout cartCount={count}>
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <i className="fas fa-box-open fa-4x d-block mb-3" style={{ color: '#d1d5db' }}></i>
                <h5 style={{ color: '#6b7280' }}>{error}</h5>
                <Link to="/shop" className="btn mt-3"
                    style={{ background: '#a78bfa', color: 'white', borderRadius: 20, padding: '10px 28px' }}>
                    Quay lại cửa hàng
                </Link>
            </div>
        </PublicLayout>
    );

    return (
        <PublicLayout cartCount={count}>
            <div className="container py-4">

                {/* Breadcrumb */}
                <nav className="mb-4">
                    <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#9ca3af', flexWrap: 'wrap' }}>
                        <li><Link to="/" style={{ color: '#a78bfa', textDecoration: 'none' }}>Trang chủ</Link></li>
                        <li>/</li>
                        <li><Link to="/shop" style={{ color: '#a78bfa', textDecoration: 'none' }}>Cửa hàng</Link></li>
                        <li>/</li>
                        <li style={{ color: '#374151' }}>{product.name}</li>
                    </ol>
                </nav>

                <div className="row">
                    {/* Ảnh sản phẩm */}
                    <div className="col-md-5 mb-4">
                        <div style={{
                            borderRadius: 20, overflow: 'hidden',
                            background: '#f9fafb',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', minHeight: 380
                        }}>
                            {product.imageUrl
                                ? <img 
                                    src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`}
                                    alt={product.name}
                                    onError={e => { e.target.style.display='none'; }} 
                                    style={{ width: '100%', maxHeight: 420, objectFit: 'contain', padding: 20 }} />
                                : <div style={{ textAlign: 'center', color: '#d1d5db' }}>
                                    <i className="fas fa-image fa-5x d-block mb-2"></i>
                                    <span style={{ fontSize: '0.9rem' }}>Chưa có ảnh</span>
                                  </div>
                            }
                        </div>
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="col-md-7">
                        <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

                            {product.categoryName && (
                                <span style={{
                                    background: '#ede9fe', color: '#7c3aed',
                                    borderRadius: 12, padding: '4px 14px',
                                    fontSize: '0.8rem', fontWeight: 600
                                }}>{product.categoryName}</span>
                            )}

                            <h2 style={{ fontWeight: 800, marginTop: 12, marginBottom: 8, color: '#1f2937' }}>
                                {product.name}
                            </h2>

                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginBottom: 16 }}>
                                {fmt(product.price)}
                            </div>

                            {product.description && (
                                <p style={{ color: '#6b7280', lineHeight: 1.8, marginBottom: 20 }}>
                                    {product.description}
                                </p>
                            )}

                            {/* Tình trạng kho */}
                            <div style={{ marginBottom: 20 }}>
                                <span style={{
                                    background: product.stock > 0 ? '#d1fae5' : '#fee2e2',
                                    color: product.stock > 0 ? '#065f46' : '#991b1b',
                                    borderRadius: 12, padding: '4px 14px', fontSize: '0.85rem', fontWeight: 600
                                }}>
                                    <i className={`fas fa-${product.stock > 0 ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                    {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
                                </span>
                            </div>

                            {/* Chọn số lượng */}
                            {product.stock > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <span style={{ fontWeight: 600, color: '#374151' }}>Số lượng:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                            style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                border: '1px solid #e5e7eb', background: 'white',
                                                cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700
                                            }}>−</button>
                                        <span style={{
                                            width: 40, textAlign: 'center',
                                            fontWeight: 700, fontSize: '1.1rem'
                                        }}>{qty}</span>
                                        <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                                            style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                border: '1px solid #e5e7eb', background: 'white',
                                                cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700
                                            }}>+</button>
                                    </div>
                                </div>
                            )}

                            {/* Thông báo thêm giỏ */}
                            {addedMsg && (
                                <div style={{
                                    background: '#d1fae5', color: '#065f46',
                                    borderRadius: 10, padding: '10px 16px',
                                    marginBottom: 16, fontSize: '0.9rem', fontWeight: 500
                                }}>
                                    <i className="fas fa-check-circle mr-2"></i>{addedMsg}
                                </div>
                            )}

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    style={{
                                        flex: 1, padding: '13px 0',
                                        background: product.stock > 0
                                            ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                                            : '#e5e7eb',
                                        color: product.stock > 0 ? 'white' : '#9ca3af',
                                        border: 'none', borderRadius: 12,
                                        fontWeight: 700, fontSize: '1rem',
                                        cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                                    }}>
                                    <i className="fas fa-cart-plus mr-2"></i>
                                    Thêm vào giỏ
                                </button>
                                <Link to="/cart"
                                    style={{
                                        flex: 1, padding: '13px 0', textAlign: 'center',
                                        border: '2px solid #a78bfa', color: '#7c3aed',
                                        borderRadius: 12, fontWeight: 700, fontSize: '1rem',
                                        textDecoration: 'none', display: 'block'
                                    }}>
                                    <i className="fas fa-shopping-cart mr-2"></i>
                                    Xem giỏ hàng
                                </Link>
                                <button
                                    onClick={() => { handleAddToCart(); navigate('/checkout'); }}
                                    disabled={product.stock === 0}
                                    style={{
                                        width: '100%', marginTop: 10, padding: '13px 0',
                                        background: product.stock > 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : '#e5e7eb',
                                        color: product.stock > 0 ? 'white' : '#9ca3af',
                                        border: 'none', borderRadius: 12,
                                        fontWeight: 700, fontSize: '1rem',
                                        cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                                    }}>
                                    ⚡ Mua ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default ProductDetail;