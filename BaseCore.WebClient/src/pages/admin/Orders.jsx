import React, { useState, useEffect, useCallback } from 'react';
import { orderApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// ===== Config trạng thái =====
const STATUS_CONFIG = {
  Pending:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7', icon: 'fa-clock' },
  Processing: { label: 'Đang xử lý',   color: '#3b82f6', bg: '#dbeafe', icon: 'fa-cog' },
  Shipped:    { label: 'Đang giao',    color: '#8b5cf6', bg: '#ede9fe', icon: 'fa-truck' },
  Completed:  { label: 'Hoàn thành',  color: '#10b981', bg: '#d1fae5', icon: 'fa-check-circle' },
  Cancelled:  { label: 'Đã hủy',      color: '#ef4444', bg: '#fee2e2', icon: 'fa-times-circle' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', icon: 'fa-circle' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>
      <i className={`fas ${cfg.icon}`} style={{ fontSize: '0.7rem' }}></i>
      {cfg.label}
    </span>
  );
};

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Completed'];

const Orders = () => {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');  // ← MỚI: filter theo trạng thái
  const [page, setPage]                   = useState(1);
  const [pageSize]                        = useState(10);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalCount, setTotalCount]       = useState(0);   // ← MỚI: đếm tổng
  const [showModal, setShowModal]         = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate]   = useState('');
  const [updating, setUpdating]           = useState(false); // ← MỚI: loading khi update
  const { isAdmin } = useAuth();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { keyword: search, page, pageSize };
      if (filterStatus) params.status = filterStatus; // ← gửi filter lên API
      const apiCall = isAdmin ? orderApi.getAll : orderApi.getMyOrders;
      const response = await apiCall(params);
      const data = response.data?.items || response.data?.data || response.data || [];
      setOrders(Array.isArray(data) ? data : []);
      const count = response.data?.totalCount || (Array.isArray(data) ? data.length : 0);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    }
    setLoading(false);
  }, [isAdmin, search, filterStatus, page, pageSize]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn XÓA VĨNH VIỄN đơn hàng này?')) return;
    try {
      await orderApi.delete(id);
      fetchOrders();
    } catch { alert('Xóa thất bại!'); }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Bạn có chắc muốn HỦY đơn hàng này không?')) return;
    try {
      await orderApi.update(id, { status: 'Cancelled' });
      fetchOrders();
    } catch { alert('Hủy đơn thất bại!'); }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await orderApi.getById(id);
      const orderData = {
        ...(response.data.order || response.data),
        items: response.data.details || response.data.items || [],
      };
      setSelectedOrder(orderData);
      setStatusUpdate(orderData.status || 'Pending');
      setShowModal(true);
    } catch { alert('Không lấy được chi tiết đơn hàng'); }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await orderApi.update(selectedOrder.id, { ...selectedOrder, status: statusUpdate });
      setSelectedOrder(prev => ({ ...prev, status: statusUpdate }));
      setShowModal(false);
      fetchOrders();
    } catch { alert('Cập nhật thất bại'); }
    setUpdating(false);
  };

  // Thống kê nhanh từ data hiện tại
  const stats = {
    pending:    orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    completed:  orders.filter(o => o.status === 'Completed').length,
    cancelled:  orders.filter(o => o.status === 'Cancelled').length,
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0" style={{ fontWeight: 700 }}>
            <i className="fas fa-shopping-bag mr-2" style={{ color: '#7c3aed' }}></i>
            Quản lý Đơn hàng
          </h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">

          {/* ===== STAT CARDS (chỉ admin thấy) ===== */}
          {isAdmin && (
            <div className="row mb-4">
              {[
                { label: 'Tổng đơn',      value: totalCount,       icon: 'fa-list',         color: '#7c3aed', bg: '#ede9fe' },
                { label: 'Chờ xác nhận',  value: stats.pending,    icon: 'fa-clock',        color: '#f59e0b', bg: '#fef3c7' },
                { label: 'Đang xử lý',    value: stats.processing, icon: 'fa-cog',          color: '#3b82f6', bg: '#dbeafe' },
                { label: 'Hoàn thành',    value: stats.completed,  icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5' },
                { label: 'Đã hủy',        value: stats.cancelled,  icon: 'fa-times-circle', color: '#ef4444', bg: '#fee2e2' },
              ].map((s, i) => (
                <div className="col" key={i}>
                  <div style={{
                    background: 'white', borderRadius: 12, padding: '16px 20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', border: filterStatus === (i === 0 ? '' : Object.keys(STATUS_CONFIG)[i-1]) ? '2px solid #7c3aed' : '2px solid transparent',
                  }}
                    onClick={() => { setFilterStatus(i === 0 ? '' : Object.keys(STATUS_CONFIG)[i-1]); setPage(1); }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== BẢNG ĐƠN HÀNG ===== */}
          <div className="card" style={{ borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div className="card-header" style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '16px 20px' }}>
              <div className="row align-items-center">
                <div className="col-md-8">
                  <form onSubmit={handleSearch} className="form-inline" style={{ gap: 8 }}>
                    <input
                      type="text" className="form-control mr-2"
                      placeholder="Tìm mã đơn, khách hàng..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      style={{ borderRadius: 8, minWidth: 200 }}
                    />
                    <select
                      className="form-control mr-2" value={filterStatus}
                      onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                      style={{ borderRadius: 8 }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 8 }}>
                      <i className="fas fa-search mr-1"></i> Tìm
                    </button>
                  </form>
                </div>
                <div className="col-md-4 text-right">
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Tổng: <strong style={{ color: '#1f2937' }}>{totalCount}</strong> đơn hàng
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: '#7c3aed' }}></div>
                  <p className="mt-2 text-muted">Đang tải...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: '#f9fafb' }}>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày đặt</th>
                        {isAdmin && <th>Khách hàng</th>}
                        <th>Sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 7 : 6} className="text-center py-5">
                            <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#d1d5db' }}></i>
                            <p className="mt-2 text-muted">Không có đơn hàng nào</p>
                          </td>
                        </tr>
                      ) : orders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <strong style={{ color: '#7c3aed' }}>#{order.id}</strong>
                          </td>
                          <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {new Date(order.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          {isAdmin && (
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {order.userName || order.userEmail || `User #${order.userId}`}
                              </div>
                            </td>
                          )}
                          <td style={{ fontSize: '0.875rem' }}>
                            {order.items?.length > 0
                              ? `${order.items[0].productName}${order.items.length > 1 ? ` +${order.items.length - 1} sp` : ''}`
                              : `${order.itemCount || 0} sản phẩm`}
                          </td>
                          <td style={{ fontWeight: 700, color: '#7c3aed' }}>
                            {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                          </td>
                          <td><StatusBadge status={order.status} /></td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary mr-1"
                              onClick={() => handleViewDetail(order.id)}
                              style={{ borderRadius: 6 }} title="Xem chi tiết"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {isAdmin ? (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(order.id)}
                                style={{ borderRadius: 6 }} title="Xóa"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            ) : (
                              order.status === 'Pending' && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleCancelOrder(order.id)}
                                  style={{ borderRadius: 6 }}
                                >
                                  Hủy đơn
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer d-flex justify-content-end" style={{ background: 'white', borderTop: '1px solid #f3f4f6' }}>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => p - 1)}>«</button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(i => (
                    <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i)}
                        style={page === i ? { background: '#7c3aed', borderColor: '#7c3aed' } : {}}
                      >{i}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => p + 1)}>»</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== MODAL CHI TIẾT ===== */}
      {showModal && selectedOrder && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

                {/* Header modal */}
                <div className="modal-header" style={{
                  background: 'linear-gradient(135deg, #1a1a2e, #533483)',
                  color: 'white', borderRadius: '16px 16px 0 0', padding: '20px 24px'
                }}>
                  <div>
                    <h5 className="modal-title mb-0" style={{ fontWeight: 700 }}>
                      <i className="fas fa-receipt mr-2"></i>
                      Đơn hàng #{selectedOrder.id}
                    </h5>
                    <small style={{ opacity: 0.7 }}>
                      {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}
                    </small>
                  </div>
                  <button onClick={() => setShowModal(false)}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div className="modal-body" style={{ padding: '24px 28px' }}>

                  {/* Timeline trạng thái */}
                  {selectedOrder.status !== 'Cancelled' && (
                    <div className="mb-4">
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 18, left: '6%', right: '6%', height: 3, background: '#e5e7eb', zIndex: 0 }}></div>
                        <div style={{
                          position: 'absolute', top: 18, left: '6%', height: 3, zIndex: 1,
                          background: '#7c3aed',
                          width: `${(STATUS_STEPS.indexOf(selectedOrder.status) / (STATUS_STEPS.length - 1)) * 88}%`,
                        }}></div>
                        {STATUS_STEPS.map((s, i) => {
                          const cfg = STATUS_CONFIG[s];
                          const done = STATUS_STEPS.indexOf(selectedOrder.status) >= i;
                          return (
                            <div key={s} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%', margin: '0 auto',
                                background: done ? '#7c3aed' : '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <i className={`fas ${cfg.icon}`} style={{ color: done ? 'white' : '#9ca3af', fontSize: '0.85rem' }}></i>
                              </div>
                              <div style={{ fontSize: '0.72rem', marginTop: 6, color: done ? '#7c3aed' : '#9ca3af', fontWeight: done ? 700 : 400 }}>
                                {cfg.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="row mb-3">
                    {/* Thông tin đơn */}
                    <div className="col-md-6">
                      <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
                        <h6 style={{ fontWeight: 700, marginBottom: 10 }}>Thông tin đơn</h6>
                        <p className="mb-1" style={{ fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Khách hàng: </span>
                          <strong>{selectedOrder.userName || `User #${selectedOrder.userId}`}</strong>
                        </p>
                        <p className="mb-1" style={{ fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Tổng cộng: </span>
                          <strong style={{ color: '#7c3aed', fontSize: '1rem' }}>
                            {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}₫
                          </strong>
                        </p>
                        <p className="mb-0" style={{ fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Trạng thái: </span>
                          <StatusBadge status={selectedOrder.status} />
                        </p>
                      </div>
                    </div>

                    {/* Cập nhật trạng thái (chỉ admin) */}
                    {isAdmin && (
                      <div className="col-md-6">
                        <div style={{ background: '#faf5ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #ede9fe' }}>
                          <h6 style={{ fontWeight: 700, marginBottom: 10, color: '#7c3aed' }}>
                            <i className="fas fa-edit mr-2"></i>Cập nhật trạng thái
                          </h6>
                          <select
                            className="form-control mb-2"
                            value={statusUpdate}
                            onChange={e => setStatusUpdate(e.target.value)}
                            style={{ borderRadius: 8, borderColor: '#a78bfa' }}
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn btn-sm btn-block"
                            onClick={handleUpdateStatus}
                            disabled={updating || statusUpdate === selectedOrder.status}
                            style={{
                              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                              color: 'white', border: 'none', borderRadius: 8, fontWeight: 600
                            }}
                          >
                            {updating
                              ? <><span className="spinner-border spinner-border-sm mr-1"></span>Đang lưu...</>
                              : <><i className="fas fa-save mr-1"></i>Lưu trạng thái</>
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Danh sách sản phẩm trong đơn */}
                  <h6 style={{ fontWeight: 700, marginBottom: 12 }}>
                    <i className="fas fa-shopping-cart mr-2" style={{ color: '#7c3aed' }}></i>
                    Sản phẩm trong đơn
                  </h6>
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <table className="table table-sm mb-0">
                      <thead style={{ background: '#f9fafb' }}>
                        <tr>
                          <th>Sản phẩm</th>
                          <th className="text-center">SL</th>
                          <th className="text-right">Đơn giá</th>
                          <th className="text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.productName}
                                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                )}
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.productName}</span>
                              </div>
                            </td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right">{(item.unitPrice || 0).toLocaleString('vi-VN')}₫</td>
                            <td className="text-right" style={{ fontWeight: 700, color: '#7c3aed' }}>
                              {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('vi-VN')}₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot style={{ background: '#f9fafb' }}>
                        <tr>
                          <td colSpan={3} className="text-right" style={{ fontWeight: 700 }}>Tổng cộng:</td>
                          <td className="text-right" style={{ fontWeight: 800, fontSize: '1rem', color: '#7c3aed' }}>
                            {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}₫
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #f3f4f6', padding: '16px 28px' }}>
                  <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}
                    style={{ borderRadius: 8 }}>Đóng</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        </>
      )}
    </div>
  );
};

export default Orders;