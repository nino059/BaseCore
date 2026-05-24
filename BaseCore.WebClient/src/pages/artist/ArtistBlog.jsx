import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArtistLayout from '../../components/ArtistLayout';
import { blogApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const StatusBadge = ({ status }) => {
  const map = { Pending:['#92400e','#fef3c7'], Published:['#065f46','#d1fae5'], Rejected:['#991b1b','#fee2e2'] };
  const [c, bg] = map[status] || ['#374151','#f3f4f6'];
  const lbl = { Pending:'Chờ duyệt', Published:'Đã đăng', Rejected:'Từ chối' }[status] || status;
  return <span style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', color:c, background:bg, padding:'2px 8px', textTransform:'uppercase' }}>{lbl}</span>;
};

const sqBtn = (bg='#1a1a1a', color='white') => ({
  padding:'8px 18px', background:bg, color, border:'none', fontSize:'0.75rem', fontWeight:700,
  letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer',
});

const ArtistBlog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

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

  return (
    <ArtistLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', color:'#c8a97a', textTransform:'uppercase', marginBottom:0, margin:0 }}>Họa sĩ</p>
          <h1 style={{ fontWeight:300, fontSize:'1.6rem', color:'#1a1a1a', margin:0 }}>Bài viết của tôi</h1>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={sqBtn()}>
          <i className="fas fa-pen mr-2" />Viết bài mới
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Đang tải...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:'center', padding:80 }}>
          <p style={{ fontSize:'2rem', color:'#e8e4df', marginBottom:12 }}>✦</p>
          <p style={{ color:'#aaa', fontWeight:300, marginBottom:20 }}>Bạn chưa có bài viết nào</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} style={sqBtn()}>Viết bài đầu tiên</button>
        </div>
      ) : (
        <div style={{ background:'white', border:'1px solid #e8e4df' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #e8e4df' }}>
                {['Tiêu đề','Thể loại','Ngày tạo','Trạng thái',''].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', color:'#aaa', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderBottom:'1px solid #f0ede8' }}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#1a1a1a', marginBottom:2 }}>{p.title}</div>
                    {p.excerpt && <div style={{ fontSize:'0.75rem', color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{p.excerpt}</div>}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:'0.82rem', color:'#8b6c4a' }}>{p.category || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:'0.82rem', color:'#767676' }}>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding:'12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ ...sqBtn('#f0ede8','#1a1a1a'), padding:'6px 14px' }}>Sửa</button>
                      <button onClick={() => handleDelete(p.id)} style={{ ...sqBtn('#fee2e2','#991b1b'), padding:'6px 14px' }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <BlogForm
          post={editing}
          authorName={user?.name || user?.username || ''}
          onSave={() => { setShowForm(false); load(); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </ArtistLayout>
  );
};

// ─── Inline Blog Form Modal ────────────────────────────────
const CATEGORIES = ['Tìm hiểu nghệ thuật', 'Kỹ thuật vẽ', 'Câu chuyện tác phẩm', 'Nghệ sĩ & Cảm hứng', 'Khác'];

const BlogForm = ({ post, authorName, onSave, onClose }) => {
  const [form, setForm] = useState({
    title:       post?.title       || '',
    excerpt:     post?.excerpt     || '',
    content:     post?.content     || '',
    category:    post?.category    || CATEGORIES[0],
    authorName:  post?.authorName  || authorName,
    coverImageUrl: post?.coverImageUrl || '',
    readTime:    post?.readTime    || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Tiêu đề là bắt buộc'); return; }
    setSaving(true);
    setError('');
    try {
      if (post) await blogApi.update(post.id, form);
      else      await blogApi.create(form);
      onSave();
    } catch (ex) {
      setError(ex.response?.data?.message || 'Lỗi khi lưu bài viết');
    }
    setSaving(false);
  };

  const lbl = { display:'block', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', color:'#8b6c4a', textTransform:'uppercase', marginBottom:4 };
  const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #e8e4df', fontSize:'0.88rem', outline:'none', background:'white', boxSizing:'border-box', color:'#1a1a1a' };
  const sqBtn = (bg='#1a1a1a', color='white') => ({ padding:'9px 22px', background:bg, color, border:'none', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' });

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', maxWidth:700, width:'100%', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e8e4df', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0, fontWeight:500, fontSize:'1rem' }}>{post ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.4rem', color:'#aaa' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:24 }}>
          {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'10px 14px', fontSize:'0.85rem', marginBottom:16 }}>{error}</div>}

          <div style={{ display:'grid', gap:16 }}>
            <div>
              <label style={lbl}>Tiêu đề *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder="Tiêu đề bài viết" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={lbl}>Thể loại</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Thời gian đọc</label>
                <input value={form.readTime} onChange={e => set('readTime', e.target.value)} style={inp} placeholder="5 phút" />
              </div>
            </div>
            <div>
              <label style={lbl}>Tóm tắt</label>
              <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} style={{ ...inp, height:72, resize:'vertical' }} placeholder="Tóm tắt ngắn về bài viết..." />
            </div>
            <div>
              <label style={lbl}>Nội dung</label>
              <textarea value={form.content} onChange={e => set('content', e.target.value)} style={{ ...inp, height:200, resize:'vertical' }} placeholder="Nội dung bài viết..." />
            </div>
            <div>
              <label style={lbl}>Ảnh bìa (URL)</label>
              <input value={form.coverImageUrl} onChange={e => set('coverImageUrl', e.target.value)} style={inp} placeholder="https://..." />
            </div>
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', borderTop:'1px solid #e8e4df', paddingTop:16, marginTop:16 }}>
            <button type="button" onClick={onClose} style={sqBtn('#f0ede8','#1a1a1a')}>Hủy</button>
            <button type="submit" disabled={saving} style={{ ...sqBtn(), opacity: saving ? .7 : 1 }}>
              {saving ? 'Đang lưu...' : (post ? 'Lưu thay đổi' : 'Gửi bài')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtistBlog;
