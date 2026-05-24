import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

export const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.userId || null;
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';

  // Ref để save luôn dùng key hiện tại mà không trigger effect khi key đổi
  const cartKeyRef = useRef(cartKey);
  cartKeyRef.current = cartKey;

  const [items, setItems] = useState([]);

  // Load cart khi user thay đổi (login / logout)
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(cartKey)) || []);
    } catch {
      setItems([]);
    }
  }, [cartKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lưu cart mỗi khi items thay đổi (dùng ref để luôn save đúng key)
  useEffect(() => {
    localStorage.setItem(cartKeyRef.current, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) =>
    setItems(prev => {
      const exist = prev.find(i => i.id === product.id);
      const maxStock = product.stock ?? Infinity;
      if (exist) {
        const newQty = Math.min(exist.qty + qty, maxStock);
        return prev.map(i => i.id === product.id ? { ...i, qty: newQty } : i);
      }
      return [...prev, { ...product, qty: Math.min(qty, maxStock) }];
    });

  const removeFromCart = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const maxStock = i.stock ?? Infinity;
      return { ...i, qty: Math.min(qty, maxStock) };
    }));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};
