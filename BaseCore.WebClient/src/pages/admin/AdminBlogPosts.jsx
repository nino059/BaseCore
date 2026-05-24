import React, { useState, useEffect } from 'react';
import { blogApi } from '../../services/api';

const StatusBadge = ({ status }) => {
  const map = { Pending:['#92400e','#fef3c7'], Published:['#065f46','#d1fae5'], Rejected:['#991b1b','#fee2e2'] };
  const [c, bg] = map[status] || ['#374151','#f3f4f6'];
  const lbl = { Pending:'Chờ duyệt', Published:'Đã đăng', Rejected:'Từ chối' }[status] || status;
  return <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', color:c, background:bg, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{lbl}</span>;
};

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    blogApi.getAll({ all: true, pageSize: 999 })
      .then(res => setPosts(res.data?.items || res.data || []))
      .catch(() => showToast('Không thể tải bài viết', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await blogApi.approve(id);
      showToast('Đã duyệt bài viết');
      load();
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const handleReject = async (id) => {
    try {
      await blogApi.reject(id);
      showToast('Đã từ chối bài viết', 'warning');
      load();
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await blogApi.delete(id);
      showToast('Đã xóa bài viết', 'warning');
      load();
    } catch { showToast('Xóa thất bại', 'error'); }
  };

  const tabs = ['all', 'Pending', 'Published', 'Rejected'];
  const tabLabel = { all:'Tất cả', Pending:'Chờ duyệt', Published:'Đã đăng', Rejected:'Từ chối' };
  const filtered = tab === 'all' ? posts : posts.filter(p => p.status === tab);
  const pendingCount = posts.filter(p => p.status === 'Pending').length;

  const toastColors = { success:'#10b981', error:'#ef4444', warning:'#f59e0b' };

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:toastColors[toast.type]||'#10b981', color:'white', padding:'12px 22px', borderRadius:12, fontWeight:700, fontSize:'0.88rem', boxShadow:'0 8px 24px rgba(0,0,0,.15)', animation:'slideIn .3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:46, height:46, borderRadius:13, background:'linear-gradient(135deg,#c8a97a,#8b6c4a)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(200,169,122,.35)', flexShrink:0 }}>
            <i className="fas fa-pen-fancy" style={{ color:'white', fontSize:'1.05rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize:'1.35rem', fontWeight:800, color:'#1e293b', margin:0 }}>Quản lý Bài viết</h1>
            <p style={{ fontSize:'0.82rem', color:'#94a3b8', margin:'4px 0 0' }}>
              {loading ? 'Đang tải...' : `${posts.length} bài viết · ${pendingCount} chờ duyệt`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e8e4df', marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'9px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.06em',
            color: tab === t ? '#1a1a1a' : '#aaa',
            borderBottom: tab === t ? '2px solid #1a1a1a' : '2px solid transparent',
            marginBottom:'-2px', position:'relative',
          }}>
            {tabLabel[t]}
            {t === 'Pending' && pendingCount > 0 && (
              <span style={{ marginLeft:6, fontSize:'0.68rem', background:'#ef4444', color:'white', borderRadius:99, padding:'1px 7px' }}>{pendingCount}</span>
            )}
            {t !== 'all' && t !== 'Pending' && (
              <span style={{ marginLeft:6, fontSize:'0.68rem', background: tab===t ? '#1a1a1a' : '#e8e4df', color: tab===t ? 'white' : '#767676', borderRadius:99, padding:'1px 7px' }}>
                {posts.filter(p => p.status === t).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:80 }}>
          <p style={{ fontSize:'2rem', color:'#e8e4df', marginBottom:12 }}>✦</p>
          <p style={{ color:'#94a3b8' }}>Không có bài viết nào</p>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Bài viết','Tác giả','Thể loại','Ngày tạo','Trạng thái','Thao tác'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', color:'#64748b', textTransform:'uppercase', borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===1 ? '#fafbff' : 'white' }}>
                  <td style={{ padding:'14px 16px', maxWidth:300 }}>
                    <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#1e293b', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{p.title}</div>
                    {p.excerpt && <div style={{ fontSize:'0.75rem', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{p.excerpt}</div>}
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:'0.85rem', color:'#475569', whiteSpace:'nowrap' }}>{p.authorName || '—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:'0.82rem', color:'#8b6c4a', whiteSpace:'nowrap' }}>{p.category || '—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:'0.82rem', color:'#94a3b8', whiteSpace:'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding:'14px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'nowrap' }}>
                      <button onClick={() => setPreview(p)} title="Xem nội dung"
                        style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', background:'#f1f5f9', color:'#475569' }}>
                        <i className="fas fa-eye" style={{ fontSize:'0.78rem' }} />
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

      {/* Preview Modal */}
      {preview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setPreview(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:16, maxWidth:640, width:'100%', maxHeight:'85vh', overflowY:'auto', padding:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <StatusBadge status={preview.status} />
                <h2 style={{ fontWeight:700, fontSize:'1.2rem', color:'#1e293b', margin:'10px 0 4px' }}>{preview.title}</h2>
                <p style={{ fontSize:'0.82rem', color:'#94a3b8', margin:0 }}>
                  {preview.authorName} · {preview.category} · {new Date(preview.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <button onClick={() => setPreview(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.4rem', color:'#aaa' }}>×</button>
            </div>
            {preview.excerpt && <p style={{ color:'#475569', fontStyle:'italic', borderLeft:'3px solid #c8a97a', paddingLeft:16, marginBottom:16 }}>{preview.excerpt}</p>}
            <div style={{ color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', fontSize:'0.9rem' }}>{preview.content || <span style={{ color:'#aaa' }}>Không có nội dung</span>}</div>
            <div style={{ display:'flex', gap:10, marginTop:24, borderTop:'1px solid #f1f5f9', paddingTop:16 }}>
              {preview.status === 'Pending' && (
                <>
                  <button onClick={() => { handleApprove(preview.id); setPreview(null); }} style={{ padding:'9px 22px', background:'#065f46', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.85rem' }}>
                    <i className="fas fa-check mr-2" />Duyệt bài
                  </button>
                  <button onClick={() => { handleReject(preview.id); setPreview(null); }} style={{ padding:'9px 22px', background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.85rem' }}>
                    <i className="fas fa-times mr-2" />Từ chối
                  </button>
                </>
              )}
              <button onClick={() => setPreview(null)} style={{ padding:'9px 22px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.85rem', marginLeft:'auto' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
};

export default AdminBlogPosts;
