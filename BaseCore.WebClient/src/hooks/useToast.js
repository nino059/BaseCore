import { useState, useRef, useCallback } from 'react';

/**
 * Hook quản lý hàng đợi toast dùng chung.
 * Dùng kèm component <Toaster toasts={toasts} /> để hiển thị.
 *
 * @returns {{ toasts, showToast, removeToast }}
 *   showToast(message, type)  type: 'success' | 'error' | 'warning' | 'info'
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return { toasts, showToast, removeToast };
}

export default useToast;
