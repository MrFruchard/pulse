/* global React, PhoneShell, PulseClock, fmtClock, Avatar, Pill, Btn, PulseLogo, BottomNav, MOCK_POSTS, MOCK_COMMENTS, PostCard */

const { useState: useState3 } = React;

// ─────────────────────────────────────────────────────────────
// 6. POST DETAIL — comments thread
// ─────────────────────────────────────────────────────────────
function ScreenPostDetail({ state = 'open', seconds = 42 * 60 + 17 }) {
  const post = MOCK_POSTS[0];
  const isClosed = state === 'closed';
  const [comment, setComment] = useState3('');

  return (
    <PhoneShell>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        height: 52, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isClosed ? 'var(--text-faint)' : 'var(--accent)',
            boxShadow: isClosed ? 'none' : '0 0 6px var(--accent)',
            animation: isClosed ? 'pulse-closed 6s ease-in-out infinite' : 'pulse-urgent 1.8s ease-in-out infinite',
          }}/>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
            {fmtClock(seconds)}
          </span>
        </div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Post (highlighted) */}
        <div style={{
          padding: '18px 18px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar size={40} hue={post.hue} label={post.author[0].toUpperCase()}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>@{post.author}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>session du 5 mai · {post.time}</div>
            </div>
            <Pill variant="muted" size="sm">{post.intent}</Pill>
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text)', marginBottom: 14, textWrap: 'pretty' }}>
            {post.body}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Object.entries(post.reactions).map(([emoji, count]) => (
              <span key={emoji} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-full)', padding: '4px 10px',
                fontSize: 12, color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                <span>{emoji}</span><span>{count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Comments header */}
        <div style={{
          padding: '14px 18px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {MOCK_COMMENTS.length} commentaires
          </div>
          {isClosed && (
            <Pill variant="muted" size="sm">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
              Commentaires fermés
            </Pill>
          )}
        </div>

        {/* Comments thread */}
        <div style={{ padding: '6px 18px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MOCK_COMMENTS.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, opacity: isClosed ? 0.7 : 1 }}>
              <Avatar size={28} hue={c.hue} label={c.author[0].toUpperCase()}/>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>@{c.author}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text)', textWrap: 'pretty' }}>
                  {c.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment input — only when open */}
      {!isClosed ? (
        <div style={{
          flexShrink: 0,
          padding: '10px 14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--bg-elevated)',
        }}>
          <Avatar size={28} hue={220} label="J"/>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajouter un commentaire…"
            style={{
              flex: 1, height: 38,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-full)',
              padding: '0 14px',
              color: 'var(--text)',
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <button disabled={!comment.trim()} style={{
            width: 38, height: 38, borderRadius: '50%',
            background: comment.trim() ? 'var(--accent)' : 'var(--surface)',
            border: '1px solid ' + (comment.trim() ? 'transparent' : 'var(--border)'),
            color: comment.trim() ? '#0b0b14' : 'var(--text-disabled)',
            cursor: comment.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      ) : (
        <div style={{
          flexShrink: 0,
          padding: '14px 18px 22px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: 'var(--text-faint)',
          background: 'var(--bg-elevated)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
          Reviens à la prochaine ouverture pour répondre.
        </div>
      )}
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. PROFILE
// ─────────────────────────────────────────────────────────────
function ScreenProfile({ state = 'open' }) {
  const isOnline = state !== 'closed';
  const past = [
    { date: '5 mai', intent: 'Question', body: 'Quelqu\'un d\'autre trouve que les meilleures idées arrivent dans la dernière demi-heure ?', comments: 8, reactions: 23 },
    { date: '4 mai', intent: 'Partage', body: 'Une chose que j\'ai apprise cette semaine : dire non à ce qui n\'a pas d\'écho.', comments: 3, reactions: 14 },
    { date: '3 mai', intent: 'Projet', body: 'Avancée du week-end sur l\'éditeur. Le drag-and-drop est enfin propre.', comments: 11, reactions: 31 },
    { date: '2 mai', intent: 'Challenge', body: '20 min sans téléphone après le réveil. Qui essaie demain ?', comments: 17, reactions: 42 },
  ];

  return (
    <PhoneShell>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        height: 52, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>@mira</div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 18px 14px' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <Avatar size={64} hue={280} label="M"/>
            {isOnline && (
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--accent)',
                border: '3px solid var(--bg)',
                animation: 'pulse-urgent 1.8s ease-in-out infinite',
              }}/>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Mira Sato</div>
              {isOnline && <Pill variant="accent" size="sm">en ligne</Pill>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>@mira · membre depuis fév. 2026</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, textWrap: 'pretty' }}>
              Designer indépendante. Je crois aux contraintes et aux conversations courtes.
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <Btn variant="secondary" size="sm" full>Suivre</Btn>
          <Btn variant="secondary" size="sm" full>Message</Btn>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '14px 4px',
          marginBottom: 22,
        }}>
          {[
            { v: '142', l: 'posts' },
            { v: '187', l: 'sessions' },
            { v: '21', l: 'streak' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
          Historique
        </div>
        <div style={{ position: 'relative', paddingLeft: 16 }}>
          {/* Timeline rail */}
          <div style={{
            position: 'absolute', left: 4, top: 6, bottom: 6,
            width: 1, background: 'var(--border)',
          }}/>
          {past.map((p, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{
                position: 'absolute', left: -16, top: 6,
                width: 9, height: 9, borderRadius: '50%',
                background: i === 0 && isOnline ? 'var(--accent)' : 'var(--surface)',
                border: '2px solid ' + (i === 0 && isOnline ? 'var(--accent)' : 'var(--border-strong)'),
                boxShadow: i === 0 && isOnline ? '0 0 8px var(--accent)' : 'none',
              }}/>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{p.date}</span>
                  <Pill variant="muted" size="sm">{p.intent}</Pill>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 8, textWrap: 'pretty' }}>{p.body}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-faint)' }}>
                  <span>{p.reactions} réactions</span>
                  <span>{p.comments} commentaires</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="profile" windowOpen={isOnline}/>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
function ScreenNotifications({ state = 'open' }) {
  const sessions = [
    {
      label: 'Aujourd\'hui · session en cours',
      live: true,
      items: [
        { type: 'comment', author: 'haru', hue: 200, time: 'à l\'instant', text: 'a commenté ton post : « Je crois que la pression de la fenêtre force… »', unread: true },
        { type: 'react',   author: 'leon', hue: 30,  time: 'il y a 2 min', text: 'a réagi 🔥 à ton post', unread: true },
        { type: 'react',   author: 'sara', hue: 160, time: 'il y a 4 min', text: 'a réagi 💡 à ton post', unread: true },
      ],
    },
    {
      label: 'Hier · session du 5 mai',
      live: false,
      items: [
        { type: 'comment', author: 'noor', hue: 340, time: '20:42', text: 'a commenté : « +1 sur l\'idée de la contrainte. »', unread: false },
        { type: 'follow',  author: 'kai',  hue: 100, time: '20:18', text: 'a commencé à te suivre', unread: false },
        { type: 'react',   author: 'haru', hue: 200, time: '20:11', text: 'a réagi 👍 à ton post', unread: false },
      ],
    },
  ];

  const iconFor = (type) => {
    if (type === 'comment') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5h16v11H8l-4 4V5z" strokeLinejoin="round"/></svg>
    );
    if (type === 'follow') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="9" r="3.5"/><path d="M4 19c1.2-2.5 3.5-3.8 6-3.8s4.8 1.3 6 3.8M18 7v6M15 10h6" strokeLinecap="round"/></svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8L12 4z" strokeLinejoin="round"/></svg>
    );
  };

  return (
    <PhoneShell>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em' }}>Notifications</div>
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-faint)', fontSize: 12, fontFamily: 'inherit', padding: 0,
        }}>Tout marquer lu</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0 14px' }}>
        {sessions.map((sess, si) => (
          <div key={si} style={{ marginTop: 16 }}>
            <div style={{
              padding: '0 18px 8px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {sess.live && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                  animation: 'pulse-urgent 1.8s ease-in-out infinite',
                }}/>
              )}
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {sess.label}
              </div>
            </div>
            <div>
              {sess.items.map((n, i) => (
                <div key={i} style={{
                  padding: '12px 18px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: n.unread ? 'rgba(129, 140, 248, 0.04)' : 'transparent',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar size={36} hue={n.hue} label={n.author[0].toUpperCase()}/>
                    <span style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: n.type === 'comment' ? 'var(--accent)' : 'var(--surface-2)',
                      color: n.type === 'comment' ? '#0b0b14' : 'var(--text-muted)',
                      border: '2px solid var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{iconFor(n.type)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.45, textWrap: 'pretty' }}>
                      <span style={{ fontWeight: 600 }}>@{n.author}</span>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{n.text}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{n.time}</div>
                  </div>
                  {n.unread && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--accent)',
                      marginTop: 14, flexShrink: 0,
                    }}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 16 }}/>
      </div>

      <BottomNav active="notifs" windowOpen={state !== 'closed'} notifCount={3}/>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. NAVBAR / Bottom nav showcase (full + dot states)
// ─────────────────────────────────────────────────────────────
function ScreenNavbar() {
  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 18px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
          Navbar — variantes
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {[
            { title: 'fenêtre ouverte · sur Pulse', active: 'home', open: true, count: 3 },
            { title: 'fenêtre ouverte · sur Notifs', active: 'notifs', open: true, count: 5 },
            { title: 'fenêtre fermée', active: 'home', open: false, count: 0 },
            { title: 'sur Profil', active: 'profile', open: true, count: 0 },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{s.title}</div>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <BottomNav active={s.active} windowOpen={s.open} notifCount={s.count}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}/>

        <div style={{
          fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5,
          padding: '14px 0 18px',
          borderTop: '1px dashed var(--border)',
        }}>
          Le point pulsant sur l'icône Pulse signale qu'une session est ouverte. Le badge sur Notifs compte les interactions non lues de la session courante.
        </div>
      </div>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. EMPTY STATE — first launch
// ─────────────────────────────────────────────────────────────
function ScreenEmpty({ state = 'open', seconds = 42 * 60 + 17 }) {
  return (
    <PhoneShell>
      {/* Header — reuse Pulse logo + clock */}
      <div style={{
        flexShrink: 0,
        padding: '14px 18px 18px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PulseLogo size={20}/>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>Pulse</span>
          </div>
          <Avatar size={28} hue={220} label="J"/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
          <PulseClock state={state} size="lg" seconds={seconds} showRings={state !== 'closed'}
            label={state === 'closed' ? 'prochaine ouverture' : 'session en cours'}/>
        </div>
      </div>

      {/* Empty body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 32px', textAlign: 'center' }}>
        {/* Decorative concentric rings */}
        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 24 }}>
          {[44, 70, 96, 120].map((sz, i) => (
            <div key={sz} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: sz, height: sz,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px solid var(--accent)',
              opacity: 0.06 + i * 0.08,
            }}/>
          ))}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 14, height: 14,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 16px var(--accent)',
            animation: state === 'closed' ? 'pulse-closed 6s ease-in-out infinite' : 'pulse-open 3.2s ease-in-out infinite',
          }}/>
        </div>

        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 10, lineHeight: 1.2 }}>
          Personne n'a encore parlé.
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 26, maxWidth: 280, textWrap: 'pretty' }}>
          La fenêtre vient d'ouvrir. Sois la première voix de la session — un post par jour, le tien compte double quand le silence dure.
        </div>

        {state !== 'closed' ? (
          <Btn variant="accent" size="lg">Écrire mon premier post</Btn>
        ) : (
          <Btn variant="secondary" size="lg" disabled>Reviens à l'ouverture</Btn>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>
          60 minutes par jour. Une voix à la fois.
        </div>
      </div>

      <BottomNav active="home" windowOpen={state !== 'closed'} notifCount={0}/>
    </PhoneShell>
  );
}

window.ScreenPostDetail = ScreenPostDetail;
window.ScreenProfile = ScreenProfile;
window.ScreenNotifications = ScreenNotifications;
window.ScreenNavbar = ScreenNavbar;
window.ScreenEmpty = ScreenEmpty;
