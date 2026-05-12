import React, { useState, useEffect, useRef } from "react";
import { productApi, categoryApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// ─── Constants ───────────────────────────────────────────────────
const TECHNIQUES = ["Sơn dầu","Acrylic","Màu nước","Mực","Chì than","Pastel","Kỹ thuật số","Khắc gỗ","Khác"];
const THEMES     = ["Phong cảnh","Chân dung","Tĩnh vật","Trừu tượng","Động vật","Đô thị","Lịch sử","Tâm linh","Khác"];
const CONDITIONS = ["Mới","Tốt","Khá tốt","Cũ"];
const STATUSES   = ["Available","Unavailable","OutOfStock"];
const STATUS_VI  = { Available:"Đang bán", Unavailable:"Ẩn", OutOfStock:"Hết hàng" };
const STATUS_CLS = { Available:"success",  Unavailable:"secondary", OutOfStock:"danger" };
const fmt = v => Number(v||0).toLocaleString("vi-VN") + "₫";

const emptyForm = {
  name:"", artistName:"", categoryId:"",
  price:"", stock:1,
  theme:"", technique:"", material:"",
  size:"", year:"", condition:"Mới",
  description:"", imageUrl:"", isOriginal:true,
  status:"Available",
};

// ─── Tách F ra NGOÀI component (FIX lỗi mất focus) ───────────────
const F = ({ label, children, required }) => (
  <div className="mb-0">
    <label className="form-label fw-semibold small mb-1">
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
  </div>
);

// ─── Component chính ─────────────────────────────────────────────
export default function Products() {
  const { user } = useAuth();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [keyword,    setKeyword]    = useState("");
  const [catFilter,  setCatFilter]  = useState("");
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const fileRef = useRef(null);

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { loadProducts(); }, [page, keyword, catFilter]);

  const loadCats = async () => {
    try { const r = await categoryApi.getAll(); setCategories(r.data||[]); }
    catch(e){ console.error(e); }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const r = await productApi.search({ keyword, categoryId: catFilter||undefined, page, pageSize: PAGE_SIZE });
      setProducts(r.data?.items || []);
      setTotalPages(r.data?.totalPages || 0);
      setTotalCount(r.data?.totalCount || 0);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, sellerId: user?.id || "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name:        p.name        || "",
      artistName:  p.artistName  || "",
      categoryId:  p.categoryId  || "",
      price:       p.price       || "",
      stock:       p.stock       ?? 1,
      theme:       p.theme       || "",
      technique:   p.technique   || "",
      material:    p.material    || "",
      size:        p.size        || "",
      year:        p.year        || "",
      condition:   p.condition   || "Mới",
      description: p.description || "",
      imageUrl:    p.imageUrl    || "",
      isOriginal:  p.isOriginal  ?? true,
      status:      p.status      || "Available",
      sellerId:    p.sellerId    || user?.id || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleChange = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCheck = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.checked }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await productApi.uploadImage(file);
      setForm(f => ({ ...f, imageUrl: r.data.url }));
    } catch(err) {
      setError("Upload ảnh thất bại: " + (err.response?.data?.message || err.message));
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim())       return setError("Vui lòng nhập tên tác phẩm");
    if (!form.artistName.trim()) return setError("Vui lòng nhập tên nghệ sĩ");
    if (!form.categoryId)        return setError("Vui lòng chọn thể loại");
    if (!form.price || Number(form.price) <= 0) return setError("Giá phải lớn hơn 0");
    if (!form.imageUrl)          return setError("Vui lòng upload ảnh tác phẩm");

    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        artistName:  form.artistName.trim(),
        categoryId:  Number(form.categoryId),
        price:       Number(form.price),
        stock:       Number(form.stock) || 1,
        theme:       form.theme       || null,
        technique:   form.technique   || null,
        material:    form.material    || null,
        size:        form.size        || null,
        year:        form.year        ? Number(form.year) : null,
        condition:   form.condition   || null,
        description: form.description || "",
        imageUrl:    form.imageUrl,
        isOriginal:  form.isOriginal,
        status:      form.status,
        sellerId:    user?.id || null,
      };
      if (editing) {
        await productApi.update(editing.id, payload);
      } else {
        await productApi.create(payload);
      }
      setShowModal(false);
      setPage(1);
      loadProducts();
    } catch(err) {
      setError("Lưu thất bại: " + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tác phẩm này?")) return;
    try {
      await productApi.delete(id);
      loadProducts();
    } catch(err) { alert("Xóa thất bại: " + (err.response?.data?.message || err.message)); }
  };

  return (
    <div className="container-fluid py-4">

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0 fw-bold">🎨 Quản lý tác phẩm</h4>
          <small className="text-muted">Tổng: {totalCount} tác phẩm</small>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"/>Thêm tác phẩm
        </button>
      </div>

      {/* ── Bộ lọc ── */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control" placeholder="🔍 Tìm theo tên, nghệ sĩ..."
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}/>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={catFilter}
                onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
                <option value="">Tất cả thể loại</option>
                {categories.map(c =>
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                )}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100"
                onClick={() => { setKeyword(""); setCatFilter(""); setPage(1); }}>
                Xóa lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bảng danh sách ── */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"/>
              <p className="mt-2 text-muted">Đang tải...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-image fs-1 d-block mb-2"/>
              Chưa có tác phẩm nào
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{width:70}}>Ảnh</th>
                    <th>Tác phẩm</th>
                    <th>Nghệ sĩ</th>
                    <th>Thể loại</th>
                    <th>Kỹ thuật</th>
                    <th>Kích thước</th>
                    <th>Giá</th>
                    <th>Kho</th>
                    <th>Trạng thái</th>
                    <th style={{width:100}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name}
                              style={{width:56,height:56,objectFit:"cover",borderRadius:6}}/>
                          : <div style={{width:56,height:56,background:"#f0f0f0",borderRadius:6,
                              display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <i className="bi bi-image text-muted"/>
                            </div>
                        }
                      </td>
                      <td>
                        <div className="fw-semibold">{p.name}</div>
                        {p.year && <small className="text-muted">{p.year}</small>}
                        {p.isOriginal && (
                          <span className="badge bg-warning text-dark ms-1" style={{fontSize:10}}>Gốc</span>
                        )}
                      </td>
                      <td>{p.artistName || <span className="text--muted">—</span>}</td>
                      <td>{p.categoryName || <span className="text-muted">—</span>}</td>
                      <td>{p.technique || <span className="text-muted">—</span>}</td>
                      <td>{p.size || <span className="text-muted">—</span>}</td>
                      <td className="fw-semibold text-danger">{fmt(p.price)}</td>
                      <td>
                        <span className={`badge bg-${p.stock > 0 ? "success" : "danger"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${STATUS_CLS[p.status]||"secondary"}`}>
                          {STATUS_VI[p.status]||p.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openEdit(p)} title="Sửa">
                          <i className="bi bi-pencil"/>
                        </button>
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(p.id)} title="Xóa">
                          <i className="bi bi-trash"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Phân trang ── */}
      {totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page===1?"disabled":""}`}>
              <button className="page-link" onClick={() => setPage(p => p-1)}>‹</button>
            </li>
            {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
              <li key={n} className={`page-item ${n===page?"active":""}`}>
                <button className="page-link" onClick={() => setPage(n)}>{n}</button>
              </li>
            ))}
            <li className={`page-item ${page===totalPages?"disabled":""}`}>
              <button className="page-link" onClick={() => setPage(p => p+1)}>›</button>
            </li>
          </ul>
        </nav>
      )}

      {/* ════ MODAL ════ */}
      {showModal && (
        <div className="modal show d-block" style={{background:"rgba(0,0,0,0.55)"}}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius:16}}>

              {/* Header */}
              <div className="modal-header border-0 px-4 pt-4 pb-2"
                style={{background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",borderRadius:"16px 16px 0 0"}}>
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">
                    {editing ? "✏️ Chỉnh sửa tác phẩm" : "🎨 Thêm tác phẩm mới"}
                  </h5>
                  <small className="text-white" style={{opacity:.75}}>
                    {editing ? `Đang sửa: ${editing.name}` : "Điền đầy đủ thông tin để đăng bán"}
                  </small>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}/>
              </div>

              <div className="modal-body p-0">
                {error && (
                  <div className="alert alert-danger rounded-0 mb-0 py-2 px-4 border-0"
                    style={{borderLeft:"4px solid #dc3545",background:"#fff5f5"}}>
                    <i className="bi bi-exclamation-circle me-2"/>{error}
                  </div>
                )}
                <div className="p-4">
                  <div className="row g-4">

                    {/* CỘT TRÁI */}
                    <div className="col-md-4">
                      <div className="card border-0 shadow-sm mb-3" style={{borderRadius:12}}>
                        <div className="card-header border-0 fw-semibold py-2 px-3"
                          style={{background:"#f8f9fa",borderRadius:"12px 12px 0 0",fontSize:13}}>
                          📷 Ảnh tác phẩm <span className="text-danger">*</span>
                        </div>
                        <div className="card-body p-3">
                          <div className="rounded-3 overflow-hidden mb-2"
                            style={{background:"#f0f0f0",aspectRatio:"4/3",
                              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                            onClick={() => fileRef.current?.click()}>
                            {form.imageUrl ? (
                              <img src={form.imageUrl} alt="preview"
                                style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            ) : (
                              <div className="text-center text-muted py-3">
                                <i className="bi bi-cloud-upload fs-2 d-block mb-1"/>
                                <small>Click để chọn ảnh</small>
                              </div>
                            )}
                          </div>
                          <input type="file" ref={fileRef} accept="image/*"
                            className="d-none" onChange={handleUpload}/>
                          <button className="btn btn-outline-primary btn-sm w-100"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading} style={{borderRadius:8}}>
                            {uploading
                              ? <><span className="spinner-border spinner-border-sm me-1"/>Đang upload...</>
                              : <><i className="bi bi-upload me-1"/>{form.imageUrl ? "Đổi ảnh" : "Chọn ảnh"}</>}
                          </button>
                          {form.imageUrl && (
                            <button className="btn btn-outline-danger btn-sm w-100 mt-1"
                              onClick={() => setForm(f => ({...f, imageUrl:""}))}
                              style={{borderRadius:8}}>
                              <i className="bi bi-trash me-1"/>Xóa ảnh
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="card border-0 shadow-sm" style={{borderRadius:12}}>
                        <div className="card-header border-0 fw-semibold py-2 px-3"
                          style={{background:"#f8f9fa",borderRadius:"12px 12px 0 0",fontSize:13}}>
                          ⚙️ Cài đặt
                        </div>
                        <div className="card-body p-3 d-flex flex-column gap-3">
                          <F label="Trạng thái bán">
                            <select className="form-select form-select-sm" style={{borderRadius:8}}
                              value={form.status} onChange={handleChange("status")}>
                              {STATUSES.map(s => <option key={s} value={s}>{STATUS_VI[s]}</option>)}
                            </select>
                          </F>
                          <div>
                            <label className="form-label fw-semibold small mb-1">Loại tác phẩm</label>
                            <div className="d-flex gap-2">
                              <button type="button"
                                className={`btn btn-sm flex-fill ${form.isOriginal?"btn-warning":"btn-outline-secondary"}`}
                                style={{borderRadius:8,fontSize:12}}
                                onClick={() => setForm(f => ({...f,isOriginal:true}))}>
                                ✅ Tranh gốc
                              </button>
                              <button type="button"
                                className={`btn btn-sm flex-fill ${!form.isOriginal?"btn-info text-white":"btn-outline-secondary"}`}
                                style={{borderRadius:8,fontSize:12}}
                                onClick={() => setForm(f => ({...f,isOriginal:false}))}>
                                🖨️ Bản in
                              </button>
                            </div>
                          </div>
                          <F label="Tình trạng">
                            <select className="form-select form-select-sm" style={{borderRadius:8}}
                              value={form.condition} onChange={handleChange("condition")}>
                              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </F>
                        </div>
                      </div>
                    </div>

                    {/* CỘT PHẢI */}
                    <div className="col-md-8 d-flex flex-column gap-3">

                      <div className="card border-0 shadow-sm" style={{borderRadius:12}}>
                        <div className="card-header border-0 fw-semibold py-2 px-3"
                          style={{background:"linear-gradient(90deg,#667eea22,transparent)",
                            borderLeft:"3px solid #667eea",borderRadius:"12px 12px 0 0",fontSize:13}}>
                          📝 Thông tin cơ bản
                        </div>
                        <div className="card-body p-3">
                          <div className="row g-3">
                            <div className="col-12">
                              <F label="Tên tác phẩm" required>
                                <input className="form-control" style={{borderRadius:8}}
                                  placeholder="VD: Hoàng hôn trên sông Hương"
                                  value={form.name} onChange={handleChange("name")}/>
                              </F>
                            </div>
                            <div className="col-md-6">
                              <F label="Tên nghệ sĩ / Tác giả" required>
                                <input className="form-control" style={{borderRadius:8}}
                                  placeholder="VD: Nguyễn Văn An"
                                  value={form.artistName} onChange={handleChange("artistName")}/>
                              </F>
                            </div>
                            <div className="col-md-6">
                              <F label="Thể loại tranh" required>
                                <select className="form-select" style={{borderRadius:8}}
                                  value={form.categoryId} onChange={handleChange("categoryId")}>
                                  <option value="">-- Chọn thể loại --</option>
                                  {categories.map(c =>
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                  )}
                                </select>
                              </F>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card border-0 shadow-sm" style={{borderRadius:12}}>
                        <div className="card-header border-0 fw-semibold py-2 px-3"
                          style={{background:"linear-gradient(90deg,#f093fb22,transparent)",
                            borderLeft:"3px solid #f093fb",borderRadius:"12px 12px 0 0",fontSize:13}}>
                          🖌️ Chi tiết kỹ thuật
                        </div>
                        <div className="card-body p-3">
                          <div className="row g-3">
                            <div className="col-md-6">
                              <F label="Kỹ thuật vẽ">
                                <select className="form-select" style={{borderRadius:8}}
                                  value={form.technique} onChange={handleChange("technique")}>
                                  <option value="">-- Chọn kỹ thuật --</option>
                                  {TECHNIQUES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </F>
                            </div>
                            <div className="col-md-6">
                              <F label="Chủ đề / Phong cách">
                                <select className="form-select" style={{borderRadius:8}}
                                  value={form.theme} onChange={handleChange("theme")}>
                                  <option value="">-- Chọn chủ đề --</option>
                                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </F>
                            </div>
                            <div className="col-md-4">
                              <F label="Chất liệu">
                                <input className="form-control" style={{borderRadius:8}}
                                  placeholder="VD: Canvas, Giấy Fabriano"
                                  value={form.material} onChange={handleChange("material")}/>
                              </F>
                            </div>
                            <div className="col-md-4">
                              <F label="Kích thước">
                                <input className="form-control" style={{borderRadius:8}}
                                  placeholder="VD: 60×80 cm"
                                  value={form.size} onChange={handleChange("size")}/>
                              </F>
                            </div>
                            <div className="col-md-4">
                              <F label="Năm sáng tác">
                                <input className="form-control" type="number" style={{borderRadius:8}}
                                  placeholder={new Date().getFullYear()}
                                  min={1800} max={new Date().getFullYear()}
                                  value={form.year} onChange={handleChange("year")}/>
                              </F>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card border-0 shadow-sm" style={{borderRadius:12}}>
                        <div className="card-header border-0 fw-semibold py-2 px-3"
                          style={{background:"linear-gradient(90deg,#4facfe22,transparent)",
                            borderLeft:"3px solid #4facfe",borderRadius:"12px 12px 0 0",fontSize:13}}>
                          💰 Giá & Kho hàng
                        </div>
                        <div className="card-body p-3">
                          <div className="row g-3 align-items-end">
                            <div className="col-md-6">
                              <F label="Giá bán (₫)" required>
                                <input className="form-control fw-bold" type="number" min={0}
                                  style={{borderRadius:8,fontSize:16,color:"#e53e3e"}}
                                  placeholder="VD: 5000000"
                                  value={form.price} onChange={handleChange("price")}/>
                                {Number(form.price) > 0 && (
                                  <div className="mt-1 fw-bold" style={{color:"#e53e3e",fontSize:13}}>
                                    = {fmt(form.price)}
                                  </div>
                                )}
                              </F>
                            </div>
                            <div className="col-md-6">
                              <F label="Số lượng trong kho">
                                <div className="input-group">
                                  <button className="btn btn-outline-secondary btn-sm" type="button"
                                    style={{borderRadius:"8px 0 0 8px"}}
                                    onClick={() => setForm(f => ({...f,stock:Math.max(0,Number(f.stock)-1)}))}>
                                    −
                                  </button>
                                  <input className="form-control text-center fw-bold" type="number" min={0}
                                    value={form.stock} onChange={handleChange("stock")}/>
                                  <button className="btn btn-outline-secondary btn-sm" type="button"
                                    style={{borderRadius:"0 8px 8px 0"}}
                                    onClick={() => setForm(f => ({...f,stock:Number(f.stock)+1}))}>
                                    +
                                  </button>
                                </div>
                              </F>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card border-0 shadow-sm" style={{borderRadius:12}}>
                        <div className="card-header border-0 fw-semibold py-2 px-3"
                          style={{background:"linear-gradient(90deg,#43e97b22,transparent)",
                            borderLeft:"3px solid #43e97b",borderRadius:"12px 12px 0 0",fontSize:13}}>
                          📖 Mô tả tác phẩm
                        </div>
                        <div className="card-body p-3">
                          <textarea className="form-control" rows={4}
                            style={{borderRadius:8,resize:"vertical"}}
                            placeholder="Câu chuyện, ý nghĩa, nguồn cảm hứng của tác phẩm..."
                            value={form.description} onChange={handleChange("description")}/>
                          <small className="text-muted d-block mt-1">
                            {form.description.length}/1000 ký tự
                          </small>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 px-4 pb-4 pt-2">
                <button className="btn btn-light px-4" style={{borderRadius:8}}
                  onClick={() => setShowModal(false)}>Hủy bỏ</button>
                <button className="btn btn-primary px-5" style={{borderRadius:8}}
                  onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Đang lưu...</>
                    : <><i className="bi bi-check-circle me-2"/>{editing?"Cập nhật":"Thêm tác phẩm"}</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
