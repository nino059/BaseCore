/* eslint-disable react-refresh/only-export-components -- context + hook + provider cố ý đặt cùng file */
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { normCartId, itemUnitPrice } from '../utils/cart';

export const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.userId || null;
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  const selKey  = userId ? `cart_sel_${userId}` : 'cart_sel_guest';

  const cartKeyRef = useRef(cartKey);
  cartKeyRef.current = cartKey;
  const selKeyRef = useRef(selKey);
  selKeyRef.current = selKey;
  const prevItemIdsRef = useRef([]);
  const skipCartSaveRef = useRef(true);

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    skipCartSaveRef.current = true;
    let loadedItems = [];
    try {
      loadedItems = JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch {
      loadedItems = [];
    }
    setItems(loadedItems);
    prevItemIdsRef.current = loadedItems.map((i) => normCartId(i.id));

    try {
      const storedSel = localStorage.getItem(selKey);
      if (storedSel !== null) {
        setSelectedIds(JSON.parse(storedSel).map(normCartId));
      } else {
        setSelectedIds([]);
      }
    } catch {
      setSelectedIds([]);
    }
  }, [cartKey, selKey]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const itemIds = items.map((i) => normCartId(i.id));
      if (itemIds.length === 0) {
        prevItemIdsRef.current = [];
        return [];
      }

      const prevNorm = prev.map(normCartId);
      const pruned = prevNorm.filter((id) => itemIds.includes(id));
      const prevCartIds = prevItemIdsRef.current;
      const newlyAddedToCart = itemIds.filter((id) => !prevCartIds.includes(id));
      prevItemIdsRef.current = itemIds;

      const selectionSaved = localStorage.getItem(selKeyRef.current) !== null;

      if (newlyAddedToCart.length > 0) {
        return [...new Set([...pruned, ...newlyAddedToCart])];
      }
      if (!selectionSaved && pruned.length === 0) {
        return itemIds;
      }
      return pruned;
    });
  }, [items]);

  useEffect(() => {
    if (skipCartSaveRef.current) {
      skipCartSaveRef.current = false;
      return;
    }
    localStorage.setItem(cartKeyRef.current, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(selKeyRef.current, JSON.stringify(selectedIds));
  }, [selectedIds]);

  const addToCart = (product) =>
    setItems((prev) => {
      const pid = normCartId(product.id);
      if (prev.some((i) => normCartId(i.id) === pid)) return prev;
      return [...prev, { ...product, qty: 1 }];
    });

  const removeFromCart = (id) => {
    const nid = normCartId(id);
    setItems((prev) => prev.filter((i) => normCartId(i.id) !== nid));
    setSelectedIds((prev) => prev.filter((x) => normCartId(x) !== nid));
  };

  const removePurchasedFromCart = useCallback((productIds) => {
    const norm = productIds.map(normCartId);
    setItems((prev) => {
      const next = prev.filter((i) => !norm.includes(normCartId(i.id)));
      return next.length === prev.length ? prev : next;
    });
    setSelectedIds((prev) => {
      const next = prev.filter((id) => !norm.includes(normCartId(id)));
      return next.length === prev.length ? prev : next;
    });
  }, []);

  const clearCart = () => {
    setItems([]);
    setSelectedIds([]);
  };

  const toggleItem = (id) => {
    const nid = normCartId(id);
    setSelectedIds((prev) =>
      prev.some((x) => normCartId(x) === nid)
        ? prev.filter((x) => normCartId(x) !== nid)
        : [...prev, nid],
    );
  };

  const toggleGroup = (ids) => {
    const normIds = ids.map(normCartId);
    setSelectedIds((prev) => {
      const allIn = normIds.length > 0 && normIds.every((id) => prev.some((x) => normCartId(x) === id));
      if (allIn) return prev.filter((id) => !normIds.includes(normCartId(id)));
      return [...new Set([...prev.map(normCartId), ...normIds])];
    });
  };

  const toggleAll = () => {
    const allIds = items.map((i) => normCartId(i.id));
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const isSelected = (id) => selectedIds.some((x) => normCartId(x) === normCartId(id));

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.some((x) => normCartId(x) === normCartId(i.id))),
    [items, selectedIds],
  );

  const total = items.reduce((s, i) => s + itemUnitPrice(i) * (i.qty || 1), 0);
  const count = items.reduce((s, i) => s + (i.qty || 1), 0);

  const selectedTotal = selectedItems.reduce((s, i) => s + itemUnitPrice(i) * (i.qty || 1), 0);
  const selectedCount = selectedItems.reduce((s, i) => s + (i.qty || 1), 0);
  const allSelected   = items.length > 0 && selectedIds.length === items.length;
  const someSelected  = selectedIds.length > 0 && !allSelected;

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, removePurchasedFromCart, clearCart,
      total, count,
      selectedIds, selectedItems, selectedTotal, selectedCount,
      toggleItem, toggleGroup, toggleAll, isSelected, allSelected, someSelected,
    }}>
      {children}
    </CartContext.Provider>
  );
};