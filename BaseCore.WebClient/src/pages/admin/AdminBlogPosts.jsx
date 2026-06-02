import React, { useState, useEffect, useCallback, useRef } from 'react';
import { blogApi } from '../../services/api';
import BlogRenderer from '../../components/BlogRenderer';

const CATEGORIES = ['Tìm hiểu nghệ thuật', 'Kỹ thuật vẽ', 'Câu chuyện tác phẩm', 'Nghệ sĩ & Cảm hứng', 'Khác'];

const STATUS_CFG = {
  Pending:   { label:'Chờ duyệt', color:'#92400e', bg:'#fef3c7' },
  Published: { label:'Đã đăng',   color:'#065f46', bg:'#d1fae5' },
  Rejected:  { label:'Từ chối',   color:'#991b1b', bg:'#fee2e2' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || { label:status, color:'#374151', bg:'#f3f4f6' };
  return <span style={{ fontSize:'0.72rem', fontWeight:700, color:c.color, background:c.bg, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{c.label}</span>;
};

// ─── Block editor helpers ──────────────────────────────────────────────────

const makeTextBlock  = ()       => ({ id: Date.now() + Math.random(), type: 'text',  value: '' });
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
  if (raw) return [{ id: Date.now(), type: 'text', value: raw }];
  return [makeTextBlock()];
}

// ─── Block editor component ────────────────────────────────────────────────

const miniBtn = (bg, color) => ({
  padding: '3px 7px', background: bg, color, border: 'none',
  fontSize: '0.7rem', cursor: 'pointer', borderRadius: 3,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

const insertBtn = () => ({
  padding: '4px 12px', background: 'white', color: 'var(--brand-dark)',
  border: '1px solid #d4c5af', fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 20,
  display: 'inline-flex', alignItems: 'center',
});

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

  const remove  = (idx) => onChange(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  const moveUp  = (idx) => {
    if (idx === 0) return;
    onChange(prev => { const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; });
  };
  const moveDown = (idx) => {
    onChange(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
            <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
              style={miniBtn(idx === 0 ? '#e5e7eb' : '#f0ede8', idx === 0 ? '#ccc' : 'var(--brand-dark)')} title="Di chuyển lên">
              <i className="fas fa-arrow-up" style={{ fontSize: '0.65rem' }} />
            </button>
            <button type="button" onClick={() => moveDown(idx)} disabled={idx === blocks.length - 1}
              style={miniBtn(idx === blocks.length - 1 ? '#e5e7eb' : '#f0ede8', idx === blocks.length - 1 ? '#ccc' : 'var(--brand-dark)')} title="Di chuyển xuống">
              <i className="fas fa-arrow-down" style={{ fontSize: '0.65rem' }} />
            </button>
            <button type="button" onClick={() => remove(idx)}
              style={miniBtn('#fee2e2', '#991b1b')} title="Xóa khối">
              <i className="fas fa-times" style={{ fontSize: '0.65rem' }} />
            </button>
          </div>

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
                color: 'var(--ink)', fontFamily: 'inherit',
              }}
            />
          ) : (
            <div style={{ border: '1.5px solid #e8e4df', background: '#faf9f7', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {block.url ? (
                <div style={{ position: 'relative' }}>
                  <img src={block.url} alt={block.caption || 'Ảnh'}
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', background: '#f0ede8' }} />
                  <button type="button"
                    onClick={() => { update(idx, { url: '' }); if (fileRefs.current[block.id]) fileRefs.current[block.id].value = ''; }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-times" style={{ fontSize: '0.7rem' }} />
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, cursor: 'pointer', border: '2px dashed #d4c5af', borderRadius: 4, background: 'white', transition: 'border-color 0.2s' }}>
                  <input
                    ref={el => fileRefs.current[block.id] = el}
                    type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleImageFile(idx, e.target.files[0])}
                  />
                  {block.uploading ? (
                    <div style={{ color: 'var(--brand)', fontSize: '0.88rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Đang tải ảnh...
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
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e8e4df', fontSize: '0.8rem', outline: 'none', background: 'white', boxSizing: 'border-box', color: '#666', fontStyle: 'italic' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '10px 0', opacity: 0.6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
            <button type="button" onClick={() => insertAfter(idx, makeTextBlock())} style={insertBtn()}>
              <i className="fas fa-plus" style={{ marginRight: 5, fontSize: '0.65rem' }} />Đoạn văn
            </button>
            <button type="button" onClick={() => insertAfter(idx, makeImageBlock())} style={insertBtn()}>
              <i className="fas fa-image" style={{ marginRight: 5, fontSize: '0.65rem' }} />Hình ảnh
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Blog editor (full-page overlay) ──────────────────────────────────────

const BlogEditor = ({ post, onSave, onClose }) => {
  const coverRef = useRef(null);
  const [form, setForm] = useState({
    title:         post?.title         || '',
    excerpt:       post?.excerpt       || '',
    category:      post?.category      || CATEGORIES[0],
    authorName:    post?.authorName    || '',
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
    e?.preventDefault();
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
    letterSpacing: '0.1em', color: 'var(--brand-dark)', textTransform: 'uppercase', marginBottom: 5,
  };
  const inp = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #e8e4df', fontSize: '0.88rem',
    outline: 'none', background: 'white', boxSizing: 'border-box', color: 'var(--ink)',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.65)', zIndex: 1000, overflowY: 'auto' }}>
      <div style={{ margin: '32px auto', background: 'white', maxWidth: 860, width: 'calc(100% - 32px)', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #e8e4df', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--brand)', textTransform: 'uppercase' }}>Quản trị viên</p>
            <h2 style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--ink)' }}>
              {post ? 'Chỉnh sửa bài viết' : 'Đăng bài viết mới'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 20px', background: '#f0ede8', color: 'var(--ink)', border: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '8px 24px', background: 'linear-gradient(135deg,var(--brand),var(--brand-dark))', color: 'white', border: 'none', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Đang lưu...' : (post ? 'Lưu thay đổi' : 'Đăng ngay')}
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

          {/* Metadata */}
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
                style={inp} placeholder="Để trống = Admin" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Tóm tắt</label>
              <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                style={{ ...inp, height: 72, resize: 'vertical' }}
                placeholder="Một đoạn ngắn giới thiệu bài viết..." />
            </div>
          </div>

          {/* Cover image */}
          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>Ảnh bìa</label>
            {form.coverImageUrl ? (
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={form.coverImageUrl} alt="Ảnh bìa"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block', background: '#f0ede8' }} />
                <button type="button"
                  onClick={() => { set('coverImageUrl', ''); if (coverRef.current) coverRef.current.value = ''; }}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer', border: '2px dashed #d4c5af', background: '#faf9f7' }}>
                <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleCoverFile(e.target.files[0])} />
                {coverUploading ? (
                  <div style={{ color: 'var(--brand)', fontSize: '0.9rem' }}>
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

          {/* Divider */}
          <div style={{ borderTop: '1px solid #e8e4df', marginBottom: 20 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase', marginTop: 16, marginBottom: 12 }}>
              Nội dung bài viết
            </p>
          </div>

          {/* Insert before first block */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '4px 0 10px', opacity: 0.6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
            <button type="button" onClick={() => setBlocks(prev => [makeTextBlock(), ...prev])} style={insertBtn()}>
              <i className="fas fa-plus" style={{ marginRight: 5, fontSize: '0.65rem' }} />Đoạn văn
            </button>
            <button type="button" onClick={() => setBlocks(prev => [makeImageBlock(), ...prev])} style={insertBtn()}>
              <i className="fas fa-image" style={{ marginRight: 5, fontSize: '0.65rem' }} />Hình ảnh
            </button>
          </div>

          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </form>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

const AdminBlogPosts = () => {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('all');
  const [toast,      setToast]      = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editing,    setEditing]    = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    blogApi.getAll({ all:true, pageSize:999 })
      .then(res => setPosts(res.data?.items || res.data || []))
      .catch(() => showToast('Không thể tải bài viết', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try { await blogApi.approve(id); showToast('Đã duyệt bài viết'); load(); }
    catch { showToast('Thao tác thất bại', 'error'); }
  };
  const handleReject = async (id) => {
    try { await blogApi.reject(id); showToast('Đã từ chối bài viết', 'warning'); load(); }
    catch { showToast('Thao tác thất bại', 'error'); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Xóa bài viết này?')) return;
    try { await blogApi.delete(id); showToast('Đã xóa bài viết', 'warning'); load(); }
    catch { showToast('Xóa thất bại', 'error'); }
  };

  const openNew  = () => { setEditing(null); setShowEditor(true); };
  const openEdit = (p) => { setEditing(p);   setShowEditor(true); };

  const counts = {
    all:       posts.length,
    Pending:   posts.filter(p => p.status === 'Pending').length,
    Published: posts.filter(p => p.status === 'Published').length,
    Rejected:  posts.filter(p => p.status === 'Rejected').length,
  };
  const filtered = tab === 'all' ? posts : posts.filter(p => p.status === tab);

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999,
          background: toast.type==='success'?'#10b981':toast.type==='error'?'#ef4444':'#f59e0b',
          color:'white', padding:'12px 22px', borderRadius:12, fontWeight:700, fontSize:'0.88rem',
          boxShadow:'0 8px 24px rgba(0,0,0,.15)', animation:'slideIn .3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { key:'all',       label:'Tổng bài viết', color:'var(--brand)', bg:'#f5edd6', icon:'fa-newspaper'    },
          { key:'Pending',   label:'Chờ duyệt',     color:'#92400e', bg:'#fef3c7', icon:'fa-clock'        },
          { key:'Published', label:'Đã đăng',        color:'#065f46', bg:'#d1fae5', icon:'fa-check-circle' },
          { key:'Rejected',  label:'Từ chối',        color:'#991b1b', bg:'#fee2e2', icon:'fa-times-circle' },
        ].map(s => {
          const active = tab === s.key;
          return (
            <div key={s.key} className="kpi-card"
              onClick={() => setTab(s.key)}
              style={{ borderTop:`3px solid ${active ? s.color : '#f1f5f9'}`, background: active ? s.bg+'55' : 'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'1.8rem', fontWeight:900, color:s.color, lineHeight:1 }}>{counts[s.key]}</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginTop:4 }}>{s.label}</div>
                </div>
                <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`fas ${s.icon}`} style={{ color:s.color, fontSize:'0.9rem' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:80, background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <p style={{ fontSize:'2rem', color:'#e8e4df', marginBottom:12 }}>✦</p>
          <p style={{ color:'#94a3b8' }}>Không có bài viết nào</p>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <i className="fas fa-newspaper" style={{ color:'var(--brand)', fontSize:'0.85rem' }} />
              <span style={{ fontWeight:700, color:'#1e293b', fontSize:'0.92rem' }}>Danh sách bài viết</span>
              <span style={{ background:'#f5edd6', color:'var(--brand)', borderRadius:20, padding:'2px 10px', fontSize:'0.73rem', fontWeight:700 }}>{filtered.length}</span>
            </div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Bài viết','Tác giả','Thể loại','Ngày tạo','Trạng thái','Thao tác'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.72rem', fontWeight:700,
                    letterSpacing:'0.08em', color:'#64748b', textTransform:'uppercase',
                    borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===1 ? '#fafbff' : 'white' }}>
                  <td style={{ padding:'14px 16px', maxWidth:300 }}>
                    <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#1e293b', marginBottom:2,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{p.title}</div>
                    {p.excerpt && <div style={{ fontSize:'0.75rem', color:'#94a3b8', overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{p.excerpt}</div>}
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:'0.85rem', color:'#475569', whiteSpace:'nowrap' }}>{p.authorName || '—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:'0.82rem', color:'var(--brand-dark)', whiteSpace:'nowrap' }}>{p.category || '—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:'0.82rem', color:'#94a3b8', whiteSpace:'nowrap' }}>
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding:'14px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setPreview(p)} title="Xem trước bài viết (giống như người xem sẽ thấy)"
                        style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#f1f5f9', color:'#475569' }}>
                        <i className="fas fa-eye" style={{ fontSize:'0.78rem' }} />
                      </button>
                      <button onClick={() => openEdit(p)} title="Chỉnh sửa"
                        style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#f5edd6', color:'var(--brand)' }}>
                        <i className="fas fa-pen" style={{ fontSize:'0.78rem' }} />
                      </button>
                      {p.status === 'Pending' && (
                        <>
                          <button onClick={() => handleApprove(p.id)} title="Duyệt"
                            style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#d1fae5', color:'#065f46' }}>
                            <i className="fas fa-check" style={{ fontSize:'0.78rem' }} />
                          </button>
                          <button onClick={() => handleReject(p.id)} title="Từ chối"
                            style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#fee2e2', color:'#991b1b' }}>
                            <i className="fas fa-times" style={{ fontSize:'0.78rem' }} />
                          </button>
                        </>
                      )}
                      {p.status === 'Published' && (
                        <button onClick={() => handleReject(p.id)} title="Ẩn bài viết"
                          style={{ padding:'0 12px', height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#fef3c7', color:'#92400e', fontSize:'0.72rem', fontWeight:700 }}>
                          Ẩn
                        </button>
                      )}
                      {p.status === 'Rejected' && (
                        <button onClick={() => handleApprove(p.id)} title="Duyệt lại"
                          style={{ padding:'0 12px', height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#d1fae5', color:'#065f46', fontSize:'0.72rem', fontWeight:700 }}>
                          Duyệt
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)} title="Xóa"
                        style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#fee2e220', color:'#ef4444' }}>
                        <i className="fas fa-trash" style={{ fontSize:'0.78rem' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── HIGH-FIDELITY PREVIEW (what visitors will actually see) ─── */}
      {preview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 14, 12, 0.72)',
            zIndex: 2000,
            overflowY: 'auto',
            padding: '40px 20px',
          }}
          onClick={() => setPreview(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 960,
              margin: '0 auto',
              background: '#faf8f5',
              borderRadius: 16,
              boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Sticky Preview Header */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'white',
                borderBottom: '1px solid #e8e4df',
                padding: '14px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
                    XEM TRƯỚC KHI DUYỆT
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <StatusBadge status={preview.status} />
                    <span style={{ fontSize: '0.82rem', color: '#666' }}>
                      {preview.authorName || '—'} · {preview.category}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {preview.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => { handleApprove(preview.id); setPreview(null); }}
                      style={{
                        padding: '10px 22px',
                        background: '#065f46',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      <i className="fas fa-check" /> Duyệt &amp; Đăng bài
                    </button>
                    <button
                      onClick={() => { handleReject(preview.id); setPreview(null); }}
                      style={{
                        padding: '10px 18px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      <i className="fas fa-times" /> Từ chối
                    </button>
                  </>
                )}

                {preview.status === 'Published' && (
                  <button
                    onClick={() => { handleReject(preview.id); setPreview(null); }}
                    style={{
                      padding: '10px 18px',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Ẩn bài viết
                  </button>
                )}

                {preview.status === 'Rejected' && (
                  <button
                    onClick={() => { handleApprove(preview.id); setPreview(null); }}
                    style={{
                      padding: '10px 18px',
                      background: '#d1fae5',
                      color: '#065f46',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Duyệt lại
                  </button>
                )}

                <button
                  onClick={() => setPreview(null)}
                  style={{
                    marginLeft: 8,
                    padding: '10px 18px',
                    background: '#f1f0ec',
                    color: '#444',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Đóng xem trước
                </button>
              </div>
            </div>

            {/* Actual rendered article (exactly like public will see) */}
            <div style={{ background: 'white', padding: '0 0 60px' }}>
              <BlogRenderer post={preview} />
            </div>

            {/* Bottom action bar (for long articles) */}
            {preview.status === 'Pending' && (
              <div
                style={{
                  borderTop: '1px solid #e8e4df',
                  background: '#faf8f5',
                  padding: '18px 28px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                }}
              >
                <button
                  onClick={() => { handleReject(preview.id); setPreview(null); }}
                  style={{
                    padding: '11px 24px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-times mr-2" /> Từ chối bài viết này
                </button>
                <button
                  onClick={() => { handleApprove(preview.id); setPreview(null); }}
                  style={{
                    padding: '11px 28px',
                    background: '#065f46',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-check mr-2" /> Duyệt &amp; Cho đăng ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blog editor overlay */}
      {showEditor && (
        <BlogEditor
          post={editing}
          onSave={() => { setShowEditor(false); load(); }}
          onClose={() => setShowEditor(false)}
        />
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        .kpi-card { background:white; border-radius:14px; padding:20px; cursor:pointer;
          transition:all .2s; border-top:3px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.10); }
      `}</style>
    </div>
  );
};

export default AdminBlogPosts;
