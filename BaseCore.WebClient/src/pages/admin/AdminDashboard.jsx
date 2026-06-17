import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productApi, userApi, categoryApi, orderApi, blogApi } from "../../services/api";

// ─── Constants ────────────────────────────────────────────────
import { ORDER_STATUS as STATUS_CFG } from "../../utils/orderStatus";

import { formatVNDCompact as fmt } from "../../utils/format";

// ─── Bar Chart ────────────────────────────────────────────────
const BarChart = ({ data, color = "var(--brand)" }) => {
  if (!data || data.length === 0) return null;
  const W = 480, H = 130, PX = 24, PY = 18, PB = 22;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const slotW  = (W - 2 * PX) / data.length;
  const barW   = Math.min(slotW * 0.5, 36);

  return (
    <svg viewBox={`0 0 ${W} ${H + PB}`} style={{ width: "100%", height: 155 }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="1"  />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0, 0.5, 1].map((f, i) => {
        const y = PY + (1 - f) * (H - PY);
        return <line key={i} x1={PX} y1={y} x2={W - PX} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />;
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const bh = d.value > 0 ? Math.max(4, (d.value / maxVal) * (H - PY)) : 0;
        const x  = PX + i * slotW + slotW / 2 - barW / 2;
        const y  = PY + (H - PY) - bh;
        return (
          <g key={i}>
            {bh > 0 && <rect x={x} y={y} width={barW} height={bh} fill="url(#barGrad)" rx="5" />}
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
                {d.value}
              </text>
            )}
            <text x={PX + i * slotW + slotW / 2} y={H + PB - 3}
              textAnchor="middle" fontSize="10" fill="#94a3b8">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Area Chart ───────────────────────────────────────────────
const AreaChart = ({ data, color = "#10b981", showValues = false }) => {
  if (!data || data.length < 2) return null;
  const W = 480, H = 130, PX = 24, PY = 18, PB = 22;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => [
    PX + (i * (W - 2 * PX)) / (data.length - 1),
    PY + (1 - d.value / maxVal) * (H - PY),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + PB}`} style={{ width: "100%", height: 155 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => {
        const y = PY + (1 - f) * (H - PY);
        return <line key={i} x1={PX} y1={y} x2={W - PX} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />;
      })}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line}  fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="white" stroke={color} strokeWidth="2.5" />
      ))}
      {data.map((d, i) => (
        <g key={i}>
          <text x={pts[i][0]} y={H + PB - 3} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {d.label}
          </text>
          {showValues && d.value > 0 && (
            <text 
              x={pts[i][0]} 
              y={pts[i][1] - 10} 
              textAnchor="middle" 
              fontSize="9" 
              fontWeight="600" 
              fill="var(--ink)"
            >
              {Number(d.value).toLocaleString("vi-VN")}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const Dashboard = () => {
  const navigate = useNavigate();

  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState({ products: 0, activeProducts: 0, hiddenProducts: 0, categories: 0, users: 0, orders: 0, blogs: 0, revenue: 0 });
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [monthlyRev,    setMonthlyRev]    = useState([]);
  const [statusDist,    setStatusDist]    = useState([]);
  const [recentOrders,  setRecentOrders]  = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Tạo 6 tháng gần nhất - an toàn, tránh lỗi năm và múi giờ
      const getLast6Months = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleString("vi-VN", { month: "short" }),
          });
        }
        return months;
      };
      const last6 = getLast6Months();

      const [prodRes, prodActiveRes, catRes, usersRes, ordersRes, blogsRes] = await Promise.all([
        productApi.getAll({ pageSize: 1, admin: true }),
        productApi.getAll({ pageSize: 1 }),
        categoryApi.getAll(),
        userApi.getAll({ pageSize: 1 }),
        orderApi.getAll({ pageSize: 200 }),
        blogApi.getAll({ pageSize: 1 }),
      ]);

      const usersCount    = usersRes.data?.totalCount || 0;
      const raw           = ordersRes.data;
      const orders        = raw?.items || raw?.data || (Array.isArray(raw) ? raw : []);

      // ── KPI ──────────────────────────────────────────────
      const revenue = orders
        .filter(o => o.status === "Completed")
        .reduce((s, o) => s + (o.totalAmount || 0), 0);

      const totalProducts  = prodRes.data?.totalCount || 0;
      const activeProducts = prodActiveRes.data?.totalCount || 0;

      const blogsCount = blogsRes.data?.totalCount || (Array.isArray(blogsRes.data?.items) ? blogsRes.data.items.length : 0);

      setStats({
        products:       totalProducts,
        activeProducts,
        hiddenProducts: totalProducts - activeProducts,
        categories: catRes.data?.length || 0,
        users:      usersCount,
        orders:     orders.length,
        blogs:      blogsCount,
        revenue,
      });

      // ── Monthly order count & revenue (hardened) ───────────────────────────────
      const safeParseDate = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
      };

      setMonthlyOrders(last6.map(m => ({
        label: m.label,
        value: orders.filter(o => {
          const d = safeParseDate(o.orderDate);
          return d && d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length,
      })));

      setMonthlyRev(last6.map(m => ({
        label: m.label,
        value: orders
          .filter(o => {
            const d = safeParseDate(o.orderDate);
            return d && d.getMonth() === m.month && d.getFullYear() === m.year && o.status === "Completed";
          })
          .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
      })));

      // ── Status distribution ───────────────────────────────
      const statusCounts = {};
      orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const total = orders.length || 1;
      setStatusDist(
        Object.entries(STATUS_CFG).map(([k, v]) => ({
          key:   k,
          label: v.label,
          color: v.color,
          count: statusCounts[k] || 0,
          pct:   Math.round(((statusCounts[k] || 0) / total) * 100),
        }))
      );

      // ── Recent orders (6 mới nhất) ────────────────────────
      setRecentOrders(
        [...orders]
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
          .slice(0, 6)
      );
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const completedCount = statusDist.find(s => s.key === "Completed")?.count || 0;

  return (
    <div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <div className="spinner-border" style={{ color: "var(--brand)", width: 44, height: 44 }} />
          <p style={{ marginTop: 14, color: "#94a3b8", fontSize: "0.9rem" }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16, marginBottom: 24,
          }}>
            {[
              { label: "Tác phẩm",   value: stats.activeProducts, color: "var(--brand)", icon: "fa-palette",      href: "/products",   sub: stats.hiddenProducts > 0 ? `${stats.hiddenProducts} ẩn/hết` : null },
              { label: "Thể loại",   value: stats.categories,     color: "var(--brand-dark)", icon: "fa-layer-group",   href: "/categories", sub: null },
              { label: "Đơn hàng",   value: stats.orders,         color: "#f59e0b", icon: "fa-shopping-bag",  href: "/orders",     sub: null },
              { label: "Bài viết",   value: stats.blogs,          color: "#7c3aed", icon: "fa-pen-fancy",     href: "/admin/blog", sub: null },
              { label: "Người dùng", value: stats.users,          color: "#10b981", icon: "fa-users",         href: "/users",      sub: null },
            ].map((k, i) => (
              <div key={i}
                style={{
                  background: "white", borderRadius: 14, padding: "20px",
                  borderTop: `3px solid ${k.color}`, boxShadow: "0 2px 12px rgba(0,0,0,.06)",
                  cursor: k.href ? "pointer" : "default", transition: "all .2s",
                }}
                onClick={() => k.href && navigate(k.href)}
                onMouseEnter={e => {
                  if (k.href) {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.10)";
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)";
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{
                      fontSize: typeof k.value === "string" ? "1.1rem" : "2rem",
                      fontWeight: 900, color: k.color, lineHeight: 1,
                    }}>
                      {k.value}
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginTop: 5 }}>{k.label}</div>
                    {k.sub && <div style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 600, marginTop: 3 }}>⚠ {k.sub}</div>}
                    {!k.sub && k.href && <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 3 }}>Nhấn để xem →</div>}
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${k.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`fas ${k.icon}`} style={{ color: k.color, fontSize: "1.1rem" }}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts row ─────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

            {/* Biểu đồ cột: đơn hàng / tháng */}
            <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 14px rgba(0,0,0,.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h6 style={{ fontWeight: 800, color: "#1e293b", margin: 0, fontSize: "0.95rem" }}>
                    Đơn hàng theo tháng
                  </h6>
                  <p style={{ fontSize: "0.76rem", color: "#94a3b8", margin: "2px 0 0" }}>
                    6 tháng gần nhất
                  </p>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--brand)18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-chart-bar" style={{ color: "var(--brand)", fontSize: "0.9rem" }} />
                </div>
              </div>
              <BarChart data={monthlyOrders} color="var(--brand)" />
            </div>

            {/* Biểu đồ area: doanh thu / tháng */}
            <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 14px rgba(0,0,0,.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h6 style={{ fontWeight: 800, color: "#1e293b", margin: 0, fontSize: "0.95rem" }}>
                    Doanh thu theo tháng
                  </h6>
                  <p style={{ fontSize: "0.76rem", color: "#94a3b8", margin: "2px 0 0" }}>
                    6 tháng gần nhất
                  </p>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#10b98118", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-chart-area" style={{ color: "#10b981", fontSize: "0.9rem" }} />
                </div>
              </div>
              <AreaChart data={monthlyRev} color="#10b981" showValues={true} />
              <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: 6, textAlign: "right", fontWeight: 600 }}>
                Đơn vị: VNĐ
              </div>
            </div>
          </div>

          {/* ── Bottom row ─────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

            {/* Đơn hàng gần nhất */}
            <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 14px rgba(0,0,0,.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h6 style={{ fontWeight: 800, color: "#1e293b", margin: 0, fontSize: "0.95rem" }}>
                  Đơn hàng gần nhất
                </h6>
                <Link to="/orders" style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
                  Xem tất cả →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
                  <i className="fas fa-inbox" style={{ fontSize: "2.2rem", display: "block", marginBottom: 10 }} />
                  Chưa có đơn hàng nào
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Mã đơn", "Ngày đặt", "Khách hàng", "Tổng tiền", "Trạng thái"]
                          .map((h, i) => (
                            <th key={i} style={{
                              fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8",
                              textTransform: "uppercase", letterSpacing: "0.05em",
                              padding: "8px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "left",
                            }}>{h}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(o => {
                        const sCfg = STATUS_CFG[o.status] || { label: o.status, color: "#6b7280" };
                        return (
                          <tr key={o.id}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}>
                            <td style={{ padding: "10px 10px", borderBottom: "1px solid #f8fafc", fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)" }}>
                              #{o.id}
                            </td>
                            <td style={{ padding: "10px 10px", borderBottom: "1px solid #f8fafc", fontSize: "0.79rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {new Date(o.orderDate).toLocaleDateString("vi-VN")}
                            </td>
                            <td style={{ padding: "10px 10px", borderBottom: "1px solid #f8fafc", fontSize: "0.84rem", color: "#334155", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {o.userName || o.userEmail || `#${o.userId}`}
                            </td>
                            <td style={{ padding: "10px 10px", borderBottom: "1px solid #f8fafc", fontSize: "0.84rem", fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                              {(o.totalAmount || 0).toLocaleString("vi-VN")}₫
                            </td>
                            <td style={{ padding: "10px 10px", borderBottom: "1px solid #f8fafc" }}>
                              <span style={{
                                background: `${sCfg.color}18`, color: sCfg.color,
                                padding: "3px 9px", borderRadius: 20,
                                fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
                              }}>
                                {sCfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Phân bổ trạng thái + doanh thu */}
            <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 14px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 0 }}>
              <h6 style={{ fontWeight: 800, color: "#1e293b", margin: "0 0 18px", fontSize: "0.95rem" }}>
                Phân bổ trạng thái
              </h6>

              <div style={{ display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>
                {statusDist.map(s => (
                  <div key={s.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>{s.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: s.color }}>
                        {s.count} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({s.pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 7, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${s.pct}%`, background: s.color,
                        borderRadius: 10, transition: "width .7s cubic-bezier(.4,0,.2,1)",
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue summary */}
              <div style={{
                marginTop: 22, background: "linear-gradient(135deg,var(--brand),var(--brand-dark))",
                borderRadius: 12, padding: "16px 18px", color: "white",
              }}>
                <div style={{ fontSize: "0.72rem", opacity: 0.8, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Tổng doanh thu
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, lineHeight: 1.25 }}>
                  {fmt(stats.revenue)}
                </div>
                <div style={{ fontSize: "0.74rem", opacity: 0.75, marginTop: 4 }}>
                  Từ {completedCount} đơn hoàn thành
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
