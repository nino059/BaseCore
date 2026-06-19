import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { orderApi } from '../../services/api';
import { normalizeOrder, normalizeOrderList, getCustomerDisplayName } from '../../utils/orderNormalize';

// ─── Config trạng thái ────────────────────────────────────────
import { ORDER_STATUS as STATUS_CFG, ORDER_STEPS as STATUS_STEPS } from '../../utils/orderStatus';
import { formatVNDCompact as fmt } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import Toaster from '../../components/ui/Toaster';
import { ADMIN_ORDER_DATE_FILTER, ADMIN_ORDER_SORT } from '../../constants/adminFeatures';
import VnDatePicker, { VN_DATE_PICKER_STYLES } from '../../components/common/VnDatePicker';
import { isoToDayStart, recordDayStart } from '../../utils/dateFilter';

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, color:'#6b7280', bg:'#f3f4f6', icon:'fa-circle' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 10px', borderRadius:20, fontSize:'0.78rem', fontWeight:700,
      color:cfg.color, background:cfg.bg,
    }}>
      <i className={`fas ${cfg.icon}`} style={{ fontSize:'0.7rem' }}></i>
      {cfg.label}
    </span>
  );
};

const clearAllFilters = (setters) => {
  setters.setSearch('');
  setters.setFilterStatus('');
  setters.setDateFrom('');
  setters.setDateTo('');
  setters.setPage(1);
};

// ─── Smart Pagination ─────────────────────────────────────────
const pageNums = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4)  return [1,2,3,4,5,6,7,'…',total];
  if (page >= total - 3) return [1,'…',...Array.from({length:7},(_,i)=>total-6+i)];
  return [1,'…',page-1,page,page+1,'…',total];
};

const SORT_OPTIONS = [
  { value: 'date_desc',   label: 'Ngày đặt: mới nhất' },
  { value: 'date_asc',    label: 'Ngày đặt: cũ nhất' },
  { value: 'amount_desc', label: 'Tổng tiền: cao → thấp' },
  { value: 'amount_asc',  label: 'Tổng tiền: thấp → cao' },
];

