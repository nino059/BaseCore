import React, { useState, useEffect, useRef, useCallback } from 'react';
import { categoryApi } from '../../services/api';

const toSlug = (str) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ICON_OPTIONS = [
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

const COLOR_OPTIONS = [
  '#c8a97a','#8b6c4a','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#84cc16',
];

const ICON_EMOJI = {
  'palette':'🎨','paint-brush':'🖌','image':'🖼','mountain':'🏔',
  'user':'👤','leaf':'🍃','city':'🏙','water':'💧',
  'sun':'☀️','star':'⭐','heart':'❤️','globe':'🌏',
};

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

const STATUS_META = {
  ForSale:   { label: 'Đang bán',    color: '#10b981', bg: '#d1fae5' },
  Available: { label: 'Có sẵn',      color: '#3b82f6', bg: '#dbeafe' },
  Pending:   { label: 'Chờ duyệt',   color: '#f59e0b', bg: '#fef3c7' },
  Sold:      { label: 'Đã bán',      color: '#6366f1', bg: '#ede9fe' },
  Hidden:    { label: 'Đã ẩn',       color: '#94a3b8', bg: '#f1f5f9' },
  Rejected:  { label: 'Bị từ chối',  color: '#ef4444', bg: '#fee2e2' },
};

const S = {
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
    background: 'linear-gradient(135deg,#c8a97a,#8b6c4a)', color: 'white',
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
  btnIcon: (color = '#c8a97a') => ({
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
    background: '#f8fafc', color: active ? '#c8a97a' : '#64748b',
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

/* ── Confirm Dialog ─────────────────────────────────────── */
const ConfirmDialog = ({ msg, onOk, onCancel }) => (
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
const CatCard = ({ cat, onEdit, onDelete, onDuplicate, onViewProducts }) => {
  const [hovered, setHovered] = useState(false);
  const color = cat.color || '#c8a97a';
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
            <button style={S.btnIcon('#c8a97a')} title="Chỉnh sửa"
              onClick={() => onEdit(cat)}
              onMouseEnter={e => e.currentTarget.style.background='#c8a97a30'}
              onMouseLeave={e => e.currentTarget.style.background='#c8a97a18'}>
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
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <i className="fas fa-sort" style={{ marginLeft: 4, opacity: 0.3, fontSize: '0.7rem' }}></i>;
  return sortDir === 'asc'
    ? <i className="fas fa-sort-up"   style={{ marginLeft: 4, color: '#c8a97a', fontSize: '0.7rem' }}></i>
    : <i className="fas fa-sort-down" style={{ marginLeft: 4, color: '#c8a97a', fontSize: '0.7rem' }}></i>;
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [keyword,    setKeyword]    = useState('');
  const [viewMode,   setViewMode]   = useState('grid');
  const [filterMode, setFilterMode] = useState('all');
  const [sortField,  setSortField]  = useState('name');
  const [sortDir,    setSortDir]    = useState('asc');
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(12);
  const [showModal,  setShowModal]  = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [formData,   setFormData]   = useState({
    name: '', description: '', slug: '', icon: 'palette', color: '#c8a97a',
  });

  // Products modal state
  const [prodModal,     setProdModal]     = useState(null);  // { cat, products }
  const [prodLoading,   setProdLoading]   = useState(false);
  const [prodSearch,    setProdSearch]    = useState('');
  const [prodStatusFilter, setProdStatusFilter] = useState('all');
  const slugManual = useRef(false);
  const nameRef = useRef(null);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { if (showModal) setTimeout(() => nameRef.current?.focus(), 100); }, [showModal]);
  // Reset page when filter/search/sort changes
  useEffect(() => { setPage(1); }, [keyword, filterMode, sortField, sortDir]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name:        cat.name        || '',
        description: cat.description || '',
        slug:        cat.slug        || '',
        icon:        cat.icon        || 'palette',
        color:       cat.color       || '#c8a97a',
      });
      slugManual.current = true;
    } else {
      setEditingCat(null);
      setFormData({ name: '', description: '', slug: '', icon: 'palette', color: '#c8a97a' });
      slugManual.current = false;
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingCat(null); setError(''); };

  const handleDuplicate = (cat) => {
    setEditingCat(null);
    setFormData({
      name:        `${cat.name} (bản sao)`,
      description: cat.description || '',
      slug:        `${cat.slug || toSlug(cat.name)}-copy`,
      icon:        cat.icon  || 'palette',
      color:       cat.color || '#c8a97a',
    });
    slugManual.current = true;
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Tên danh mục không được để trống.'); return; }
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('Slug chỉ được chứa a-z, 0-9 và dấu gạch ngang (-).');
      return;
    }
    const payload = {
      ...formData,
      slug: formData.slug || toSlug(formData.name),
    };
    setSaving(true);
    try {
      if (editingCat) {
        await categoryApi.update(editingCat.id, { id: editingCat.id, ...payload });
        showToast('Cập nhật danh mục thành công!');
      } else {
        await categoryApi.create(payload);
        showToast('Thêm danh mục thành công!');
      }
      closeModal();
      loadCategories();
    } catch (e) {
      setError(e.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await categoryApi.delete(confirmDel.id);
      setConfirmDel(null);
      showToast('Đã xóa danh mục!', 'danger');
      loadCategories();
    } catch {
      setConfirmDel(null);
      showToast('Không thể xóa — danh mục có tranh đang liên kết.', 'warning');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const openProdModal = async (cat) => {
    setProdModal({ cat, products: [] });
    setProdSearch('');
    setProdStatusFilter('all');
    setProdLoading(true);
    try {
      const res = await categoryApi.getProducts(cat.id);
      setProdModal({ cat: res.data.category || cat, products: res.data.products || [] });
    } catch {
      setProdModal({ cat, products: [] });
    } finally {
      setProdLoading(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────
  const kpi = {
    total:      categories.length,
    hasProds:   categories.filter(c => (c.productCount || 0) > 0).length,
    noProds:    categories.filter(c => !(c.productCount || 0)).length,
    totalPainting: categories.reduce((s, c) => s + (c.totalProductCount ?? c.productCount ?? 0), 0),
  };

  const afterFilter = categories.filter(c => {
    const kw = keyword.toLowerCase();
    const matchKw = !kw || c.name.toLowerCase().includes(kw) || (c.description || '').toLowerCase().includes(kw) || (c.slug || '').includes(kw);
    const matchFilter = filterMode === 'all'
      ? true
      : filterMode === 'hasProducts'
        ? (c.productCount || 0) > 0
        : !(c.productCount || 0);
    return matchKw && matchFilter;
  });

  const afterSort = [...afterFilter].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'vi');
    else if (sortField === 'productCount') cmp = (a.productCount || 0) - (b.productCount || 0);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(afterSort.length / pageSize));
  const paginated  = afterSort.slice((page - 1) * pageSize, page * pageSize);

  // ── Render ──────────────────────────────────────────────
  return (
    <div>
      <style>{`
        .kpi-card { background:white; border-radius:14px; padding:20px; cursor:pointer;
          transition:all .2s; border-top:3px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'danger' ? '#ef4444' : '#f59e0b',
          color: 'white', padding: '12px 22px', borderRadius: 12,
          fontWeight: 700, fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.3s ease',
        }}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'danger' ? 'trash' : 'exclamation-triangle'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <button style={S.btnPrimary} onClick={() => openModal()}>
          <i className="fas fa-plus"></i> Thêm danh mục
        </button>
      </div>

      {/* KPI cards — clickable filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { id: 'all',         label: 'Tổng danh mục', value: kpi.total,    color: '#c8a97a', icon: 'fa-layer-group',        bg: '#f5edd6' },
          { id: 'hasProducts', label: 'Có tranh',       value: kpi.hasProds, color: '#10b981', icon: 'fa-image',              bg: '#d1fae5' },
          { id: 'noProducts',  label: 'Chưa có tranh',  value: kpi.noProds,  color: '#f59e0b', icon: 'fa-exclamation-circle', bg: '#fef3c7' },
        ].map((k) => {
          const active = filterMode === k.id;
          return (
            <div key={k.id} className="kpi-card"
              onClick={() => setFilterMode(f => f === k.id ? 'all' : k.id)}
              style={{ borderTop:`3px solid ${active ? k.color : '#f1f5f9'}`, background: active ? k.bg+'55' : 'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'1.8rem', fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginTop:4 }}>{k.label}</div>
                </div>
                <div style={{ width:36, height:36, borderRadius:10, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`fas ${k.icon}`} style={{ color:k.color, fontSize:'0.9rem' }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{
        background: 'white', borderRadius: 14, padding: '14px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,.05)', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            style={{
              flex: '1 1 240px', padding: '10px 16px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none',
              background: '#f8fafc',
            }}
            placeholder="🔍  Tìm kiếm tên, mô tả, slug..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />

          {/* Sort selector */}
          <select
            value={`${sortField}-${sortDir}`}
            onChange={e => {
              const [f, d] = e.target.value.split('-');
              setSortField(f); setSortDir(d);
            }}
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              fontSize: '0.85rem', color: '#374151', background: '#f8fafc',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="name-asc">Tên A → Z</option>
            <option value="name-desc">Tên Z → A</option>
            <option value="productCount-desc">Nhiều tranh nhất</option>
            <option value="productCount-asc">Ít tranh nhất</option>
          </select>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              fontSize: '0.85rem', color: '#374151', background: '#f8fafc',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / trang</option>)}
          </select>

          {/* View mode toggle */}
          <div style={{
            display: 'flex', gap: 6, background: '#f1f5f9',
            border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 4,
          }}>
            {[['grid','th-large'],['list','list']].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                border: 'none', cursor: 'pointer', borderRadius: 8,
                width: 36, height: 36, fontSize: '0.88rem',
                background: viewMode === mode ? '#c8a97a' : 'transparent',
                color: viewMode === mode ? 'white' : '#94a3b8',
                transition: 'all 0.18s',
              }}>
                <i className={`fas fa-${icon}`}></i>
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {afterSort.length} kết quả
          </span>
        </div>

        {/* Active filter chips */}
        {(filterMode !== 'all' || keyword) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Đang lọc:</span>
            {filterMode !== 'all' && (
              <span style={{
                background: '#c8a97a18', color: '#8b6c4a', borderRadius: 999,
                padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {filterMode === 'hasProducts' ? 'Có tranh' : 'Chưa có tranh'}
                <button onClick={() => setFilterMode('all')} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: '#8b6c4a', fontWeight: 900, padding: 0, lineHeight: 1,
                }}>×</button>
              </span>
            )}
            {keyword && (
              <span style={{
                background: '#6366f118', color: '#6366f1', borderRadius: 999,
                padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                "{keyword}"
                <button onClick={() => setKeyword('')} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: '#6366f1', fontWeight: 900, padding: 0, lineHeight: 1,
                }}>×</button>
              </span>
            )}
            <button
              onClick={() => { setFilterMode('all'); setKeyword(''); }}
              style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: 'white', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 80, background: '#f1f5f9' }} />
              <div style={{ padding: 18 }}>
                <div style={{ height: 16, background: '#f1f5f9', borderRadius: 8, width: '55%', marginBottom: 8 }} />
                <div style={{ height: 12, background: '#f1f5f9', borderRadius: 8, width: '80%', marginBottom: 6 }} />
                <div style={{ height: 12, background: '#f1f5f9', borderRadius: 8, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>

      ) : paginated.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🗂</div>
          <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            {(keyword || filterMode !== 'all') ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}
          </h4>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 24 }}>
            {(keyword || filterMode !== 'all')
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Hãy tạo danh mục đầu tiên để phân loại tranh'}
          </p>
          {!(keyword || filterMode !== 'all') && (
            <button style={{ ...S.btnPrimary, margin: '0 auto' }} onClick={() => openModal()}>
              <i className="fas fa-plus"></i> Tạo danh mục đầu tiên
            </button>
          )}
        </div>

      ) : viewMode === 'grid' ? (
        <>
          <div style={S.grid}>
            {paginated.map(cat => (
              <CatCard key={cat.id} cat={cat}
                onEdit={openModal} onDelete={setConfirmDel}
                onDuplicate={handleDuplicate} onViewProducts={openProdModal} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={afterSort.length} pageSize={pageSize} />
        </>

      ) : (
        <div style={{
          background: 'white', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {/* Table header bar */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
              Danh sách danh mục{' '}
              <span style={{
                background: '#f5edd6', color: '#c8a97a',
                borderRadius: 999, padding: '2px 10px',
                fontSize: '0.78rem', fontWeight: 700, marginLeft: 6,
              }}>
                {afterSort.length}
              </span>
            </span>
            <button onClick={loadCategories} style={{
              border: '1.5px solid #e2e8f0', background: 'white', borderRadius: 8,
              padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700,
              color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className="fas fa-sync-alt" style={{ fontSize: '0.78rem' }}></i> Làm mới
            </button>
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.thSortable(sortField === 'name')} onClick={() => handleSort('name')}>
                  Danh Mục <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </th>
                <th style={S.th}>Slug</th>
                <th style={S.th}>Mô tả</th>
                <th style={S.thSortable(sortField === 'productCount')} onClick={() => handleSort('productCount')}>
                  Số Tranh <SortIcon field="productCount" sortField={sortField} sortDir={sortDir} />
                </th>
                <th style={{ ...S.th, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((cat, idx) => {
                const color = cat.color || '#c8a97a';
                const rowIdx = (page - 1) * pageSize + idx;
                return (
                  <tr key={cat.id} style={{ background: idx % 2 === 1 ? '#fafbff' : 'white' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? '#fafbff' : 'white'}>
                    <td style={{ ...S.td, width: 48, color: '#94a3b8', fontWeight: 700 }}>{rowIdx + 1}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem', flexShrink: 0,
                        }}>
                          {ICON_EMOJI[cat.icon] || '🎨'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{cat.name}</div>
                          <div style={{ fontSize: '0.75rem', color }}>{cat.icon || 'palette'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>
                      {cat.slug
                        ? <code style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem' }}>{cat.slug}</code>
                        : <em style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>—</em>
                      }
                    </td>
                    <td style={{ ...S.td, maxWidth: 240 }}>
                      <span style={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontSize: '0.85rem', color: '#64748b',
                      }}>
                        {cat.description || <em style={{ color: '#cbd5e1' }}>Chưa có mô tả</em>}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={S.catBadge(color)}>{cat.productCount || 0} đang bán</span>
                        {(cat.totalProductCount != null && cat.totalProductCount > (cat.productCount || 0)) && (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{cat.totalProductCount} tổng</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={S.btnIcon('#10b981')} title="Xem tranh"
                          onClick={() => openProdModal(cat)}
                          onMouseEnter={e => e.currentTarget.style.background='#10b98130'}
                          onMouseLeave={e => e.currentTarget.style.background='#10b98118'}>
                          <i className="fas fa-images" style={{ fontSize: '0.78rem' }}></i>
                        </button>
                        <button style={S.btnIcon('#6366f1')} title="Nhân bản"
                          onClick={() => handleDuplicate(cat)}
                          onMouseEnter={e => e.currentTarget.style.background='#6366f130'}
                          onMouseLeave={e => e.currentTarget.style.background='#6366f118'}>
                          <i className="fas fa-copy" style={{ fontSize: '0.78rem' }}></i>
                        </button>
                        <button style={S.btnIcon('#c8a97a')} title="Chỉnh sửa"
                          onClick={() => openModal(cat)}
                          onMouseEnter={e => e.currentTarget.style.background='#c8a97a30'}
                          onMouseLeave={e => e.currentTarget.style.background='#c8a97a18'}>
                          <i className="fas fa-pen" style={{ fontSize: '0.78rem' }}></i>
                        </button>
                        <button style={S.btnDanger} title="Xóa" onClick={() => setConfirmDel(cat)}
                          onMouseEnter={e => e.currentTarget.style.background='#ef444430'}
                          onMouseLeave={e => e.currentTarget.style.background='#fee2e220'}>
                          <i className="fas fa-trash" style={{ fontSize: '0.78rem' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={afterSort.length} pageSize={pageSize} />
        </div>
      )}

      {/* ══ MODAL THÊM / SỬA ══════════════════════════════════ */}
      {showModal && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h5 style={S.modalTitle}>
                {editingCat ? '✏️  Chỉnh Sửa Danh Mục' : '➕  Thêm Danh Mục Mới'}
              </h5>
              <button onClick={closeModal} style={{
                border: 'none', background: '#f1f5f9', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', color: '#64748b',
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={S.modalBody}>
                {error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    color: '#dc2626', fontSize: '0.85rem',
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </div>
                )}

                {/* Name */}
                <div style={S.formGroup}>
                  <label style={S.label}>Tên danh mục *</label>
                  <input ref={nameRef} style={S.input} type="text"
                    placeholder="VD: Tranh Sơn Dầu, Tranh Lụa..."
                    value={formData.name}
                    onChange={e => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name,
                        slug: slugManual.current ? prev.slug : toSlug(name),
                      }));
                    }}
                    onFocus={e => e.target.style.borderColor = '#c8a97a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    required />
                </div>

                {/* Slug */}
                <div style={S.formGroup}>
                  <label style={S.label}>Slug (URL)
                    <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', marginLeft: 6 }}>— tự động từ tên, có thể sửa</span>
                  </label>
                  <input style={S.input} type="text"
                    placeholder="vd: tranh-son-dau"
                    value={formData.slug}
                    onChange={e => {
                      slugManual.current = true;
                      setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                    }}
                    onFocus={e => e.target.style.borderColor = '#c8a97a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                {/* Description */}
                <div style={S.formGroup}>
                  <label style={S.label}>Mô tả</label>
                  <textarea style={S.textarea} rows={3}
                    placeholder="Mô tả ngắn về danh mục này..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#c8a97a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                {/* Icon picker */}
                <div style={S.formGroup}>
                  <label style={S.label}>Icon đại diện</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ICON_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setFormData({ ...formData, icon: opt.value })}
                        title={opt.label}
                        style={{
                          border: formData.icon === opt.value
                            ? `2px solid ${formData.color}`
                            : '2px solid #e2e8f0',
                          borderRadius: 10,
                          background: formData.icon === opt.value
                            ? `${formData.color}15`
                            : 'white',
                          padding: '8px 12px', cursor: 'pointer',
                          fontSize: '1.1rem', transition: 'all 0.15s',
                        }}>
                        {ICON_EMOJI[opt.value] || '🎨'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div style={S.formGroup}>
                  <label style={S.label}>Màu sắc</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: c, border: 'none', cursor: 'pointer',
                          outline: formData.color === c ? `3px solid ${c}` : '3px solid transparent',
                          outlineOffset: 2, transition: 'outline 0.15s',
                        }} />
                    ))}
                    <input type="color" value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: '1.5px solid #e2e8f0', cursor: 'pointer',
                        padding: 2, background: 'white',
                      }}
                      title="Màu tùy chỉnh" />
                  </div>
                </div>

                {/* Live preview */}
                <div style={{
                  background: '#f8fafc', borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, background: formData.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', flexShrink: 0,
                  }}>
                    {ICON_EMOJI[formData.icon] || '🎨'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>
                      {formData.name || <span style={{ color: '#cbd5e1' }}>Tên danh mục</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                      {formData.description || 'Mô tả danh mục sẽ hiển thị ở đây'}
                    </div>
                    {formData.slug && (
                      <code style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3, display: 'block' }}>
                        /{formData.slug}
                      </code>
                    )}
                  </div>
                </div>
              </div>

              <div style={S.modalFoot}>
                <button type="button" onClick={closeModal} style={{
                  padding: '10px 22px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  fontWeight: 700, color: '#64748b', cursor: 'pointer',
                }}>Hủy</button>
                <button type="submit" disabled={saving} style={{
                  ...S.btnPrimary, opacity: saving ? 0.7 : 1,
                  minWidth: 130, justifyContent: 'center',
                }}>
                  {saving ? (
                    <>
                      <span style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.5)',
                        borderTopColor: 'white', borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className={`fas fa-${editingCat ? 'save' : 'plus'}`}></i>
                      {editingCat ? 'Lưu thay đổi' : 'Thêm danh mục'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL XEM TRANH TRONG DANH MỤC ══════════════════ */}
      {prodModal && (
        <div style={S.overlay} onClick={() => setProdModal(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ ...S.modalHeader, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: prodModal.cat.color || '#c8a97a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem',
                }}>
                  {ICON_EMOJI[prodModal.cat.icon] || '🎨'}
                </div>
                <div>
                  <h5 style={{ ...S.modalTitle, marginBottom: 2 }}>
                    Tranh trong "{prodModal.cat.name}"
                  </h5>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {prodLoading ? 'Đang tải...' : `${prodModal.products.length} tranh`}
                  </span>
                </div>
              </div>
              <button onClick={() => setProdModal(null)} style={{
                border: 'none', background: '#f1f5f9', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', color: '#64748b',
              }}>✕</button>
            </div>

            {/* Toolbar */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              <input
                style={{ flex: '1 1 200px', padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', background: '#f8fafc' }}
                placeholder="🔍  Tìm tên tranh, họa sĩ..."
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
              />
              <select
                value={prodStatusFilter}
                onChange={e => setProdStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
              {prodLoading ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 10, display: 'block' }}></i>
                  Đang tải danh sách tranh...
                </div>
              ) : (() => {
                const kw = prodSearch.toLowerCase();
                const filtered = prodModal.products.filter(p => {
                  const matchKw = !kw || p.name.toLowerCase().includes(kw) || (p.artistName || '').toLowerCase().includes(kw);
                  const matchStatus = prodStatusFilter === 'all' || p.status === prodStatusFilter;
                  return matchKw && matchStatus;
                });
                if (filtered.length === 0) return (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fas fa-image" style={{ fontSize: '2rem', marginBottom: 10, display: 'block', opacity: 0.3 }}></i>
                    <div style={{ fontSize: '0.88rem' }}>
                      {prodModal.products.length === 0 ? 'Danh mục này chưa có tranh nào' : 'Không tìm thấy tranh phù hợp'}
                    </div>
                  </div>
                );
                return (
                  <table style={{ ...S.table, fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width: 48 }}>#</th>
                        <th style={S.th}>Tranh</th>
                        <th style={S.th}>Họa sĩ</th>
                        <th style={S.th}>Giá</th>
                        <th style={S.th}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p, idx) => {
                        const sm = STATUS_META[p.status] || { label: p.status, color: '#64748b', bg: '#f1f5f9' };
                        return (
                          <tr key={p.id}
                            style={{ background: idx % 2 === 1 ? '#fafbff' : 'white' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? '#fafbff' : 'white'}
                          >
                            <td style={{ ...S.td, color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #f1f5f9' }} />
                                ) : (
                                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <i className="fas fa-image" style={{ color: '#cbd5e1' }}></i>
                                  </div>
                                )}
                                <span style={{ fontWeight: 600, color: '#1e293b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                              </div>
                            </td>
                            <td style={{ ...S.td, color: '#64748b' }}>{p.artistName || '—'}</td>
                            <td style={{ ...S.td, fontWeight: 700, color: '#c8a97a', whiteSpace: 'nowrap' }}>
                              {p.price != null ? p.price.toLocaleString('vi-VN') + ' ₫' : '—'}
                            </td>
                            <td style={S.td}>
                              <span style={{ background: sm.bg, color: sm.color, borderRadius: 999, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                                {sm.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => setProdModal(null)} style={{
                padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', fontWeight: 700, color: '#64748b', cursor: 'pointer',
              }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDel && (
        <ConfirmDialog
          msg={`Bạn có chắc muốn xóa danh mục "${confirmDel.name}"? Hành động này không thể hoàn tác.`}
          onOk={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

/* ── Pagination Component ───────────────────────────────── */
const Pagination = ({ page, totalPages, onPageChange, total, pageSize }) => {
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
                background: p === page ? '#c8a97a' : 'white',
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

export default Categories;
