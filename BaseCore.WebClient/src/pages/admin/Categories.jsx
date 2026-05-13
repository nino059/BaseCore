import React, { useState, useEffect, useRef } from 'react';
import { categoryApi, productApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/* ── Bảng icon chọn cho danh mục tranh ──────────────────── */
const ICON_OPTIONS = [
  { value: 'palette',        label: '🎨 Bảng màu'     },
  { value: 'paint-brush',    label: '🖌 Cọ vẽ'        },
  { value: 'image',          label: '🖼 Tranh'         },
  { value: 'mountain',       label: '🏔 Phong cảnh'   },
  { value: 'user',           label: '👤 Chân dung'    },
  { value: 'leaf',           label: '🍃 Thiên nhiên'  },
  { value: 'city',           label: '🏙 Đô thị'       },
  { value: 'water',          label: '💧 Trừu tượng'   },
  { value: 'sun',            label: '☀️ Ấn tượng'     },
  { value: 'star',           label: '⭐ Nổi bật'      },
  { value: 'heart',          label: '❤️ Lãng mạn'     },
  { value: 'globe',          label: '🌏 Dân gian'     },
];

const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#84cc16',
];

const ICON_EMOJI = {
  'palette':'🎨','paint-brush':'🖌','image':'🖼','mountain':'🏔',
  'user':'👤','leaf':'🍃','city':'🏙','water':'💧',
  'sun':'☀️','star':'⭐','heart':'❤️','globe':'🌏',
};

