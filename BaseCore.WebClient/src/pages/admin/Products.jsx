import React, { useState, useEffect, useRef } from "react";
import { productApi, categoryApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// Khớp đúng với Categories DB (Name, Slug, Icon)
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

  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
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
      name:       p.name        || "",
      artistName: p.artistName  || "",
      categoryId: p.categoryId  || "",
      price:      p.price       || "",
      stock:      p.stock       ?? 1,
      theme:      p.theme       || "",
      technique:  p.technique   || "",
      material:   p.material    || "",
      size:       p.size        || "",
      year:       p.year        || "",
      condition:  p.condition   || "Mới",
      description:p.description || "",
      imageUrl:   p.imageUrl    || "",
      isOriginal: p.isOriginal  ?? true,
      status:     p.status      || "Available",
      sellerId:   p.sellerId    || user?.id || "",
    });
    setError("");
    setShowModal(true);
  };

    const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await productApi.uploadImage(file); // ← truyền file, KHÔNG phải FormData
      setForm(f => ({ ...f, imageUrl: r.data.url }));
    } catch (e) {
      setError("Upload ảnh thất bại: " + (e.response?.data?.message || e.message));
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim())      return setError("Vui lòng nhập tên tác phẩm");
    if (!form.artistName.trim())return setError("Vui lòng nhập tên nghệ sĩ");
    if (!form.categoryId)       return setError("Vui lòng chọn thể loại");
    if (!form.price || Number(form.price) <= 0) return setError("Giá phải lớn hơn 0");
    if (!form.imageUrl)         return setError("Vui lòng upload ảnh tác phẩm");

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
    } catch(e) {
      setError("Lưu thất bại: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tác phẩm này?")) return;
    try {
      await productApi.delete(id);
      loadProducts();
    } catch(e) { alert("Xóa thất bại: " + (e.response?.data?.message || e.message)); }
  };

  const F = ({ label, children, required }) => (
    <div className="mb-3">
      <label className="form-label fw-semibold">
        {label}{required && <span className="text-danger ms-1">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0 fw-bold">🎨 Quản lý tác phẩm</h4>
          <small className="text-muted">Tổng: {totalCount} tác phẩm</small>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"/>Thêm tác phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control" placeholder="🔍 Tìm theo tên, nghệ sĩ..."
                value={keyword} onChange={e=>{setKeyword(e.target.value);setPage(1);}}/>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={catFilter}
                onChange={e=>{setCatFilter(e.target.value);setPage(1);}}>
                <option value="">Tất cả thể loại</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100"
                onClick={()=>{setKeyword("");setCatFilter("");setPage(1);}}>
                Xóa lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"/><p className="mt-2 text-muted">Đang tải...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-image fs-1 d-block mb-2"/>Chưa có tác phẩm nào
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
                          : <div style={{width:56,height:56,background:"#f0f0f0",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <i className="bi bi-image text-muted"/>
                            </div>
                        }
                      </td>
                      <td>
                        <div className="fw-semibold">{p.name}</div>
                        {p.year && <small className="text-muted">{p.year}</small>}
                        {p.isOriginal && <span className="badge bg-warning text-dark ms-1" style={{fontSize:10}}>Gốc</span>}
                      </td>
                      <td>{p.artistName || <span className="text-muted">—</span>}</td>
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
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={()=>openEdit(p)} title="Sửa">
                          <i className="bi bi-pencil"/>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(p.id)} title="Xóa">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page===1?"disabled":""}`}>
              <button className="page-link" onClick={()=>setPage(p=>p-1)}>‹</button>
            </li>
            {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
              <li key={n} className={`page-item ${n===page?"active":""}`}>
                <button className="page-link" onClick={()=>setPage(n)}>{n}</button>
              </li>
            ))}
            <li className={`page-item ${page===totalPages?"disabled":""}`}>
              <button className="page-link" onClick={()=>setPage(p=>p+1)}>›</button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{background:"rgba(0,0,0,0.5)"}}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  🎨 {editing ? "Chỉnh sửa tác phẩm" : "Thêm tác phẩm mới"}
                </h5>
                <button className="btn-close" onClick={()=>setShowModal(false)}/>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="row g-4">

                  {/* Cột trái — ảnh */}
                  <div className="col-md-4">
                    <F label="Ảnh tác phẩm" required>
                      <div className="border rounded-3 p-3 text-center" style={{background:"#fafafa"}}>
                        {form.imageUrl ? (
                          <img src={form.imageUrl} alt="preview"
                            className="img-fluid rounded mb-2"
                            style={{maxHeight:280,objectFit:"contain"}}/>
                        ) : (
                          <div className="py-5 text-muted">
                            <i className="bi bi-image fs-1 d-block mb-2"/>
                            Chưa có ảnh
                          </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*"
                          className="d-none" onChange={handleUpload}/>
                        <button className="btn btn-outline-primary btn-sm w-100"
                          onClick={()=>fileRef.current?.click()}
                          disabled={uploading}>
                          {uploading
                            ? <><span className="spinner-border spinner-border-sm me-1"/>Đang upload...</>
                            : <><i className="bi bi-upload me-1"/>Chọn ảnh</>}
                        </button>
                      </div>
                    </F>

                    <F label="Trạng thái">
                      <select className="form-select" value={form.status}
                        onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                        {STATUSES.map(s=><option key={s} value={s}>{STATUS_VI[s]}</option>)}
                      </select>
                    </F>

                    <F label="Tranh gốc">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="isOriginal"
                          checked={form.isOriginal}
                          onChange={e=>setForm(f=>({...f,isOriginal:e.target.checked}))}/>
                        <label className="form-check-label" htmlFor="isOriginal">
                          {form.isOriginal ? "✅ Tranh gốc (bản độc bản)" : "🖨️ Bản in / Copy"}
                        </label>
                      </div>
                    </F>
                  </div>

                  {/* Cột phải — thông tin */}
                  <div className="col-md-8">
                    <div className="row g-3">
                      <div className="col-12">
                        <F label="Tên tác phẩm" required>
                          <input className="form-control" placeholder="VD: Hoàng hôn trên sông Hương"
                            value={form.name}
                            onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                        </F>
                      </div>
                      <div className="col-md-6">
                        <F label="Tên nghệ sĩ / Tác giả" required>
                          <input className="form-control" placeholder="VD: Nguyễn Văn An"
                            value={form.artistName}
                            onChange={e=>setForm(f=>({...f,artistName:e.target.value}))}/>
                        </F>
                      </div>
                      <div className="col-md-6">
                        <F label="Thể loại tranh" required>
                          <select className="form-select" value={form.categoryId}
                            onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))}>
                            <option value="">-- Chọn thể loại --</option>
                            {categories.map(c=>(
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </F>
                      </div>
                      <div className="col-md-6">
                        <F label="Kỹ thuật vẽ">
                          <select className="form-select" value={form.technique}
                            onChange={e=>setForm(f=>({...f,technique:e.target.value}))}>
                            <option value="">-- Chọn kỹ thuật --</option>
                            {TECHNIQUES.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </F>
                      </div>
                      <div className="col-md-6">
                        <F label="Chủ đề / Phong cách">
                          <select className="form-select" value={form.theme}
                            onChange={e=>setForm(f=>({...f,theme:e.target.value}))}>
                            <option value="">-- Chọn chủ đề --</option>
                            {THEMES.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </F>
                      </div>
                      <div className="col-md-4">
                        <F label="Chất liệu">
                          <input className="form-control" placeholder="VD: Canvas, Giấy Fabriano"
                            value={form.material}
                            onChange={e=>setForm(f=>({...f,material:e.target.value}))}/>
                        </F>
                      </div>
                      <div className="col-md-4">
                        <F label="Kích thước">
                          <input className="form-control" placeholder="VD: 60x80 cm"
                            value={form.size}
                            onChange={e=>setForm(f=>({...f,size:e.target.value}))}/>
                        </F>
                      </div>
                      <div className="col-md-4">
                        <F label="Năm sáng tác">
                          <input className="form-control" type="number"
                            placeholder={new Date().getFullYear()}
                            min={1800} max={new Date().getFullYear()}
                            value={form.year}
                            onChange={e=>setForm(f=>({...f,year:e.target.value}))}/>
                        </F>
                      </div>
                      <div className="col-md-6">
                        <F label="Tình trạng tác phẩm">
                          <select className="form-select" value={form.condition}
                            onChange={e=>setForm(f=>({...f,condition:e.target.value}))}>
                            {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
                          </select>
                        </F>
                      </div>
                      <div className="col-md-3">
                        <F label="Giá bán (₫)" required>
                          <input className="form-control" type="number" min={0}
                            placeholder="VD: 5000000"
                            value={form.price}
                            onChange={e=>setForm(f=>({...f,price:e.target.value}))}/>
                          {form.price > 0 &&
                            <small className="text-muted">{fmt(form.price)}</small>}
                        </F>
                      </div>
                      <div className="col-md-3">
                        <F label="Số lượng">
                          <input className="form-control" type="number" min={0}
                            value={form.stock}
                            onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/>
                        </F>
                      </div>
                      <div className="col-12">
                        <F label="Mô tả tác phẩm">
                          <textarea className="form-control" rows={4}
                            placeholder="Câu chuyện, ý nghĩa, nguồn cảm hứng của tác phẩm..."
                            value={form.description}
                            onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
                        </F>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Hủy</button>
                <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1"/>Đang lưu...</>
                    : <><i className="bi bi-check-lg me-1"/>{editing?"Cập nhật":"Thêm tác phẩm"}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}