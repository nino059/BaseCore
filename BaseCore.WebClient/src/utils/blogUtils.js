// blogUtils.js
// Shared helpers for the block-based blog content system

export const makeTextBlock = () => ({
  id: Date.now() + Math.random(),
  type: 'text',
  value: '',
});

export const makeImageBlock = (url = '') => ({
  id: Date.now() + Math.random(),
  type: 'image',
  url,
  caption: '',
  uploading: false,
});

/**
 * Convert array of block objects → JSON string stored in DB
 */
export function blocksToContent(blocks) {
  if (!Array.isArray(blocks)) return '[]';
  return JSON.stringify(
    blocks.map((b) =>
      b.type === 'image'
        ? { type: 'image', url: b.url || '', caption: b.caption || '' }
        : { type: 'text', value: b.value || '' }
    )
  );
}

/**
 * Convert raw content (JSON string or legacy plain text) → array of blocks with ids
 */
export function contentToBlocks(raw) {
  if (!raw) return [makeTextBlock()];

  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map((b) => ({
        ...b,
        id: Date.now() + Math.random(),
        ...(b.type === 'image' ? { uploading: false } : {}),
      }));
    }
  } catch {
    // legacy plain text
  }

  // Fallback: treat as single text block
  return [{ id: Date.now(), type: 'text', value: String(raw) }];
}

/**
 * Get plain text excerpt for search / list (strips images)
 */
export function getPlainTextFromContent(raw, maxLength = 160) {
  try {
    const blocks = JSON.parse(raw || '[]');
    const text = blocks
      .filter((b) => b.type === 'text')
      .map((b) => b.value || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  } catch {
    return String(raw || '').slice(0, maxLength);
  }
}
