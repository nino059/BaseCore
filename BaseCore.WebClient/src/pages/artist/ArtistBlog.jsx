import React, { useState, useEffect, useRef, useCallback } from 'react';
import ArtistLayout from '../../components/ArtistLayout';
import { blogApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Tìm hiểu nghệ thuật', 'Kỹ thuật vẽ', 'Câu chuyện tác phẩm', 'Nghệ sĩ & Cảm hứng', 'Khác'];

const StatusBadge = ({ status }) => {
  const map = {
    Pending:   ['#92400e', '#fef3c7'],
    Published: ['#065f46', '#d1fae5'],
    Rejected:  ['#991b1b', '#fee2e2'],
  };
  const [c, bg] = map[status] || ['#374151', '#f3f4f6'];
  const lbl = { Pending:'Chờ duyệt', Published:'Đã đăng', Rejected:'Từ chối' }[status] || status;
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
      color: c, background: bg, padding: '2px 10px', borderRadius: 20,
      textTransform: 'uppercase',
    }}>{lbl}</span>
  );
};

// ─── Block editor helpers ──────────────────────────────────────────────────

const makeTextBlock  = ()      => ({ id: Date.now() + Math.random(), type: 'text',  value: '' });
const makeImageBlock = (url='') => ({ id: Date.now() + Math.random(), type: 'image', url, caption: '', uploading: false });

function blocksToContent(blocks) {
  return JSON.stringify(blocks.map(b =>
    b.type === 'image'
      ? { type: 'image', url: b.url, caption: b.caption }
      : { type: 'text',  value: b.value }
  ));
}

function contentToBlocks(raw) {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.map(b => ({
        ...b,
        id: Date.now() + Math.random(),
        ...(b.type === 'image' ? { uploading: false } : {}),
      }));
    }
  } catch {}
  // Cũ: plain text content
  if (raw) return [{ id: Date.now(), type: 'text', value: raw }];
  return [makeTextBlock()];
}

// ─── Block editor component ────────────────────────────────────────────────

