/* global React, PhoneShell, PulseClock, fmtClock, Avatar, Pill, Btn, PulseLogo, MOCK_POSTS */

const { useState: useState2, useEffect: useEffect2 } = React;

// Reusable bottom nav with pulsing dot for the Home tab when window is open
function BottomNav({ active = 'home', windowOpen, notifCount = 3 }) {
  const items = [
    { id: 'home', label: 'Pulse', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'currentColor'} opacity={active ? 1 : 0.9}/>
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.4" opacity={active ? 0.7 : 0.5}/>
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" opacity={active ? 0.4 : 0.25}/>
      </svg>
    )},
    { id: 'explore', label: 'Explore', icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'notifs', label: 'Notifs', icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 16h14l-1.5-2.5V10a5.5 5.5 0 10-11 0v3.5L5 16z" strokeLinejoin="round"/>
        <path d="M10 19a2 2 0 004 0" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'profile', label: 'Profil', icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="9" r="3.5"/><path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" strokeLinecap="round"/>
      </svg>
    )},
  ];

  return (
    <div style={{
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'rgba(10,10,11,0.85)',
      backdropFilter: 'blur(12px)',
      padding: '8px 12px 22px',
      display: 'flex',
      justifyContent: 'space-around',
    }}>
      {items.map((it) => {
        const isActive = active === it.id;
        return (
          <button key={it.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: isActive ? 'var(--text)' : 'var(--text-faint)',
            padding: '4px 12px',
            fontFamily: 'inherit',
            position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              {it.icon(isActive)}
              {/* Pulsing dot on Home when window is open */}
              {it.id === 'home' && windowOpen && (
                <span style={{
                  position: 'absolute', top: -2, right: -3,
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px var(--accent)',
                  animation: 'pulse-urgent 1.6s ease-in-out infinite',
                }}/>
              )}
              {/* Notif badge */}
              {it.id === 'notifs' && notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -6,
                  minWidth: 14, height: 14, padding: '0 4px',
                  borderRadius: 7,
                  background: 'var(--accent)',
                  color: '#0b0b14',
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid var(--bg)',
                }}>{notifCount}</span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Header used on Home — clock front and center
function HomeHeader({ state, seconds, hasPosted }) {
  const isClosed = state === 'closed';
  return (
    <div style={{
      flexShrink: 0,
      padding: '14px 18px 18px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PulseLogo size={20}/>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>Pulse</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasPosted && state !== 'closed' && (
            <Pill variant="accent" size="sm">posté ✓</Pill>
          )}
          <Avatar size={28} hue={220} label="J"/>
        </div>
      </div>

      {/* Clock — compact, no rings, just the counter */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0 8px' }}>
        <PulseClock
          state={state}
          size="md"
          seconds={seconds}
          showRings={false}
          label={isClosed ? 'prochaine ouverture' : (state === 'urgent' ? 'temps restant' : 'session en cours')}
        />
      </div>
    </div>
  );
}

// Post card
function PostCard({ post, frozen, onClick, delay = 0 }) {
  return (
    <div className="post-enter" onClick={onClick} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 14,
      cursor: frozen ? 'default' : 'pointer',
      opacity: frozen ? 0.62 : 1,
      filter: frozen ? 'saturate(0.65)' : 'none',
      transition: 'opacity 200ms, border-color 150ms',
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar size={28} hue={post.hue} label={post.author[0].toUpperCase()}/>
        <div style={{ fontSize: 13, fontWeight: 600 }}>@{post.author}</div>
        <Pill variant="muted" size="sm">{post.intent}</Pill>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{post.time}</div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)', marginBottom: 12, textWrap: 'pretty' }}>
        {post.body}
      </div>

      {post.hasImage && (
        <div style={{
          height: 140, marginBottom: 12,
          borderRadius: 'var(--r-md)',
          background: `linear-gradient(135deg, hsl(${post.hue}, 22%, 22%), hsl(${post.hue + 30}, 18%, 14%))`,
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-faint)', fontSize: 11,
        }}>
          <span style={{ opacity: 0.5 }}>—  image  —</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Object.entries(post.reactions).map(([emoji, count]) => (
          <span key={emoji} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-full)',
            padding: '3px 9px',
            fontSize: 11, color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>{emoji}</span><span>{count}</span>
          </span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-faint)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 5h16v11H8l-4 4V5z" strokeLinejoin="round"/>
          </svg>
          {post.comments}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3 + 4. HOME (open / closed)
// ─────────────────────────────────────────────────────────────
function ScreenHome({ state = 'open', seconds = 42 * 60 + 17, hasPosted = false, onCompose, onPostClick }) {
  const isClosed = state === 'closed';

  return (
    <PhoneShell>
      <HomeHeader state={state} seconds={seconds} hasPosted={hasPosted}/>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 14px' }}>
        {/* Compose CTA */}
        {!isClosed && !hasPosted && (
          <button onClick={onCompose} style={{
            width: '100%',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-ring)',
            borderRadius: 'var(--r-lg)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 14,
            transition: 'background 150ms',
          }}>
            <Avatar size={32} hue={220} label="J"/>
            <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-muted)' }}>
              Qu'est-ce que tu partages aujourd'hui ?
            </span>
            <span style={{
              background: 'var(--accent)', color: '#0b0b14',
              padding: '6px 12px', borderRadius: 'var(--r-md)',
              fontSize: 12, fontWeight: 600,
            }}>Écrire</span>
          </button>
        )}

        {!isClosed && hasPosted && (
          <div style={{
            background: 'var(--surface)',
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--r-lg)',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12, color: 'var(--text-muted)',
            marginBottom: 14,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ton post est en ligne. Reviens demain pour le prochain.
          </div>
        )}

        {/* Closed-window banner */}
        {isClosed && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            marginBottom: 14,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.6" style={{ marginTop: 2, flexShrink: 0 }}>
              <rect x="5" y="11" width="14" height="9" rx="2"/>
              <path d="M8 11V8a4 4 0 018 0v3"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Fenêtre fermée</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                Lecture seule. Tu peux parcourir, mais ni poster ni commenter avant la prochaine ouverture.
              </div>
            </div>
          </div>
        )}

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
          <Pill variant="solid" size="md" style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>Global</Pill>
          <Pill variant="default" size="md">Abonnements</Pill>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
            {isClosed ? 'session du 5 mai' : `${MOCK_POSTS.length} posts`}
          </div>
        </div>

        {/* Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_POSTS.map((p, i) => (
            <PostCard key={p.id} post={p} frozen={isClosed} onClick={() => !isClosed && onPostClick && onPostClick(p)} delay={i * 60}/>
          ))}
        </div>

        <div style={{ height: 20 }}/>
      </div>

      <BottomNav active="home" windowOpen={!isClosed}/>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. COMPOSER
// ─────────────────────────────────────────────────────────────
function ScreenComposer({ seconds = 42 * 60 + 17 }) {
  const [text, setText] = useState2('Je crois que la contrainte du temps change la qualité de ce qu\'on écrit. On garde l\'essentiel.');
  const max = 500;
  const intentions = ['Question', 'Partage', 'Projet', 'Challenge'];
  const [intent, setIntent] = useState2('Partage');

  return (
    <PhoneShell>
      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        height: 52, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}>Annuler</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)',
            animation: 'pulse-urgent 1.6s ease-in-out infinite',
          }}/>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
            {fmtClock(seconds)}
          </span>
        </div>
        <Btn variant="accent" size="sm" disabled={text.length === 0}>Publier</Btn>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 16px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={36} hue={220} label="J"/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>@jules</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Visible par tous · 1 post / jour</div>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, max))}
          placeholder="Qu'est-ce que tu veux partager aujourd'hui ?"
          style={{
            flex: 1, minHeight: 200,
            background: 'transparent',
            border: 'none', outline: 'none',
            color: 'var(--text)',
            fontSize: 17, lineHeight: 1.5,
            fontFamily: 'inherit',
            resize: 'none',
            padding: 0,
          }}
        />

        {/* Intent picker */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 600, marginBottom: 8 }}>
            Intention
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {intentions.map((i) => (
              <button key={i} onClick={() => setIntent(i)} style={{
                background: intent === i ? 'var(--accent-soft)' : 'transparent',
                border: `1px solid ${intent === i ? 'var(--accent-ring)' : 'var(--border)'}`,
                color: intent === i ? 'var(--accent-strong)' : 'var(--text-muted)',
                borderRadius: 'var(--r-full)',
                padding: '6px 12px',
                fontSize: 12, fontWeight: 500,
                fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all 150ms',
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* Counter + warning */}
        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-faint)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5" strokeLinecap="round"/>
            </svg>
            Tu ne peux publier qu'une fois par session.
          </div>
          <div style={{
            fontSize: 12, fontVariantNumeric: 'tabular-nums',
            color: text.length > max * 0.9 ? 'var(--danger)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {text.length}/{max}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

window.BottomNav = BottomNav;
window.HomeHeader = HomeHeader;
window.PostCard = PostCard;
window.ScreenHome = ScreenHome;
window.ScreenComposer = ScreenComposer;
