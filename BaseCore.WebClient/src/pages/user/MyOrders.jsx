import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '../../services/api';
import PublicLayout from '../../components/layout/PublicLayout';
import { formatVND as fmt } from '../../utils/format';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const TABS = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'Pending',    label: 'Chờ xác nhận' },
  { key: 'Processing', label: 'Đang xử lý' },
  { key: 'Shipping',   label: 'Đang giao' },
  { key: 'Completed',  label: 'Đã giao' },
  { key: 'Cancelled',  label: 'Đã hủy' },
];

import { ORDER_STATUS as STATUS_MAP } from '../../utils/orderStatus';

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' };
  return (
    <span
      className="inline-flex items-center gap-[5px] px-3 py-1 text-[0.72rem] font-bold tracking-[0.06em]"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }}></span>
      {s.label}
    </span>
  );
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      const data = res.data?.data || res.data || [];
      setOrders(data);
    } catch (err) { console.error(err); }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <PublicLayout>
      <div className="bg-cream min-h-[80vh]">
        <div className="max-w-[960px] mx-auto px-5 py-12">

          {/* Header */}
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-[0.72rem] font-bold tracking-[0.18em] text-brand uppercase mb-2">
                Tài khoản
              </p>
              <h1 className="font-extralight text-[clamp(1.4rem,3vw,2rem)] text-ink tracking-[0.04em] m-0">
                Đơn hàng của tôi
              </h1>
              <p className="text-[0.72rem] text-[#aaa] mt-1.5">
                <i className="fas fa-sync-alt mr-1.5 text-brand" />
                Tự động cập nhật mỗi 30 giây
              </p>
            </div>
            <Link to="/shop" className="px-6 py-[11px] bg-transparent border-[1.5px] border-ink text-ink text-[0.75rem] font-bold tracking-[0.12em] uppercase no-underline inline-block">
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex flex-nowrap overflow-x-auto mb-8 border-b-[1.5px] border-line">
            {TABS.map(t => {
              const active = activeTab === t.key;
              const cnt = orders.filter(o => o.status === t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-[18px] py-[11px] border-none cursor-pointer text-[0.82rem] tracking-[0.06em] bg-transparent whitespace-nowrap -mb-[1.5px] border-b-2 transition-all ${active ? 'font-bold text-ink border-ink' : 'font-normal text-muted border-transparent'}`}
                >
                  {t.label}
                  {t.key !== 'all' && cnt > 0 && (
                    <span className="ml-1.5 text-[0.7rem] text-brand">({cnt})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-[#ede9e0] opacity-50" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[2rem] text-line mb-5">✦</p>
              <p className="font-light text-[1.1rem] text-muted mb-2">Bạn chưa có đơn hàng nào</p>
              <p className="text-[0.85rem] text-[#aaa] mb-7">Khám phá bộ sưu tập nghệ thuật của chúng tôi</p>
              <Link to="/shop" className="inline-block px-8 py-[13px] bg-ink text-white text-[0.78rem] font-bold tracking-[0.14em] uppercase no-underline">
                Khám phá ngay
              </Link>
            </div>
          )}

          {/* Tab empty */}
          {!loading && orders.length > 0 && filtered.length === 0 && (
            <div className="text-center py-[60px] text-[#aaa]">
              <p className="text-[2rem] mb-3">✦</p>
              <p className="font-light">Không có đơn hàng nào ở trạng thái này.</p>
            </div>
          )}

          {/* Danh sách đơn hàng */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {filtered.map(order => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/my-orders/${order.id}`)}
                  className="bg-white px-6 py-5 cursor-pointer border-l-[3px] border-l-transparent hover:border-l-brand shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <span className="font-semibold text-[0.92rem] text-ink">Đơn #{order.id}</span>
                      <div className="text-[#aaa] text-[0.78rem] mt-[3px]">
                        {fmtDate(order.createdAt || order.orderDate)}
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex justify-between items-center">
                    {order.items && (
                      <span className="text-[#aaa] text-[0.8rem]">
                        {order.items.length} tác phẩm
                      </span>
                    )}
                    <div className="flex items-center gap-3.5">
                      <span className="font-semibold text-ink text-[0.95rem]">
                        {fmt(order.totalAmount || order.total || 0)}
                      </span>
                      <span className="text-[0.75rem] text-brand font-bold">
                        Xem chi tiết <i className="fas fa-arrow-right text-[0.65rem]" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default MyOrders;
