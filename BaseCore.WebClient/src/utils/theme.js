// Nguồn màu thương hiệu duy nhất (đồng bộ với CSS variables trong index.css).
// Dùng cho inline style trong JS. Ưu tiên var(--token) để chỉ cần sửa 1 nơi.
export const theme = {
  brand:      'var(--brand)',       // #c8a97a
  brandDark:  'var(--brand-dark)',  // #8b6c4a
  brandLight: 'var(--brand-light)', // #e8d5a8
  ink:        'var(--ink)',         // #1a1a1a
};

// Giá trị hex thô (khi cần tính toán/đổ vào canvas, nơi var() không dùng được)
export const colors = {
  brand:      '#c8a97a',
  brandDark:  '#8b6c4a',
  brandLight: '#e8d5a8',
  ink:        '#1a1a1a',
};

export default theme;
