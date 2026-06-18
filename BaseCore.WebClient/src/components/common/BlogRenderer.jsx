import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../services/api';
import { toImg } from '../../utils/image';

/**
 * BlogRenderer - Elegant, premium reading experience for art articles
 * Used in public BlogDetail and Admin/Artist preview (compact mode)
 */
const BlogRenderer = ({ post, compact = false }) => {
  const [progress, setProgress] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [avatarErr, setAvatarErr] = useState(false);
  const [artistLinkId, setArtistLinkId] = useState(null);

  const {
    title,
    excerpt,
    authorName,
    authorId,
    authorAvatarUrl,
    category,
    coverImageUrl,
    publishedAt,
    createdAt,
    readTime,
    content,
  } = post || {};

  const resolvedAuthorName = authorName || post?.AuthorName || 'Tác giả';
  const resolvedAuthorId = authorId || post?.AuthorId;
  const resolvedAvatarFromPost = authorAvatarUrl || post?.AuthorAvatarUrl || '';

  // Parse blocks
  let blocks = [];
  try {
    const parsed = JSON.parse(content || '[]');
    if (Array.isArray(parsed)) blocks = parsed;
  } catch {
    if (content) blocks = [{ type: 'text', value: content }];
  }

  const date = publishedAt || createdAt;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';


  useEffect(() => {
    setAvatarErr(false);
    setArtistLinkId(resolvedAuthorId || null);

    const direct = resolvedAvatarFromPost;
    if (direct) {
      setAvatarSrc(toImg(direct) || direct);
      if (resolvedAuthorId) return;
    } else {
      setAvatarSrc(null);
    }

    if (!resolvedAuthorId && !resolvedAuthorName) return;

    userApi.getArtists()
      .then((res) => {
        const artists = Array.isArray(res.data) ? res.data : [];
        const match = artists.find((a) => {
          const id = a.id || a.Id;
          const name = a.name || a.Name;
          if (resolvedAuthorId && id === resolvedAuthorId) return true;
          if (resolvedAuthorName && name && name.toLowerCase() === resolvedAuthorName.toLowerCase()) return true;
          return false;
        });
        if (!match) return;
        const id = match.id || match.Id;
        if (id) setArtistLinkId(id);
        if (!direct) {
          const url = match.avatarUrl || match.AvatarUrl || '';
          if (url) setAvatarSrc(toImg(url) || url);
        }
      })
      .catch(() => {});
  }, [post, resolvedAvatarFromPost, resolvedAuthorId, resolvedAuthorName]);

  // Beautiful reading progress (full mode only)
  useEffect(() => {
    if (compact) return;

    const handleScroll = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;

      const scrolled = window.scrollY + windowHeight - articleTop;
      const progressPercent = Math.min(Math.max((scrolled / articleHeight) * 100, 0), 100);
      setProgress(progressPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [compact]);

  // Keyboard support for lightbox (Escape)
  const closeLightbox = useCallback(() => setLightboxImage(null), []);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImage, closeLightbox]);

  // Elegant share bar (used twice: after excerpt + at article end)
  const ShareBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
      paddingTop: 18,
      borderTop: '1px solid #f0ece8',
      flexWrap: 'wrap',
    }}>

    </div>
  );

  // First text block gets beautiful drop cap (only in full reading mode)
  let firstTextBlockIndex = -1;

  // Early-return SAU khi mọi hook đã chạy (tránh vi phạm Rules of Hooks)
  if (!post) return null;

  return (
    <article
      style={{
        maxWidth: compact ? '100%' : '780px',
        margin: '0 auto',
        background: '#f9f6f1',           // warm cream paper background (not harsh white)
        border: '1px solid #f0e9df',
        boxShadow: '0 8px 32px rgba(0,0,0,0.045)',
        fontFamily: 'inherit',
      }}
    >
      {/* Premium thin progress bar */}
      {!compact && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 2,
          background: 'rgba(232,228,223,0.7)', zIndex: 9999,
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(to right, var(--brand), var(--brand-dark))',
            transition: 'width 0.12s cubic-bezier(0.23, 1, 0.32, 1)',
          }} />
        </div>
      )}

      {/* Elegant Cover Image */}
      {coverImageUrl && (
        <div style={{
          width: '100%', height: compact ? '300px' : '520px',
          overflow: 'hidden', background: '#f0ece8', position: 'relative',
        }}>
          <img
            src={coverImageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => (e.target.style.display = 'none')}
          />
          {/* Very subtle artistic vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, transparent 32%, transparent 68%, rgba(0,0,0,0.08) 100%)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Premium Article Header */}
      <div style={{ padding: compact ? '26px 26px 16px' : '52px 52px 26px' }}>

        {/* Title - more elegant and commanding */}
        <h1 style={{
          fontSize: compact ? '1.72rem' : 'clamp(2.05rem, 4.6vw, 2.85rem)',
          fontWeight: 300, lineHeight: 1.18, color: 'var(--ink)',
          letterSpacing: '-0.015em', margin: '0 0 20px',
        }}>
          {title}
        </h1>

        {/* Refined author block */}
        {resolvedAuthorName && (() => {
          const authorInner = (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: '#e8e4df',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.05rem', fontWeight: 600, color: 'var(--brand-dark)', flexShrink: 0,
                overflow: 'hidden', border: '2px solid rgba(200,169,122,0.42)',
                transition: 'border-color 0.2s ease',
              }}>
                {avatarSrc && !avatarErr ? (
                  <img
                    src={avatarSrc}
                    alt={resolvedAuthorName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={() => setAvatarErr(true)}
                  />
                ) : (
                  resolvedAuthorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#2c2c2c', transition: 'color 0.2s ease' }}>
                  {resolvedAuthorName}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#888' }}>Tác giả</div>
              </div>
            </>
          );

          const wrapStyle = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 22,
            textDecoration: 'none',
            color: 'inherit',
          };

          return artistLinkId ? (
            <Link
              to={`/artists/${artistLinkId}`}
              className="blog-author-link"
              style={wrapStyle}
            >
              {authorInner}
            </Link>
          ) : (
            <div style={wrapStyle}>{authorInner}</div>
          );
        })()}

        {/* Elegant excerpt */}
        {excerpt && (
          <div style={{ marginBottom: compact ? 18 : 28 }}>
            <p className="blog-prose__excerpt" style={{
              fontSize: compact ? '0.96rem' : '1.065rem', color: '#4f4a42',
              fontStyle: 'italic', lineHeight: 1.78,
              borderLeft: '3.5px solid var(--brand)', paddingLeft: 20, margin: 0,
            }}>
              {excerpt}
            </p>
            {!compact && <ShareBar />}
          </div>
        )}
      </div>

      {/* Body Content - Premium reading experience */}
      <div
        className="blog-prose"
        style={{
          padding: compact ? '0 26px 36px' : '4px 52px 88px',
        }}
      >
        {blocks.length === 0 && (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Bài viết chưa có nội dung.</p>
        )}

        {blocks.map((block, index) => {
          if (block.type === 'image' && block.url) {
            const handleImageClick = () => { if (!compact) setLightboxImage(block.url); };

            return (
              <figure key={index} style={{ margin: '52px 0', textAlign: 'center' }}>
                <div
                  onClick={handleImageClick}
                  style={{
                    display: 'inline-block', maxWidth: '100%',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.09)',
                    borderRadius: 6, overflow: 'hidden',
                    background: '#f5f0e6',
                    cursor: compact ? 'default' : 'zoom-in',
                    transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease',
                    border: '1px solid #e6d9c9',
                  }}
                  onMouseEnter={e => {
                    if (!compact) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 18px 55px rgba(0,0,0,0.13)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!compact) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.09)';
                    }
                  }}
                >
                  <img
                    src={block.url}
                    alt={block.caption || title}
                    style={{
                      display: 'block', maxWidth: '100%', height: 'auto',
                      maxHeight: compact ? '420px' : '680px', objectFit: 'contain',
                    }}
                  />
                </div>
                {block.caption && (
                  <figcaption style={{
                    marginTop: 14, fontSize: '0.85rem', color: '#6b6358',
                    fontStyle: 'italic', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto',
                    position: 'relative',
                  }}>
                    <span style={{ position: 'relative', paddingLeft: 18 }}>
                      {block.caption}
                      <span style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: 9, height: 1, background: 'var(--brand)',
                      }} />
                    </span>
                  </figcaption>
                )}
              </figure>
            );
          }

          // Text block
          const text = (block.value || '').trim();
          if (!text) return null;

          const isFirstText = !compact && firstTextBlockIndex === -1;
          if (isFirstText) firstTextBlockIndex = index;

          return (
            <p
              key={index}
              className={`blog-prose__paragraph${isFirstText ? ' blog-prose__paragraph--lead' : ''}`}
              style={{
                fontSize: compact ? '0.97rem' : '1.075rem',
                lineHeight: 1.88,
                color: '#2f2a24',
                margin: '0 0 1.48em',
              }}
            >
              {text}
            </p>
          );
        })}

        {/* Elegant end separator + share */}
        {!compact && blocks.length > 0 && (
          <div style={{ marginTop: 52, paddingTop: 28, borderTop: '1px solid #e6d9c9' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--brand)', letterSpacing: '0.4em' }}>✦ ✦ ✦</span>
            </div>
            <ShareBar />
          </div>
        )}
      </div>

      {/* Premium Lightbox */}
      {lightboxImage && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.96)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: 24, animation: 'fadeIn 0.2s ease',
          }}
        >
          <img
            src={lightboxImage}
            alt="Xem ảnh lớn"
            style={{
              maxWidth: '94%', maxHeight: '92vh', objectFit: 'contain',
              borderRadius: 4, boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 28, right: 32,
              background: 'rgba(255,255,255,0.08)', color: '#ddd',
              border: '1px solid rgba(255,255,255,0.25)', width: 46, height: 46,
              borderRadius: '50%', fontSize: '1.55rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ddd'; }}
          >
            ×
          </button>
        </div>
      )}

      
      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        marginBottom: 14, fontSize: '0.82rem', color: '#777',
      }}>
        {category && (
          <span style={{
            fontSize: '0.71rem', fontWeight: 700, letterSpacing: '0.09em',
            textTransform: 'uppercase', padding: '3px 13px', background: '#f0ece8', color: 'var(--brand-dark)',
            borderRadius: 2,
          }}>
            {category}
          </span>
        )}
        {formattedDate && <span>{formattedDate}</span>}
        {readTime && <span style={{ color: '#aaa' }}>· {readTime} đọc</span>}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .blog-prose__excerpt,
        .blog-prose__paragraph {
          text-align: justify;
          text-justify: inter-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .blog-author-link:hover > div:first-child {
          border-color: var(--brand) !important;
        }
        .blog-author-link:hover > div:last-child > div:first-child {
          color: var(--brand-dark) !important;
        }

        .blog-prose__paragraph--lead::first-letter {
          -webkit-initial-letter: 2;
          initial-letter: 2;
          -webkit-initial-letter-align: auto;
          initial-letter-align: auto;
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-weight: 400;
          color: var(--brand-dark);
          letter-spacing: -0.02em;
          margin-right: 0.06em;
          padding: 0;
        }
      `}</style>
    </article>
  );
};

export default BlogRenderer;
