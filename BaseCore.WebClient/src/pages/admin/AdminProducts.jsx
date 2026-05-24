import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { productApi, categoryApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// ─── Constants ─────────────────────────────────────────────────────
const THEMES    = ["Phong cảnh","Chân dung","Tĩnh vật","Trừu tượng","Động vật","Đô thị","Lịch sử","Tâm linh","Khác"];
const MATERIALS = ["Giấy dó","Giấy điệp","Lụa","Vải bố","Sơn mài","Gỗ","Gốm sứ","Giấy thường","Tre, nứa, mây","Chất liệu khác"];
const STATUSES   = ["Available","Unavailable","OutOfStock","Pending","Rejected"];
const STATUS_VI  = { Available:"Đang bán", Unavailable:"Đã ẩn", OutOfStock:"Hết hàng", Pending:"Chờ duyệt", Rejected:"Từ chối" };
const STATUS_COLOR = { Available:"#10b981", Unavailable:"#6b7280", OutOfStock:"#ef4444", Pending:"#92400e", Rejected:"#991b1b" };
const STATUS_BG    = { Available:"#d1fae5", Unavailable:"#f3f4f6", OutOfStock:"#fee2e2", Pending:"#fef3c7", Rejected:"#fee2e2" };

const fmt = v => Number(v || 0).toLocaleString("vi-VN") + "₫";

const emptyForm = {
  name:"", artistName:"", categoryId:"",
  price:"", discountPrice:"", stock:1,
  theme:"", material:"",
  width:"", height:"",
  description:"", imageUrl:"",
  status:"Available",
};

// ─── Field wrapper ──────────────────────────────────────────────────
const F = ({ label, children, required }) => (
  <div>
    <label style={{ fontWeight:600, fontSize:"0.82rem", color:"#374151", display:"block", marginBottom:5 }}>
      {label}{required && <span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
    </label>
    {children}
  </div>
);

// ─── Toast ─────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding:"11px 18px", borderRadius:10, color:"white", fontWeight:600, fontSize:"0.88rem",
        background: t.type==="success" ? "#10b981" : t.type==="error" ? "#ef4444" : "#3b82f6",
        boxShadow:"0 4px 20px rgba(0,0,0,0.15)", minWidth:260, animation:"slideIn .25s ease",
      }}>
        <i className={`fas ${t.type==="success"?"fa-check-circle":t.type==="error"?"fa-times-circle":"fa-info-circle"} mr-2`}></i>
        {t.message}
      </div>
    ))}
  </div>
);

