import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ArtistLayout from '../../components/ArtistLayout';
import { productApi, categoryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Constants ──────────────────────────────────────────────
const THEMES    = ['Phong cảnh','Chân dung','Tĩnh vật','Trừu tượng','Động vật','Đô thị','Lịch sử','Tâm linh','Khác'];
const MATERIALS = ['Giấy dó','Giấy điệp','Lụa','Vải bố','Sơn mài','Gỗ','Gốm sứ','Giấy thường','Tre, nứa, mây','Chất liệu khác'];

const STATUS_CFG = {
  Pending:  { label:'Chờ duyệt', color:'#92400e', bg:'#fef3c7', icon:'fa-clock' },
  ForSale:  { label:'Đang bán',  color:'#065f46', bg:'#d1fae5', icon:'fa-check-circle' },
  Ordered:  { label:'Đã đặt',    color:'#1e40af', bg:'#dbeafe', icon:'fa-shopping-cart' },
  Sold:     { label:'Đã bán',    color:'#6b7280', bg:'#f3f4f6', icon:'fa-box' },
  Rejected: { label:'Từ chối',   color:'#991b1b', bg:'#fee2e2', icon:'fa-ban' },
};

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';
const emptyForm = {
  name:'', artistName:'', categoryId:'',
  price:'', theme:'', material:'',
  width:'', height:'', description:'', imageUrl:'',
};

// ─── Field wrapper ───────────────────────────────────────────
const F = ({ label, children, required }) => (
  <div>
    <label style={{ fontWeight:600, fontSize:'0.82rem', color:'#374151', display:'block', marginBottom:5 }}>
      {label}{required && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}
    </label>
    {children}
  </div>
);

// ─── Toast ───────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding:'11px 18px', borderRadius:10, color:'white', fontWeight:600, fontSize:'0.88rem',
        background: t.type==='success' ? '#10b981' : t.type==='error' ? '#ef4444' : '#3b82f6',
        boxShadow:'0 4px 20px rgba(0,0,0,0.15)', minWidth:260, animation:'slideIn .25s ease',
      }}>
        <i className={`fas ${t.type==='success'?'fa-check-circle':'fa-times-circle'} mr-2`}></i>
        {t.message}
      </div>
    ))}
  </div>
);

