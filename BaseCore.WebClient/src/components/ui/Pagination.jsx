import React from 'react';

// Sinh dãy số trang có "…" khi nhiều trang (giữ trang đầu/cuối + lân cận trang hiện tại)
const getPageNums = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total]);
  for (let i = Math.max(2, cur - 2); i <= Math.min(total - 1, cur + 2); i++) s.add(i);
  return [...s].sort((a, b) => a - b).reduce((acc, n, i, arr) => {
    if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
    acc.push(n);
    return acc;
  }, []);
};

/**
 * Phân trang dùng chung.
 * @param {number} page       trang hiện tại (1-based)
 * @param {number} totalPages tổng số trang
 * @param {(n:number)=>void} onChange  callback khi đổi trang
 */
const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  const nums = getPageNums(page, totalPages);

  return (
    <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-2 border-[1.5px] border-line bg-white font-semibold text-[0.85rem] disabled:text-[#ddd] disabled:cursor-not-allowed enabled:text-ink enabled:cursor-pointer"
      >
        ← Trước
      </button>

      {nums.map((n, i) => n === '…' ? (
        <span key={`e${i}`} className="px-1 py-2 text-[#aaa] text-[0.85rem]">…</span>
      ) : (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-[38px] h-[38px] border-none cursor-pointer font-bold text-[0.85rem] ${
            page === n ? 'bg-ink text-white' : 'bg-white text-ink outline outline-[1.5px] outline-line'
          }`}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 border-[1.5px] border-line bg-white font-semibold text-[0.85rem] disabled:text-[#ddd] disabled:cursor-not-allowed enabled:text-ink enabled:cursor-pointer"
      >
        Sau →
      </button>
    </div>
  );
};

export default Pagination;
