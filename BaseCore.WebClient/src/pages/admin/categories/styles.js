// Hằng số + object style dùng riêng cho trang Quản lý danh mục (AdminCategories).

export const toSlug = (str) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const ICON_OPTIONS = [
  { value: 'palette',        label: '🎨 Bảng màu'    },
  { value: 'paint-brush',    label: '🖌 Cọ vẽ'       },
  { value: 'image',          label: '🖼 Tranh'        },
  { value: 'mountain',       label: '🏔 Phong cảnh'  },
  { value: 'user',           label: '👤 Chân dung'   },
  { value: 'leaf',           label: '🍃 Thiên nhiên' },
  { value: 'city',           label: '🏙 Đô thị'      },
  { value: 'water',          label: '💧 Trừu tượng'  },
  { value: 'sun',            label: '☀️ Ấn tượng'    },
  { value: 'star',           label: '⭐ Nổi bật'     },
  { value: 'heart',          label: '❤️ Lãng mạn'    },
  { value: 'globe',          label: '🌏 Dân gian'    },
];

export const COLOR_OPTIONS = [
  'var(--brand)','var(--brand-dark)','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#84cc16',
];

export const ICON_EMOJI = {
  'palette':'🎨','paint-brush':'🖌','image':'🖼','mountain':'🏔',
  'user':'👤','leaf':'🍃','city':'🏙','water':'💧',
  'sun':'☀️','star':'⭐','heart':'❤️','globe':'🌏',
};

export const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

export const STATUS_META = {
  ForSale:   { label: 'Đang bán',    color: '#10b981', bg: '#d1fae5' },
  Available: { label: 'Có sẵn',      color: '#3b82f6', bg: '#dbeafe' },
  Pending:   { label: 'Chờ duyệt',   color: '#f59e0b', bg: '#fef3c7' },
  Sold:      { label: 'Đã bán',      color: '#6366f1', bg: '#ede9fe' },
  Hidden:    { label: 'Đã ẩn',       color: '#94a3b8', bg: '#f1f5f9' },
  Rejected:  { label: 'Bị từ chối',  color: '#ef4444', bg: '#fee2e2' },
};

export const S = {
  kpiCard: (color, active) => ({
    background: active ? `${color}18` : 'white',
    borderRadius: 14, padding: '16px 20px',
    borderTop: `3px solid ${color}`,
    border: active ? `2px solid ${color}` : `2px solid transparent`,
    borderTopWidth: 3,
    boxShadow: active ? `0 4px 18px ${color}30` : '0 2px 12px rgba(0,0,0,.06)',
    cursor: 'pointer', transition: 'all 0.2s',
    userSelect: 'none',
  }),
  kpiNum:   (color) => ({ fontSize: '1.9rem', fontWeight: 900, color, lineHeight: 1 }),
  kpiLabel: { fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginTop: 5 },

  btnPrimary: {
    background: 'linear-gradient(135deg,var(--brand),var(--brand-dark))', color: 'white',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
  },
  btnSecondary: {
    background: 'white', color: '#64748b',
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  },
  btnIcon: (color = 'var(--brand)') => ({
    width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `${color}18`, color, fontSize: '0.9rem', transition: 'all 0.18s',
  }),
  btnDanger: {
    width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fee2e220', color: '#ef4444', fontSize: '0.9rem', transition: 'all 0.18s',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 },
  catCard: (hovered) => ({
    background: 'white', borderRadius: 16, overflow: 'hidden',
    boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
    cursor: 'default',
  }),
  catHeader: (color) => ({
    height: 80, background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2.2rem',
  }),
  catBody: { padding: '16px 18px 18px' },
  catName: { fontWeight: 800, fontSize: '1rem', color: '#1e293b', marginBottom: 4 },
  catDesc: {
    fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 12,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    minHeight: 36,
  },
  catFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: (color) => ({
    background: `${color}18`, color, borderRadius: 999,
    padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
  }),
  actions: { display: 'flex', gap: 6 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '0.78rem',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '12px 16px', borderBottom: '2px solid #e2e8f0', textAlign: 'left',
  },
  thSortable: (active) => ({
    background: '#f8fafc', color: active ? 'var(--brand)' : '#64748b',
    fontWeight: 700, fontSize: '0.78rem',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '12px 16px', borderBottom: '2px solid #e2e8f0', textAlign: 'left',
    cursor: 'pointer', userSelect: 'none',
    transition: 'color 0.15s',
  }),
  td: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#334155', verticalAlign: 'middle' },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, backdropFilter: 'blur(3px)',
  },
  modal: {
    background: 'white', borderRadius: 20, width: '100%', maxWidth: 520,
    boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden',
    maxHeight: '90vh', overflowY: 'auto',
  },
  modalWide: {
    background: 'white', borderRadius: 20, width: '100%', maxWidth: 860,
    boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  modalHeader: {
    padding: '22px 28px 18px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  modalTitle: { fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', margin: 0 },
  modalBody:  { padding: '22px 28px' },
  modalFoot:  { padding: '16px 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f1f5f9' },
  label:  { fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:  {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s',
  },
  textarea: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    resize: 'vertical', minHeight: 80,
  },
  formGroup: { marginBottom: 18 },
};
