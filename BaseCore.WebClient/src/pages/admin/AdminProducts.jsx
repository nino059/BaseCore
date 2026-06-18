import React, { useState, useEffect, useCallback, useMemo } from "react";
import { productApi, categoryApi } from "../../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ["Pending","ForSale","Ordered","Sold","Rejected"];
import { getProductStatus } from "../../utils/orderStatus";

import { formatVNDCompact as fmt } from "../../utils/format";
import { useToast } from "../../hooks/useToast";
import Toaster from "../../components/ui/Toaster";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

// ─── UI Components ────────────────────────────────────────────────────────────
const NoteModal = ({ open, title, placeholder, onConfirm, onCancel, color = "#ef4444", btnLabel = "Xác nhận" }) => {
  const [note, setNote] = useState("");
  const [err,  setErr]  = useState("");
  if (!open) return null;
  const submit = () => {
    if (!note.trim()) { setErr("Vui lòng nhập lý do"); return; }
    onConfirm(note.trim());
    setNote(""); setErr("");
  };
  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:2100 }} />
      <div style={{
        position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        background:"white", borderRadius:16, padding:"28px 32px", zIndex:2101,
        minWidth:380, maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <h5 style={{ fontWeight:800, marginBottom:6, color:"#1f2937" }}>{title}</h5>
        <p style={{ color:"#6b7280", marginBottom:14, fontSize:"0.85rem" }}>
          Thông báo này sẽ được gửi đến họa sĩ.
        </p>
        <textarea
          rows={4}
          value={note}
          onChange={e => { setNote(e.target.value); setErr(""); }}
          placeholder={placeholder}
          autoFocus
          style={{
            width:"100%", borderRadius:9, border:`1.5px solid ${err ? "#ef4444" : "#e5e7eb"}`,
            padding:"10px 12px", fontSize:"0.88rem", resize:"vertical", boxSizing:"border-box",
          }}
        />
        {err && <p style={{ color:"#ef4444", fontSize:"0.8rem", margin:"4px 0 0" }}>{err}</p>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
          <button onClick={() => { setNote(""); setErr(""); onCancel(); }}
            style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #e5e7eb", background:"white", color:"#374151", fontWeight:600, cursor:"pointer" }}>
            Hủy
          </button>
          <button onClick={submit}
            style={{ padding:"9px 22px", borderRadius:9, border:"none", background:color, color:"white", fontWeight:700, cursor:"pointer" }}>
            {btnLabel}
          </button>
        </div>
      </div>
    </>
  );
};

const pageNums = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4)  return [1,2,3,4,5,6,7,"…",total];
  if (page >= total-3) return [1,"…",...Array.from({length:7},(_,i)=>total-6+i)];
  return [1,"…",page-1,page,page+1,"…",total];
};

