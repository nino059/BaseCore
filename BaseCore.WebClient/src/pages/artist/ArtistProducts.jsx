import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ArtistLayout from '../../components/layout/ArtistLayout';
import { productApi, categoryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toImg } from '../../utils/image';
import { useToast } from '../../hooks/useToast';
import Toaster from '../../components/ui/Toaster';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// ─── Constants ──────────────────────────────────────────────
const THEMES    = ['Phong cảnh','Chân dung','Tĩnh vật','Trừu tượng','Động vật','Đô thị','Lịch sử','Tâm linh','Khác'];
const MATERIALS = ['Giấy dó','Giấy điệp','Lụa','Vải bố','Sơn mài','Gỗ','Gốm sứ','Giấy thường','Tre, nứa, mây','Chất liệu khác'];

import { PRODUCT_STATUS as STATUS_CFG } from '../../utils/orderStatus';

import { formatVNDCompact as fmt } from '../../utils/format';
const emptyForm = {
  name:'', artistName:'', categoryId:'',
  price:'', theme:'', material:'',
  width:'', height:'', description:'', imageUrl:'',
};

// ─── Field wrapper ───────────────────────────────────────────
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: '0.88rem',
  border: '1.5px solid #e5e7eb',
  outline: 'none',
  background: '#fff',
};

const F = ({ label, children, required }) => (
  <div style={{ minWidth: 0 }}>
    <label style={{ fontWeight:600, fontSize:'0.82rem', color:'#374151', display:'block', marginBottom:5 }}>
      {label}{required && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}
    </label>
    {children}
  </div>
);