/* ── Styles tập trung ──────────────────────────────────── */
const S = {
  page:      { background: '#f1f5f9', minHeight: '100vh', padding: '28px 24px' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title:     { fontSize: '1.55rem', fontWeight: 800, color: '#1e293b', margin: 0 },
  subtitle:  { fontSize: '0.85rem', color: '#94a3b8', marginTop: 2 },

  kpiRow:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16, marginBottom: 28 },
  kpiCard:   (color) => ({
    background: 'white', borderRadius: 14, padding: '20px 22px',
    borderLeft: `4px solid ${color}`, boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  }),
  kpiNum:    (color) => ({ fontSize: '1.9rem', fontWeight: 900, color, lineHeight: 1 }),
  kpiLabel:  { fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 },

  toolbar:   { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  search:    {
    flex: '1 1 260px', padding: '10px 16px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none',
    background: 'white',
  },

  btnPrimary: {
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
  },
  btnIcon: (color='#6366f1') => ({
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
const CatCard = ({ cat, onEdit, onDelete, isAdmin }) => {
  const [hovered, setHovered] = useState(false);
  const color = cat.color || '#6366f1';
  const icon  = ICON_EMOJI[cat.icon] || '🎨';
  return (
    <div style={S.catCard(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={S.catHeader(color)}>{icon}</div>
      <div style={S.catBody}>
        <div style={S.catName}>{cat.name}</div>
        <div style={S.catDesc}>{cat.description || 'Chưa có mô tả'}</div>
        <div style={S.catFooter}>
          <span style={S.catBadge(color)}>
            {cat.productCount || 0} tranh
          </span>
          {isAdmin && (
            <div style={S.actions}>
              <button style={S.btnIcon('#6366f1')} title="Chỉnh sửa"
                onClick={() => onEdit(cat)}
                onMouseEnter={e => e.currentTarget.style.background='#6366f130'}
                onMouseLeave={e => e.currentTarget.style.background='#6366f118'}>
                <i className="fas fa-pen" style={{ fontSize: '0.78rem' }}></i>
              </button>
              <button style={S.btnDanger} title="Xóa"
                onClick={() => onDelete(cat)}
                onMouseEnter={e => e.currentTarget.style.background='#ef444430'}
                onMouseLeave={e => e.currentTarget.style.background='#fee2e220'}>
                <i className="fas fa-trash" style={{ fontSize: '0.78rem' }}></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [keyword,    setKeyword]    = useState('');
  const [viewMode,   setViewMode]   = useState('grid');
  const [showModal,  setShowModal]  = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [formData,   setFormData]   = useState({
    name: '', description: '', icon: 'palette', color: '#6366f1',
  });
  const { isAdmin } = useAuth();
  const nameRef = useRef(null);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { if (showModal) setTimeout(() => nameRef.current?.focus(), 100); }, [showModal]);

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
        icon:        cat.icon        || 'palette',
        color:       cat.color       || '#6366f1',
      });
    } else {
      setEditingCat(null);
      setFormData({ name: '', description: '', icon: 'palette', color: '#6366f1' });
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingCat(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Tên danh mục không được để trống.'); return; }
    setSaving(true);
    try {
      if (editingCat) {
        await categoryApi.update(editingCat.id, { id: editingCat.id, ...formData });
        showToast('Cập nhật danh mục thành công!');
      } else {
        await categoryApi.create(formData);
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

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(keyword.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div style={S.page}>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981'
            : toast.type === 'danger' ? '#ef4444' : '#f59e0b',
          color: 'white', padding: '12px 22px', borderRadius: 12,
          fontWeight: 700, fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.3s ease',
        }}>
          <i className={`fas fa-${
            toast.type === 'success' ? 'check-circle'
            : toast.type === 'danger' ? 'trash'
            : 'exclamation-triangle'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>🗂 Quản Lý Danh Mục</h1>
          <p style={S.subtitle}>Tổ chức và phân loại các thể loại tranh</p>
        </div>
        {isAdmin && (
          <button style={S.btnPrimary} onClick={() => openModal()}>
            <i className="fas fa-plus"></i> Thêm danh mục
          </button>
        )}
      </div>

      {/* KPI cards */}
      <div style={S.kpiRow}>
        {[
          { label: 'Tổng danh mục', value: categories.length,        color: '#6366f1', icon: 'fa-layer-group'       },
          { label: 'Có tranh',      value: categories.filter(c => (c.productCount || 0) > 0).length, color: '#10b981', icon: 'fa-image' },
          { label: 'Chưa có tranh', value: categories.filter(c => !(c.productCount || 0)).length,    color: '#f59e0b', icon: 'fa-exclamation-circle' },
          { label: 'Kết quả lọc',   value: filtered.length,           color: '#3b82f6', icon: 'fa-filter'            },
        ].map((k, i) => (
          <div key={i} style={S.kpiCard(k.color)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={S.kpiNum(k.color)}>{k.value}</div>
                <div style={S.kpiLabel}>{k.label}</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${k.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: k.color,
              }}>
                <i className={`fas ${k.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <input style={S.search} placeholder="🔍  Tìm kiếm danh mục..."
          value={keyword} onChange={e => setKeyword(e.target.value)} />
        <div style={{
          display: 'flex', gap: 6, background: 'white',
          border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 4,
        }}>
          {[['grid','th-large'],['list','list']].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              border: 'none', cursor: 'pointer', borderRadius: 8,
              width: 36, height: 36, fontSize: '0.88rem',
              background: viewMode === mode ? '#6366f1' : 'transparent',
              color: viewMode === mode ? 'white' : '#94a3b8',
              transition: 'all 0.18s',
            }}>
              <i className={`fas fa-${icon}`}></i>
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {filtered.length} / {categories.length} danh mục
        </span>
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

      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🗂</div>
          <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            {keyword ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}
          </h4>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 24 }}>
            {keyword
              ? `Không có kết quả cho "${keyword}"`
              : 'Hãy tạo danh mục đầu tiên để phân loại tranh'}
          </p>
          {isAdmin && !keyword && (
            <button style={{ ...S.btnPrimary, margin: '0 auto' }} onClick={() => openModal()}>
              <i className="fas fa-plus"></i> Tạo danh mục đầu tiên
            </button>
          )}
        </div>

      ) : viewMode === 'grid' ? (
        <div style={S.grid}>
          {filtered.map(cat => (
            <CatCard key={cat.id} cat={cat} isAdmin={isAdmin}
              onEdit={openModal} onDelete={setConfirmDel} />
          ))}
        </div>

      ) : (
        <div style={{
          background: 'white', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Danh Mục</th>
                <th style={S.th}>Mô tả</th>
                <th style={S.th}>Số Tranh</th>
                {isAdmin && <th style={{ ...S.th, textAlign: 'right' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => {
                const color = cat.color || '#6366f1';
                return (
                  <tr key={cat.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ ...S.td, width: 48, color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
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
                    <td style={{ ...S.td, maxWidth: 280 }}>
                      <span style={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontSize: '0.85rem', color: '#64748b',
                      }}>
                        {cat.description || <em style={{ color: '#cbd5e1' }}>Chưa có mô tả</em>}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={S.catBadge(color)}>{cat.productCount || 0} tranh</span>
                    </td>
                    {isAdmin && (
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button style={S.btnIcon('#6366f1')} title="Chỉnh sửa" onClick={() => openModal(cat)}>
                            <i className="fas fa-pen" style={{ fontSize: '0.78rem' }}></i>
                          </button>
                          <button style={S.btnDanger} title="Xóa" onClick={() => setConfirmDel(cat)}>
                            <i className="fas fa-trash" style={{ fontSize: '0.78rem' }}></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    required />
                </div>

                {/* Description */}
                <div style={S.formGroup}>
                  <label style={S.label}>Mô tả</label>
                  <textarea style={S.textarea} rows={3}
                    placeholder="Mô tả ngắn về danh mục này..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
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

export default Categories;