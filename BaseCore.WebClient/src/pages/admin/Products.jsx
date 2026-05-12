import React, { useState, useEffect, useRef } from "react";
import { productApi, categoryApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const MATERIALS = ["Sơn dầu","Acrylic","Màu nước","Mực","Chì than","Pastel","Kỹ thuật số","Khác"];
const STATUSES  = ["Available","Unavailable","OutOfStock"];
const STATUS_LABEL = { Available: "Đang bán", Unavailable: "Ẩn", OutOfStock: "Hết hàng" };
const STATUS_COLOR = { Available: "success",  Unavailable: "secondary", OutOfStock: "danger" };

const fmt = (p) => (p || 0).toLocaleString("vi-VN") + "₫";

const Products = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [keyword, setKeyword]       = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage]             = useState(1);
  const [pageSize]                  = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [showModal, setShowModal]           = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError]                   = useState("");
  const [uploading, setUploading]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [imagePreview, setImagePreview]     = useState(null);
  const fileInputRef = useRef(null);
  const { isAdmin } = useAuth();

  const emptyForm = {
    name: "", artistName: "", categoryId: "",
    price: "", stock: 1,
    material: "", dimensions: "", year: "",
    description: "", imageUrl: "", status: "Available",
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts();   }, [page, keyword, categoryId]);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.search({ keyword, categoryId: categoryId || undefined, page, pageSize });
      setProducts(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 0);
      setTotalCount(res.data?.totalCount || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name:        product.name        || "",
        artistName:  product.artistName  || "",
        categoryId:  product.categoryId  || "",
        price:       product.price       || "",
        stock:       product.stock       ?? 1,
        material:    product.material    || "",
        dimensions:  product.dimensions  || "",
        year:        product.year        || "",
        description: product.description || "",
        imageUrl:    product.imageUrl    || "",
        status:      product.status      || "Available",
      });
      setImagePreview(product.imageUrl || null);
    } else {
      setEditingProduct(null);
      setFormData({ ...emptyForm, categoryId: categories[0]?.id || "" });
      setImagePreview(null);
    }
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImagePreview(null);
    setError("");
  };

  // ── Upload ảnh qua backend → Cloudinary ──
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    try {
      const res = await productApi.uploadImage(file);
      const url = res.data?.url;
      if (!url) throw new Error("Không nhận được URL từ server");
      setFormData(f => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.response?.data?.message || "Upload ảnh thất bại. Vui lòng thử lại!");
      setImagePreview(formData.imageUrl || null);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setSubmitting(true);
    setError("");
    try {
      const data = {
        ...formData,
        price:      parseFloat(formData.price),
        stock:      parseInt(formData.stock),
        categoryId: parseInt(formData.categoryId),
        year:       formData.year ? parseInt(formData.year) : null,
      };
      if (editingProduct) {
        await productApi.update(editingProduct.id, { id: editingProduct.id, ...data });
      } else {
        await productApi.create(data);
      }
      closeModal();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Lưu thất bại, vui lòng thử lại!");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa tác phẩm này?")) return;
    try { await productApi.delete(id); loadProducts(); }
    catch { alert("Xóa thất bại!"); }
  };

  const set = (field) => (e) => setFormData(f => ({ ...f, [field]: e.target.value }));

  const inputCls   = "form-control";
  const labelStyle = { fontWeight: 600, fontSize: "0.88rem", color: "#374151", marginBottom: 4 };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0" style={{ fontWeight: 700 }}>
            <i className="fas fa-palette mr-2" style={{ color: "#a78bfa" }}></i>
            Quản lý Tác phẩm
          </h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card" style={{ borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>

            {/* Toolbar */}
            <div className="card-header" style={{ background: "white", borderBottom: "1px solid #f3f4f6" }}>
              <div className="row align-items-center">
                <div className="col-md-7">
                  <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadProducts(); }}
                    className="form-inline" style={{ gap: 8 }}>
                    <input type="text" className="form-control mr-2"
                      placeholder="Tìm tên tranh, nghệ sĩ..."
                      value={keyword} onChange={(e) => setKeyword(e.target.value)}
                      style={{ borderRadius: 8, minWidth: 200 }} />
                    <select className="form-control mr-2" value={categoryId}
                      onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                      style={{ borderRadius: 8 }}>
                      <option value="">Tất cả thể loại</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 8 }}>
                      <i className="fas fa-search mr-1"></i> Tìm
                    </button>
                  </form>
                </div>
                <div className="col-md-5 text-right">
                  <span className="text-muted mr-3" style={{ fontSize: "0.9rem" }}>
                    Tổng: <strong>{totalCount}</strong> tác phẩm
                  </span>
                  {isAdmin && (
                    <button className="btn btn-success" onClick={() => openModal()}
                      style={{ borderRadius: 8 }}>
                      <i className="fas fa-plus mr-1"></i> Thêm tác phẩm
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: "#a78bfa" }}></div>
                  <p className="mt-2 text-muted">Đang tải...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: "#f9fafb" }}>
                      <tr>
                        <th style={{ width: 64 }}>Ảnh</th>
                        <th>Tên tác phẩm</th>
                        <th>Nghệ sĩ</th>
                        <th>Thể loại</th>
                        <th>Chất liệu</th>
                        <th>Giá</th>
                        <th>SL</th>
                        <th>Trạng thái</th>
                        {isAdmin && <th style={{ width: 110 }}>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-5 text-muted">
                            <i className="fas fa-palette"
                              style={{ fontSize: "2rem", marginBottom: 8, display: "block", color: "#e5e7eb" }}></i>
                            Chưa có tác phẩm nào
                          </td>
                        </tr>
                      ) : products.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name}
                                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                                onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                            ) : null}
                            <div style={{
                              display: p.imageUrl ? "none" : "flex",
                              width: 56, height: 56, background: "#f3f4f6",
                              borderRadius: 10, alignItems: "center", justifyContent: "center"
                            }}>
                              <i className="fas fa-image text-muted"></i>
                            </div>
                          </td>
                          <td>
                            <strong>{p.name}</strong>
                            {p.dimensions && (
                              <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{p.dimensions}</div>
                            )}
                          </td>
                          <td>{p.artistName || <span className="text-muted">—</span>}</td>
                          <td>{p.categoryName || "—"}</td>
                          <td>{p.material || <span className="text-muted">—</span>}</td>
                          <td style={{ fontWeight: 700, color: "#7c3aed" }}>{fmt(p.price)}</td>
                          <td>{p.stock}</td>
                          <td>
                            <span className={`badge badge-${STATUS_COLOR[p.status] || "secondary"}`}>
                              {STATUS_LABEL[p.status] || p.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              <button className="btn btn-sm btn-outline-primary mr-1"
                                onClick={() => openModal(p)} title="Sửa">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(p.id)} title="Xóa">
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-end p-3">
                  <ul className="pagination mb-0">
                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(i => (
                      <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(i)}
                          style={page === i ? { background: "#7c3aed", borderColor: "#7c3aed" } : {}}>
                          {i}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MODAL THÊM / SỬA ═══════ */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block", zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content"
                style={{ borderRadius: 16, border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

                <div className="modal-header"
                  style={{ background: "linear-gradient(135deg,#1a1a2e,#533483)", color: "white", borderRadius: "16px 16px 0 0" }}>
                  <h5 className="modal-title" style={{ fontWeight: 700 }}>
                    <i className={`fas fa-${editingProduct ? "edit" : "plus-circle"} mr-2`}></i>
                    {editingProduct ? "Cập nhật tác phẩm" : "Thêm tác phẩm mới"}
                  </h5>
                  <button type="button" onClick={closeModal}
                    style={{ background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body" style={{ padding: "24px 28px" }}>
                    {error && (
                      <div className="alert"
                        style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, border: "none" }}>
                        <i className="fas fa-exclamation-circle mr-2"></i>{error}
                      </div>
                    )}

                    <div className="row">
                      {/* Cột trái: Upload ảnh */}
                      <div className="col-md-4">
                        <label style={labelStyle}>Ảnh tác phẩm</label>
                        <div
                          onClick={() => !uploading && fileInputRef.current?.click()}
                          style={{
                            border: `2px dashed ${uploading ? "#d1d5db" : "#a78bfa"}`,
                            borderRadius: 12, minHeight: 200,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            cursor: uploading ? "not-allowed" : "pointer",
                            background: "#faf5ff", overflow: "hidden", position: "relative",
                          }}>
                          {uploading ? (
                            <div className="text-center">
                              <div className="spinner-border" style={{ color: "#a78bfa" }}></div>
                              <p style={{ marginTop: 8, color: "#a78bfa", fontSize: "0.85rem" }}>Đang upload...</p>
                            </div>
                          ) : imagePreview ? (
                            <>
                              <img src={imagePreview} alt="preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
                              <div style={{
                                position: "absolute", bottom: 0, left: 0, right: 0,
                                background: "rgba(0,0,0,0.5)", color: "white",
                                padding: "6px 0", textAlign: "center", fontSize: "0.8rem"
                              }}>
                                <i className="fas fa-camera mr-1"></i> Đổi ảnh
                              </div>
                            </>
                          ) : (
                            <div className="text-center" style={{ color: "#a78bfa", padding: 20 }}>
                              <i className="fas fa-cloud-upload-alt"
                                style={{ fontSize: "2.5rem", marginBottom: 8, display: "block" }}></i>
                              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Click để tải ảnh lên</span>
                              <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
                                JPG, PNG, WEBP – tối đa 5MB
                              </span>
                            </div>
                          )}
                        </div>

                        <input ref={fileInputRef} type="file" accept="image/*"
                          style={{ display: "none" }} onChange={handleImageChange} />

                        <div className="mt-2">
                          <input className={inputCls} placeholder="Hoặc nhập URL ảnh..."
                            value={formData.imageUrl}
                            onChange={(e) => {
                              setFormData(f => ({ ...f, imageUrl: e.target.value }));
                              setImagePreview(e.target.value || null);
                            }}
                            style={{ borderRadius: 8, fontSize: "0.82rem" }} />
                        </div>

                        {formData.imageUrl && !uploading && (
                          <div style={{
                            marginTop: 6, padding: "4px 10px", background: "#d1fae5",
                            color: "#065f46", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600
                          }}>
                            <i className="fas fa-check-circle mr-1"></i> Ảnh đã sẵn sàng
                          </div>
                        )}
                      </div>

                      {/* Cột phải: Thông tin */}
                      <div className="col-md-8">
                        <div className="row">
                          <div className="col-12 form-group mb-3">
                            <label style={labelStyle}>Tên tác phẩm *</label>
                            <input className={inputCls} required value={formData.name}
                              onChange={set("name")} placeholder="VD: Hoàng hôn trên phố cổ"
                              style={{ borderRadius: 8 }} />
                          </div>

                          <div className="col-md-6 form-group mb-3">
                            <label style={labelStyle}>Nghệ sĩ / Tác giả</label>
                            <input className={inputCls} value={formData.artistName}
                              onChange={set("artistName")} placeholder="VD: Nguyễn Văn A"
                              style={{ borderRadius: 8 }} />
                          </div>

                          <div className="col-md-6 form-group mb-3">
                            <label style={labelStyle}>Thể loại *</label>
                            <select className={inputCls} required value={formData.categoryId}
                              onChange={set("categoryId")} style={{ borderRadius: 8 }}>
                              <option value="">-- Chọn thể loại --</option>
                              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>

                          <div className="col-md-6 form-group mb-3">
                            <label style={labelStyle}>Chất liệu</label>
                            <select className={inputCls} value={formData.material}
                              onChange={set("material")} style={{ borderRadius: 8 }}>
                              <option value="">-- Chọn chất liệu --</option>
                              {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>

                          <div className="col-md-6 form-group mb-3">
                            <label style={labelStyle}>Kích thước</label>
                            <input className={inputCls} value={formData.dimensions}
                              onChange={set("dimensions")} placeholder="VD: 60×80cm"
                              style={{ borderRadius: 8 }} />
                          </div>

                          <div className="col-md-4 form-group mb-3">
                            <label style={labelStyle}>Năm sáng tác</label>
                            <input className={inputCls} type="number" value={formData.year}
                              onChange={set("year")} placeholder="2024"
                              min="1900" max={new Date().getFullYear()}
                              style={{ borderRadius: 8 }} />
                          </div>

                          <div className="col-md-4 form-group mb-3">
                            <label style={labelStyle}>Giá (VNĐ) *</label>
                            <input className={inputCls} type="number" required
                              value={formData.price} onChange={set("price")}
                              placeholder="0" min="0" style={{ borderRadius: 8 }} />
                          </div>

                          <div className="col-md-4 form-group mb-3">
                            <label style={labelStyle}>Số lượng</label>
                            <input className={inputCls} type="number" value={formData.stock}
                              onChange={set("stock")} min="0" style={{ borderRadius: 8 }} />
                          </div>

                          <div className="col-md-6 form-group mb-3">
                            <label style={labelStyle}>Trạng thái</label>
                            <select className={inputCls} value={formData.status}
                              onChange={set("status")} style={{ borderRadius: 8 }}>
                              {STATUSES.map(s => (
                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-12 form-group mb-0">
                            <label style={labelStyle}>Mô tả tác phẩm</label>
                            <textarea className={inputCls} rows={3} value={formData.description}
                              onChange={set("description")}
                              placeholder="Mô tả về tác phẩm, cảm hứng sáng tác, ý nghĩa..."
                              style={{ borderRadius: 8, resize: "vertical" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer" style={{ borderTop: "1px solid #f3f4f6", padding: "16px 28px" }}>
                    <button type="button" className="btn btn-outline-secondary mr-2"
                      onClick={closeModal} style={{ borderRadius: 8 }}>
                      Hủy
                    </button>
                    <button type="submit" disabled={submitting || uploading}
                      style={{
                        background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
                        color: "white", border: "none", borderRadius: 8,
                        padding: "8px 28px", fontWeight: 700,
                        cursor: (submitting || uploading) ? "not-allowed" : "pointer",
                        opacity: (submitting || uploading) ? 0.7 : 1,
                      }}>
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm mr-2"></span>Đang lưu...</>
                        : <><i className={`fas fa-${editingProduct ? "save" : "plus"} mr-2`}></i>
                            {editingProduct ? "Cập nhật" : "Thêm tác phẩm"}</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        </>
      )}
    </div>
  );
};

export default Products;