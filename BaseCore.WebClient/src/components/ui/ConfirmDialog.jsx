import React from 'react';

/**
 * Hộp thoại xác nhận dùng chung (thay cho window.confirm và các bản inline lặp lại).
 *
 * @param {boolean}  open
 * @param {string}   title
 * @param {string}   message
 * @param {string}   confirmLabel  nhãn nút xác nhận (mặc định "Xác nhận")
 * @param {string}   cancelLabel   nhãn nút hủy (mặc định "Hủy bỏ")
 * @param {boolean}  danger        true → nút xác nhận màu đỏ (hành động xóa)
 * @param {()=>void} onConfirm
 * @param {()=>void} onCancel
 */
const ConfirmDialog = ({
  open, title, message,
  confirmLabel = 'Xác nhận', cancelLabel = 'Hủy bỏ',
  danger = false, onConfirm, onCancel,
}) => {
  if (!open) return null;
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 }} onClick={onCancel} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'white', borderRadius: 16, padding: '28px 32px', zIndex: 2001,
        minWidth: 340, maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{danger ? '⚠️' : '❓'}</div>
        <h5 style={{ fontWeight: 800, marginBottom: 8, color: '#1f2937' }}>{title}</h5>
        {message && <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>{message}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{ padding: '9px 24px', borderRadius: 9, border: 'none', background: danger ? '#ef4444' : 'var(--brand)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
