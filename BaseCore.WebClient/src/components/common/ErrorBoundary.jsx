import React from 'react';

/**
 * Error Boundary toàn cục — chặn lỗi render để không làm trắng cả app.
 * (Bắt buộc là class component: React chỉ hỗ trợ error boundary qua class.)
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log để debug; có thể nối tới dịch vụ giám sát (Sentry...) sau này.
    console.error('Lỗi render bị chặn bởi ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
        padding: 24, background: 'var(--cream, #faf8f5)', textAlign: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: '2.5rem', color: 'var(--brand, #c8a97a)' }}>✦</div>
        <h1 style={{ fontWeight: 300, fontSize: 'clamp(1.3rem,3vw,1.8rem)', color: 'var(--ink, #1a1a1a)', margin: 0 }}>
          Đã có lỗi xảy ra
        </h1>
        <p style={{ color: '#767676', maxWidth: 440, margin: 0, lineHeight: 1.6 }}>
          Rất tiếc, trang gặp sự cố ngoài ý muốn. Bạn thử tải lại trang, hoặc quay về trang chủ.
        </p>

        {import.meta.env.DEV && (
          <pre style={{
            maxWidth: 600, overflow: 'auto', textAlign: 'left',
            background: '#1a1a1a', color: '#f87171', padding: '12px 16px',
            borderRadius: 8, fontSize: '0.78rem', lineHeight: 1.5, margin: 0,
          }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={this.handleReload} style={{
            padding: '12px 28px', background: 'var(--ink, #1a1a1a)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Tải lại trang
          </button>
          <button onClick={this.handleHome} style={{
            padding: '12px 28px', background: 'white', color: 'var(--ink, #1a1a1a)',
            border: '1.5px solid var(--line, #e8e4df)', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