// ─── Product Review Modal ─────────────────────────────────────────────────────
const ProductReviewModal = ({ product, onApprove, onReject, onClose, fmt }) => {
  if (!product) return null;
  const isPending = product.status === 'Pending';
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:18, maxWidth:820, width:'100%', maxHeight:'92vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'white', zIndex:10, borderRadius:'18px 18px 0 0' }}>
          <div>
            <p style={{ margin:0, fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.14em', color:'var(--brand)', textTransform:'uppercase' }}>Xét duyệt tác phẩm</p>
            <h2 style={{ margin:0, fontWeight:700, fontSize:'1.1rem', color:'#1e293b' }}>{product.name}</h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.5rem', color:'#94a3b8', lineHeight:1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          {/* Ảnh */}
          <div style={{ gridColumn:'1 / 2' }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name}
                style={{ width:'100%', borderRadius:12, objectFit:'contain', maxHeight:420, background:'#f8f5f0' }} />
            ) : (
              <div style={{ width:'100%', aspectRatio:'3/4', background:'#f1f5f9', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fas fa-image" style={{ fontSize:'3rem', color:'#cbd5e1' }} />
              </div>
            )}
          </div>

          {/* Thông tin */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Họa sĩ */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#f8fafc', borderRadius:10 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--brand),var(--brand-dark))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'white', fontWeight:800, fontSize:'0.82rem' }}>{(product.artistName||'?')[0].toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Họa sĩ</div>
                <div style={{ fontWeight:700, color:'#1e293b', fontSize:'0.92rem' }}>{product.artistName || '—'}</div>
              </div>
            </div>

            {/* Trạng thái + thể loại */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Trạng thái</div>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color: getProductStatus(product.status).color, background: getProductStatus(product.status).bg, padding:'3px 10px', borderRadius:20 }}>
                  {getProductStatus(product.status).label}
                </span>
              </div>
              <div style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Thể loại</div>
                <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.88rem' }}>{product.categoryName || '—'}</div>
              </div>
            </div>

            {/* Giá */}
            <div style={{ padding:'12px 14px', background:'#fff7ed', borderRadius:10, border:'1px solid #fed7aa' }}>
              <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Giá bán</div>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#dc2626' }}>{fmt(product.price)}</div>
              {product.discountPrice && (
                <div style={{ fontSize:'0.8rem', color:'#9ca3af', textDecoration:'line-through' }}>{fmt(product.discountPrice)}</div>
              )}
            </div>

            {/* Chất liệu / chủ đề / kích thước */}
            {(product.material || product.theme || product.width || product.height) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {product.material && (
                  <div style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Chất liệu</div>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.86rem' }}>{product.material}</div>
                  </div>
                )}
                {product.theme && (
                  <div style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:10 }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Chủ đề</div>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.86rem' }}>{product.theme}</div>
                  </div>
                )}
                {(product.width || product.height) && (
                  <div style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:10, gridColumn: (!product.material && !product.theme) ? '1/-1' : 'auto' }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Kích thước</div>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.86rem' }}>
                      {product.width && product.height ? `${product.width} × ${product.height} cm` : product.width ? `${product.width} cm` : `${product.height} cm`}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ghi chú admin cũ (nếu đã từ chối trước) */}
            {product.adminNote && (
              <div style={{ padding:'10px 14px', background:'#fee2e2', borderRadius:10, border:'1px solid #fca5a5' }}>
                <div style={{ fontSize:'0.68rem', color:'#991b1b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Ghi chú từ chối trước đó</div>
                <div style={{ fontSize:'0.85rem', color:'#991b1b' }}>{product.adminNote}</div>
              </div>
            )}
          </div>

          {/* Mô tả — full width */}
          {product.description && (
            <div style={{ gridColumn:'1 / -1', padding:'14px 18px', background:'#f8fafc', borderRadius:10 }}>
              <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Mô tả tác phẩm</div>
              <p style={{ margin:0, color:'#374151', lineHeight:1.8, fontSize:'0.9rem', whiteSpace:'pre-wrap' }}>{product.description}</p>
            </div>
          )}
        </div>

        {/* Footer — nút duyệt / từ chối */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10, justifyContent:'flex-end', background:'#fafbff', borderRadius:'0 0 18px 18px', position:'sticky', bottom:0 }}>
          <button onClick={onClose}
            style={{ padding:'9px 22px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'white', color:'#374151', fontWeight:600, cursor:'pointer' }}>
            Đóng
          </button>
          {isPending && (
            <>
              <button onClick={onReject}
                style={{ padding:'9px 22px', borderRadius:9, border:'none', background:'#fee2e2', color:'#991b1b', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-times" style={{ fontSize:'0.78rem' }} /> Từ chối
              </button>
              <button onClick={onApprove}
                style={{ padding:'9px 22px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#10b981,#065f46)', color:'white', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <i className="fas fa-check" style={{ fontSize:'0.78rem' }} /> Duyệt tranh
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminProducts() {
  const [allProducts,  setAllProducts]  = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  const [keyword,      setKeyword]      = useState("");
  const [catFilter,    setCatFilter]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  const { toasts, showToast } = useToast();
  const [confirm, setConfirm] = useState({ open:false, title:"", message:"", onConfirm:null });
  const [noteModal, setNoteModal] = useState({ open:false, title:"", placeholder:"", color:"#ef4444", btnLabel:"", onConfirm:null });
  const [reviewProduct, setReviewProduct] = useState(null);

  const openConfirm  = (title, message, cb) => setConfirm({ open:true, title, message, onConfirm:cb });
  const closeConfirm = () => setConfirm(p => ({ ...p, open:false }));

  const openNoteModal = (title, placeholder, color, btnLabel, cb) =>
    setNoteModal({ open:true, title, placeholder, color, btnLabel, onConfirm:cb });
  const closeNoteModal = () => setNoteModal(p => ({ ...p, open:false }));

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
    total:    allProducts.length,
    forSale:  allProducts.filter(p => p.status === "ForSale").length,
    pending:  allProducts.filter(p => p.status === "Pending").length,
    ordered:  allProducts.filter(p => p.status === "Ordered").length,
    sold:     allProducts.filter(p => p.status === "Sold").length,
  }), [allProducts]);

  const handleDelete = (id, name) => openConfirm(
    "Xóa tác phẩm",
    `Bạn có chắc muốn xóa "${name}"? Thao tác này không thể hoàn tác.`,
    async () => {
      closeConfirm();
      try {
        const res = await productApi.delete(id);
        showToast(res.data?.message || "Đã xóa tác phẩm thành công");
        loadAllProducts();
      } catch(err) {
        showToast("Xóa thất bại: " + (err.response?.data?.message || err.message), "error");
      }
    }
  );

  const handleApprove = async (id) => {
    try {
      await productApi.approve(id);
      setAllProducts(p => p.map(x => x.id === id ? { ...x, status: "ForSale", adminNote: null } : x));
      showToast("Đã duyệt — tranh hiển thị trên cửa hàng");
    } catch(err) {
      showToast(err.response?.data?.message || "Duyệt thất bại", "error");
    }
  };

  const handleReject = (id) => {
    openNoteModal(
      "Từ chối tác phẩm",
      "Nhập lý do từ chối để thông báo cho họa sĩ...",
      "#ef4444", "Từ chối",
      async (note) => {
        closeNoteModal();
        try {
          await productApi.reject(id, note);
          setAllProducts(p => p.map(x => x.id === id ? { ...x, status: "Rejected", adminNote: note } : x));
          showToast("Đã từ chối tác phẩm", "info");
        } catch(err) {
          showToast(err.response?.data?.message || "Thao tác thất bại", "error");
        }
      }
    );
  };

  const clearFilters = () => { setKeyword(""); setCatFilter(""); setStatusFilter(""); setPage(1); };
  const hasFilter = keyword || catFilter || statusFilter;

  const openReview = (p) => setReviewProduct(p);
  const closeReview = () => setReviewProduct(null);

  const handleApproveFromReview = () => {
    const id = reviewProduct.id;
    closeReview();
    handleApprove(id);
  };

  const handleRejectFromReview = () => {
    const id = reviewProduct.id;
    closeReview();
    handleReject(id);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .prod-row { border-bottom:1px solid #f1f5f9; transition:background .12s; }
        .prod-row:hover { background:#f8f7ff !important; }
        .action-btn { transition:all .15s; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .action-btn:hover { transform:scale(1.1); }
        .kpi-card { background:white; border-radius:14px; padding:20px; cursor:pointer;
          transition:all .2s; border-top:3px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
      `}</style>

      <Toaster toasts={toasts} />
      <ConfirmDialog {...confirm} confirmLabel="Xác nhận xóa" danger onCancel={closeConfirm} />
      <NoteModal
        open={noteModal.open}
        title={noteModal.title}
        placeholder={noteModal.placeholder}
        color={noteModal.color}
        btnLabel={noteModal.btnLabel}
        onConfirm={noteModal.onConfirm}
        onCancel={closeNoteModal}
      />
      <ProductReviewModal
        product={reviewProduct}
        fmt={fmt}
        onApprove={handleApproveFromReview}
        onReject={handleRejectFromReview}
        onClose={closeReview}
      />

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Tổng",        value:statsData.total,   icon:"fa-images",       color:"var(--brand)", bg:"#fdf6e3", key:"" },
          { label:"Đang bán",    value:statsData.forSale, icon:"fa-check-circle", color:"#10b981", bg:"#d1fae5", key:"ForSale" },
          { label:"Chờ duyệt",   value:statsData.pending, icon:"fa-clock",        color:"#92400e", bg:"#fef3c7", key:"Pending" },
          { label:"Đã đặt",      value:statsData.ordered, icon:"fa-shopping-cart",color:"#1e40af", bg:"#dbeafe", key:"Ordered" },
          { label:"Đã bán",      value:statsData.sold,    icon:"fa-box",          color:"#6b7280", bg:"#f3f4f6", key:"Sold" },
        ].map((s, i) => {
          const active = i === 0 ? !statusFilter : statusFilter === s.key;
          return (
            <div key={i} className="kpi-card"
              onClick={() => { setStatusFilter(i === 0 ? "" : f => f === s.key ? "" : s.key); setPage(1); }}
              style={{ borderTop:`3px solid ${active ? s.color : "#f1f5f9"}`, background: active ? s.bg+"55" : "white" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"1.8rem", fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#374151", marginTop:4 }}>{s.label}</div>
                </div>
                <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:"0.9rem" }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bộ lọc */}
      <div style={{ background:"white", borderRadius:14, padding:"14px 18px", boxShadow:"0 2px 12px rgba(0,0,0,.05)", marginBottom:16 }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:"1 1 220px", position:"relative", minWidth:180 }}>
            <i className="fas fa-search" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:"0.82rem" }}></i>
            <input className="form-control" placeholder="Tìm tên tác phẩm, nghệ sĩ..." value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              style={{ paddingLeft:34, borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:"0.87rem" }} />
          </div>
          <select className="form-control" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            style={{ flex:"0 0 auto", width:190, borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:"0.87rem" }}>
            <option value="">Tất cả thể loại</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ flex:"0 0 auto", width:165, borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:"0.87rem" }}>
            <option value="">Tất cả trạng thái</option>
            {STATUSES.map(s => <option key={s} value={s}>{getProductStatus(s).label}</option>)}
          </select>
          {hasFilter && (
            <button onClick={clearFilters} style={{ padding:"7px 14px", borderRadius:9, border:"1.5px solid #fecaca",
              background:"#fef2f2", color:"#ef4444", fontWeight:600, cursor:"pointer", fontSize:"0.83rem" }}>
              <i className="fas fa-times-circle mr-1"></i> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng */}
      <div style={{ background:"white", borderRadius:14, boxShadow:"0 2px 16px rgba(0,0,0,.07)", overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <i className="fas fa-table" style={{ color:"var(--brand)", fontSize:"0.85rem" }}></i>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:"0.92rem" }}>Danh sách tác phẩm</span>
            {!loading && (
              <span style={{ background:"#f5edd6", color:"var(--brand)", borderRadius:20, padding:"2px 10px", fontSize:"0.73rem", fontWeight:700 }}>
                {totalCount}
              </span>
            )}
          </div>
          <button onClick={loadAllProducts} title="Làm mới"
            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#64748b", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <i className="fas fa-sync-alt" style={{ fontSize:"0.78rem" }}></i>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"70px 0" }}>
            <div className="spinner-border" style={{ color:"var(--brand)", width:40, height:40 }}></div>
            <p style={{ marginTop:14, color:"#94a3b8", fontSize:"0.88rem" }}>Đang tải...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", animation:"fadeUp .3s ease" }}>
            <div style={{ fontSize:"3rem", marginBottom:12 }}>🎨</div>
            <div style={{ fontWeight:700, color:"#475569", marginBottom:8 }}>
              {hasFilter ? "Không tìm thấy tác phẩm phù hợp" : "Chưa có tác phẩm nào"}
            </div>
            {hasFilter && (
              <button onClick={clearFilters} style={{ padding:"8px 20px", borderRadius:9, border:"none", background:"#f5edd6", color:"var(--brand)", fontWeight:700, cursor:"pointer" }}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f8fafc", borderBottom:"2px solid #f1f5f9" }}>
                  {["#","Ảnh","Tác phẩm","Nghệ sĩ","Thể loại","Giá bán","Trạng thái","Thao tác"].map((h, i) => (
                    <th key={i} style={{ padding:"11px 14px", fontSize:"0.72rem", fontWeight:700, color:"#94a3b8",
                      textTransform:"uppercase", letterSpacing:"0.06em",
                      textAlign:(i===0||i>=6)?"center":"left", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayList.map((p, idx) => (
                  <tr key={p.id} className="prod-row" style={{ background:idx%2===1?"#fafbff":"white" }}>

                    <td style={{ padding:"12px 14px", color:"#cbd5e1", fontSize:"0.78rem", fontWeight:700, textAlign:"center" }}>
                      {(page-1)*PAGE_SIZE+idx+1}
                    </td>

                    <td style={{ padding:"10px 14px" }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width:52, height:52, objectFit:"cover", borderRadius:10, boxShadow:"0 2px 8px rgba(0,0,0,.12)", display:"block" }} />
                        : <div style={{ width:52, height:52, background:"#f1f5f9", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <i className="fas fa-image" style={{ color:"#cbd5e1", fontSize:"1.2rem" }}></i>
                          </div>
                      }
                    </td>

                    <td style={{ padding:"12px 14px", maxWidth:200 }}>
                      <div style={{ fontWeight:700, color:"#1e293b", fontSize:"0.88rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                      <div style={{ fontSize:"0.71rem", color:"#94a3b8", marginTop:2 }}>
                        {p.material && <span>{p.material}</span>}
                        {p.width && p.height && <span style={{ marginLeft:6 }}>{p.width}×{p.height}cm</span>}
                      </div>
                      {p.adminNote && (
                        <div style={{ marginTop:4, fontSize:"0.71rem", color:"#991b1b", background:"#fee2e2", borderRadius:4, padding:"2px 7px", display:"inline-block" }}>
                          <i className="fas fa-comment-alt mr-1"></i>{p.adminNote}
                        </div>
                      )}
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
                          background:"linear-gradient(135deg,var(--brand),var(--brand-dark))", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:"white", fontSize:"0.65rem", fontWeight:800 }}>{(p.artistName||"?")[0].toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize:"0.85rem", color:"#475569", fontWeight:500, whiteSpace:"nowrap" }}>{p.artistName || "—"}</span>
                      </div>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      {p.categoryName
                        ? <span style={{ background:"#f1f5f9", borderRadius:8, padding:"4px 10px", fontSize:"0.8rem", fontWeight:600, color:"#475569" }}>{p.categoryName}</span>
                        : <span style={{ color:"#e2e8f0" }}>—</span>
                      }
                    </td>

                    <td style={{ padding:"12px 14px", whiteSpace:"nowrap" }}>
                      <span style={{ fontWeight:800, color:"#dc2626", fontSize:"0.9rem" }}>{fmt(p.price)}</span>
                    </td>

                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      <span style={{
                        display:"inline-block", padding:"4px 12px", borderRadius:20, fontSize:"0.72rem", fontWeight:700,
                        background: getProductStatus(p.status).bg,
                        color:      getProductStatus(p.status).color,
                        whiteSpace:"nowrap",
                      }}>
                        {getProductStatus(p.status).label}
                      </span>
                    </td>

                    <td style={{ padding:"10px 14px", textAlign:"center", whiteSpace:"nowrap" }}>
                      {/* Xem chi tiết — luôn hiển thị */}
                      <button className="action-btn" onClick={() => openReview(p)} title="Xem chi tiết"
                        style={{ width:30, height:30, borderRadius:7, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#475569", marginRight:4 }}>
                        <i className="fas fa-eye" style={{ fontSize:"0.68rem" }}></i>
                      </button>

                      {/* Duyệt + Từ chối — chỉ khi Pending */}
                      {p.status === "Pending" && (
                        <>
                          <button className="action-btn" onClick={() => handleApprove(p.id)} title="Duyệt tranh"
                            style={{ width:30, height:30, borderRadius:7, border:"1.5px solid #a7f3d0", background:"#d1fae5", color:"#065f46", marginRight:4 }}>
                            <i className="fas fa-check" style={{ fontSize:"0.68rem" }}></i>
                          </button>
                          <button className="action-btn" onClick={() => handleReject(p.id)} title="Từ chối"
                            style={{ width:30, height:30, borderRadius:7, border:"1.5px solid #fca5a5", background:"#fee2e2", color:"#991b1b", marginRight:4 }}>
                            <i className="fas fa-times" style={{ fontSize:"0.68rem" }}></i>
                          </button>
                        </>
                      )}

                      {/* Xóa — luôn hiển thị */}
                      <button className="action-btn" onClick={() => handleDelete(p.id, p.name)} title="Xóa"
                        style={{ width:30, height:30, borderRadius:7, border:"1.5px solid #fecaca", background:"#fef2f2", color:"#ef4444" }}>
                        <i className="fas fa-trash" style={{ fontSize:"0.68rem" }}></i>
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
          <div style={{ padding:"12px 20px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fafbff" }}>
            <span style={{ fontSize:"0.82rem", color:"#64748b" }}>
              Hiển thị <strong>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,totalCount)}</strong> / <strong>{totalCount}</strong>
            </span>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setPage(p=>p-1)} disabled={page===1}
                style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0", background:page===1?"#f8fafc":"white", color:page===1?"#e2e8f0":"#475569", cursor:page===1?"not-allowed":"pointer", fontWeight:700 }}>‹</button>
              {pageNums(page,totalPages).map((n,i) =>
                n==="…"
                  ? <span key={`e${i}`} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8" }}>…</span>
                  : <button key={n} onClick={() => setPage(n)} style={{ width:32, height:32, borderRadius:8,
                      border:page===n?"none":"1.5px solid #e2e8f0", background:page===n?"var(--brand)":"white",
                      color:page===n?"white":"#475569", fontWeight:page===n?800:500, cursor:"pointer" }}>{n}</button>
              )}
              <button onClick={() => setPage(p=>p+1)} disabled={page===totalPages}
                style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0", background:page===totalPages?"#f8fafc":"white", color:page===totalPages?"#e2e8f0":"#475569", cursor:page===totalPages?"not-allowed":"pointer", fontWeight:700 }}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
