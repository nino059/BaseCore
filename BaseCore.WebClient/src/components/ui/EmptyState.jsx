import React from 'react';

/**
 * Trạng thái rỗng / lỗi dùng chung (icon ✦ + tiêu đề + mô tả + nút hành động tùy chọn).
 * @param {string} title       dòng chính
 * @param {string} message     dòng phụ (tùy chọn)
 * @param {string} actionLabel nhãn nút (tùy chọn)
 * @param {()=>void} onAction  callback khi bấm nút
 * @param {string} symbol      ký hiệu trang trí (mặc định ✦)
 * @param {string} tone        'default' | 'error' — đổi màu tiêu đề khi lỗi
 */
const EmptyState = ({ title, message, actionLabel, onAction, symbol = '✦', tone = 'default' }) => (
  <div className="text-center py-20 px-5">
    <p className="text-[2.5rem] text-line mb-4">{symbol}</p>
    {title && (
      <p className={`font-light text-base mb-2 ${tone === 'error' ? 'text-[#991b1b]' : 'text-muted'}`}>
        {title}
      </p>
    )}
    {message && <p className="text-[#aaa] text-[0.88rem] mb-5">{message}</p>}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-7 py-3 bg-ink text-white border-none cursor-pointer text-[0.78rem] font-bold tracking-[0.14em] uppercase"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