// ─── Confirm Dialog ─────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:2000 }} />
      <div style={{
        position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        background:"white", borderRadius:16, padding:"28px 32px", zIndex:2001,
        minWidth:340, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", textAlign:"center",
      }}>
        <div style={{ fontSize:"2.2rem", marginBottom:10 }}>⚠️</div>
        <h5 style={{ fontWeight:800, marginBottom:8, color:"#1f2937" }}>{title}</h5>
        <p style={{ color:"#6b7280", marginBottom:24, fontSize:"0.9rem" }}>{message}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onCancel}
            style={{ padding:"9px 24px", borderRadius:9, border:"1.5px solid #e5e7eb", background:"white", color:"#374151", fontWeight:600, cursor:"pointer", fontSize:"0.9rem" }}>
            Hủy bỏ
          </button>
          <button onClick={onConfirm}
            style={{ padding:"9px 24px", borderRadius:9, border:"none", background:"#ef4444", color:"white", fontWeight:700, cursor:"pointer", fontSize:"0.9rem" }}>
            Xóa tác phẩm
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Smart Pagination ───────────────────────────────────────────────
const pageNums = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4)  return [1,2,3,4,5,6,7,"…",total];
  if (page >= total-3) return [1,"…",...Array.from({length:7},(_,i)=>total-6+i)];
  return [1,"…",page-1,page,page+1,"…",total];
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function Products() {
  const { user } = useAuth();

  const [allProducts,  setAllProducts]  = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  const [keyword,      setKeyword]      = useState("");
  const [catFilter,    setCatFilter]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [modalErr,  setModalErr]  = useState("");
  const fileRef = useRef(null);

  const [toasts,  setToasts]  = useState([]);
  const toastId = useRef(0);
  const [confirm, setConfirm] = useState({ open:false, title:"", message:"", onConfirm:null });
  const [quickUpdating, setQuickUpdating] = useState({});

  const showToast = useCallback((message, type="success") => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const openConfirm  = (title, message, cb) => setConfirm({ open:true, title, message, onConfirm:cb });
  const closeConfirm = () => setConfirm(p => ({ ...p, open:false }));

  const loadCats = useCallback(async () => {
    try { const r = await categoryApi.getAll(); setCategories(r.data || []); }
    catch(e) { console.error(e); }
  }, []);

  const loadAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productApi.getAll({ pageSize: 999, admin: true });
      setAllProducts(r.data?.items || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCats(); loadAllProducts(); }, [loadCats, loadAllProducts]);

  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(kw) ||
        p.artistName?.toLowerCase().includes(kw)
      );
    }
    if (catFilter)    list = list.filter(p => String(p.categoryId) === String(catFilter));
    if (statusFilter) list = list.filter(p => p.status === statusFilter);
    return list;
  }, [allProducts, keyword, catFilter, statusFilter]);

  const totalCount  = filteredProducts.length;
  const totalPages  = Math.ceil(totalCount / PAGE_SIZE) || 0;
  const displayList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const statsData = useMemo(() => ({
    total:       allProducts.length,
    available:   allProducts.filter(p => p.status === "Available").length,
    pending:     allProducts.filter(p => p.status === "Pending").length,
    unavailable: allProducts.filter(p => p.status === "Unavailable").length,
    outOfStock:  allProducts.filter(p => p.status === "OutOfStock").length,
  }), [allProducts]);

  useEffect(() => { setPage(1); }, [keyword, catFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, sellerId: user?.id || "" });
    setModalErr("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name:        p.name        || "",
      artistName:  p.artistName  || "",
      categoryId:  p.categoryId  || "",
      price:       p.price       ? String(Math.round(Number(p.price))) : "",
      discountPrice: p.discountPrice ? String(Math.round(Number(p.discountPrice))) : "",
      stock:       p.stock       ?? 1,
      theme:       p.theme       || "",
      material:    p.material    || "",
      width:       p.width       || "",
      height:      p.height      || "",
      description: p.description || "",
      imageUrl:    p.imageUrl    || "",
      status:      p.status      || "Available",
      sellerId:    p.sellerId    || user?.id || "",
    });
    setModalErr("");
    setShowModal(true);
  };

  const handleChange = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
  const handlePriceChange = e => { const raw = e.target.value.replace(/[^0-9]/g, ''); setForm(f => ({ ...f, price: raw })); };
  const adjustPrice = delta => setForm(f => ({ ...f, price: String(Math.max(0, Number(f.price || 0) + delta)) }));
  const adjustDim = (field, delta) => setForm(f => ({ ...f, [field]: String(Math.max(1, Number(f[field] || 0) + delta)) }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await productApi.uploadImage(file);
      setForm(f => ({ ...f, imageUrl: r.data.url }));
      showToast("Upload ảnh thành công");
    } catch(err) {
      setModalErr("Upload ảnh thất bại: " + (err.response?.data?.message || err.message));
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setModalErr("");
    if (!form.name.trim())              return setModalErr("Vui lòng nhập tên tác phẩm");
    if (!form.artistName.trim())        return setModalErr("Vui lòng nhập tên nghệ sĩ / tác giả");
    if (!form.categoryId)               return setModalErr("Vui lòng chọn thể loại tranh");
    if (!form.price || Number(form.price) <= 0) return setModalErr("Giá bán phải lớn hơn 0");
    if (!form.material)                 return setModalErr("Vui lòng chọn chất liệu");
    if (!form.theme)                    return setModalErr("Vui lòng chọn chủ đề / phong cách");
    if (!form.width  || Number(form.width)  <= 0) return setModalErr("Chiều rộng phải lớn hơn 0");
    if (!form.height || Number(form.height) <= 0) return setModalErr("Chiều cao phải lớn hơn 0");
    if (!form.description.trim())       return setModalErr("Vui lòng nhập mô tả tác phẩm");
    if (!form.imageUrl)                 return setModalErr("Vui lòng upload ảnh tác phẩm");
    setSaving(true);
    try {
      const payload = {
        name:          form.name.trim(),
        artistName:    form.artistName.trim(),
        categoryId:    Number(form.categoryId),
        price:         Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock:         Number(form.stock) || 1,
        theme:       form.theme,
        material:    form.material,
        width:       Number(form.width),
        height:      Number(form.height),
        description: form.description.trim(),
        imageUrl:    form.imageUrl,
        status:      form.status,
        sellerId:    user?.id || null,
      };
      if (editing) {
        await productApi.update(editing.id, payload);
        showToast("Cập nhật tác phẩm thành công");
      } else {
        await productApi.create(payload);
        showToast("Thêm tác phẩm mới thành công");
      }
      setShowModal(false);
      loadAllProducts();
    } catch(err) {
      setModalErr("Lưu thất bại: " + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => openConfirm(
    "Xóa tác phẩm",
    `Bạn có chắc muốn xóa "${name}"? Thao tác này không thể hoàn tác.`,
    async () => {
      closeConfirm();
      try {
        const res = await productApi.delete(id);
        const msg = res.data?.message || "Đã xóa tác phẩm thành công";
        showToast(msg);
        loadAllProducts();
      } catch(err) {
        showToast("Xóa thất bại: " + (err.response?.data?.message || err.message), "error");
      }
    }
  );

  const handleApprove = async (id) => {
    try {
      await productApi.approve(id);
      setAllProducts(p => p.map(x => x.id === id ? { ...x, status: 'Available' } : x));
      showToast("Đã duyệt tác phẩm — hiển thị trên cửa hàng");
    } catch { showToast("Duyệt thất bại", "error"); }
  };

  const handleReject = async (id) => {
    try {
      await productApi.reject(id);
      setAllProducts(p => p.map(x => x.id === id ? { ...x, status: 'Rejected' } : x));
      showToast("Đã từ chối tác phẩm", "info");
    } catch { showToast("Thao tác thất bại", "error"); }
  };

  const handleQuickStatus = async (productId, newStatus) => {
    setQuickUpdating(p => ({ ...p, [productId]: true }));
    try {
      await productApi.update(productId, { status: newStatus });
      setAllProducts(p => p.map(x => x.id === productId ? { ...x, status: newStatus } : x));
      showToast("Đã cập nhật trạng thái");
    } catch(err) {
      showToast("Cập nhật thất bại", "error");
    } finally {
      setQuickUpdating(p => ({ ...p, [productId]: false }));
    }
  };

  const clearFilters = () => { setKeyword(""); setCatFilter(""); setStatusFilter(""); setPage(1); };
  const hasFilter = keyword || catFilter || statusFilter;

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .prod-row { border-bottom: 1px solid #f1f5f9; transition: background .12s; }
        .prod-row:hover { background: #f8f7ff !important; }
        .action-btn { transition: all .15s; cursor: pointer; display:inline-flex; align-items:center; justify-content:center; }
        .action-btn:hover { transform: scale(1.1); }
        .status-sel { border:none; outline:none; cursor:pointer; border-radius:20px;
          padding:4px 12px; font-size:.78rem; font-weight:700; appearance:none;
          -webkit-appearance:none; text-align:center; transition:filter .15s; }
        .status-sel:hover { filter: brightness(.92); }
        .kpi-card { background:white; border-radius:14px; padding:20px;
          cursor:pointer; transition:all .2s; border-top:3px solid #f1f5f9;
          box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
        input.form-control::placeholder, textarea.form-control::placeholder { color: #c5cdd8 !important; opacity: 1; }
        .chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px;
          border-radius:20px; font-size:0.78rem; font-weight:600;
          background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
        .chip-close { background:none; border:none; cursor:pointer; color:#94a3b8;
          font-size:0.9rem; line-height:1; padding:0 1px; margin-left:1px; }
        .chip-close:hover { color:#ef4444; }
      `}</style>

      <Toast toasts={toasts} />
      <ConfirmDialog {...confirm} onCancel={closeConfirm} />

      {/* ── Tiêu đề trang ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{
            width:46, height:46, borderRadius:13,
            background:"linear-gradient(135deg,#c8a97a,#c8a97a)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 14px rgba(124,58,237,.35)", flexShrink:0,
          }}>
            <i className="fas fa-paint-brush" style={{ color:"white", fontSize:"1.1rem" }}></i>
          </div>
          <div>
            <h1 style={{ fontSize:"1.35rem", fontWeight:800, color:"#1e293b", margin:0, lineHeight:1.2 }}>
              Quản lý Tác phẩm
            </h1>
            <p style={{ fontSize:"0.82rem", color:"#94a3b8", margin:"4px 0 0" }}>
              {loading ? "Đang tải..." : `${statsData.total} tác phẩm trong hệ thống`}
            </p>
          </div>
        </div>
        <button onClick={openAdd} style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"10px 22px", borderRadius:11, border:"none",
          background:"linear-gradient(135deg,#c8a97a,#c8a97a)",
          color:"white", fontWeight:700, fontSize:"0.9rem", cursor:"pointer",
          boxShadow:"0 4px 18px rgba(124,58,237,.38)", transition:"all .18s",
          whiteSpace:"nowrap",
        }}>
          <i className="fas fa-plus"></i> Thêm tác phẩm
        </button>
      </div>

      {/* ── KPI Cards (4 cards, mỗi card click để lọc) ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:18 }}>
        {[
          { label:"Tổng tác phẩm", value:statsData.total,       icon:"fa-images",       color:"#c8a97a", bg:"#f5edd6", statusKey:"",            subLabel:"tất cả" },
          { label:"Đang bán",      value:statsData.available,   icon:"fa-check-circle", color:"#10b981", bg:"#d1fae5", statusKey:"Available",    subLabel:"sẵn sàng bán" },
          { label:"Chờ duyệt",     value:statsData.pending,     icon:"fa-clock",        color:"#92400e", bg:"#fef3c7", statusKey:"Pending",      subLabel:"từ họa sĩ" },
          { label:"Đã ẩn",         value:statsData.unavailable, icon:"fa-eye-slash",    color:"#6b7280", bg:"#f3f4f6", statusKey:"Unavailable",  subLabel:"tạm ngưng" },
          { label:"Hết hàng",      value:statsData.outOfStock,  icon:"fa-box-open",     color:"#ef4444", bg:"#fee2e2", statusKey:"OutOfStock",   subLabel:"cần nhập thêm" },
        ].map((s, i) => {
          const active = i === 0 ? !statusFilter : statusFilter === s.statusKey;
          return (
            <div
              key={i}
              className="kpi-card"
              onClick={() => {
                if (i === 0) setStatusFilter("");
                else setStatusFilter(f => f === s.statusKey ? "" : s.statusKey);
                setPage(1);
              }}
              style={{
                borderTop: `3px solid ${active ? s.color : "#f1f5f9"}`,
                background: active ? s.bg + "55" : "white",
                boxShadow: active ? `0 6px 24px ${s.color}28` : "0 2px 12px rgba(0,0,0,.06)",
              }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"2.1rem", fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#374151", marginTop:5 }}>{s.label}</div>
                  <div style={{ fontSize:"0.72rem", color: active ? s.color : "#94a3b8", marginTop:3, fontWeight: active ? 700 : 400 }}>
                    {active
                      ? <><i className="fas fa-check-circle mr-1"></i>Đang lọc</>
                      : s.subLabel
                    }
                  </div>
                </div>
                <div style={{
                  width:44, height:44, borderRadius:12, background:s.bg, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:"1.1rem" }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bộ lọc ── */}
      <div style={{
        background:"white", borderRadius:14, padding:"14px 18px",
        boxShadow:"0 2px 12px rgba(0,0,0,.05)", marginBottom:16,
      }}>
        {/* Inputs row */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:"1 1 220px", position:"relative", minWidth:180 }}>
            <i className="fas fa-search" style={{
              position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:"#9ca3af", fontSize:"0.82rem",
            }}></i>
            <input
              className="form-control"
              placeholder="Tìm tên tác phẩm, nghệ sĩ..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              style={{ paddingLeft:34, borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:"0.87rem" }}
            />
          </div>

          <select
            className="form-control"
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            style={{
              flex:"0 0 auto", width:190, borderRadius:9,
              border: catFilter ? "1.5px solid #c8a97a" : "1.5px solid #e5e7eb",
              fontSize:"0.87rem", color: catFilter ? "#c8a97a" : "#9ca3af", fontWeight: catFilter ? 600 : 400,
            }}>
            <option value="">Tất cả thể loại</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="form-control"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              flex:"0 0 auto", width:165, borderRadius:9,
              border: statusFilter ? `1.5px solid ${STATUS_COLOR[statusFilter]}` : "1.5px solid #e5e7eb",
              fontSize:"0.87rem",
              color: statusFilter ? STATUS_COLOR[statusFilter] : "#9ca3af",
              fontWeight: statusFilter ? 700 : 400,
            }}>
            <option value="">Tất cả trạng thái</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_VI[s]}</option>)}
          </select>

          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{
                padding:"7px 14px", borderRadius:9, border:"1.5px solid #fecaca",
                background:"#fef2f2", color:"#ef4444", fontWeight:600, cursor:"pointer",
                fontSize:"0.83rem", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
              }}>
              <i className="fas fa-times-circle"></i> Xóa lọc
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilter && (
          <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
            {keyword.trim() && (
              <span className="chip" style={{ borderColor:"#c4b5fd", background:"#f5edd6", color:"#c8a97a" }}>
                <i className="fas fa-search" style={{ fontSize:"0.65rem" }}></i>
                "{keyword.trim()}"
                <button className="chip-close" onClick={() => { setKeyword(""); setPage(1); }}>×</button>
              </span>
            )}
            {catFilter && (
              <span className="chip" style={{ borderColor:"#bfdbfe", background:"#dbeafe", color:"#2563eb" }}>
                <i className="fas fa-layer-group" style={{ fontSize:"0.65rem" }}></i>
                {categories.find(c => String(c.id) === String(catFilter))?.name || catFilter}
                <button className="chip-close" onClick={() => { setCatFilter(""); setPage(1); }}>×</button>
              </span>
            )}
            {statusFilter && (
              <span className="chip" style={{
                background: STATUS_BG[statusFilter], color: STATUS_COLOR[statusFilter],
                borderColor: STATUS_COLOR[statusFilter] + "50",
              }}>
                <i className="fas fa-circle" style={{ fontSize:"0.5rem" }}></i>
                {STATUS_VI[statusFilter]}
                <button className="chip-close" onClick={() => { setStatusFilter(""); setPage(1); }}>×</button>
              </span>
            )}
            <span style={{ marginLeft:"auto", fontSize:"0.8rem", color:"#94a3b8", fontWeight:600 }}>
              <strong style={{ color:"#475569" }}>{totalCount}</strong> kết quả
            </span>
          </div>
        )}
      </div>

      {/* ── Bảng danh sách ── */}
      <div style={{ background:"white", borderRadius:14, boxShadow:"0 2px 16px rgba(0,0,0,.07)", overflow:"hidden" }}>

        {/* Table header */}
        <div style={{
          padding:"14px 20px", borderBottom:"1px solid #f1f5f9",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <i className="fas fa-table" style={{ color:"#c8a97a", fontSize:"0.85rem" }}></i>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:"0.92rem" }}>Danh sách tác phẩm</span>
            {!loading && (
              <span style={{ background:"#f5edd6", color:"#c8a97a", borderRadius:20, padding:"2px 10px", fontSize:"0.73rem", fontWeight:700 }}>
                {totalCount}
              </span>
            )}
            {hasFilter && (
              <span style={{ background:"#fef9c3", color:"#ca8a04", borderRadius:20, padding:"2px 9px", fontSize:"0.72rem", fontWeight:700 }}>
                đã lọc
              </span>
            )}
          </div>
          <button
            onClick={loadAllProducts}
            title="Làm mới dữ liệu"
            style={{
              width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0",
              background:"white", color:"#64748b", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .15s",
            }}>
            <i className="fas fa-sync-alt" style={{ fontSize:"0.78rem" }}></i>
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"70px 0" }}>
            <div className="spinner-border" style={{ color:"#c8a97a", width:40, height:40 }}></div>
            <p style={{ marginTop:14, color:"#94a3b8", fontSize:"0.88rem" }}>Đang tải dữ liệu...</p>
          </div>

        ) : displayList.length === 0 ? (
          <div style={{ textAlign:"center", padding:"70px 0", animation:"fadeUp .3s ease" }}>
            <div style={{
              width:72, height:72, borderRadius:"50%", background:"#f1f5f9",
              margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <i className="fas fa-search" style={{ fontSize:"1.6rem", color:"#cbd5e1" }}></i>
            </div>
            <div style={{ fontWeight:700, color:"#475569", marginBottom:6, fontSize:"0.95rem" }}>
              {hasFilter ? "Không tìm thấy tác phẩm phù hợp" : "Chưa có tác phẩm nào"}
            </div>
            <div style={{ fontSize:"0.83rem", color:"#94a3b8", marginBottom:18 }}>
              {hasFilter ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" : "Bắt đầu thêm tác phẩm đầu tiên vào hệ thống"}
            </div>
            {hasFilter
              ? <button onClick={clearFilters}
                  style={{ padding:"8px 20px", borderRadius:9, border:"none", background:"#f5edd6", color:"#c8a97a", fontWeight:700, cursor:"pointer" }}>
                  <i className="fas fa-times mr-1"></i> Xóa bộ lọc
                </button>
              : <button onClick={openAdd}
                  style={{ padding:"9px 22px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#c8a97a,#c8a97a)", color:"white", fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(124,58,237,.3)" }}>
                  <i className="fas fa-plus mr-1"></i> Thêm tác phẩm đầu tiên
                </button>
            }
          </div>

        ) : (
          <div className="table-responsive">
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f8fafc", borderBottom:"2px solid #f1f5f9" }}>
                  {["#","Ảnh","Tác phẩm","Nghệ sĩ","Thể loại","Giá bán","Kho","Trạng thái","Thao tác"].map((h, i) => (
                    <th key={i} style={{
                      padding:"11px 14px", fontSize:"0.72rem", fontWeight:700,
                      color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em",
                      textAlign: (i === 0 || i >= 7) ? "center" : "left",
                      whiteSpace:"nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayList.map((p, idx) => (
                  <tr key={p.id} className="prod-row"
                    style={{ background: idx % 2 === 1 ? "#fafbff" : "white" }}>

                    {/* # */}
                    <td style={{ padding:"12px 14px", color:"#cbd5e1", fontSize:"0.78rem", fontWeight:700, textAlign:"center" }}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    {/* Ảnh */}
                    <td style={{ padding:"10px 14px" }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name}
                            style={{ width:52, height:52, objectFit:"cover", borderRadius:10, boxShadow:"0 2px 8px rgba(0,0,0,.12)", display:"block" }} />
                        : <div style={{ width:52, height:52, background:"#f1f5f9", borderRadius:10,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <i className="fas fa-image" style={{ color:"#cbd5e1", fontSize:"1.2rem" }}></i>
                          </div>
                      }
                    </td>

                    {/* Tác phẩm */}
                    <td style={{ padding:"12px 14px", maxWidth:190 }}>
                      <div style={{ fontWeight:700, color:"#1e293b", fontSize:"0.88rem",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>
                        {p.name}
                      </div>
                      <div style={{ display:"flex", gap:5, marginTop:4, flexWrap:"wrap" }}>
                        {p.material && (
                          <span style={{ fontSize:"0.71rem", color:"#94a3b8", background:"#f8fafc",
                            padding:"1px 6px", borderRadius:4, border:"1px solid #f1f5f9" }}>{p.material}</span>
                        )}
                        {(p.width && p.height) && (
                          <span style={{ fontSize:"0.71rem", color:"#94a3b8" }}>{p.width}×{p.height}cm</span>
                        )}
                      </div>
                    </td>

                    {/* Nghệ sĩ */}
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{
                          width:30, height:30, borderRadius:"50%", flexShrink:0,
                          background:"linear-gradient(135deg,#c8a97a,#8b6c4a)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          <span style={{ color:"white", fontSize:"0.65rem", fontWeight:800 }}>
                            {(p.artistName || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize:"0.85rem", color:"#475569", fontWeight:500, whiteSpace:"nowrap" }}>
                          {p.artistName || <span style={{ color:"#e2e8f0" }}>—</span>}
                        </span>
                      </div>
                    </td>

                    {/* Thể loại */}
                    <td style={{ padding:"12px 14px" }}>
                      {p.categoryName
                        ? <span style={{ background:"#f1f5f9", borderRadius:8, padding:"4px 10px",
                            fontSize:"0.8rem", fontWeight:600, color:"#475569", whiteSpace:"nowrap" }}>
                            {p.categoryName}
                          </span>
                        : <span style={{ color:"#e2e8f0" }}>—</span>
                      }
                    </td>

                    {/* Giá */}
                    <td style={{ padding:"12px 14px", whiteSpace:"nowrap" }}>
                      <span style={{ fontWeight:800, color:"#dc2626", fontSize:"0.9rem" }}>{fmt(p.price)}</span>
                    </td>

                    {/* Kho */}
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      <span style={{
                        display:"inline-block", padding:"3px 10px", borderRadius:20,
                        fontSize:"0.78rem", fontWeight:700, minWidth:38, textAlign:"center",
                        background: p.stock > 5 ? "#d1fae5" : p.stock > 0 ? "#fef3c7" : "#fee2e2",
                        color:      p.stock > 5 ? "#10b981" : p.stock > 0 ? "#d97706" : "#ef4444",
                      }}>
                        {p.stock}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      {quickUpdating[p.id] ? (
                        <div className="spinner-border spinner-border-sm" style={{ color:"#c8a97a", width:18, height:18 }}></div>
                      ) : (
                        <select
                          className="status-sel"
                          value={p.status}
                          onChange={e => handleQuickStatus(p.id, e.target.value)}
                          style={{
                            background: STATUS_BG[p.status]    || "#f3f4f6",
                            color:      STATUS_COLOR[p.status] || "#6b7280",
                          }}>
                          {STATUSES.map(s => <option key={s} value={s}>{STATUS_VI[s]}</option>)}
                        </select>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding:"12px 14px", textAlign:"center", whiteSpace:"nowrap" }}>
                      <button
                        className="action-btn"
                        onClick={() => openEdit(p)}
                        title="Chỉnh sửa"
                        style={{
                          width:32, height:32, borderRadius:8,
                          border:"1.5px solid #e0e7ff", background:"#fdf6e3", color:"#c8a97a",
                          marginRight:6,
                        }}>
                        <i className="fas fa-pencil-alt" style={{ fontSize:"0.73rem" }}></i>
                      </button>
                      {p.status === "Pending" && (
                        <>
                          <button className="action-btn" onClick={() => handleApprove(p.id)} title="Duyệt — hiện trên cửa hàng"
                            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #a7f3d0", background:"#d1fae5", color:"#065f46", marginRight:6 }}>
                            <i className="fas fa-check" style={{ fontSize:"0.73rem" }}></i>
                          </button>
                          <button className="action-btn" onClick={() => handleReject(p.id)} title="Từ chối"
                            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #fca5a5", background:"#fee2e2", color:"#991b1b", marginRight:6 }}>
                            <i className="fas fa-times" style={{ fontSize:"0.73rem" }}></i>
                          </button>
                        </>
                      )}
                      <button
                        className="action-btn"
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Xóa"
                        style={{
                          width:32, height:32, borderRadius:8,
                          border:"1.5px solid #fecaca", background:"#fef2f2", color:"#ef4444",
                        }}>
                        <i className="fas fa-trash" style={{ fontSize:"0.73rem" }}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            padding:"12px 20px", borderTop:"1px solid #f1f5f9",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            background:"#fafbff",
          }}>
            <span style={{ fontSize:"0.82rem", color:"#64748b" }}>
              Hiển thị{" "}
              <strong style={{ color:"#1e293b" }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}</strong>
              {" "}trong{" "}
              <strong style={{ color:"#1e293b" }}>{totalCount}</strong> tác phẩm
            </span>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0",
                  background: page===1 ? "#f8fafc" : "white", color: page===1 ? "#e2e8f0" : "#475569",
                  cursor: page===1 ? "not-allowed" : "pointer", fontWeight:700 }}>‹</button>
              {pageNums(page, totalPages).map((n, i) =>
                n === "…"
                  ? <span key={`e${i}`} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8" }}>…</span>
                  : <button key={n} onClick={() => setPage(n)} style={{
                      width:32, height:32, borderRadius:8,
                      border: page===n ? "none" : "1.5px solid #e2e8f0",
                      background: page===n ? "#c8a97a" : "white",
                      color: page===n ? "white" : "#475569",
                      fontWeight: page===n ? 800 : 500, cursor:"pointer",
                      boxShadow: page===n ? "0 2px 8px rgba(124,58,237,.3)" : "none",
                    }}>{n}</button>
              )}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0",
                  background: page===totalPages ? "#f8fafc" : "white",
                  color: page===totalPages ? "#e2e8f0" : "#475569",
                  cursor: page===totalPages ? "not-allowed" : "pointer", fontWeight:700 }}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ════ MODAL THÊM / SỬA ════ */}
      {showModal && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(15,15,35,0.6)", zIndex:1050,
          display:"flex", alignItems:"flex-start", justifyContent:"center",
          padding:"20px 0", overflowY:"auto",
        }}>
          <div style={{
            background:"white", borderRadius:18, width:"100%", maxWidth:860,
            margin:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.25)", overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{
              background:"linear-gradient(135deg,#c8a97a,#c8a97a)",
              padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <div>
                <h5 style={{ color:"white", fontWeight:800, margin:0, fontSize:"1.05rem" }}>
                  <i className={`fas fa-${editing?"pencil-alt":"paint-brush"} mr-2`}></i>
                  {editing ? "Chỉnh sửa tác phẩm" : "Thêm tác phẩm mới"}
                </h5>
                <p style={{ color:"rgba(255,255,255,.7)", margin:"3px 0 0", fontSize:"0.8rem" }}>
                  {editing ? `Đang sửa: ${editing.name}` : "Điền đầy đủ thông tin để đăng bán"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background:"rgba(255,255,255,.15)", border:"none", color:"white",
                width:32, height:32, borderRadius:8, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem",
              }}>✕</button>
            </div>

            {/* Error */}
            {modalErr && (
              <div style={{
                background:"#fef2f2", borderLeft:"4px solid #ef4444",
                padding:"10px 20px", fontSize:"0.87rem", color:"#dc2626",
                display:"flex", alignItems:"center", gap:8,
              }}>
                <i className="fas fa-exclamation-circle"></i> {modalErr}
              </div>
            )}

            {/* Body */}
            <div style={{ padding:"24px 28px", display:"flex", gap:22 }}>

              {/* CỘT TRÁI */}
              <div style={{ width:230, flexShrink:0, display:"flex", flexDirection:"column", gap:16 }}>

                {/* Ảnh */}
                <div style={{ background:"#fafbff", borderRadius:12, overflow:"hidden", border:"1.5px solid #e2e8f0" }}>
                  <div style={{ padding:"10px 14px 6px", borderBottom:"1px solid #f1f5f9" }}>
                    <span style={{ fontWeight:700, fontSize:"0.8rem", color:"#374151" }}>
                      <i className="fas fa-camera mr-1" style={{ color:"#c8a97a" }}></i>
                      Ảnh tác phẩm <span style={{ color:"#ef4444" }}>*</span>
                    </span>
                  </div>
                  <div style={{ padding:12 }}>
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{
                        aspectRatio:"4/3", background: form.imageUrl ? "transparent" : "#f1f5f9",
                        borderRadius:10, overflow:"hidden", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        marginBottom:10, border: form.imageUrl ? "none" : "2px dashed #cbd5e1",
                      }}>
                      {form.imageUrl
                        ? <img src={form.imageUrl} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ textAlign:"center", color:"#94a3b8" }}>
                            <i className="fas fa-cloud-upload-alt" style={{ fontSize:"1.8rem", display:"block", marginBottom:6 }}></i>
                            <span style={{ fontSize:"0.78rem" }}>Click để chọn ảnh</span>
                          </div>
                      }
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" className="d-none" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{
                        width:"100%", padding:"7px 0", borderRadius:8,
                        border:"1.5px solid #c8a97a", background: uploading ? "#f3f4f6" : "white",
                        color:"#c8a97a", fontWeight:600, cursor: uploading ? "not-allowed" : "pointer",
                        fontSize:"0.82rem", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                      {uploading
                        ? <><span className="spinner-border spinner-border-sm"></span> Đang upload...</>
                        : <><i className="fas fa-upload"></i> {form.imageUrl ? "Đổi ảnh" : "Chọn ảnh"}</>
                      }
                    </button>
                  </div>
                </div>

                {/* Cài đặt */}
                <div style={{ background:"#fafbff", borderRadius:12, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ padding:"10px 14px 6px", borderBottom:"1px solid #f1f5f9" }}>
                    <span style={{ fontWeight:700, fontSize:"0.8rem", color:"#374151" }}>
                      <i className="fas fa-cog mr-1" style={{ color:"#c8a97a" }}></i>Cài đặt
                    </span>
                  </div>
                  <div style={{ padding:14 }}>
                    <F label="Trạng thái bán">
                      <select className="form-control" value={form.status} onChange={handleChange("status")}
                        style={{ borderRadius:8, fontSize:"0.85rem", border:"1.5px solid #e5e7eb" }}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_VI[s]}</option>)}
                      </select>
                    </F>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>

                {/* Thông tin cơ bản */}
                <div style={{ background:"#fafbff", borderRadius:12, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ padding:"10px 14px 6px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #c8a97a", borderRadius:"11px 11px 0 0" }}>
                    <span style={{ fontWeight:700, fontSize:"0.8rem", color:"#374151" }}>
                      <i className="fas fa-info-circle mr-1" style={{ color:"#c8a97a" }}></i>Thông tin cơ bản
                    </span>
                  </div>
                  <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:12 }}>
                    <F label="Tên tác phẩm" required>
                      <input className="form-control" placeholder="VD: Hoàng hôn trên sông Hương"
                        value={form.name} onChange={handleChange("name")}
                        style={{ borderRadius:8, fontSize:"0.88rem", border:"1.5px solid #e5e7eb" }} />
                    </F>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <F label="Nghệ sĩ / Tác giả" required>
                        <input className="form-control" placeholder="Nguyễn Văn An"
                          value={form.artistName} onChange={handleChange("artistName")}
                          style={{ borderRadius:8, fontSize:"0.88rem", border:"1.5px solid #e5e7eb" }} />
                      </F>
                      <F label="Thể loại tranh" required>
                        <select className="form-control" value={form.categoryId} onChange={handleChange("categoryId")}
                          style={{ borderRadius:8, fontSize:"0.88rem", border:"1.5px solid #e5e7eb" }}>
                          <option value="">-- Chọn thể loại --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </F>
                    </div>
                  </div>
                </div>

                {/* Chi tiết kỹ thuật */}
                <div style={{ background:"#fafbff", borderRadius:12, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ padding:"10px 14px 6px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #a855f7", borderRadius:"11px 11px 0 0" }}>
                    <span style={{ fontWeight:700, fontSize:"0.8rem", color:"#374151" }}>
                      <i className="fas fa-palette mr-1" style={{ color:"#a855f7" }}></i>Thông tin tác phẩm
                    </span>
                  </div>
                  <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <F label="Chất liệu" required>
                        <select className="form-control" value={form.material} onChange={handleChange("material")}
                          style={{ borderRadius:8, fontSize:"0.88rem", border: form.material ? "1.5px solid #a855f7" : "1.5px solid #e5e7eb" }}>
                          <option value="">-- Chọn chất liệu --</option>
                          {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </F>
                      <F label="Chủ đề / Phong cách" required>
                        <select className="form-control" value={form.theme} onChange={handleChange("theme")}
                          style={{ borderRadius:8, fontSize:"0.88rem", border: form.theme ? "1.5px solid #a855f7" : "1.5px solid #e5e7eb" }}>
                          <option value="">-- Chọn chủ đề --</option>
                          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </F>
                    </div>
                    <div>
                      <label style={{ fontWeight:600, fontSize:"0.82rem", color:"#374151", display:"block", marginBottom:5 }}>
                        Kích thước (cm) <span style={{ color:"#ef4444" }}>*</span>
                      </label>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"flex-start" }}>
                        <div>
                          <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                            <button type="button" onClick={() => adjustDim("width", -5)} title="-5cm"
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:"1.5px solid #e5e7eb", background:"#f8fafc", cursor:"pointer", fontWeight:700, fontSize:"0.78rem", color:"#6b7280" }}>−</button>
                            <input className="form-control" type="number" min={1} max={9999}
                              placeholder="Rộng"
                              value={form.width} onChange={handleChange("width")}
                              style={{ borderRadius:7, fontSize:"0.88rem", border: form.width ? "1.5px solid #a855f7" : "1.5px solid #e5e7eb", textAlign:"center", padding:"6px 4px" }} />
                            <button type="button" onClick={() => adjustDim("width", 5)} title="+5cm"
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:"1.5px solid #e5e7eb", background:"#f8fafc", cursor:"pointer", fontWeight:700, fontSize:"0.78rem", color:"#6b7280" }}>+</button>
                          </div>
                          <div style={{ fontSize:"0.7rem", color:"#94a3b8", textAlign:"center", marginTop:3 }}>Chiều rộng</div>
                        </div>
                        <span style={{ fontWeight:700, color:"#94a3b8", fontSize:"1rem", paddingTop:8 }}>×</span>
                        <div>
                          <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                            <button type="button" onClick={() => adjustDim("height", -5)} title="-5cm"
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:"1.5px solid #e5e7eb", background:"#f8fafc", cursor:"pointer", fontWeight:700, fontSize:"0.78rem", color:"#6b7280" }}>−</button>
                            <input className="form-control" type="number" min={1} max={9999}
                              placeholder="Cao"
                              value={form.height} onChange={handleChange("height")}
                              style={{ borderRadius:7, fontSize:"0.88rem", border: form.height ? "1.5px solid #a855f7" : "1.5px solid #e5e7eb", textAlign:"center", padding:"6px 4px" }} />
                            <button type="button" onClick={() => adjustDim("height", 5)} title="+5cm"
                              style={{ flexShrink:0, width:28, height:34, borderRadius:7, border:"1.5px solid #e5e7eb", background:"#f8fafc", cursor:"pointer", fontWeight:700, fontSize:"0.78rem", color:"#6b7280" }}>+</button>
                          </div>
                          <div style={{ fontSize:"0.7rem", color:"#94a3b8", textAlign:"center", marginTop:3 }}>Chiều cao</div>
                        </div>
                      </div>
                      {(form.width && form.height) && (
                        <div style={{ marginTop:6, fontSize:"0.82rem", color:"#c8a97a", fontWeight:600 }}>
                          → {form.width} × {form.height} cm
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Giá & Kho */}
                <div style={{ background:"#fafbff", borderRadius:12, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ padding:"10px 14px 6px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #10b981", borderRadius:"11px 11px 0 0" }}>
                    <span style={{ fontWeight:700, fontSize:"0.8rem", color:"#374151" }}>
                      <i className="fas fa-money-bill-wave mr-1" style={{ color:"#10b981" }}></i>Giá &amp; Kho hàng
                    </span>
                  </div>
                  <div style={{ padding:"14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <F label="Giá bán (₫)" required>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <button type="button" onClick={() => adjustPrice(-100000)}
                            title="-100.000₫"
                            style={{ flexShrink:0, width:36, height:38, borderRadius:8, border:"1.5px solid #fecaca", background:"#fef2f2", cursor:"pointer", fontWeight:800, fontSize:"0.82rem", color:"#dc2626" }}>−</button>
                          <input className="form-control"
                            type="text" inputMode="numeric"
                            placeholder="1.000.000"
                            value={form.price === '' ? '' : Number(form.price).toLocaleString('vi-VN')}
                            onChange={handlePriceChange}
                            style={{ borderRadius:8, fontSize:"0.95rem", fontWeight:700, color:"#dc2626", border:"1.5px solid #e5e7eb", textAlign:"right" }} />
                          <button type="button" onClick={() => adjustPrice(100000)}
                            title="+100.000₫"
                            style={{ flexShrink:0, width:36, height:38, borderRadius:8, border:"1.5px solid #bbf7d0", background:"#f0fdf4", cursor:"pointer", fontWeight:800, fontSize:"0.82rem", color:"#16a34a" }}>+</button>
                        </div>
                        {Number(form.price) > 0 && (
                          <div style={{ marginTop:4, fontSize:"0.8rem", fontWeight:700, color:"#dc2626" }}>= {fmt(form.price)}</div>
                        )}
                      </F>
                      <F label="Số lượng trong kho">
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, stock: Math.max(0, Number(f.stock) - 1) }))}
                            style={{ width:34, height:38, borderRadius:8, border:"1.5px solid #e5e7eb", background:"white", cursor:"pointer", fontWeight:800, fontSize:"1rem", color:"#374151" }}>−</button>
                          <input className="form-control text-center" type="number" min={0}
                            value={form.stock} onChange={handleChange("stock")}
                            style={{ borderRadius:8, fontWeight:800, fontSize:"1rem", border:"1.5px solid #e5e7eb", textAlign:"center" }} />
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, stock: Number(f.stock) + 1 }))}
                            style={{ width:34, height:38, borderRadius:8, border:"1.5px solid #e5e7eb", background:"white", cursor:"pointer", fontWeight:800, fontSize:"1rem", color:"#374151" }}>+</button>
                        </div>
                      </F>
                    </div>
                    <div style={{ marginTop:12 }}>
                      <F label="Giá khuyến mãi (₫) — tuỳ chọn">
                        <input className="form-control"
                          type="text" inputMode="numeric"
                          placeholder="Để trống nếu không giảm giá"
                          value={form.discountPrice === '' ? '' : (form.discountPrice ? Number(form.discountPrice).toLocaleString('vi-VN') : '')}
                          onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ''); setForm(f => ({ ...f, discountPrice: raw })); }}
                          style={{ borderRadius:8, fontSize:"0.9rem", fontWeight:700, color:"#ea580c", border:"1.5px solid #e5e7eb", textAlign:"right" }} />
                        {form.discountPrice > 0 && form.price > 0 && (
                          <div style={{ marginTop:4, fontSize:"0.8rem", fontWeight:600, color:"#ea580c" }}>
                            Giảm {Math.round((1 - Number(form.discountPrice) / Number(form.price)) * 100)}% — {fmt(form.discountPrice)}
                          </div>
                        )}
                      </F>
                    </div>
                  </div>
                </div>

                {/* Mô tả */}
                <div style={{ background:"#fafbff", borderRadius:12, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ padding:"10px 14px 6px", borderBottom:"1px solid #f1f5f9", borderLeft:"3px solid #3b82f6", borderRadius:"11px 11px 0 0" }}>
                    <span style={{ fontWeight:700, fontSize:"0.8rem", color:"#374151" }}>
                      <i className="fas fa-align-left mr-1" style={{ color:"#3b82f6" }}></i>Mô tả tác phẩm
                    </span>
                  </div>
                  <div style={{ padding:"14px" }}>
                    <textarea className="form-control" rows={4}
                      placeholder="Câu chuyện, ý nghĩa, nguồn cảm hứng về tác phẩm... *"
                      value={form.description} onChange={handleChange("description")}
                      style={{ borderRadius:8, resize:"vertical", fontSize:"0.88rem",
                        border: form.description ? "1.5px solid #3b82f6" : "1.5px solid #e5e7eb" }} />
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                      <span style={{ fontSize:"0.75rem", color: form.description.length === 0 ? "#ef4444" : "#94a3b8" }}>
                        {form.description.length === 0 ? "Bắt buộc" : ""}
                      </span>
                      <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>{form.description.length}/1000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding:"16px 28px", borderTop:"1px solid #f1f5f9",
              display:"flex", justifyContent:"flex-end", gap:10, background:"#fafbff",
            }}>
              <button onClick={() => setShowModal(false)} style={{
                padding:"10px 24px", borderRadius:9, border:"1.5px solid #e5e7eb",
                background:"white", color:"#374151", fontWeight:600, cursor:"pointer", fontSize:"0.9rem",
              }}>Hủy bỏ</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding:"10px 28px", borderRadius:9, border:"none",
                background: saving ? "#e5e7eb" : "linear-gradient(135deg,#c8a97a,#c8a97a)",
                color: saving ? "#9ca3af" : "white", fontWeight:700,
                cursor: saving ? "not-allowed" : "pointer", fontSize:"0.9rem",
                display:"flex", alignItems:"center", gap:8,
                boxShadow: saving ? "none" : "0 4px 14px rgba(124,58,237,.35)",
              }}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm"></span> Đang lưu...</>
                  : <><i className={`fas fa-${editing?"save":"plus"}`}></i> {editing ? "Cập nhật" : "Thêm tác phẩm"}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