const BlockEditor = ({ blocks, onChange }) => {
  const fileRefs = useRef({});

  const update = useCallback((idx, patch) => {
    onChange(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, [onChange]);

  const insertAfter = (idx, block) => {
    onChange(prev => {
      const next = [...prev];
      next.splice(idx + 1, 0, block);
      return next;
    });
  };

  const remove = (idx) => {
    onChange(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    onChange(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    onChange(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleImageFile = async (idx, file) => {
    if (!file) return;
    update(idx, { uploading: true });
    try {
      const res = await blogApi.uploadImage(file);
      const url = res.data?.url || res.data?.imageUrl || res.data;
      update(idx, { url, uploading: false });
    } catch {
      update(idx, { uploading: false });
      alert('Upload ảnh thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {blocks.map((block, idx) => (
        <div key={block.id} style={{ position: 'relative' }}>
          {/* Block control bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            justifyContent: 'flex-end', marginBottom: 4,
          }}>
            <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
              style={miniBtn(idx === 0 ? '#e5e7eb' : '#f0ede8', idx === 0 ? '#ccc' : '#8b6c4a')}
              title="Di chuyển lên">
              <i className="fas fa-arrow-up" style={{ fontSize: '0.65rem' }} />
            </button>
            <button type="button" onClick={() => moveDown(idx)} disabled={idx === blocks.length - 1}
              style={miniBtn(idx === blocks.length - 1 ? '#e5e7eb' : '#f0ede8', idx === blocks.length - 1 ? '#ccc' : '#8b6c4a')}
              title="Di chuyển xuống">
              <i className="fas fa-arrow-down" style={{ fontSize: '0.65rem' }} />
            </button>
            <button type="button" onClick={() => remove(idx)}
              style={miniBtn('#fee2e2', '#991b1b')} title="Xóa khối">
              <i className="fas fa-times" style={{ fontSize: '0.65rem' }} />
            </button>
          </div>

          {/* Block content */}
          {block.type === 'text' ? (
            <textarea
              value={block.value}
              onChange={e => update(idx, { value: e.target.value })}
              placeholder="Nhập nội dung đoạn văn..."
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e8e4df', fontSize: '0.92rem',
                lineHeight: 1.7, resize: 'vertical', minHeight: 100,
                outline: 'none', background: 'white', boxSizing: 'border-box',
                color: '#1a1a1a', fontFamily: 'inherit',
              }}
            />
          ) : (
            <div style={{
              border: '1.5px solid #e8e4df', background: '#faf9f7',
              padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {block.url ? (
                <div style={{ position: 'relative' }}>
                  <img src={block.url} alt={block.caption || 'Ảnh'}
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', background: '#f0ede8' }}
                  />
                  <button type="button"
                    onClick={() => { update(idx, { url: '' }); if (fileRefs.current[block.id]) fileRefs.current[block.id].value = ''; }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none',
                      borderRadius: '50%', width: 26, height: 26, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <i className="fas fa-times" style={{ fontSize: '0.7rem' }} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: 140, cursor: 'pointer',
                  border: '2px dashed #d4c5af', borderRadius: 4,
                  background: 'white', transition: 'border-color 0.2s',
                }}>
                  <input
                    ref={el => fileRefs.current[block.id] = el}
                    type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleImageFile(idx, e.target.files[0])}
                  />
                  {block.uploading ? (
                    <div style={{ color: '#c8a97a', fontSize: '0.88rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
                      Đang tải ảnh...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-image" style={{ fontSize: '2rem', color: '#d4c5af', marginBottom: 8 }} />
                      <span style={{ fontSize: '0.82rem', color: '#aaa' }}>Nhấn để chọn ảnh từ máy</span>
                      <span style={{ fontSize: '0.72rem', color: '#ccc', marginTop: 4 }}>JPG, PNG, WEBP</span>
                    </>
                  )}
                </label>
              )}
              <input
                value={block.caption}
                onChange={e => update(idx, { caption: e.target.value })}
                placeholder="Chú thích ảnh (không bắt buộc)"
                style={{
                  width: '100%', padding: '7px 10px',
                  border: '1px solid #e8e4df', fontSize: '0.8rem',
                  outline: 'none', background: 'white', boxSizing: 'border-box',
                  color: '#666', fontStyle: 'italic',
                }}
              />
            </div>
          )}

          {/* Insert buttons between blocks */}
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center',
            padding: '10px 0', opacity: 0.6,
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
            <button type="button" onClick={() => insertAfter(idx, makeTextBlock())}
              style={insertBtn()}>
              <i className="fas fa-plus" style={{ marginRight: 5, fontSize: '0.65rem' }} />Đoạn văn
            </button>
            <button type="button" onClick={() => insertAfter(idx, makeImageBlock())}
              style={insertBtn()}>
              <i className="fas fa-image" style={{ marginRight: 5, fontSize: '0.65rem' }} />Hình ảnh
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const miniBtn = (bg, color) => ({
  padding: '3px 7px', background: bg, color, border: 'none',
  fontSize: '0.7rem', cursor: 'pointer', borderRadius: 3,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

const insertBtn = () => ({
  padding: '4px 12px', background: 'white', color: '#8b6c4a',
  border: '1px solid #d4c5af', fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 20,
  display: 'inline-flex', alignItems: 'center',
});

// ─── Blog editor (full page overlay) ──────────────────────────────────────

const BlogEditor = ({ post, authorName, onSave, onClose }) => {
  const coverRef = useRef(null);
  const [form, setForm] = useState({
    title:        post?.title        || '',
    excerpt:      post?.excerpt      || '',
    category:     post?.category     || CATEGORIES[0],
    authorName:   post?.authorName   || authorName,
    coverImageUrl: post?.coverImageUrl || '',
  });
  const [blocks, setBlocks]               = useState(() => contentToBlocks(post?.content));
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCoverFile = async (file) => {
    if (!file) return;
    setCoverUploading(true);
    try {
      const res = await blogApi.uploadImage(file);
      const url = res.data?.url || res.data?.imageUrl || res.data;
      set('coverImageUrl', url);
    } catch {
      alert('Upload ảnh bìa thất bại.');
    }
    setCoverUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Tiêu đề là bắt buộc'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, content: blocksToContent(blocks) };
      if (post) await blogApi.update(post.id, payload);
      else      await blogApi.create(payload);
      onSave();
    } catch (ex) {
      setError(ex.response?.data?.message || 'Lỗi khi lưu bài viết');
    }
    setSaving(false);
  };

  const lbl = {
    display: 'block', fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.1em', color: '#8b6c4a', textTransform: 'uppercase', marginBottom: 5,
  };
  const inp = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #e8e4df', fontSize: '0.88rem',
    outline: 'none', background: 'white', boxSizing: 'border-box', color: '#1a1a1a',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.65)',
      zIndex: 1000, overflowY: 'auto',
    }}>
      <div style={{
        margin: '32px auto', background: 'white',
        maxWidth: 860, width: 'calc(100% - 32px)',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 28px', borderBottom: '1px solid #e8e4df',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'white', zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: '#c8a97a', textTransform: 'uppercase' }}>Soạn thảo bài viết</p>
            <h2 style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: '#1a1a1a' }}>
              {post ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 20px', background: '#f0ede8', color: '#1a1a1a', border: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '8px 24px', background: '#1a1a1a', color: 'white', border: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Đang lưu...' : (post ? 'Lưu thay đổi' : 'Gửi bài')}
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px', flex: 1 }}>
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', fontSize: '0.85rem', marginBottom: 20, borderLeft: '3px solid #f87171' }}>
              {error}
            </div>
          )}

          {/* ── Metadata section ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Tiêu đề *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                style={{ ...inp, fontSize: '1.05rem', fontWeight: 500 }}
                placeholder="Tiêu đề bài viết" />
            </div>
            <div>
              <label style={lbl}>Thể loại</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tên tác giả</label>
              <input value={form.authorName} onChange={e => set('authorName', e.target.value)}
                style={inp} placeholder="Tên hiển thị" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Tóm tắt</label>
              <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                style={{ ...inp, height: 72, resize: 'vertical' }}
                placeholder="Một đoạn ngắn giới thiệu bài viết..." />
            </div>
          </div>

          {/* ── Cover image ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>Ảnh bìa</label>
            {form.coverImageUrl ? (
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={form.coverImageUrl} alt="Ảnh bìa"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block', background: '#f0ede8' }} />
                <button type="button"
                  onClick={() => { set('coverImageUrl', ''); if (coverRef.current) coverRef.current.value = ''; }}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none',
                    borderRadius: '50%', width: 30, height: 30, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 160, cursor: 'pointer',
                border: '2px dashed #d4c5af', background: '#faf9f7',
              }}>
                <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleCoverFile(e.target.files[0])} />
                {coverUploading ? (
                  <div style={{ color: '#c8a97a', fontSize: '0.9rem' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Đang tải...
                  </div>
                ) : (
                  <>
                    <i className="fas fa-image" style={{ fontSize: '2.5rem', color: '#d4c5af', marginBottom: 10 }} />
                    <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Nhấn để chọn ảnh bìa</span>
                    <span style={{ fontSize: '0.75rem', color: '#ccc', marginTop: 4 }}>JPG, PNG, WEBP — tỉ lệ 16:9 lý tưởng</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid #e8e4df', marginBottom: 20 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', color: '#c8a97a', textTransform: 'uppercase', marginTop: 16, marginBottom: 12 }}>
              Nội dung bài viết
            </p>
          </div>

          {/* ── Block editor ── */}
          {/* First block's insert-before row */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '4px 0 10px', opacity: 0.6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
            <button type="button" onClick={() => setBlocks(prev => [makeTextBlock(), ...prev])}
              style={insertBtn()}>
              <i className="fas fa-plus" style={{ marginRight: 5, fontSize: '0.65rem' }} />Đoạn văn
            </button>
            <button type="button" onClick={() => setBlocks(prev => [makeImageBlock(), ...prev])}
              style={insertBtn()}>
              <i className="fas fa-image" style={{ marginRight: 5, fontSize: '0.65rem' }} />Hình ảnh
            </button>
          </div>

          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </form>
      </div>
    </div>
  );
};

// ─── Main page component ───────────────────────────────────────────────────

const ArtistBlog = () => {
  const { user } = useAuth();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing]   = useState(null);

  const load = () => {
    setLoading(true);
    blogApi.getAll({ mine: true, pageSize: 999 })
      .then(res => setPosts(res.data?.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Xóa bài viết này?')) return;
    await blogApi.delete(id);
    load();
  };

  const openNew = () => { setEditing(null); setShowEditor(true); };
  const openEdit = (p) => { setEditing(p); setShowEditor(true); };

  const sqBtn = (bg = '#1a1a1a', color = 'white') => ({
    padding: '8px 18px', background: bg, color, border: 'none',
    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
  });

  return (
    <ArtistLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={openNew} style={sqBtn()}>
          <i className="fas fa-pen" style={{ marginRight: 8 }} />Viết bài mới
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Đang tải...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ fontSize: '2rem', color: '#e8e4df', marginBottom: 12 }}>✦</p>
          <p style={{ color: '#aaa', fontWeight: 300, marginBottom: 20 }}>Bạn chưa có bài viết nào</p>
          <button onClick={openNew} style={sqBtn()}>Viết bài đầu tiên</button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e4df' }}>
                {['Tiêu đề', 'Thể loại', 'Ngày tạo', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f0ede8' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: 2 }}>{p.title}</div>
                    {p.excerpt && (
                      <div style={{ fontSize: '0.75rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {p.excerpt}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#8b6c4a' }}>{p.category || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#767676' }}>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)}
                        style={{ padding: '6px 14px', background: '#f0ede8', color: '#1a1a1a', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        style={{ padding: '6px 14px', background: '#fee2e2', color: '#991b1b', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditor && (
        <BlogEditor
          post={editing}
          authorName={user?.name || user?.username || ''}
          onSave={() => { setShowEditor(false); load(); }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </ArtistLayout>
  );
};

export default ArtistBlog;
