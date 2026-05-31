import React, { useState, useEffect, useRef, useCallback } from "react";
import { userApi } from "../../services/api";

// ─── Constants ───────────────────────────────────────────────────────
const ROLE_CFG = {
  1: { label: "Quản trị viên", color: "#ef4444", bg: "#fee2e2" },
  2: { label: "Họa sĩ",        color: "#c8a97a", bg: "#fdf6ec" },
  0: { label: "Người dùng",    color: "#3b82f6", bg: "#dbeafe" },
};

// ─── Avatar helpers ──────────────────────────────────────────────────
const AVATAR_COLORS = ["#c8a97a","#8b6c4a","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const initials    = (name, uname) =>
  (name || uname || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

// ─── Avatar ─────────────────────────────────────────────────────────
const Avatar = ({ user, size = 40 }) => {
  const [err, setErr] = useState(false);
  if (user.image && !err) {
    return (
      <img src={user.image} alt="" onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(user.id), color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0, userSelect: "none",
    }}>
      {initials(user.name, user.username)}
    </div>
  );
};

// ─── Toast ───────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const MAP = {
    success: { bg: "#10b981", icon: "fa-check-circle"        },
    error:   { bg: "#ef4444", icon: "fa-times-circle"        },
    warning: { bg: "#f59e0b", icon: "fa-exclamation-triangle" },
  };
  const cfg = MAP[toast.type] || MAP.success;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: cfg.bg, color: "white", padding: "12px 22px", borderRadius: 12,
      fontWeight: 700, fontSize: "0.88rem", boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      display: "flex", alignItems: "center", gap: 8, animation: "slideIn .3s ease",
    }}>
      <i className={`fas ${cfg.icon}`} /> {toast.msg}
    </div>
  );
};

// ─── Confirm Dialog ──────────────────────────────────────────────────
const ConfirmDialog = ({ msg, onOk, onCancel }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15,23,42,.55)",
    zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(3px)", padding: 16,
  }} onClick={onCancel}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "white", borderRadius: 16, maxWidth: 380, width: "100%",
      padding: 28, boxShadow: "0 16px 48px rgba(0,0,0,.2)", textAlign: "center",
    }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 14 }}>🗑️</div>
      <h4 style={{ fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Xác nhận xóa</h4>
      <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>{msg}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onCancel} style={{
          padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0",
          background: "white", fontWeight: 700, color: "#64748b", cursor: "pointer",
        }}>Hủy</button>
        <button onClick={onOk} style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg,#ef4444,#dc2626)",
          color: "white", fontWeight: 700, cursor: "pointer",
        }}>Xóa</button>
      </div>
    </div>
  </div>
);

