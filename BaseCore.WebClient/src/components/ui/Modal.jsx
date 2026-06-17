import React, { useEffect } from 'react';

/**
 * Modal dùng chung (backdrop + card + đóng bằng Escape/click ngoài).
 * @param {boolean} open
 * @param {()=>void} onClose
 * @param {string} title    tiêu đề header (tùy chọn)
 * @param {number} width    bề rộng tối đa (px), mặc định 520
 * @param {ReactNode} footer khu nút bấm dưới cùng (tùy chọn)
 */
const Modal = ({ open, onClose, title, width = 520, footer, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 2000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: width, background: 'white', borderRadius: 14,
        zIndex: 2001, boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {title && (
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0ece8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1.2rem', lineHeight: 1, padding: '2px 6px' }}>✕</button>
          </div>
        )}
        <div style={{ padding: 24, overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f0ece8', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Modal;