const StepperBtn = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="ap-stepper-btn"
  >
    {children}
  </button>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const ArtistProducts = () => {
  const { user } = useAuth();
  const sellerId = user?.userId || user?.id;

  const [allProducts, setAllProducts] = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tabStatus,   setTabStatus]   = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [modalErr,  setModalErr]  = useState('');
  const fileRef = useRef(null);

  const { toasts, showToast } = useToast();
  const [confirm, setConfirm] = useState({ open:false, title:'', message:'', onConfirm:null });

  const openConfirm  = (title, message, cb) => setConfirm({ open:true, title, message, onConfirm:cb });
  const closeConfirm = () => setConfirm(p => ({ ...p, open:false }));

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        productApi.getAll({ sellerId, pageSize:999 }),
        categoryApi.getAll(),
      ]);
      setAllProducts(pRes.data?.items || []);
      setCategories(cRes.data || []);
    } catch { showToast('Không thể tải dữ liệu', 'error'); }
    finally { setLoading(false); }
  }, [sellerId, showToast]);

  useEffect(() => { load(); }, [load]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    allProducts.length,
    forSale:  allProducts.filter(p => p.status === 'ForSale').length,
    pending:  allProducts.filter(p => p.status === 'Pending').length,
    ordered:  allProducts.filter(p => p.status === 'Ordered').length,
    sold:     allProducts.filter(p => p.status === 'Sold').length,
    rejected: allProducts.filter(p => p.status === 'Rejected').length,
  }), [allProducts]);

  // ── Tabs & filter ─────────────────────────────────────────
  const tabs = [
    { key:'all',      label:'Tất cả',    count: stats.total },
    { key:'Pending',  label:'Chờ duyệt', count: stats.pending },
    { key:'ForSale',  label:'Đang bán',  count: stats.forSale },
    { key:'Ordered',  label:'Đã đặt',    count: stats.ordered },
    { key:'Sold',     label:'Đã bán',    count: stats.sold },
    { key:'Rejected', label:'Từ chối',   count: stats.rejected },
  ];
  const filtered = tabStatus === 'all' ? allProducts : allProducts.filter(p => p.status === tabStatus);

  // ── Modal helpers ─────────────────────────────────────────
  const ch  = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const adj = (k, d) => setForm(f => ({ ...f, [k]: String(Math.max(1, Number(f[k]||0)+d)) }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, artistName: user?.name || user?.username || '' });
    setModalErr('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name:        p.name        || '',
      artistName:  p.artistName  || user?.name || '',
      categoryId:  p.categoryId  || '',
      price:       p.price ? String(Math.round(Number(p.price))) : '',
      theme:       p.theme       || '',
      material:    p.material    || '',
      width:       p.width       || '',
      height:      p.height      || '',
      description: p.description || '',
      imageUrl:    p.imageUrl    || '',
    });
    setModalErr('');
    setShowModal(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setModalErr('');
    try {
      const r = await productApi.uploadImage(file);
      const url = r.data?.url || r.data?.Url;
      if (!url) throw new Error('Server không trả về URL ảnh');
      setForm(f => ({ ...f, imageUrl: url }));
      showToast('Upload ảnh thành công');
    } catch (err) {
      setModalErr('Upload ảnh thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const parsePositiveInt = (val, label) => {
    const n = Number(val);
    if (!val || !Number.isFinite(n) || n <= 0) return { error: `${label} phải là số nguyên dương` };
    return { value: Math.round(n) };
  };

  const handleSave = async () => {
    setModalErr('');
    if (!form.name.trim())                          return setModalErr('Vui lòng nhập tên tác phẩm');
    if (form.name.trim().length > 200)              return setModalErr('Tên tác phẩm tối đa 200 ký tự');
    if (!form.categoryId)                            return setModalErr('Vui lòng chọn thể loại');
    if (!form.price || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0)
      return setModalErr('Giá bán phải lớn hơn 0');
    if (!form.material)                              return setModalErr('Vui lòng chọn chất liệu');
    if (!form.theme)                                 return setModalErr('Vui lòng chọn chủ đề');
    const w = parsePositiveInt(form.width, 'Chiều rộng');
    if (w.error) return setModalErr(w.error);
    const h = parsePositiveInt(form.height, 'Chiều cao');
    if (h.error) return setModalErr(h.error);
    if (!form.description.trim())                    return setModalErr('Vui lòng nhập mô tả tác phẩm');
    if (form.description.trim().length > 1000)       return setModalErr('Mô tả tối đa 1000 ký tự');
    if (!form.imageUrl)                              return setModalErr('Vui lòng upload ảnh tác phẩm');

    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        artistName:  form.artistName.trim() || user?.name || '',
        categoryId:  Number(form.categoryId),
        price:       Number(form.price),
        theme:       form.theme,
        material:    form.material,
        width:       w.value,
        height:      h.value,
        description: form.description.trim(),
        imageUrl:    form.imageUrl,
      };
      if (editing) {
        await productApi.update(editing.id, payload);
        showToast('Cập nhật tác phẩm thành công');
      } else {
        await productApi.create(payload);
        showToast('Đã gửi tác phẩm — chờ Admin duyệt');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setModalErr('Lưu thất bại: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => openConfirm(
    'Xóa tác phẩm',
    `Bạn có chắc muốn xóa "${name}"? Thao tác này không thể hoàn tác.`,
    async () => {
      closeConfirm();
      try {
        await productApi.delete(id);
        showToast('Đã xóa tác phẩm');
        load();
      } catch (err) {
        showToast('Xóa thất bại: ' + (err.response?.data?.message || err.message), 'error');
      }
    }
  );

  const handleRestock = async (id) => {
    try {
      await productApi.restock(id);
      showToast('Đã đánh dấu còn hàng — tranh trở lại Đang bán');
      load();
    } catch (err) {
      showToast('Không thể cập nhật: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // ══════════════════════════════════════════════════════════
  return (
    <ArtistLayout>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        .ap-row { border-bottom:1px solid #f1f5f9; transition:background .12s; }
        .ap-row:hover { background:#fffbf4 !important; }
        .ap-action { transition:all .15s; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .ap-action:hover { transform:scale(1.1); }
        .kpi-card-artist { background:white; border-radius:14px; padding:18px;
          box-shadow:0 2px 12px rgba(0,0,0,.06); cursor:pointer; transition:all .2s; border-top:3px solid #f1f5f9; }
        .kpi-card-artist:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
        .tab-btn { padding:7px 16px; border-radius:20px; border:1.5px solid #e2e8f0; background:white;
          font-size:0.78rem; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .tab-btn.active { border-color:var(--brand); background:#fdf6ec; color:var(--brand-dark); }
        .tab-btn:hover:not(.active) { border-color:var(--brand); color:var(--brand-dark); }
        .ap-modal-panel { width:100%; max-width:860px; margin:20px 16px; max-height:calc(100vh - 40px); display:flex; flex-direction:column; }
        .ap-modal-body { display:flex; gap:22px; align-items:flex-start; overflow-y:auto; flex:1; min-height:0; }
        .ap-modal-side { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:16px; min-width:0; }
        .ap-modal-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
        .ap-form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; min-width:0; }
        .ap-form-section { background:#fffbf4; border-radius:12px; border:1.5px solid var(--brand-light); overflow:hidden; min-width:0; }
        .ap-form-section-head { padding:10px 14px 8px; border-bottom:1px solid #f5ede0; }
        .ap-form-section-body { padding:14px; display:flex; flex-direction:column; gap:12px; min-width:0; }
        .ap-stepper-row { display:flex; gap:6px; align-items:center; min-width:0; }
        .ap-stepper-row .form-control { flex:1; min-width:0; width:auto !important; height:38px; padding:0 8px; }
        .ap-stepper-btn { flex-shrink:0; width:32px; height:38px; border-radius:7px; border:1.5px solid #e5e7eb; background:#f8fafc; cursor:pointer; font-weight:700; font-size:0.82rem; color:#6b7280; display:flex; align-items:center; justify-content:center; padding:0; }
        .ap-stepper-btn:hover { border-color:var(--brand); color:var(--brand-dark); background:#fffbf4; }
        .ap-size-grid { display:grid; grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr); gap:10px; align-items:center; }
        .ap-size-col { min-width:0; }
        @media (max-width: 768px) {
          .ap-modal-body { flex-direction:column; }
          .ap-modal-side { width:100%; }
          .ap-form-grid-2 { grid-template-columns:1fr; }
        }
      `}</style>

      <Toaster toasts={toasts} />
      <ConfirmDialog {...confirm} confirmLabel="Xóa tác phẩm" danger onCancel={closeConfirm} />

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <button onClick={openAdd} style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'10px 22px', borderRadius:11, border:'none',
          background:'linear-gradient(135deg,var(--brand),var(--brand-dark))',
          color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
          boxShadow:'0 4px 18px rgba(200,169,122,.4)', transition:'all .18s', whiteSpace:'nowrap',
        }}>
          <i className="fas fa-plus"></i> Thêm tác phẩm
        </button>
      </div>

      {/* ── KPI Cards — chỉ 1 dòng (4 box chính) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { label:'Tổng tác phẩm', value:stats.total,    color:'var(--brand)', bg:'#fdf6ec', icon:'fa-images',       key:'all' },
          { label:'Đang bán',      value:stats.forSale,  color:'#10b981', bg:'#d1fae5', icon:'fa-check-circle', key:'ForSale' },
          { label:'Chờ duyệt',     value:stats.pending,  color:'#f59e0b', bg:'#fef3c7', icon:'fa-clock',        key:'Pending' },
          { label:'Đã bán',        value:stats.sold,     color:'#6b7280', bg:'#f3f4f6', icon:'fa-box',          key:'Sold' },
        ].map((s, i) => {
          const active = tabStatus === s.key;
          return (
            <div key={i} className="kpi-card-artist"
              onClick={() => setTabStatus(s.key)}
              style={{
                borderTop:`3px solid ${active ? s.color : '#f1f5f9'}`,
                background: active ? s.bg + '55' : 'white',
                boxShadow: active ? `0 6px 24px ${s.color}28` : undefined,
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'2rem', fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151', marginTop:4 }}>{s.label}</div>
                  <div style={{ fontSize:'0.7rem', color: active ? s.color : '#94a3b8', marginTop:2, fontWeight: active ? 700 : 400 }}>
                    {active ? <><i className="fas fa-check-circle mr-1"></i>Đang xem</> : 'Nhấn để lọc'}
                  </div>
                </div>
                <div style={{ width:38, height:38, borderRadius:10, background:s.bg, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:'1rem' }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,.07)', overflow:'hidden' }}>
        {/* Tab bar */}
        <div style={{ padding:'12px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {tabs.map(t => (
              <button key={t.key} className={`tab-btn${tabStatus === t.key ? ' active' : ''}`}
                onClick={() => setTabStatus(t.key)}>
                {t.label}
                {t.count > 0 && (
                  <span style={{ marginLeft:5, background: tabStatus===t.key ? 'var(--brand)' : '#e2e8f0',
                    color: tabStatus===t.key ? 'white' : '#64748b',
                    borderRadius:20, padding:'1px 7px', fontSize:'0.7rem', fontWeight:700 }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={load} title="Làm mới"
            style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', color:'#64748b', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-sync-alt" style={{ fontSize:'0.78rem' }}></i>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'70px 0' }}>
            <div className="spinner-border" style={{ color:'var(--brand)', width:40, height:40 }}></div>
            <p style={{ marginTop:14, color:'#94a3b8', fontSize:'0.88rem' }}>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'70px 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:14 }}>🎨</div>
            <div style={{ fontWeight:700, color:'#475569', marginBottom:6 }}>
              {tabStatus === 'all' ? 'Chưa có tác phẩm nào' : `Không có tranh "${tabs.find(t=>t.key===tabStatus)?.label}"`}
            </div>
            <div style={{ fontSize:'0.83rem', color:'#94a3b8', marginBottom:18 }}>
              {tabStatus === 'all' ? 'Thêm tác phẩm đầu tiên để bắt đầu' : 'Chuyển sang tab khác để xem'}
            </div>
            {tabStatus === 'all' && (
              <button onClick={openAdd}
                style={{ padding:'9px 22px', borderRadius:9, border:'none', background:'linear-gradient(135deg,var(--brand),var(--brand-dark))', color:'white', fontWeight:700, cursor:'pointer' }}>
                <i className="fas fa-plus mr-1"></i> Thêm tác phẩm đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                  {['#','Ảnh','Tác phẩm','Chất liệu','Giá bán','Trạng thái','Thao tác'].map((h, i) => (
                    <th key={i} style={{
                      padding:'11px 14px', fontSize:'0.72rem', fontWeight:700,
                      color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em',
                      textAlign:(i===0||i>=5)?'center':'left', whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const sc = STATUS_CFG[p.status] || STATUS_CFG.Pending;
                  const canEdit   = ['Pending','ForSale','Sold'].includes(p.status);
                  const canRestock = p.status === 'Sold';
                  const canDelete = ['Pending','Rejected'].includes(p.status);

                  return (
                    <tr key={p.id} className="ap-row"
                      style={{ background: idx%2===1 ? '#fafbff' : 'white' }}>

                      <td style={{ padding:'12px 14px', color:'#cbd5e1', fontSize:'0.78rem', fontWeight:700, textAlign:'center' }}>
                        {idx+1}
                      </td>

                      <td style={{ padding:'10px 14px' }}>
                        {p.imageUrl
                          ? <img src={toImg(p.imageUrl)}
                              alt={p.name} style={{ width:52, height:52, objectFit:'cover', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,.12)', display:'block' }}
                              onError={e => e.target.style.display='none'} />
                          : <div style={{ width:52, height:52, background:'#f1f5f9', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <i className="fas fa-image" style={{ color:'#cbd5e1', fontSize:'1.2rem' }}></i>
                            </div>
                        }
                      </td>

                      <td style={{ padding:'12px 14px', maxWidth:200 }}>
                        <div style={{ fontWeight:700, color:'#1e293b', fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>
                          {p.categoryName || '—'}
                          {(p.width && p.height) && ` · ${p.width}×${p.height}cm`}
                        </div>
                        {p.status === 'Rejected' && p.adminNote && (
                          <div style={{ marginTop:5, fontSize:'0.73rem', color:'#dc2626',
                            background:'#fef2f2', borderRadius:6, padding:'3px 8px', display:'inline-block', maxWidth:180 }}>
                            <i className="fas fa-times-circle mr-1"></i>
                            {p.adminNote}
                          </div>
                        )}
                      </td>

                      <td style={{ padding:'12px 14px', fontSize:'0.85rem', color:'#475569' }}>
                        {p.material || <span style={{ color:'#e2e8f0' }}>—</span>}
                      </td>

                      <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                        <span style={{ fontWeight:800, color:'var(--brand)', fontSize:'0.9rem' }}>{fmt(p.price)}</span>
                      </td>

                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <span style={{
                          fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em',
                          color:sc.color, background:sc.bg, borderRadius:20, padding:'3px 10px',
                          whiteSpace:'nowrap',
                        }}>
                          <i className={`fas ${sc.icon} mr-1`} style={{ fontSize:'0.65rem' }}></i>
                          {sc.label}
                        </span>
                      </td>

                      <td style={{ padding:'12px 14px', textAlign:'center', whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
                          {canEdit && (
                            <button className="ap-action" onClick={() => openEdit(p)} title="Chỉnh sửa"
                              style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fde68a', background:'#fef9c3', color:'#92400e' }}>
                              <i className="fas fa-pencil-alt" style={{ fontSize:'0.68rem' }}></i>
                            </button>
                          )}
                          {canRestock && (
                            <button className="ap-action" onClick={() => handleRestock(p.id)} title="Đánh dấu còn hàng"
                              style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', color:'#1e40af' }}>
                              <i className="fas fa-redo" style={{ fontSize:'0.68rem' }}></i>
                            </button>
                          )}
                          {canDelete && (
                            <button className="ap-action" onClick={() => handleDelete(p.id, p.name)} title="Xóa"
                              style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', color:'#ef4444' }}>
                              <i className="fas fa-trash" style={{ fontSize:'0.68rem' }}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════ MODAL THÊM / SỬA ════ */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0,
          background:'rgba(15,15,35,0.6)', zIndex:1050,
          display:'flex', alignItems:'flex-start', justifyContent:'center',
          overflowY:'auto',
        }}>
          <div className="ap-modal-panel" style={{
            background:'white', borderRadius:18,
            boxShadow:'0 24px 80px rgba(0,0,0,0.25)', overflow:'hidden',
          }}>
            {/* Header */}
            <div style={{
              background:'linear-gradient(135deg,var(--brand),var(--brand-dark))',
              padding:'20px 28px', display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div>
                <h5 style={{ color:'white', fontWeight:800, margin:0, fontSize:'1.05rem' }}>
                  <i className={`fas fa-${editing?'pencil-alt':'paint-brush'} mr-2`}></i>
                  {editing ? 'Chỉnh sửa tác phẩm' : 'Thêm tác phẩm mới'}
                </h5>
                <p style={{ color:'rgba(255,255,255,.7)', margin:'3px 0 0', fontSize:'0.8rem' }}>
                  {editing ? `Đang sửa: ${editing.name}` : 'Tác phẩm sẽ gửi cho Admin duyệt trước khi hiển thị'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background:'rgba(255,255,255,.15)', border:'none', color:'white',
                width:32, height:32, borderRadius:8, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem',
              }}>✕</button>
            </div>

            {/* Error */}
            {modalErr && (
              <div style={{
                background:'#fef2f2', borderLeft:'4px solid #ef4444',
                padding:'10px 20px', fontSize:'0.87rem', color:'#dc2626',
                display:'flex', alignItems:'center', gap:8,
              }}>
                <i className="fas fa-exclamation-circle"></i> {modalErr}
              </div>
            )}

            {/* Body */}
            <div className="ap-modal-body" style={{ padding:'24px 28px' }}>

              {/* CỘT TRÁI */}
              <div className="ap-modal-side">

                {/* Ảnh */}
                <div className="ap-form-section">
                  <div className="ap-form-section-head">
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-camera mr-1" style={{ color:'var(--brand)' }}></i>
                      Ảnh tác phẩm <span style={{ color:'#ef4444' }}>*</span>
                    </span>
                  </div>
                  <div style={{ padding:12 }}>
                    <div onClick={() => fileRef.current?.click()}
                      style={{
                        aspectRatio:'4/3', background: form.imageUrl ? 'transparent' : '#f5f0ea',
                        borderRadius:10, overflow:'hidden', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        marginBottom:10, border: form.imageUrl ? 'none' : '2px dashed #d4b896',
                      }}>
                      {form.imageUrl
                        ? <img src={form.imageUrl} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ textAlign:'center', color:'var(--brand)' }}>
                            <i className="fas fa-cloud-upload-alt" style={{ fontSize:'1.8rem', display:'block', marginBottom:6 }}></i>
                            <span style={{ fontSize:'0.78rem' }}>Click để chọn ảnh</span>
                          </div>
                      }
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{
                        width:'100%', padding:'7px 0', borderRadius:8,
                        border:'1.5px solid var(--brand)', background: uploading ? '#f3f4f6' : 'white',
                        color:'var(--brand-dark)', fontWeight:600, cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      }}>
                      {uploading
                        ? <><span className="spinner-border spinner-border-sm"></span> Đang upload...</>
                        : <><i className="fas fa-upload"></i> {form.imageUrl ? 'Đổi ảnh' : 'Chọn ảnh'}</>
                      }
                    </button>
                  </div>
                </div>

                {/* Info box */}
                <div className="ap-form-section" style={{ padding:14 }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--brand-dark)', lineHeight:1.7 }}>
                    <i className="fas fa-info-circle mr-1"></i>
                    Tác phẩm sau khi gửi sẽ ở trạng thái <strong>Chờ duyệt</strong>. Admin sẽ xem xét và duyệt để hiển thị trên cửa hàng.
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI */}
              <div className="ap-modal-main">

                {/* Thông tin cơ bản */}
                <div className="ap-form-section">
                  <div className="ap-form-section-head" style={{ borderLeft:'3px solid var(--brand)' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-info-circle mr-1" style={{ color:'var(--brand)' }}></i>Thông tin cơ bản
                    </span>
                  </div>
                  <div className="ap-form-section-body">
                    <F label="Tên tác phẩm" required>
                      <input className="form-control" placeholder="VD: Hoàng hôn trên sông Hương"
                        value={form.name} onChange={ch('name')} style={inputStyle} />
                    </F>
                    <div className="ap-form-grid-2">
                      <F label="Tên họa sĩ">
                        <input className="form-control" placeholder="Tên tác giả"
                          value={form.artistName} onChange={ch('artistName')} style={inputStyle} />
                      </F>
                      <F label="Thể loại tranh" required>
                        <select className="form-control" value={form.categoryId} onChange={ch('categoryId')}
                          style={{ ...inputStyle, paddingRight: 28 }}>
                          <option value="">-- Chọn thể loại --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </F>
                    </div>
                  </div>
                </div>

                {/* Chi tiết kỹ thuật */}
                <div className="ap-form-section">
                  <div className="ap-form-section-head" style={{ borderLeft:'3px solid #d4a76a' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-palette mr-1" style={{ color:'#d4a76a' }}></i>Thông tin tác phẩm
                    </span>
                  </div>
                  <div className="ap-form-section-body">
                    <div className="ap-form-grid-2">
                      <F label="Chất liệu" required>
                        <select className="form-control" value={form.material} onChange={ch('material')}
                          style={{ ...inputStyle, paddingRight: 28, border: form.material ? '1.5px solid var(--brand)' : '1.5px solid #e5e7eb' }}>
                          <option value="">-- Chọn chất liệu --</option>
                          {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </F>
                      <F label="Chủ đề / Phong cách" required>
                        <select className="form-control" value={form.theme} onChange={ch('theme')}
                          style={{ ...inputStyle, paddingRight: 28, border: form.theme ? '1.5px solid var(--brand)' : '1.5px solid #e5e7eb' }}>
                          <option value="">-- Chọn chủ đề --</option>
                          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </F>
                    </div>

                    {/* Kích thước */}
                    <div style={{ minWidth: 0 }}>
                      <label style={{ fontWeight:600, fontSize:'0.82rem', color:'#374151', display:'block', marginBottom:8 }}>
                        Kích thước (cm) <span style={{ color:'#ef4444' }}>*</span>
                      </label>
                      <div className="ap-size-grid">
                        <div className="ap-size-col">
                          <div className="ap-stepper-row">
                            <StepperBtn onClick={() => adj('width', -5)}>−</StepperBtn>
                            <input className="form-control" type="number" min={1} placeholder="Rộng"
                              value={form.width} onChange={ch('width')}
                              style={{ textAlign:'center', border: form.width ? '1.5px solid var(--brand)' : '1.5px solid #e5e7eb' }} />
                            <StepperBtn onClick={() => adj('width', 5)}>+</StepperBtn>
                          </div>
                          <div style={{ fontSize:'0.7rem', color:'#94a3b8', textAlign:'center', marginTop:4 }}>Chiều rộng</div>
                        </div>
                        <span style={{ fontWeight:700, color:'#94a3b8', fontSize:'1rem', textAlign:'center' }}>×</span>
                        <div className="ap-size-col">
                          <div className="ap-stepper-row">
                            <StepperBtn onClick={() => adj('height', -5)}>−</StepperBtn>
                            <input className="form-control" type="number" min={1} placeholder="Cao"
                              value={form.height} onChange={ch('height')}
                              style={{ textAlign:'center', border: form.height ? '1.5px solid var(--brand)' : '1.5px solid #e5e7eb' }} />
                            <StepperBtn onClick={() => adj('height', 5)}>+</StepperBtn>
                          </div>
                          <div style={{ fontSize:'0.7rem', color:'#94a3b8', textAlign:'center', marginTop:4 }}>Chiều cao</div>
                        </div>
                      </div>
                      {form.width && form.height && (
                        <div style={{ marginTop:8, fontSize:'0.75rem', color:'var(--brand)', fontWeight:600, textAlign:'center' }}>
                          Kích thước: {form.width} × {form.height} cm
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Giá bán */}
                <div className="ap-form-section">
                  <div className="ap-form-section-head" style={{ borderLeft:'3px solid #10b981' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-tag mr-1" style={{ color:'#10b981' }}></i>Giá bán
                    </span>
                  </div>
                  <div className="ap-form-section-body">
                    <F label="Giá bán (VNĐ)" required>
                      <div className="ap-stepper-row">
                        <StepperBtn onClick={() => adj('price', -100000)}>−</StepperBtn>
                        <input className="form-control" type="number" min={0} step={100000} placeholder="0"
                          value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value.replace(/[^0-9]/g,'') }))}
                          style={{ border: form.price ? '1.5px solid #10b981' : '1.5px solid #e5e7eb' }} />
                        <StepperBtn onClick={() => adj('price', 100000)}>+</StepperBtn>
                      </div>
                      {form.price > 0 && (
                        <div style={{ fontSize:'0.72rem', color:'#10b981', marginTop:6, fontWeight:600 }}>
                          ≈ {new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(form.price)}
                        </div>
                      )}
                    </F>
                  </div>
                </div>

                {/* Mô tả */}
                <div className="ap-form-section">
                  <div className="ap-form-section-head" style={{ borderLeft:'3px solid #3b82f6' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-align-left mr-1" style={{ color:'#3b82f6' }}></i>Mô tả tác phẩm <span style={{ color:'#ef4444' }}>*</span>
                    </span>
                  </div>
                  <div className="ap-form-section-body">
                    <textarea className="form-control"
                      rows={5} placeholder="Mô tả câu chuyện, kỹ thuật, ý nghĩa của tác phẩm..."
                      value={form.description} onChange={ch('description')}
                      style={{ ...inputStyle, height:'auto', minHeight:120, padding:'10px 12px', resize:'vertical', width:'100%', boxSizing:'border-box', border: form.description ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb' }}
                    />
                    <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:4, textAlign:'right' }}>
                      {form.description.length} ký tự
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:'16px 28px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafbff' }}>
              <button type="button" onClick={() => setShowModal(false)}
                style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', fontWeight:700, color:'#64748b', cursor:'pointer' }}>
                Hủy
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{
                  padding:'10px 28px', borderRadius:10, border:'none',
                  background:'linear-gradient(135deg,var(--brand),var(--brand-dark))',
                  color:'white', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, display:'flex', alignItems:'center', gap:8,
                }}>
                {saving
                  ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} /> Đang lưu...</>
                  : <><i className={`fas fa-${editing ? 'save' : 'paper-plane'}`}></i> {editing ? 'Lưu thay đổi' : 'Gửi duyệt'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </ArtistLayout>
  );
};

export default ArtistProducts;
