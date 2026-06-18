export const normCartId = (id) => String(id);

export const getArtistKey = (item) =>
  String(item.sellerId || item.artistName || item.artist || '__other__');

export const getArtistName = (item) =>
  item.artistName || item.artist || 'Nghệ sĩ khác';

export const itemUnitPrice = (item) => item.price ?? 0;

export const calcShipping = (subtotal) =>
  subtotal >= 5_000_000 ? 0 : (subtotal > 0 ? 50_000 : 0);

export const groupByArtist = (items) => {
  const map = {};
  items.forEach((item) => {
    const key = getArtistKey(item);
    if (!map[key]) {
      map[key] = {
        key,
        name: getArtistName(item),
        sellerId: item.sellerId || null,
        items: [],
      };
    }
    map[key].items.push(item);
  });
  return Object.values(map);
};

export const groupSubtotal = (groupItems) =>
  groupItems.reduce((s, i) => s + itemUnitPrice(i) * (i.qty || 1), 0);