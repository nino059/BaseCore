import React, { useState } from 'react';
import { S, ICON_EMOJI } from './styles';

/* ── Confirm Dialog (xác nhận xóa) ──────────────────────── */
export const ConfirmDialog = ({ msg, onOk, onCancel }) => (
  <div style={S.overlay} onClick={onCancel}>
    <div onClick={e => e.stopPropagation()} style={{
      background: 'white', borderRadius: 16, maxWidth: 360, width: '100%',
      padding: 28, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🗑️</div>
      <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Xác nhận xóa</h4>
      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>{msg}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={onCancel} style={{
          padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0',
          background: 'white', fontWeight: 700, color: '#64748b', cursor: 'pointer',
        }}>Hủy</button>
        <button onClick={onOk} style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white',
          fontWeight: 700, cursor: 'pointer',
        }}>Xóa</button>
      </div>
    </div>
  </div>
);

/* ── Category Card ──────────────────────────────────────── */
export const CatCard = ({ cat, onEdit, onDelete, onDuplicate, onViewProducts }) => {
  const [hovered, setHovered] = useState(false);
  const color = cat.color || 'var(--brand)';
  const icon  = ICON_EMOJI[cat.icon] || '🎨';
  const forSale = cat.productCount || 0;
  const total   = cat.totalProductCount != null ? cat.totalProductCount : forSale;
  return (
    <div style={S.catCard(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={S.catHeader(color)}>{icon}</div>
      <div style={S.catBody}>
        <div style={S.catName}>{cat.name}</div>
        {cat.slug && (
          <div style={{ marginBottom: 4 }}>
            <code style={{ background: '#f1f5f9', color: '#64748b', padding: '1px 7px', borderRadius: 5, fontSize: '0.73rem' }}>{cat.slug}</code>
          </div>
        )}
        <div style={S.catDesc}>{cat.description || 'Chưa có mô tả'}</div>
        <div style={S.catFooter}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={S.catBadge(color)}>{forSale} đang bán</span>
            {total > forSale && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{total} tổng cộng</span>
            )}
          </div>
          <div style={S.actions}>
            <button style={S.btnIcon('#10b981')} title="Xem tranh"
              onClick={() => onViewProducts(cat)}
              onMouseEnter={e => e.currentTarget.style.background='#10b98130'}
              onMouseLeave={e => e.currentTarget.style.background='#10b98118'}>
              <i className="fas fa-images" style={{ fontSize: '0.78rem' }}></i>
            </button>
            <button style={S.btnIcon('#6366f1')} title="Nhân bản"
              onClick={() => onDuplicate(cat)}
              onMouseEnter={e => e.currentTarget.style.background='#6366f130'}
              onMouseLeave={e => e.currentTarget.style.background='#6366f118'}>
              <i className="fas fa-copy" style={{ fontSize: '0.78rem' }}></i>
            </button>
            <button style={S.btnIcon('var(--brand)')} title="Chỉnh sửa"
              onClick={() => onEdit(cat)}
              onMouseEnter={e => e.currentTarget.style.background='var(--brand)30'}
              onMouseLeave={e => e.currentTarget.style.background='var(--brand)18'}>
              <i className="fas fa-pen" style={{ fontSize: '0.78rem' }}></i>
            </button>
            <button style={S.btnDanger} title="Xóa"
              onClick={() => onDelete(cat)}
              onMouseEnter={e => e.currentTarget.style.background='#ef444430'}
              onMouseLeave={e => e.currentTarget.style.background='#fee2e220'}>
              <i className="fas fa-trash" style={{ fontSize: '0.78rem' }}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Sort icon helper ───────────────────────────────────── */
export const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <i className="fas fa-sort" style={{ marginLeft: 4, opacity: 0.3, fontSize: '0.7rem' }}></i>;
  return sortDir === 'asc'
    ? <i className="fas fa-sort-up"   style={{ marginLeft: 4, color: 'var(--brand)', fontSize: '0.7rem' }}></i>
    : <i className="fas fa-sort-down" style={{ marginLeft: 4, color: 'var(--brand)', fontSize: '0.7rem' }}></i>;
};

/* ── Pagination ─────────────────────────────────────────── */
export const Pagination = ({ page, totalPages, onPageChange, total, pageSize }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const btnBase = {
    minWidth: 36, height: 36, borderRadius: 8, border: 'none',
    cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 20px', borderTop: '1px solid #f1f5f9',
      flexWrap: 'wrap', gap: 10,
    }}>
      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
        Hiển thị <b>{start}–{end}</b> trong <b>{total}</b> danh mục
      </span>

      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          style={{ ...btnBase, background: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#cbd5e1' : '#64748b', border: '1.5px solid #e2e8f0', cursor: page === 1 ? 'default' : 'pointer' }}>
          <i className="fas fa-chevron-left" style={{ fontSize: '0.72rem' }}></i>
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} style={{ ...btnBase, background: 'transparent', color: '#94a3b8', cursor: 'default' }}>…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              style={{ ...btnBase,
                background: p === page ? 'var(--brand)' : 'white',
                color:      p === page ? 'white'   : '#374151',
                border: p === page ? 'none' : '1.5px solid #e2e8f0',
                boxShadow: p === page ? '0 2px 8px rgba(200,169,122,.4)' : 'none',
              }}>
              {p}
            </button>
          )
        )}

        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          style={{ ...btnBase, background: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#cbd5e1' : '#64748b', border: '1.5px solid #e2e8f0', cursor: page === totalPages ? 'default' : 'pointer' }}>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.72rem' }}></i>
        </button>
      </div>
    </div>
  );
};
