import React, { useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { formatVND as fmt } from '../../utils/format';
import { toImg } from '../../utils/image';
import { calcShipping, itemUnitPrice, groupSubtotal, groupByArtist, getArtistKey, getArtistName } from '../../utils/cart';

const CartCheckbox = ({ checked, indeterminate, onChange, ariaLabel }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="w-[18px] h-[18px] accent-brand shrink-0 cursor-pointer"
    />
  );
};

const Cart = () => {
  const {
    items, removeFromCart, clearCart, count,
    selectedItems, selectedTotal, selectedCount,
    toggleItem, toggleGroup, toggleAll, isSelected,
    allSelected, someSelected,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();

  const artistGroups = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const key = getArtistKey(item);
      if (!map[key]) {
        map[key] = {
          key,
          name: getArtistName(item),
          sellerId: item.sellerId || null,
          items: [],
        };
      }
      map[key].items.push(item);
    });
    return Object.values(map);
  }, [items]);

  const selectedArtistGroups = useMemo(
    () => groupByArtist(selectedItems),
    [selectedItems],
  );

  const shipping = useMemo(
    () => selectedArtistGroups.reduce((s, g) => s + calcShipping(groupSubtotal(g.items)), 0),
    [selectedArtistGroups],
  );
  const grandTotal = selectedTotal + shipping;

  const handleCheckout = () => {
    if (selectedCount === 0) return;
    if (isAuthenticated) navigate('/checkout');
    else openLogin();
  };

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">
        <div className="bg-white border-b border-line pt-7 pb-6">
          <div className="max-w-[1140px] mx-auto px-4">
            <h1
              className="text-ink font-medium text-[clamp(1.9rem,4.2vw,2.7rem)] tracking-[0.01em] m-0 leading-[1.15]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              GIỎ HÀNG
            </h1>
          </div>
        </div>

        <div className="max-w-[1140px] mx-auto px-4 py-8">
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
                <div className="bg-white overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 py-3.5 px-5 border-b border-[#f3f4f6]">
                    <CartCheckbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      ariaLabel="Chọn tất cả sản phẩm"
                    />
                    <span className="text-[0.88rem] text-ink font-medium">
                      Chọn tất cả ({count})
                    </span>
                  </div>

                  {artistGroups.map((group, gIdx) => {
                    const groupIds = group.items.map((i) => i.id);
                    const groupAllSelected = groupIds.every((id) => isSelected(id));
                    const groupSomeSelected = groupIds.some((id) => isSelected(id)) && !groupAllSelected;

                    return (
                      <div key={group.key} className={gIdx < artistGroups.length - 1 ? 'border-b border-[#f0f0f0]' : ''}>
                        <div className="flex items-center gap-3 py-3 px-5 bg-[#faf8f5] border-b border-[#f3f4f6]">
                          <CartCheckbox
                            checked={groupAllSelected}
                            indeterminate={groupSomeSelected}
                            onChange={() => toggleGroup(groupIds)}
                            ariaLabel={`Chọn tất cả tranh của ${group.name}`}
                          />
                          <Link
                            to={group.sellerId ? `/artists/${group.sellerId}` : '/artists'}
                            className="flex items-center gap-2 no-underline text-inherit min-w-0"
                          >
                            <i className="fas fa-palette text-brand text-[0.85rem] shrink-0" />
                            <span className="font-semibold text-[0.88rem] text-ink truncate hover:text-brand-dark transition-colors">
                              {group.name}
                            </span>
                          </Link>
                          <span className="text-[0.72rem] text-[#aaa] ml-auto shrink-0">
                            {group.items.length} tác phẩm
                          </span>
                        </div>

                        {group.items.map((item, idx) => {
                          const unitPrice = itemUnitPrice(item);
                          const lineTotal = unitPrice * (item.qty || 1);
                          const checked = isSelected(item.id);

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 py-4 px-5 ${idx < group.items.length - 1 ? 'border-b border-[#f3f4f6]' : ''} ${!checked ? 'opacity-60' : ''}`}
                            >
                              <CartCheckbox
                                checked={checked}
                                onChange={() => toggleItem(item.id)}
                                ariaLabel={`Chọn ${item.name}`}
                              />

                              <Link
                                to={`/product/${item.id}`}
                                className="flex items-center gap-4 flex-1 min-w-0 no-underline text-inherit group"
                              >
                                <div className="w-[70px] h-[70px] bg-[#f0ece6] overflow-hidden shrink-0">
                                  {toImg(item.imageUrl)
                                    ? <img src={toImg(item.imageUrl)} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    : <div className="w-full h-full flex items-center justify-center">
                                        <i className="fas fa-image text-[#d1d5db] text-2xl"></i>
                                      </div>
                                  }
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[0.95rem] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-brand-dark transition-colors">
                                    {item.name}
                                  </div>
                                  {item.categoryName && (
                                    <span className="bg-[#f0ece6] text-brand-dark px-2.5 py-0.5 text-[0.72rem] font-bold tracking-[0.06em]">
                                      {item.categoryName}
                                    </span>
                                  )}
                                  <div className="mt-1">
                                    <span className="text-ink font-semibold text-[0.9rem]">{fmt(item.price)}</span>
                                  </div>
                                </div>
                              </Link>

                              <div className="font-bold text-ink min-w-[90px] text-right shrink-0">
                                {fmt(lineTotal)}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="bg-none border-none text-[#aaa] hover:text-[#991b1b] cursor-pointer text-[1.1rem] shrink-0 transition-colors"
                                aria-label={`Xóa ${item.name}`}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-4">
                  <Link to="/shop" className="text-muted no-underline flex items-center gap-1.5 text-[0.85rem] tracking-[0.02em]">
                    <i className="fas fa-arrow-left"></i> Tiếp tục mua sắm
                  </Link>
                  <button type="button" onClick={clearCart} className="bg-none border-none text-[#aaa] cursor-pointer text-[0.82rem] tracking-[0.04em]">
                    <i className="fas fa-trash mr-1"></i> Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-7 shadow-[0_2px_16px_rgba(0,0,0,0.05)] sticky top-20">
                  <p className="text-[0.68rem] font-bold tracking-[0.18em] text-brand uppercase mb-5">
                    Tóm tắt đơn hàng
                  </p>

                  {selectedCount > 0 && selectedArtistGroups.length > 1 && (
                    <p className="text-[0.75rem] text-brand-dark bg-[#faf8f5] px-3 py-2 mb-4 leading-relaxed">
                      <i className="fas fa-info-circle mr-1.5" />
                      Tranh từ nhiều họa sĩ sẽ được tách thành các đơn riêng để giao hàng độc lập.
                    </p>
                  )}

                  <div className="flex justify-between mb-3 text-muted text-[0.88rem]">
                    <span>Tạm tính ({selectedCount} sản phẩm)</span>
                    <span className="text-ink">{fmt(selectedTotal)}</span>
                  </div>

                  <div className="flex justify-between mb-1 text-muted text-[0.88rem]">
                    <span>Phí vận chuyển</span>
                    <span className={`font-semibold ${shipping === 0 && selectedCount > 0 ? 'text-[#2d6a4f]' : 'text-ink'}`}>
                      {selectedCount === 0 ? '—' : shipping === 0 ? 'Miễn phí' : fmt(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && selectedCount > 0 && (
                    <p className="text-[0.75rem] text-[#aaa] mb-4">
                      Miễn phí ship cho mỗi đơn từ {fmt(5_000_000)}
                    </p>
                  )}

                  <div className="border-t-[1.5px] border-line pt-[18px] mb-6 flex justify-between font-semibold text-base">
                    <span className="text-ink">Tổng cộng</span>
                    <span className="text-ink font-bold">{fmt(grandTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={selectedCount === 0}
                    className={`w-full py-[13px] border-none text-[0.78rem] font-bold tracking-[0.14em] uppercase ${
                      selectedCount === 0
                        ? 'bg-[#d1d5db] text-white cursor-not-allowed'
                        : 'bg-ink text-white cursor-pointer'
                    }`}
                  >
                    {selectedCount === 0
                      ? 'Chọn sản phẩm để thanh toán'
                      : isAuthenticated
                        ? `Thanh toán (${selectedCount})`
                        : 'Đăng nhập để thanh toán'}
                  </button>

                  {!isAuthenticated && selectedCount > 0 && (
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