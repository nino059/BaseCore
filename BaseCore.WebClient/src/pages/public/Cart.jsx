import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAuthModal } from '../../contexts/AuthModalContext';

import { formatVND as fmt } from '../../utils/format';

const Cart = () => {
  const { items, removeFromCart, clearCart, count } = useCart();
  const { isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();

  const subtotal   = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.qty, 0);
  const shipping   = subtotal >= 5_000_000 ? 0 : 50_000;
  const grandTotal = subtotal + shipping;

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">
        <div className="max-w-[1140px] mx-auto px-4 py-12">

          <div className="mb-9">
            <p className="text-[0.72rem] font-bold tracking-[0.18em] text-brand uppercase mb-2">
              Mua sắm
            </p>
            <h1 className="font-extralight text-[clamp(1.4rem,3vw,2rem)] text-ink tracking-[0.04em] m-0">
              Giỏ hàng
              {count > 0 && (
                <span className="text-base font-normal text-[#aaa] ml-3">({count} sản phẩm)</span>
              )}
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 px-5 bg-white">
              <p className="text-[2.5rem] text-line mb-5">✦</p>
              <h5 className="font-light text-muted mb-2">Giỏ hàng của bạn đang trống</h5>
              <p className="text-[#aaa] mb-7 text-[0.9rem]">Khám phá các tác phẩm nghệ thuật độc đáo</p>
              <Link to="/shop" className="inline-block px-8 py-[13px] bg-ink text-white text-[0.78rem] font-bold tracking-[0.14em] uppercase no-underline">
                Khám phá cửa hàng
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="lg:col-span-2">
                <div className="bg-white overflow-hidden">
                  {items.map((item, idx) => {
                    const unitPrice = item.discountPrice ?? item.price;
                    const lineTotal = unitPrice * item.qty;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 py-4 px-5 ${idx < items.length - 1 ? 'border-b border-[#f3f4f6]' : ''}`}
                      >
                        <div className="w-[70px] h-[70px] bg-[#f0ece6] overflow-hidden shrink-0">
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <i className="fas fa-image text-[#d1d5db] text-2xl"></i>
                              </div>
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[0.95rem] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.name}
                          </div>

                          {item.categoryName && (
                            <span className="bg-[#f0ece6] text-brand-dark px-2.5 py-0.5 text-[0.72rem] font-bold tracking-[0.06em]">
                              {item.categoryName}
                            </span>
                          )}

                          <div className="mt-1 flex items-center gap-2">
                            {item.discountPrice ? (
                              <>
                                <span className="text-ink font-bold text-[0.9rem]">{fmt(item.discountPrice)}</span>
                                <span className="line-through text-[#aaa] text-[0.8rem]">{fmt(item.price)}</span>
                                <span className="bg-[#fef3c7] text-[#92400e] px-2 py-px text-[0.68rem] font-bold tracking-[0.06em]">SALE</span>
                              </>
                            ) : (
                              <span className="text-ink font-semibold text-[0.9rem]">{fmt(item.price)}</span>
                            )}
                          </div>
                        </div>

                        <div className="font-bold text-ink min-w-[90px] text-right shrink-0">
                          {fmt(lineTotal)}
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="bg-none border-none text-[#aaa] hover:text-[#991b1b] cursor-pointer text-[1.1rem] shrink-0 transition-colors"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-4">
                  <Link to="/shop" className="text-muted no-underline flex items-center gap-1.5 text-[0.85rem] tracking-[0.02em]">
                    <i className="fas fa-arrow-left"></i> Tiếp tục mua sắm
                  </Link>
                  <button onClick={clearCart} className="bg-none border-none text-[#aaa] cursor-pointer text-[0.82rem] tracking-[0.04em]">
                    <i className="fas fa-trash mr-1"></i> Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-7 shadow-[0_2px_16px_rgba(0,0,0,0.05)] sticky top-20">
                  <p className="text-[0.68rem] font-bold tracking-[0.18em] text-brand uppercase mb-5">
                    Tóm tắt đơn hàng
                  </p>

                  <div className="flex justify-between mb-3 text-muted text-[0.88rem]">
                    <span>Tạm tính ({count} sản phẩm)</span>
                    <span className="text-ink">{fmt(subtotal)}</span>
                  </div>

                  <div className="flex justify-between mb-1 text-muted text-[0.88rem]">
                    <span>Phí vận chuyển</span>
                    <span className={`font-semibold ${shipping === 0 ? 'text-[#2d6a4f]' : 'text-ink'}`}>
                      {shipping === 0 ? 'Miễn phí' : fmt(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[0.75rem] text-[#aaa] mb-4">
                      Miễn phí vận chuyển cho đơn từ {fmt(5_000_000)}
                    </p>
                  )}

                  <div className="border-t-[1.5px] border-line pt-[18px] mb-6 flex justify-between font-semibold text-base">
                    <span className="text-ink">Tổng cộng</span>
                    <span className="text-ink font-bold">{fmt(grandTotal)}</span>
                  </div>

                  <button
                    onClick={() => isAuthenticated ? navigate('/checkout') : openLogin()}
                    className="w-full py-[13px] bg-ink text-white border-none text-[0.78rem] font-bold tracking-[0.14em] uppercase cursor-pointer"
                  >
                    {isAuthenticated ? 'Thanh toán' : 'Đăng nhập để thanh toán'}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-center mt-3.5 text-[0.82rem] text-[#aaa]">
                      Hoặc{' '}
                      <button
                        type="button"
                        onClick={openRegister}
                        className="bg-none border-none p-0 text-ink font-bold border-b border-ink cursor-pointer text-[0.82rem]"
                      >
                        tạo tài khoản mới
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Cart;