// ─── Confirm Dialog ──────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:2000 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'white', borderRadius:16, padding:'28px 32px', zIndex:2001,
        minWidth:340, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', textAlign:'center',
      }}>
        <div style={{ fontSize:'2.2rem', marginBottom:10 }}>⚠️</div>
        <h5 style={{ fontWeight:800, marginBottom:8, color:'#1f2937' }}>{title}</h5>
        <p style={{ color:'#6b7280', marginBottom:24, fontSize:'0.9rem' }}>{message}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={onCancel}
            style={{ padding:'9px 24px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'white', color:'#374151', fontWeight:600, cursor:'pointer' }}>
            Hủy bỏ
          </button>
          <button onClick={onConfirm}
            style={{ padding:'9px 24px', borderRadius:9, border:'none', background:'#ef4444', color:'white', fontWeight:700, cursor:'pointer' }}>
            Xóa tác phẩm
          </button>
        </div>
      </div>
    </>
  );
};

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

  const [toasts,  setToasts]  = useState([]);
  const toastId = useRef(0);
  const [confirm, setConfirm] = useState({ open:false, title:'', message:'', onConfirm:null });

  const showToast = useCallback((message, type='success') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

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
    try {
      const r = await productApi.uploadImage(file);
      setForm(f => ({ ...f, imageUrl: r.data.url }));
      showToast('Upload ảnh thành công');
    } catch (err) {
      setModalErr('Upload ảnh thất bại: ' + (err.response?.data?.message || err.message));
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setModalErr('');
    if (!form.name.trim())                          return setModalErr('Vui lòng nhập tên tác phẩm');
    if (!form.categoryId)                            return setModalErr('Vui lòng chọn thể loại');
    if (!form.price || Number(form.price) <= 0)      return setModalErr('Giá bán phải lớn hơn 0');
    if (!form.material)                              return setModalErr('Vui lòng chọn chất liệu');
    if (!form.theme)                                 return setModalErr('Vui lòng chọn chủ đề');
    if (!form.width  || Number(form.width)  <= 0)    return setModalErr('Chiều rộng phải lớn hơn 0');
    if (!form.height || Number(form.height) <= 0)    return setModalErr('Chiều cao phải lớn hơn 0');
    if (!form.description.trim())                    return setModalErr('Vui lòng nhập mô tả tác phẩm');
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
        width:       Number(form.width),
        height:      Number(form.height),
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
        .tab-btn.active { border-color:#c8a97a; background:#fdf6ec; color:#8b6c4a; }
        .tab-btn:hover:not(.active) { border-color:#c8a97a; color:#8b6c4a; }
      `}</style>

      <Toast toasts={toasts} />
      <ConfirmDialog {...confirm} onCancel={closeConfirm} />

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <button onClick={openAdd} style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'10px 22px', borderRadius:11, border:'none',
          background:'linear-gradient(135deg,#c8a97a,#8b6c4a)',
          color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
          boxShadow:'0 4px 18px rgba(200,169,122,.4)', transition:'all .18s', whiteSpace:'nowrap',
        }}>
          <i className="fas fa-plus"></i> Thêm tác phẩm
        </button>
      </div>

      {/* ── KPI Cards — chỉ 1 dòng (4 box chính) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { label:'Tổng tác phẩm', value:stats.total,    color:'#c8a97a', bg:'#fdf6ec', icon:'fa-images',       key:'all' },
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
                  <span style={{ marginLeft:5, background: tabStatus===t.key ? '#c8a97a' : '#e2e8f0',
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
            <div className="spinner-border" style={{ color:'#c8a97a', width:40, height:40 }}></div>
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
                style={{ padding:'9px 22px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#c8a97a,#8b6c4a)', color:'white', fontWeight:700, cursor:'pointer' }}>
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
                          ? <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `http://localhost:5000${p.imageUrl}`}
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
                        <span style={{ fontWeight:800, color:'#c8a97a', fontSize:'0.9rem' }}>{fmt(p.price)}</span>
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
          padding:'20px 0', overflowY:'auto',
        }}>
          <div style={{
            background:'white', borderRadius:18, width:'100%', maxWidth:860,
            margin:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', overflow:'hidden',
          }}>
            {/* Header */}
            <div style={{
              background:'linear-gradient(135deg,#c8a97a,#8b6c4a)',
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
            <div style={{ padding:'24px 28px', display:'flex', gap:22 }}>

              {/* CỘT TRÁI */}
              <div style={{ width:230, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>

                {/* Ảnh */}
                <div style={{ background:'#fffbf4', borderRadius:12, overflow:'hidden', border:'1.5px solid #e8d5a8' }}>
                  <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid #f5ede0' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-camera mr-1" style={{ color:'#c8a97a' }}></i>
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
                        : <div style={{ textAlign:'center', color:'#c8a97a' }}>
                            <i className="fas fa-cloud-upload-alt" style={{ fontSize:'1.8rem', display:'block', marginBottom:6 }}></i>
                            <span style={{ fontSize:'0.78rem' }}>Click để chọn ảnh</span>
                          </div>
                      }
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" className="d-none" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{
                        width:'100%', padding:'7px 0', borderRadius:8,
                        border:'1.5px solid #c8a97a', background: uploading ? '#f3f4f6' : 'white',
                        color:'#8b6c4a', fontWeight:600, cursor: uploading ? 'not-allowed' : 'pointer',
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
                <div style={{ background:'#fffbf4', borderRadius:12, border:'1.5px solid #e8d5a8', padding:14 }}>
                  <div style={{ fontSize:'0.8rem', color:'#8b6c4a', lineHeight:1.7 }}>
                    <i className="fas fa-info-circle mr-1"></i>
                    Tác phẩm sau khi gửi sẽ ở trạng thái <strong>Chờ duyệt</strong>. Admin sẽ xem xét và duyệt để hiển thị trên cửa hàng.
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI */}
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>

                {/* Thông tin cơ bản */}
                <div style={{ background:'#fffbf4', borderRadius:12, border:'1.5px solid #e8d5a8' }}>
                  <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid #f5ede0', borderLeft:'3px solid #c8a97a', borderRadius:'11px 11px 0 0' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-info-circle mr-1" style={{ color:'#c8a97a' }}></i>Thông tin cơ bản
                    </span>
                  </div>
                  <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:12 }}>
                    <F label="Tên tác phẩm" required>
                      <input className="form-control" placeholder="VD: Hoàng hôn trên sông Hương"
                        value={form.name} onChange={ch('name')}
                        style={{ borderRadius:8, fontSize:'0.88rem', border:'1.5px solid #e5e7eb' }} />
                    </F>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <F label="Tên họa sĩ">
                        <input className="form-control" placeholder="Tên tác giả"
                          value={form.artistName} onChange={ch('artistName')}
                          style={{ borderRadius:8, fontSize:'0.88rem', border:'1.5px solid #e5e7eb' }} />
                      </F>
                      <F label="Thể loại tranh" required>
                        <select className="form-control" value={form.categoryId} onChange={ch('categoryId')}
                          style={{ borderRadius:8, fontSize:'0.88rem', border:'1.5px solid #e5e7eb' }}>
                          <option value="">-- Chọn thể loại --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </F>
                    </div>
                  </div>
                </div>

                {/* Chi tiết kỹ thuật */}
                <div style={{ background:'#fffbf4', borderRadius:12, border:'1.5px solid #e8d5a8' }}>
                  <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid #f5ede0', borderLeft:'3px solid #d4a76a', borderRadius:'11px 11px 0 0' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-palette mr-1" style={{ color:'#d4a76a' }}></i>Thông tin tác phẩm
                    </span>
                  </div>
                  <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <F label="Chất liệu" required>
                        <select className="form-control" value={form.material} onChange={ch('material')}
                          style={{ borderRadius:8, fontSize:'0.88rem', border: form.material ? '1.5px solid #c8a97a' : '1.5px solid #e5e7eb' }}>
                          <option value="">-- Chọn chất liệu --</option>
                          {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </F>
                      <F label="Chủ đề / Phong cách" required>
                        <select className="form-control" value={form.theme} onChange={ch('theme')}
                          style={{ borderRadius:8, fontSize:'0.88rem', border: form.theme ? '1.5px solid #c8a97a' : '1.5px solid #e5e7eb' }}>
                          <option value="">-- Chọn chủ đề --</option>
                          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </F>
                    </div>

                    {/* Kích thước */}
                    <div>
                      <label style={{ fontWeight:600, fontSize:'0.82rem', color:'#374151', display:'block', marginBottom:5 }}>
                        Kích thước (cm) <span style={{ color:'#ef4444' }}>*</span>
                      </label>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:8, alignItems:'flex-start' }}>
                        <div>
                          <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                            <button type="button" onClick={() => adj('width',-5)}
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#6b7280' }}>−</button>
                            <input className="form-control" type="number" min={1} placeholder="Rộng"
                              value={form.width} onChange={ch('width')}
                              style={{ borderRadius:7, fontSize:'0.88rem', border: form.width ? '1.5px solid #c8a97a' : '1.5px solid #e5e7eb', textAlign:'center', padding:'6px 4px' }} />
                            <button type="button" onClick={() => adj('width',5)}
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#6b7280' }}>+</button>
                          </div>
                          <div style={{ fontSize:'0.7rem', color:'#94a3b8', textAlign:'center', marginTop:3 }}>Chiều rộng</div>
                        </div>
                        <span style={{ fontWeight:700, color:'#94a3b8', fontSize:'1rem', paddingTop:8 }}>×</span>
                        <div>
                          <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                            <button type="button" onClick={() => adj('height',-5)}
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#6b7280' }}>−</button>
                            <input className="form-control" type="number" min={1} placeholder="Cao"
                              value={form.height} onChange={ch('height')}
                              style={{ borderRadius:7, fontSize:'0.88rem', border: form.height ? '1.5px solid #c8a97a' : '1.5px solid #e5e7eb', textAlign:'center', padding:'6px 4px' }} />
                            <button type="button" onClick={() => adj('height',5)}
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#6b7280' }}>+</button>
                          </div>
                          <div style={{ fontSize:'0.7rem', color:'#94a3b8', textAlign:'center', marginTop:3 }}>Chiều cao</div>
                        </div>
                      </div>
                      {form.width && form.height && (
                        <div style={{ marginTop:6, fontSize:'0.75rem', color:'#c8a97a', fontWeight:600, textAlign:'center' }}>
                          Kích thước: {form.width} × {form.height} cm
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Giá bán */}
                <div style={{ background:'#fffbf4', borderRadius:12, border:'1.5px solid #e8d5a8' }}>
                  <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid #f5ede0', borderLeft:'3px solid #10b981', borderRadius:'11px 11px 0 0' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-tag mr-1" style={{ color:'#10b981' }}></i>Giá bán
                    </span>
                  </div>
                  <div style={{ padding:'14px' }}>
                    <F label="Giá bán (VNĐ)" required>
                      <div style={{ display:'flex', gap:3 }}>
                        <button type="button" onClick={() => adj('price',-100000)}
                          style={{ flexShrink:0, width:28, height:36, borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#6b7280' }}>−</button>
                        <input className="form-control" type="number" min={0} step={100000} placeholder="0"
                          value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value.replace(/[^0-9]/g,'') }))}
                          style={{ borderRadius:7, fontSize:'0.88rem', border: form.price ? '1.5px solid #10b981' : '1.5px solid #e5e7eb' }} />
                        <button type="button" onClick={() => adj('price',100000)}
                          style={{ flexShrink:0, width:28, height:36, borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#6b7280' }}>+</button>
                      </div>
                      {form.price > 0 && (
                        <div style={{ fontSize:'0.72rem', color:'#10b981', marginTop:4, fontWeight:600 }}>
                          ≈ {new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(form.price)}
                        </div>
                      )}
                    </F>
                  </div>
                </div>

                {/* Mô tả */}
                <div style={{ background:'#fffbf4', borderRadius:12, border:'1.5px solid #e8d5a8' }}>
                  <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid #f5ede0', borderLeft:'3px solid #3b82f6', borderRadius:'11px 11px 0 0' }}>
                    <span style={{ fontWeight:700, fontSize:'0.8rem', color:'#374151' }}>
                      <i className="fas fa-align-left mr-1" style={{ color:'#3b82f6' }}></i>Mô tả tác phẩm <span style={{ color:'#ef4444' }}>*</span>
                    </span>
                  </div>
                  <div style={{ padding:'14px' }}>
                    <textarea className="form-control"
                      rows={5} placeholder="Mô tả câu chuyện, kỹ thuật, ý nghĩa của tác phẩm..."
                      value={form.description} onChange={ch('description')}
                      style={{ borderRadius:8, fontSize:'0.88rem', resize:'vertical', border: form.description ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb' }}
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
                  background:'linear-gradient(135deg,#c8a97a,#8b6c4a)',
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
