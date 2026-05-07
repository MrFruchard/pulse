/* global React */

// PhoneShell — minimal iOS-style frame for our screens
function PhoneShell({ children, time = '20:14', dark = true }) {
  return (
    <div className="pulse-screen" style={{
      width: 375,
      height: 760,
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font-sans)',
      borderRadius: 36,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 38, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 22px 0 26px',
        fontSize: 13, fontWeight: 600,
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
      }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 8.5L1 7M5 8.5L5 5M9 8.5L9 3M13 8.5L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M7 1.5C9 1.5 11 2.5 12.5 4l-.7.7C10.5 3.4 8.8 2.5 7 2.5S3.5 3.4 2.2 4.7l-.7-.7C3 2.5 5 1.5 7 1.5zm0 2.3c1.5 0 2.8.6 3.7 1.5l-.7.7c-.7-.7-1.8-1.2-3-1.2s-2.3.5-3 1.2l-.7-.7c.9-.9 2.2-1.5 3.7-1.5zm0 2.3c1 0 1.8.4 2.4 1L7 9.5 4.6 7c.6-.6 1.4-1 2.4-1z"/></svg>
          <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" opacity="0.5"/>
            <rect x="2" y="2" width="14" height="7" rx="1.2" fill="currentColor"/>
            <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* Screen body */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// Small helpers
const Avatar = ({ size = 32, hue = 220, label = 'M' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, hsl(${hue}, 30%, 35%), hsl(${hue}, 25%, 22%))`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: size * 0.42, fontWeight: 600,
    flexShrink: 0,
    border: '1px solid var(--border-subtle)',
  }}>{label}</div>
);

const Pill = ({ children, variant = 'default', size = 'md', style = {} }) => {
  const variants = {
    default: { bg: 'transparent', color: 'var(--text-muted)', border: 'var(--border)' },
    accent:  { bg: 'var(--accent-soft)', color: 'var(--accent-strong)', border: 'transparent' },
    danger:  { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'transparent' },
    solid:   { bg: 'var(--text)', color: 'var(--bg)', border: 'transparent' },
    muted:   { bg: 'var(--surface-2)', color: 'var(--text-muted)', border: 'transparent' },
  };
  const v = variants[variant];
  const sizes = {
    sm: { fz: 10, py: 2, px: 7 },
    md: { fz: 11, py: 3, px: 9 },
    lg: { fz: 12, py: 5, px: 11 },
  };
  const s = sizes[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`,
      borderRadius: 'var(--r-full)',
      padding: `${s.py}px ${s.px}px`,
      fontSize: s.fz, fontWeight: 500,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
};

const Btn = ({ children, variant = 'primary', disabled, full, size = 'md', onClick, style = {} }) => {
  const variants = {
    primary: { bg: 'var(--text)', color: 'var(--bg)', border: 'transparent' },
    accent:  { bg: 'var(--accent)', color: '#0b0b14', border: 'transparent' },
    secondary: { bg: 'var(--surface)', color: 'var(--text)', border: 'var(--border)' },
    ghost: { bg: 'transparent', color: 'var(--text-muted)', border: 'transparent' },
  };
  const v = variants[variant];
  const sizes = {
    sm: { fz: 12, h: 32, px: 12 },
    md: { fz: 14, h: 40, px: 16 },
    lg: { fz: 15, h: 48, px: 20 },
  };
  const s = sizes[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: disabled ? 'var(--surface)' : v.bg,
      color: disabled ? 'var(--text-disabled)' : v.color,
      border: `1px solid ${disabled ? 'var(--border)' : v.border}`,
      height: s.h, padding: `0 ${s.px}px`,
      borderRadius: 'var(--r-md)',
      fontSize: s.fz, fontWeight: 500,
      fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      width: full ? '100%' : 'auto',
      letterSpacing: '-0.005em',
      transition: 'background 150ms ease, transform 100ms ease',
      ...style,
    }}>{children}</button>
  );
};

// Mini logo glyph — concentric circles, like a sonar ping
const PulseLogo = ({ size = 22, color = 'var(--accent)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill={color}/>
    <circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="1.2" opacity="0.55"/>
    <circle cx="12" cy="12" r="10.5" stroke={color} strokeWidth="1.2" opacity="0.22"/>
  </svg>
);

window.PhoneShell = PhoneShell;
window.Avatar = Avatar;
window.Pill = Pill;
window.Btn = Btn;
window.PulseLogo = PulseLogo;