// ─── Input helper ────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
  borderRadius: 10, fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: "0.78rem", fontWeight: 700, color: "#64748b", marginBottom: 6,
  display: "block", textTransform: "uppercase", letterSpacing: "0.05em",
};
const focusOn  = e => { e.target.style.borderColor = "#c8a97a"; };
const focusOff = e => { e.target.style.borderColor = "#e2e8f0"; };

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
const Users = () => {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [keyword,    setKeyword]    = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [kpi, setKpi] = useState({ total: 0, admins: 0, artists: 0, members: 0 });

  const [showModal,   setShowModal]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [formError,   setFormError]   = useState("");
  const [form, setForm] = useState({
    username: "", password: "", name: "", email: "",
    phone: "", position: "", userType: 0,
  });

  const firstInputRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load danh sách (có filter, phân trang) ──────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { keyword, page, pageSize: PAGE_SIZE };
      if (roleFilter !== "") params.userType = roleFilter;
      const res  = await userApi.getAll(params);
      const data = res.data;
      setUsers(data.data || data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalCount(data.totalCount || 0);
    } catch {
      showToast("Không thể tải danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [keyword, roleFilter, page]);

  // ── Load KPI (load all để đếm chính xác) ───────────────────────
  const loadKpi = useCallback(async () => {
    try {
      const res = await userApi.getAll({ pageSize: 999 });
      const all = res.data?.data || res.data?.items || [];
      setKpi({
        total:   res.data?.totalCount || all.length,
        admins:  all.filter(u => u.userType === 1).length,
        artists: all.filter(u => u.userType === 2).length,
        members: all.filter(u => u.userType === 0).length,
      });
    } catch { /* KPI không quan trọng nếu lỗi */ }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadKpi();   }, [loadKpi]);
  useEffect(() => {
    if (showModal) setTimeout(() => firstInputRef.current?.focus(), 120);
  }, [showModal]);

  // ── Modal ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingUser(null);
    setForm({ username: "", password: "", name: "", email: "", phone: "", position: "", userType: 0 });
    setFormError("");
    setShowModal(true);
  };
  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      username: u.username || "",
      password: "",
      name:     u.name     || "",
      email:    u.email    || "",
      phone:    u.phone    || "",
      position: u.position || "",
      userType: u.userType ?? 0,
    });
    setFormError("");
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingUser(null); setFormError(""); };

  const ch = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // ── Submit form ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!editingUser && !form.password) {
      setFormError("Mật khẩu không được để trống khi tạo mới");
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          name:     form.name,
          email:    form.email,
          phone:    form.phone,
          position: form.position,
          userType: parseInt(form.userType),
        };
        if (form.password) payload.password = form.password;
        await userApi.update(editingUser.id, payload);
        showToast("Cập nhật người dùng thành công!");
      } else {
        await userApi.create({
          username: form.username,
          password: form.password,
          name:     form.name,
          email:    form.email,
          phone:    form.phone,
          position: form.position,
          userType: parseInt(form.userType),
        });
        showToast("Thêm người dùng thành công!");
      }
      closeModal();
      loadUsers();
      loadKpi();
    } catch (err) {
      setFormError(err.response?.data?.message || "Thao tác thất bại, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await userApi.delete(confirmDel.id);
      setConfirmDel(null);
      showToast(`Đã xóa "${confirmDel.name || confirmDel.username}"`, "warning");
      loadUsers();
      loadKpi();
    } catch {
      setConfirmDel(null);
      showToast("Xóa thất bại!", "error");
    }
  };

  // ── Pagination thông minh (tối đa 7 nút) ────────────────────────
  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4)             return [1,2,3,4,5,"…",totalPages];
    if (page >= totalPages - 3) return [1,"…",totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,"…",page-1,page,page+1,"…",totalPages];
  };

  const hasFilter = keyword || roleFilter;

  // ── Pagination display range ─────────────────────────────────────
  const rangeFrom = (page - 1) * PAGE_SIZE + 1;
  const rangeTo   = Math.min(page * PAGE_SIZE, totalCount);

  // ════════════════════════════════════════════════════════════════
  return (
    <div>
      <Toast toast={toast} />

      {/* ── KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
        {[
          { label:'Tất cả',        value:kpi.total,   color:'#c8a97a', bg:'#f5edd6', icon:'fa-users',        key:''  },
          { label:'Quản trị viên', value:kpi.admins,  color:'#ef4444', bg:'#fee2e2', icon:'fa-user-shield',  key:'1' },
          { label:'Họa sĩ',        value:kpi.artists, color:'#c8a97a', bg:'#fdf6ec', icon:'fa-paint-brush',  key:'2' },
          { label:'Người dùng',    value:kpi.members, color:'#3b82f6', bg:'#dbeafe', icon:'fa-user',         key:'0' },
        ].map(s => {
          const active = roleFilter === s.key;
          return (
            <div key={s.key} className="kpi-card"
              onClick={() => { setRoleFilter(s.key); setPage(1); }}
              style={{ borderTop:`3px solid ${active ? s.color : '#f1f5f9'}`, background: active ? s.bg+'55' : 'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'1.8rem', fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginTop:4 }}>{s.label}</div>
                </div>
                <div style={{ width:34, height:34, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:'0.85rem' }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search bar ── */}
      <div style={{ background: "white", borderRadius: 14, padding: "12px 16px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <i className="fas fa-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.82rem", pointerEvents: "none" }}></i>
            <input
              style={{ width: "100%", padding: "9px 36px 9px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: "0.88rem", outline: "none", background: "white", boxSizing: "border-box" }}
              placeholder="Tìm theo tên, email, username..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              onFocus={e => e.target.style.borderColor = "#c8a97a"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            {keyword && (
              <button onClick={() => { setKeyword(""); setPage(1); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1, padding: 2 }}>
                <i className="fas fa-times-circle" />
              </button>
            )}
          </div>
          {hasFilter && (
            <button onClick={() => { setRoleFilter(""); setKeyword(""); setPage(1); }}
              style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontWeight: 600, cursor: "pointer", fontSize: "0.83rem", whiteSpace: "nowrap" }}>
              <i className="fas fa-times-circle mr-1"></i> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Bảng ──────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>

        {/* Table header bar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fas fa-table" style={{ color: "#c8a97a", fontSize: "0.85rem" }}></i>
            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.92rem" }}>Danh sách người dùng</span>
            {!loading && (
              <span style={{ background: "#eef2ff", color: "#c8a97a", borderRadius: 20, padding: "2px 10px", fontSize: "0.73rem", fontWeight: 700 }}>
                {totalCount}
              </span>
            )}
            {hasFilter && (
              <span style={{ background: "#fef9c3", color: "#ca8a04", borderRadius: 20, padding: "2px 9px", fontSize: "0.72rem", fontWeight: 700 }}>
                đã lọc
              </span>
            )}
          </div>
          <button onClick={() => { loadUsers(); loadKpi(); }} title="Làm mới"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-sync-alt" style={{ fontSize: "0.78rem" }}></i>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div className="spinner-border" style={{ color: "#c8a97a" }} />
            <p style={{ marginTop: 12, color: "#94a3b8" }}>Đang tải...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 14 }}>👤</div>
            <h4 style={{ fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Không tìm thấy người dùng</h4>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              {hasFilter ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" : "Chưa có người dùng nào trong hệ thống"}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Người dùng", "Email", "Điện thoại", "Vai trò", "Thao tác"].map((h, i) => (
                    <th key={i} style={{
                      background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: "0.78rem",
                      textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 16px",
                      borderBottom: "2px solid #e2e8f0", textAlign: i === 5 ? "center" : "left", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const roleCfg = ROLE_CFG[u.userType] || ROLE_CFG[0];
                  return (
                    <tr key={u.id} className="user-row"
                      style={{ background: idx % 2 === 1 ? "#fafbff" : "white" }}>
                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontWeight: 700, width: 48 }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar user={u} size={40} />
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>
                              {u.name || u.username}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>
                        {u.email || <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>
                        {u.phone || <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: roleCfg.bg, color: roleCfg.color, padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700 }}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => openEdit(u)} title="Chỉnh sửa"
                            style={{ width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer", background: "#c8a97a18", color: "#c8a97a" }}>
                            <i className="fas fa-pen" style={{ fontSize: "0.78rem" }} />
                          </button>
                          <button onClick={() => setConfirmDel(u)} title="Xóa"
                            style={{ width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer", background: "#fee2e220", color: "#ef4444" }}>
                            <i className="fas fa-trash" style={{ fontSize: "0.78rem" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer / Pagination ──────────────────────────── */}
        {!loading && users.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Hiển thị <strong style={{ color: "#1e293b" }}>{rangeFrom}–{rangeTo}</strong> trong{" "}
              <strong style={{ color: "#1e293b" }}>{totalCount}</strong> người dùng
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", cursor: page === 1 ? "not-allowed" : "pointer", color: "#64748b", opacity: page === 1 ? 0.45 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ‹
                </button>
                {pageNums().map((n, i) =>
                  n === "…" ? (
                    <span key={`e${i}`} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>…</span>
                  ) : (
                    <button key={n} onClick={() => setPage(n)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: page === n ? "none" : "1.5px solid #e2e8f0", cursor: "pointer", background: page === n ? "#c8a97a" : "white", color: page === n ? "white" : "#64748b", fontWeight: page === n ? 700 : 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {n}
                    </button>
                  )
                )}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", cursor: page === totalPages ? "not-allowed" : "pointer", color: "#64748b", opacity: page === totalPages ? 0.45 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ MODAL THÊM / SỬA ════════════════════════════════ */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.55)",
          zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(3px)", padding: 16,
        }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: 20, width: "100%", maxWidth: 520,
            boxShadow: "0 24px 80px rgba(0,0,0,.22)", overflow: "hidden",
            maxHeight: "92vh", overflowY: "auto",
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 28px 18px",
              background: "linear-gradient(135deg,#c8a97a,#8b6c4a)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h5 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", margin: 0 }}>
                  {editingUser ? "✏️  Chỉnh Sửa Người Dùng" : "➕  Thêm Người Dùng Mới"}
                </h5>
                {editingUser && (
                  <small style={{ color: "rgba(255,255,255,.75)" }}>@{editingUser.username}</small>
                )}
              </div>
              <button onClick={closeModal} style={{ border: "none", background: "rgba(255,255,255,.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "white", fontSize: "1rem" }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
                {formError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: "0.85rem", display: "flex", gap: 8, alignItems: "center" }}>
                    <i className="fas fa-exclamation-circle" /> {formError}
                  </div>
                )}

                {/* Tên đăng nhập — chỉ khi tạo mới */}
                {!editingUser && (
                  <div>
                    <label style={labelStyle}>Tên đăng nhập *</label>
                    <input ref={firstInputRef} style={inputStyle} placeholder="VD: nguyenvana"
                      value={form.username} onChange={ch("username")}
                      onFocus={focusOn} onBlur={focusOff} required />
                  </div>
                )}

                {/* Họ và tên */}
                <div>
                  <label style={labelStyle}>Họ và tên</label>
                  <input ref={editingUser ? firstInputRef : null} style={inputStyle} placeholder="Nguyễn Văn A"
                    value={form.name} onChange={ch("name")}
                    onFocus={focusOn} onBlur={focusOff} />
                </div>

                {/* Email + Điện thoại */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" style={inputStyle} placeholder="email@example.com"
                      value={form.email} onChange={ch("email")}
                      onFocus={focusOn} onBlur={focusOff} />
                  </div>
                  <div>
                    <label style={labelStyle}>Điện thoại</label>
                    <input type="tel" style={inputStyle} placeholder="0901234567"
                      value={form.phone} onChange={ch("phone")}
                      onFocus={focusOn} onBlur={focusOff} />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label style={labelStyle}>
                    {editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}
                  </label>
                  <input type="password" style={inputStyle}
                    placeholder={editingUser ? "••••••••" : "Nhập mật khẩu"}
                    value={form.password} onChange={ch("password")}
                    onFocus={focusOn} onBlur={focusOff}
                    required={!editingUser} />
                </div>

                {/* Vai trò */}
                <div>
                  <label style={labelStyle}>Vai trò</label>
                  <select style={{ ...inputStyle, background: "white", cursor: "pointer" }}
                    value={form.userType} onChange={ch("userType")}
                    onFocus={focusOn} onBlur={focusOff}>
                    <option value={0}>Người dùng</option>
                    <option value={2}>Họa sĩ</option>
                    <option value={1}>Quản trị viên</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 28px 24px", display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9" }}>
                <button type="button" onClick={closeModal} style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                  Hủy
                </button>
                <button type="submit" disabled={saving} style={{
                  padding: "10px 28px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg,#c8a97a,#8b6c4a)",
                  color: "white", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8,
                }}>
                  {saving ? (
                    <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Đang lưu...</>
                  ) : (
                    <><i className={`fas fa-${editingUser ? "save" : "user-plus"}`} /> {editingUser ? "Lưu thay đổi" : "Thêm người dùng"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ CONFIRM DELETE ═══════════════════════════════════ */}
      {confirmDel && (
        <ConfirmDialog
          msg={`Bạn có chắc muốn xóa người dùng "${confirmDel.name || confirmDel.username}"? Hành động này không thể hoàn tác.`}
          onOk={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        .user-row { border-bottom: 1px solid #f1f5f9; transition: background .12s; }
        .user-row:hover { background: #f8f7ff !important; }
        .kpi-card { background:white; border-radius:14px; padding:20px; cursor:pointer;
          transition:all .2s; border-top:3px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
      `}</style>
    </div>
  );
};

export default Users;
