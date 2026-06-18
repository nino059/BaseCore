/** Giới hạn và validation cho bộ lọc / tìm kiếm Shop */

export const PRICE_MIN = 0;
export const PRICE_MAX = 10_000_000_000; // 10 tỷ VND
export const SIZE_MIN = 0;
export const SIZE_MAX = 1000; // cm

const fmtLimit = (n) => Number(n).toLocaleString('vi-VN');

export function parseNumericInput(raw) {
  if (raw === '' || raw == null) return { value: null, error: null };
  const trimmed = String(raw).trim();
  if (trimmed === '') return { value: null, error: null };
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return { value: null, error: 'Vui lòng nhập số hợp lệ' };
  return { value: num, error: null };
}

export function validatePriceValue(num) {
  if (num < PRICE_MIN) return 'Giá không được âm';
  if (num > PRICE_MAX) return `Giá tối đa là ${fmtLimit(PRICE_MAX)} đ`;
  return null;
}

export function validateSizeValue(num) {
  if (num < SIZE_MIN) return 'Kích thước không được âm';
  if (num > SIZE_MAX) return `Kích thước tối đa là ${SIZE_MAX} cm`;
  return null;
}

export function validateFilterField(raw, type) {
  const { value, error } = parseNumericInput(raw);
  if (error) return error;
  if (value === null) return null;
  return type === 'price' ? validatePriceValue(value) : validateSizeValue(value);
}

export function validateFilterRange(minRaw, maxRaw, type) {
  const minErr = validateFilterField(minRaw, type);
  const maxErr = validateFilterField(maxRaw, type);
  if (minErr || maxErr) return null;

  const minVal = minRaw !== '' && minRaw != null ? Number(minRaw) : null;
  const maxVal = maxRaw !== '' && maxRaw != null ? Number(maxRaw) : null;
  if (minVal != null && maxVal != null && minVal > maxVal) {
    return type === 'price'
      ? 'Giá tối thiểu không được lớn hơn giá tối đa'
      : 'Kích thước tối thiểu không được lớn hơn kích thước tối đa';
  }
  return null;
}

/** Trích số từ chuỗi tìm kiếm (bỏ dấu chấm/phẩy ngăn cách hàng nghìn) */
export function extractNumbersFromQuery(q) {
  const cleaned = String(q)
    .toLowerCase()
    .replace(/đ|vnđ|vnd|triệu|tỷ|tr\b/gi, ' ')
    .replace(/(\d)[.,](?=\d{3}\b)/g, '$1');

  const matches = cleaned.match(/-?\d+(?:[.,]\d+)?/g);
  if (!matches) return [];

  return matches
    .map((token) => Number(token.replace(',', '.')))
    .filter((n) => Number.isFinite(n));
}

export function validateSearchQuery(q) {
  const trimmed = (q || '').trim();
  if (!trimmed) return null;

  const hasCm = /\bcm\b/i.test(trimmed);
  const numbers = extractNumbersFromQuery(trimmed);

  for (const n of numbers) {
    if (n < 0) return 'Không được nhập số âm';
    if (hasCm && n > SIZE_MAX) return `Kích thước tìm kiếm tối đa là ${SIZE_MAX} cm`;
    if (!hasCm && n > PRICE_MAX) return `Giá tìm kiếm tối đa là ${fmtLimit(PRICE_MAX)} đ`;
  }

  const dimMatch = trimmed.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (dimMatch) {
    const w = Number(dimMatch[1]);
    const h = Number(dimMatch[2]);
    if (w < 0 || h < 0) return 'Không được nhập số âm';
    if (w > SIZE_MAX || h > SIZE_MAX) return `Kích thước tìm kiếm tối đa là ${SIZE_MAX} cm`;
  }

  return null;
}

export function effectiveFilterValue(raw, fieldError, rangeError) {
  if (fieldError || rangeError) return null;
  if (raw === '' || raw == null) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function matchesDimensionPattern(q, w, h) {
  const dimMatch = q.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!dimMatch) return false;
  const qw = Number(dimMatch[1]);
  const qh = Number(dimMatch[2]);
  return (w === qw && h === qh) || (w === qh && h === qw);
}

function numberMatchesPrice(n, price) {
  if (n === price) return true;
  const priceStr = String(Math.round(price));
  const nStr = String(Math.round(Math.abs(n)));
  return nStr.length >= 3 && priceStr.includes(nStr);
}

function numberMatchesSize(n, w, h, maxDim, minDim) {
  return n === w || n === h || n === maxDim || n === minDim;
}

/** Tìm theo tên, nghệ sĩ, giá hoặc kích thước */
export function matchesProductSearch(product, rawQuery) {
  const q = (rawQuery || '').toLowerCase().trim();
  if (!q) return true;

  const name = (product.name || '').toLowerCase();
  const art = (product.artistName || product.artist || '').toLowerCase();
  if (name.includes(q) || art.includes(q)) return true;

  const price = product.price ?? 0;
  const w = Number(product.width || 0);
  const h = Number(product.height || 0);
  const maxDim = Math.max(w, h);
  const minDim = Math.min(w, h);

  if (matchesDimensionPattern(q, w, h)) return true;

  const sizeStr = w && h ? `${w}x${h}` : w ? `${w}` : h ? `${h}` : '';
  if (sizeStr && q.replace(/\s/g, '').includes(sizeStr.replace(/\s/g, ''))) return true;

  const numbers = extractNumbersFromQuery(q);
  if (numbers.length === 0) return false;

  const hasCm = /\bcm\b/i.test(q);
  return numbers.some((n) => {
    if (n < 0) return false;
    if (hasCm) return numberMatchesSize(n, w, h, maxDim, minDim);
    if (n <= SIZE_MAX && numberMatchesSize(n, w, h, maxDim, minDim)) return true;
    return numberMatchesPrice(n, price);
  });
}

export function clampPrice(n) {
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, n));
}

export function clampSize(n) {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, n));
}

/** Nhãn chip bộ lọc giá — không dùng ∞ */
export function formatPriceChipLabel(minPrice, maxPrice, fmt) {
  const hasMin = minPrice !== '' && minPrice != null;
  const hasMax = maxPrice !== '' && maxPrice != null;
  if (hasMin && hasMax) return `Giá: ${fmt(minPrice)} – ${fmt(maxPrice)}`;
  if (hasMin) return `Giá: lớn hơn ${fmt(minPrice)}`;
  if (hasMax) return `Giá: dưới ${fmt(maxPrice)}`;
  return '';
}

/** Nhãn chip bộ lọc kích thước — không dùng ∞ */
export function formatSizeChipLabel(minSize, maxSize) {
  const hasMin = minSize !== '' && minSize != null;
  const hasMax = maxSize !== '' && maxSize != null;
  if (hasMin && hasMax) return `Kích thước: ${minSize} – ${maxSize} cm`;
  if (hasMin) return `Kích thước: lớn hơn ${minSize} cm`;
  if (hasMax) return `Kích thước: dưới ${maxSize} cm`;
  return '';
}