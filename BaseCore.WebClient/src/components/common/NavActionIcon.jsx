import React from 'react';
import { Link } from 'react-router-dom';

export const NAV_ACTION_THEME = {
  dark: {
    color: 'rgba(255,255,255,0.88)',
    hoverBg: 'rgba(255,255,255,0.08)',
    badgeBorder: '1.5px solid rgba(20,16,12,0.9)',
    alertRing: 'rgba(200,169,122,0.22)',
  },
  light: {
    color: '#374151',
    hoverBg: '#f5f0eb',
    badgeBorder: '1.5px solid white',
    alertRing: 'rgba(200,169,122,0.18)',
  },
};

export function BellGlyph({ size = 17, active = false, color = 'currentColor' }) {
  const fill = active ? 'var(--brand)' : color;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.25c-1.38 0-2.5 1.12-2.5 2.5v.42C5.78 5.34 4.5 7.1 4.5 9.25v3.05L3 14.35v.4h14v-.4l-1.5-2.05V9.25c0-2.15-1.28-3.91-3-4.08V4.75c0-1.38-1.12-2.5-2.5-2.5Z"
        fill={fill}
      />
      <path
        d="M8.25 14.75h3.5c0 .97-.78 1.75-1.75 1.75s-1.75-.78-1.75-1.75Z"
        fill={fill}
      />
    </svg>
  );
}

const NavActionIcon = ({
  theme = 'dark',
  count = 0,
  maxCount = 9,
  title,
  onClick,
  href,
  children,
  showAlertRing = false,
}) => {
  const t = NAV_ACTION_THEME[theme] || NAV_ACTION_THEME.dark;
  const hasBadge = count > 0;
  const hasAlert = showAlertRing && hasBadge;

  const baseStyle = {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: t.color,
    textDecoration: 'none',
    transition: 'background 0.15s ease, color 0.15s ease',
    lineHeight: 0,
  };

  const iconWrapStyle = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: hasAlert ? t.alertRing : 'transparent',
    transition: 'background 0.2s ease',
  };

  const badge = hasBadge && (
    <span style={{
      position: 'absolute',
      top: 2,
      right: 2,
      background: 'var(--brand)',
      color: 'white',
      borderRadius: '50%',
      minWidth: 17,
      height: 17,
      fontSize: 10,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: count > maxCount ? '0 4px' : 0,
      lineHeight: 1,
      border: t.badgeBorder,
      boxShadow: '0 1px 4px rgba(139,108,74,0.35)',
    }}>
      {count > 99 ? '99+' : count > maxCount ? `${maxCount}+` : count}
    </span>
  );

  const content = (
    <>
      <span style={iconWrapStyle}>{children}</span>
      {badge}
    </>
  );

  const hover = {
    onMouseEnter: (e) => { e.currentTarget.style.background = t.hoverBg; },
    onMouseLeave: (e) => { e.currentTarget.style.background = 'none'; },
  };

  if (href) {
    return (
      <Link to={href} title={title} style={baseStyle} {...hover}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" title={title} onClick={onClick} style={baseStyle} {...hover}>
      {content}
    </button>
  );
};

export default NavActionIcon;