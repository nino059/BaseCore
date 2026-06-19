export const formatIsoToVn = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

export const isoToDayStart = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getTime();
};

export const recordDayStart = (record, ...dateFields) => {
  const fields = dateFields.length ? dateFields : ['orderDate', 'createdAt', 'CreatedAt'];
  let raw = null;
  for (const key of fields) {
    if (record?.[key]) { raw = record[key]; break; }
  }
  if (!raw) return null;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
};