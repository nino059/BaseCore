import React from 'react';

const COLORS = {
  success: '#10b981',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
};
const ICONS = {
  success: 'fa-check-circle',
  error:   'fa-times-circle',
  warning: 'fa-exclamation-circle',
  info:    'fa-info-circle',
};

/**
 * Hiển thị danh sách toast (góc trên phải). Dùng chung với hook useToast.
 * <Toaster toasts={toasts} />
 */
const Toaster = ({ toasts = [] }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <style>{`@keyframes toastSlideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }`}</style>
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{
          padding: '11px 18px', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: '0.88rem',
          background: COLORS[t.type] || COLORS.info,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 260, animation: 'toastSlideIn .25s ease',
        }}
      >
        <i className={`fas ${ICONS[t.type] || ICONS.info} mr-2`}></i>
        {t.message}
      </div>
    ))}
  </div>
);

export default Toaster;
