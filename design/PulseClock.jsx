/* global React */

// ─────────────────────────────────────────────────────────────
// PulseClock — restrained, crisp, grounded.
//
// Geometry: a fixed-size circular zone holds everything.
//   • Static concentric rings (3 of them) form a "plinth"
//   • One emitted ring per beat ripples outward from the inner radius
//     to the outer radius — never beyond.
//   • Numbers + dot scale gently with lub-DUB cadence.
//   • Brightness/glow surge handled with text color luminance, not blur.
//
// Crucially: the whole component is wrapped in overflow:hidden so it
// can never bleed into the feed below.
// ─────────────────────────────────────────────────────────────

function fmtClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(r)}`;
}

function PulseClock({ state = 'open', size = 'lg', seconds, label, showRings = true }) {
  const isUrgent = state === 'urgent';
  const isClosed = state === 'closed';
  const isLive = !isClosed;

  const color = isClosed
    ? 'var(--text-faint)'
    : isUrgent
      ? 'var(--danger)'
      : 'var(--accent)';

  const ringColor = isUrgent ? 'var(--danger)' : 'var(--accent)';

  const sizes = {
    hero: { font: 80, weight: 600, gap: 16, zone: 320, dotSize: 12, ecgW: 220 },
    lg:   { font: 48, weight: 600, gap: 12, zone: 0,   dotSize: 9,  ecgW: 170 },
    md:   { font: 28, weight: 600, gap: 6,  zone: 0,   dotSize: 7,  ecgW: 100 },
    sm:   { font: 14, weight: 500, gap: 6,  zone: 0,   dotSize: 5,  ecgW: 0 },
  };
  const cfg = sizes[size];

  // Cycle drives every layer in lockstep.
  const cycle = isClosed ? 6 : isUrgent ? 1.0 : 2.4;

  const pulseAnim = isClosed
    ? `pulse-closed ${cycle}s ease-in-out infinite`
    : isUrgent
      ? `pulse-urgent ${cycle}s cubic-bezier(.4,0,.2,1) infinite`
      : `pulse-open ${cycle}s cubic-bezier(.4,0,.2,1) infinite`;

  const glowAnim = isClosed
    ? 'none'
    : isUrgent
      ? `pulse-urgent-glow ${cycle}s cubic-bezier(.4,0,.2,1) infinite`
      : `pulse-glow ${cycle}s cubic-bezier(.4,0,.2,1) infinite`;

  const restingAnim = isUrgent
    ? `ring-resting-urgent ${cycle}s ease-in-out infinite`
    : `ring-resting ${cycle}s ease-in-out infinite`;

  const ringAnimName = isUrgent ? 'ring-emit-fast' : 'ring-emit';

  // Three static rings at fixed radii inside the zone, plus 2 emitted rings
  // staggered for a continuous ripple effect.
  const innerR = cfg.zone * 0.28;     // smallest static ring
  const midR   = cfg.zone * 0.40;
  const outerR = cfg.zone * 0.50;     // largest — bounded by zone radius
  const halfStroke = 1;

  const StaticRing = ({ r, opacity = 0.14 }) => (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      width: r * 2, height: r * 2,
      marginLeft: -r, marginTop: -r,
      borderRadius: '50%',
      border: `1px solid ${ringColor}`,
      opacity,
      pointerEvents: 'none',
    }}/>
  );

  // Emitted ring — sized to outerR, animated from inner to slightly past outer,
  // contained inside the clipped zone.
  const EmittedRing = ({ delay = 0, weight = 1.5 }) => (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      width: outerR * 2, height: outerR * 2,
      marginLeft: -outerR, marginTop: -outerR,
      borderRadius: '50%',
      border: `${weight}px solid ${ringColor}`,
      animation: `${ringAnimName} ${cycle}s cubic-bezier(.2,.6,.3,1) ${delay}s infinite`,
      opacity: 0,
      pointerEvents: 'none',
      transformOrigin: 'center',
    }}/>
  );

  return (
    <div style={{
      position: 'relative',
      width: cfg.zone || 'auto',
      height: cfg.zone || 'auto',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Critical: clip everything to the zone so nothing bleeds into the
      // surrounding layout (header / feed below).
      overflow: 'hidden',
      borderRadius: cfg.zone ? '50%' : 0,
    }}>
      {/* Static concentric rings — give the clock a stable, geometric base */}
      {isLive && showRings && cfg.zone > 0 && (
        <>
          <StaticRing r={outerR} opacity={0.08}/>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: midR * 2, height: midR * 2,
            marginLeft: -midR, marginTop: -midR,
            borderRadius: '50%',
            border: `1px solid ${ringColor}`,
            animation: restingAnim,
            pointerEvents: 'none',
          }}/>
          <StaticRing r={innerR} opacity={0.20}/>
        </>
      )}

      {/* Closed state: a single very faint static ring */}
      {isClosed && showRings && cfg.zone > 0 && (
        <>
          <StaticRing r={midR} opacity={0.06}/>
          <StaticRing r={innerR} opacity={0.10}/>
        </>
      )}

      {/* Emitted rings — the heartbeat ripple */}
      {isLive && showRings && cfg.zone > 0 && (
        <>
          <EmittedRing delay={0} weight={1.5}/>
          {!isUrgent && <EmittedRing delay={cycle * 0.55} weight={1}/>}
        </>
      )}

      {/* Center stack: digits + label, on top of the rings */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: cfg.gap,
        animation: pulseAnim,
        transformOrigin: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          {/* Heartbeat dot — solid, no bleeding shadow */}
          <span style={{
            width: cfg.dotSize, height: cfg.dotSize,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            animation: glowAnim,
          }}/>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: cfg.font,
            fontWeight: cfg.weight,
            letterSpacing: '-0.04em',
            color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            animation: glowAnim,
          }}>
            {fmtClock(seconds)}
          </span>
        </div>

        {/* ECG sweep removed for cleaner urgent state */}

        {label && (
          <div style={{
            fontSize: size === 'hero' ? 11 : 9,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

window.PulseClock = PulseClock;
window.fmtClock = fmtClock;