const orderTimestamp = (o) => {
  const d = o.orderDate || o.createdAt;
  const t = d ? new Date(d).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

const orderAmount = (o) => Number(o.totalAmount ?? o.TotalAmount ?? 0) || 0;

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Orders = () => {
  const [allOrders,     setAllOrders]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [sortBy,        setSortBy]        = useState('date_desc');
  const [page,          setPage]          = useState(1);
  const PAGE_SIZE = 10;
  const [showModal,     setShowModal]     = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { toasts, showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await orderApi.getAll({});
      setAllOrders(normalizeOrderList(res));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Pipeline: Lọc → Sắp xếp → Phân trang (bật/tắt qua constants/adminFeatures.js)
  const filtered = useMemo(() => {
    let list = allOrders;
    if (filterStatus) list = list.filter(o => o.status === filterStatus);
    if (search) {
      const kw = search.toLowerCase();
      list = list.filter(o =>
        String(o.id).includes(kw) ||
        getCustomerDisplayName(o).toLowerCase().includes(kw)
      );
    }
    if (ADMIN_ORDER_DATE_FILTER) {
      const fromTs = isoToDayStart(dateFrom);
      const toTs = isoToDayStart(dateTo);
      if (fromTs != null) {
        list = list.filter(o => {
          const day = recordDayStart(o, 'orderDate', 'createdAt');
          return day != null && day >= fromTs;
        });
      }
      if (toTs != null) {
        list = list.filter(o => {
          const day = recordDayStart(o, 'orderDate', 'createdAt');
          return day != null && day <= toTs;
        });
      }
    }

    if (ADMIN_ORDER_SORT) {
      const sorted = [...list];
      switch (sortBy) {
        case 'date_asc':
          sorted.sort((a, b) => orderTimestamp(a) - orderTimestamp(b));
          break;
        case 'amount_desc':
          sorted.sort((a, b) => orderAmount(b) - orderAmount(a));
          break;
        case 'amount_asc':
          sorted.sort((a, b) => orderAmount(a) - orderAmount(b));
          break;
        case 'date_desc':
        default:
          sorted.sort((a, b) => orderTimestamp(b) - orderTimestamp(a));
          break;
      }
      return sorted;
    }

    return list;
  }, [allOrders, filterStatus, search, dateFrom, dateTo, sortBy]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const orders     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:      allOrders.length,
    pending:    allOrders.filter(o => o.status === 'Pending').length,
    processing: allOrders.filter(o => o.status === 'Processing').length,
    shipped:    allOrders.filter(o => o.status === 'Shipping').length,
    completed:  allOrders.filter(o => o.status === 'Completed').length,
    cancelled:  allOrders.filter(o => o.status === 'Cancelled').length,
  }), [allOrders]);

  // ── Xem chi tiết đơn hàng ──
  const handleViewDetail = async (id) => {
    try {
      const res = await orderApi.getById(id);
      const order = normalizeOrder(res.data?.order || res.data);
      if (!order) throw new Error('empty');
      setSelectedOrder(order);
      setShowModal(true);
    } catch { showToast('Không lấy được chi tiết đơn hàng', 'error'); }
  };

  const hasFilter = search || filterStatus
    || (ADMIN_ORDER_DATE_FILTER && (dateFrom || dateTo));
  const handleClearFilters = () => clearAllFilters({ setSearch, setFilterStatus, setDateFrom, setDateTo, setPage });

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        .order-row { border-bottom: 1px solid #f1f5f9; transition: background .12s; }
        .order-row:hover { background: #f8f7ff !important; }
        .status-sel { border:none; outline:none; cursor:pointer; border-radius:20px;
          padding:4px 10px; font-size:.78rem; font-weight:700; transition:filter .15s; }
        .status-sel:hover { filter:brightness(.92); }
        .action-btn { opacity:.65; transition:opacity .15s,transform .15s; }
        .action-btn:hover { opacity:1; transform:scale(1.1); }
        .chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px;
          border-radius:20px; font-size:0.78rem; font-weight:600;
          background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
        .chip-close { background:none; border:none; cursor:pointer; color:#94a3b8;
          font-size:0.9rem; line-height:1; padding:0 1px; margin-left:1px; }
        .chip-close:hover { color:#ef4444; }
        .admin-order-filters {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .admin-order-search {
          position: relative;
          width: 100%;
          min-width: 0;
        }
        .admin-order-search-input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 9px 12px 9px 34px;
          border-radius: 9px;
          border: 1.5px solid #e5e7eb;
          font-size: 0.88rem;
          outline: none;
        }
        .admin-order-search-input:focus {
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(200, 169, 122, 0.18);
        }
        .admin-order-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .admin-order-filter-select {
          flex: 1 1 200px;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .admin-order-clear-filter { flex: 0 0 auto; }
        ${VN_DATE_PICKER_STYLES}
      `}</style>

      <Toaster toasts={toasts} />

      {/* ── KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:18 }}>
        {[
          { label:'Tổng đơn',     value:stats.total,      icon:'fa-list',         color:'var(--brand)', bg:'#f5edd6', key:''           },
          { label:'Chờ xác nhận', value:stats.pending,    icon:'fa-clock',        color:'#f59e0b', bg:'#fef3c7', key:'Pending'    },
          { label:'Đang xử lý',   value:stats.processing, icon:'fa-cog',          color:'#3b82f6', bg:'#dbeafe', key:'Processing' },
          { label:'Đang giao',    value:stats.shipped,    icon:'fa-truck',        color:'var(--brand-dark)', bg:'#f5edd6', key:'Shipping'   },
          { label:'Hoàn thành',   value:stats.completed,  icon:'fa-check-circle', color:'#10b981', bg:'#d1fae5', key:'Completed'  },
          { label:'Đã hủy',       value:stats.cancelled,  icon:'fa-times-circle', color:'#ef4444', bg:'#fee2e2', key:'Cancelled'  },
        ].map((s, i) => {
          const active = i === 0 ? !filterStatus : filterStatus === s.key;
          return (
            <div key={i} className="kpi-card"
              onClick={() => { setFilterStatus(f => f === s.key ? '' : s.key); setPage(1); }}
              style={{ borderTop:`3px solid ${active ? s.color : '#f1f5f9'}`, background: active ? s.bg+'55' : 'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'1.8rem', fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginTop:4 }}>{s.label}</div>
                </div>
                <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:'0.9rem' }}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bộ lọc ── */}
      <div style={{ background:'white', borderRadius:14, padding:'14px 18px', boxShadow:'0 2px 12px rgba(0,0,0,.06)', marginBottom:18 }}>
        <div className="admin-order-filters">
          <div className="admin-order-search">
            <i className="fas fa-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:'0.82rem', pointerEvents:'none' }}></i>
            <input className="admin-order-search-input" placeholder="Tìm mã đơn, tên khách hàng..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="admin-order-filter-row">
            <select className="form-control admin-order-filter-select" value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              style={{ borderRadius:9, border:'1.5px solid #e5e7eb', fontSize:'0.87rem' }}>
              <option value="">Tất cả trạng thái</option>
              {Object.keys(STATUS_CFG).map(s => (
                <option key={s} value={s}>{STATUS_CFG[s].label}</option>
              ))}
            </select>
            {ADMIN_ORDER_SORT && (
              <select
                className="form-control admin-order-filter-select"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                style={{ borderRadius:9, border:'1.5px solid #e5e7eb', fontSize:'0.87rem' }}
                aria-label="Sắp xếp đơn hàng"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {hasFilter && (
              <button type="button" onClick={handleClearFilters}
                className="admin-order-clear-filter"
                style={{ padding:'7px 14px', borderRadius:9, border:'1.5px solid #fecaca', background:'#fef2f2', color:'#ef4444', fontWeight:600, cursor:'pointer', fontSize:'0.83rem', whiteSpace:'nowrap' }}>
                <i className="fas fa-times-circle mr-1"></i> Xóa lọc
              </button>
            )}
          </div>
          {ADMIN_ORDER_DATE_FILTER && (
            <div className="admin-order-filter-row vn-date-row">
              <VnDatePicker
                label="Từ ngày"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(v) => { setDateFrom(v); setPage(1); }}
              />
              <VnDatePicker
                label="Đến ngày"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(v) => { setDateTo(v); setPage(1); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Bảng đơn hàng ── */}
      <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,.07)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <i className="fas fa-list" style={{ color:'#f59e0b', fontSize:'0.85rem' }}></i>
            <span style={{ fontWeight:700, color:'#1e293b', fontSize:'0.92rem' }}>Danh sách đơn hàng</span>
            {!loading && (
              <span style={{ marginLeft:2, background:'#fef3c7', color:'#d97706', borderRadius:20, padding:'2px 10px', fontSize:'0.75rem', fontWeight:700 }}>
                {totalCount}
              </span>
            )}
            {hasFilter && (
              <span style={{ background:'#fef9c3', color:'#ca8a04', borderRadius:20, padding:'2px 9px', fontSize:'0.72rem', fontWeight:700 }}>
                đã lọc
              </span>
            )}
          </div>
          <button onClick={fetchOrders} title="Làm mới"
            style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fas fa-sync-alt" style={{ fontSize:'0.78rem' }}></i>
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div className="spinner-border" style={{ color:'#f59e0b', width:36, height:36 }}></div>
            <p style={{ marginTop:12, color:'#94a3b8', fontSize:'0.88rem' }}>Đang tải dữ liệu...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
            <i className="fas fa-inbox" style={{ fontSize:'2.8rem', display:'block', marginBottom:12, color:'#e2e8f0' }}></i>
            <div style={{ fontWeight:600, color:'#64748b', marginBottom:6 }}>
              {hasFilter ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
            </div>
            {hasFilter && (
              <button onClick={handleClearFilters}
                style={{ marginTop:10, padding:'7px 18px', borderRadius:8, border:'none', background:'#fef3c7', color:'#d97706', fontWeight:600, cursor:'pointer' }}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Mã đơn','Ngày đặt','Khách hàng','Sản phẩm','Tổng tiền','Trạng thái','Thao tác'].map((h, i) => (
                    <th key={i} style={{
                      padding:'10px 14px', fontSize:'0.73rem', fontWeight:700,
                      color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em',
                      borderBottom:'1px solid #f1f5f9', textAlign: i === 6 ? 'center' : 'left',
                      whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o.id} className="order-row" style={{ background: idx % 2 === 1 ? '#fafbff' : 'white', transition:'background .15s' }}>

                    {/* Mã đơn */}
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontWeight:800, color:'#f59e0b', fontSize:'0.9rem' }}>#{o.id}</span>
                    </td>

                    {/* Ngày đặt */}
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontSize:'0.84rem', color:'#475569' }}>
                        {new Date(o.orderDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                        {new Date(o.orderDate).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:'0.86rem', color:'#1e293b' }}>
                        {getCustomerDisplayName(o)}
                      </div>
                      {o.userPhone && (
                        <div style={{ fontSize:'0.76rem', color:'#94a3b8' }}>
                          <i className="fas fa-phone" style={{ fontSize:'0.65rem', marginRight:3 }}></i>{o.userPhone}
                        </div>
                      )}
                    </td>

                    {/* Sản phẩm */}
                    <td style={{ padding:'12px 14px', maxWidth:180 }}>
                      <div style={{ fontSize:'0.84rem', color:'#1e293b', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {o.items?.length > 0
                          ? o.items[0].productName
                          : '—'}
                      </div>
                      {o.items?.length > 1 && (
                        <div style={{ fontSize:'0.74rem', color:'#94a3b8' }}>+{o.items.length - 1} tranh khác</div>
                      )}
                    </td>

                    {/* Tổng tiền */}
                    <td style={{ padding:'12px 14px', fontWeight:800, color:'#dc2626', whiteSpace:'nowrap' }}>
                      {fmt(o.totalAmount)}
                    </td>

                    {/* Trạng thái — chỉ xem, Admin không thay đổi */}
                    <td style={{ padding:'12px 14px' }}>
                      <StatusBadge status={o.status} />
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding:'12px 14px', textAlign:'center', whiteSpace:'nowrap' }}>
                      <button
                        onClick={() => handleViewDetail(o.id)}
                        style={{
                          background:'none', border:'1px solid var(--brand)', color:'var(--brand)',
                          borderRadius:6, padding:'4px 10px', cursor:'pointer',
                          fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap',
                        }}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding:'12px 20px', borderTop:'1px solid #f1f5f9',
            display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafbff',
          }}>
            <span style={{ fontSize:'0.82rem', color:'#64748b' }}>
              Hiển thị{' '}
              <strong style={{ color:'#1e293b' }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}</strong>
              {' '}trong{' '}
              <strong style={{ color:'#1e293b' }}>{totalCount}</strong> đơn hàng
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background: page===1?'#f8fafc':'white', color: page===1?'#cbd5e1':'#475569', cursor: page===1?'not-allowed':'pointer', fontWeight:700 }}>
                ‹
              </button>
              {pageNums(page, totalPages).map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>…</span>
                  : <button key={n} onClick={() => setPage(n)} style={{
                      width:32, height:32, borderRadius:8,
                      border: page===n ? 'none' : '1.5px solid #e2e8f0',
                      background: page===n ? '#f59e0b' : 'white',
                      color: page===n ? 'white' : '#475569',
                      fontWeight: page===n ? 800 : 500, cursor:'pointer',
                      boxShadow: page===n ? '0 2px 8px rgba(245,158,11,.3)' : 'none',
                    }}>{n}</button>
              )}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background: page===totalPages?'#f8fafc':'white', color: page===totalPages?'#cbd5e1':'#475569', cursor: page===totalPages?'not-allowed':'pointer', fontWeight:700 }}>
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════ MODAL CHI TIẾT ════ */}
      {showModal && selectedOrder && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(15,15,35,0.6)', zIndex:1050,
          display:'flex', alignItems:'flex-start', justifyContent:'center',
          padding:'20px 0', overflowY:'auto',
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background:'white', borderRadius:18, width:'100%', maxWidth:720,
            margin:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', overflow:'hidden',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              background:'linear-gradient(135deg,#1a1a2e,#533483)',
              padding:'18px 26px', display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div>
                <h5 style={{ color:'white', fontWeight:800, margin:0, fontSize:'1.05rem' }}>
                  <i className="fas fa-receipt mr-2"></i>Đơn hàng #{selectedOrder.id}
                </h5>
                <p style={{ color:'rgba(255,255,255,.65)', margin:'3px 0 0', fontSize:'0.8rem' }}>
                  {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background:'rgba(255,255,255,.15)', border:'none', color:'white',
                width:32, height:32, borderRadius:8, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem',
              }}>✕</button>
            </div>

            <div style={{ padding:'22px 26px' }}>

              {/* Timeline trạng thái */}
              {selectedOrder.status !== 'Cancelled' && (
                <div style={{ marginBottom:22 }}>
                  <div style={{ display:'flex', alignItems:'center', position:'relative' }}>
                    <div style={{ position:'absolute', top:18, left:'6%', right:'6%', height:3, background:'#e5e7eb', zIndex:0 }}></div>
                    <div style={{
                      position:'absolute', top:18, left:'6%', height:3, zIndex:1,
                      background:'linear-gradient(90deg,var(--brand),var(--brand-dark))',
                      width:`${(STATUS_STEPS.indexOf(selectedOrder.status) / (STATUS_STEPS.length - 1)) * 88}%`,
                      transition:'width .5s',
                    }}></div>
                    {STATUS_STEPS.map((s, i) => {
                      const cfg  = STATUS_CFG[s];
                      const done = STATUS_STEPS.indexOf(selectedOrder.status) >= i;
                      return (
                        <div key={s} style={{ textAlign:'center', zIndex:2, flex:1 }}>
                          <div style={{
                            width:36, height:36, borderRadius:'50%', margin:'0 auto',
                            background: done ? 'var(--brand)' : '#e5e7eb',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            boxShadow: done ? '0 0 0 4px rgba(124,58,237,0.18)' : 'none',
                            transition:'all .3s',
                          }}>
                            <i className={`fas ${cfg.icon}`} style={{ color: done ? 'white' : '#9ca3af', fontSize:'0.85rem' }}></i>
                          </div>
                          <div style={{ fontSize:'0.7rem', marginTop:5, color: done ? 'var(--brand)' : '#9ca3af', fontWeight: done ? 700 : 400 }}>
                            {cfg.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Info đơn hàng */}
              <div style={{ marginBottom:20 }}>
                <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px' }}>
                  <h6 style={{ fontWeight:700, marginBottom:12, fontSize:'0.88rem', color:'#374151' }}>
                    <i className="fas fa-info-circle mr-1" style={{ color:'var(--brand)' }}></i> Thông tin đơn
                  </h6>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
                    <div style={{ fontSize:'0.85rem' }}>
                      <span style={{ color:'#6b7280' }}>Khách hàng: </span>
                      <strong>{getCustomerDisplayName(selectedOrder)}</strong>
                    </div>
                    <div style={{ fontSize:'0.85rem' }}>
                      <span style={{ color:'#6b7280' }}>Số điện thoại: </span>
                      <span>{selectedOrder.userPhone || selectedOrder.phone || '—'}</span>
                    </div>
                    <div style={{ fontSize:'0.85rem' }}>
                      <span style={{ color:'#6b7280' }}>Tổng tiền: </span>
                      <strong style={{ color:'#dc2626', fontSize:'1rem' }}>{fmt(selectedOrder.totalAmount)}</strong>
                    </div>
                    <div style={{ fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'#6b7280' }}>Trạng thái: </span>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    <div style={{ fontSize:'0.85rem' }}>
                      <span style={{ color:'#6b7280' }}>Thanh toán: </span>
                      <span>{selectedOrder.paymentMethod || 'COD'}</span>
                    </div>
                    {(selectedOrder.shippingAddress || selectedOrder.address) && (
                      <div style={{ fontSize:'0.85rem', gridColumn:'1 / -1', paddingTop:8, borderTop:'1px solid #e5e7eb', marginTop:4 }}>
                        <i className="fas fa-map-marker-alt mr-1" style={{ color:'#ef4444' }}></i>
                        <span style={{ color:'#6b7280' }}>Địa chỉ: </span>
                        <span>{selectedOrder.shippingAddress || selectedOrder.address}</span>
                      </div>
                    )}
                    {selectedOrder.note && (
                      <div style={{ fontSize:'0.85rem', gridColumn:'1 / -1', paddingTop:8, borderTop:'1px solid #e5e7eb', marginTop:4 }}>
                        <i className="fas fa-sticky-note mr-1" style={{ color:'#f59e0b' }}></i>
                        <span style={{ color:'#6b7280' }}>Ghi chú: </span>
                        <em>{selectedOrder.note}</em>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <h6 style={{ fontWeight:700, marginBottom:10, fontSize:'0.88rem', color:'#374151' }}>
                <i className="fas fa-shopping-cart mr-1" style={{ color:'var(--brand)' }}></i> Sản phẩm trong đơn
              </h6>
              <div style={{ borderRadius:10, overflow:'hidden', border:'1.5px solid #e5e7eb' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Sản phẩm','Đơn giá','Thành tiền'].map((h, i) => (
                        <th key={i} style={{
                          padding:'9px 12px', fontSize:'0.73rem', fontWeight:700,
                          color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em',
                          textAlign: i > 0 ? 'center' : 'left', borderBottom:'1px solid #e5e7eb',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:'0.85rem' }}>
                          Không có thông tin sản phẩm
                        </td>
                      </tr>
                    ) : (selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'10px 12px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.productName}
                                style={{ width:40, height:40, objectFit:'cover', borderRadius:8 }} />
                            )}
                            <span style={{ fontWeight:600, fontSize:'0.86rem', color:'#1e293b' }}>
                              {item.productName}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'center', fontSize:'0.85rem', color:'#64748b' }}>
                          {fmt(item.unitPrice)}
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'center', fontWeight:800, color:'var(--brand)' }}>
                          {fmt(item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'#f8fafc' }}>
                      <td colSpan={2} style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, fontSize:'0.88rem' }}>
                        Tổng cộng:
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'center', fontWeight:900, fontSize:'1rem', color:'var(--brand)' }}>
                        {fmt(selectedOrder.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 26px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', background:'#fafbff' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding:'9px 24px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'white', color:'#374151', fontWeight:600, cursor:'pointer' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .kpi-card { background:white; border-radius:14px; padding:20px; cursor:pointer;
          transition:all .2s; border-top:3px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
      `}</style>
    </div>
  );
};

export default Orders;
