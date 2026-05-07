/* global React, PhoneShell, PulseClock, fmtClock, Avatar, Pill, Btn, PulseLogo */

const { useState, useEffect } = React;

// ── Mock data ─────────────────────────────────────────────────
const MOCK_POSTS = [
  { id: 1, author: 'mira', hue: 280, time: '20:14', body: "Quelqu'un d'autre trouve que les meilleures idées arrivent dans la dernière demi-heure de la session ? J'ai l'impression que la contrainte fait sortir des choses qu'on garderait pour soi sinon.", reactions: { '🔥': 12, '👍': 4, '💡': 7 }, comments: 8, intent: 'Question' },
  { id: 2, author: 'haru', hue: 200, time: '20:08', body: 'Premier prototype de l\'app de méditation que je build depuis 3 mois. La synchronisation avec la respiration est plus dure que prévu mais on y arrive.', reactions: { '🔥': 28, '🤝': 5, '👏': 11 }, comments: 14, intent: 'Projet', hasImage: true },
  { id: 3, author: 'leon', hue: 30, time: '20:01', body: 'Lecture du soir : "Four Thousand Weeks" de Burkeman. Ce livre fait écho avec ce qu\'on fait ici.', reactions: { '📚': 6, '👍': 3 }, comments: 4, intent: 'Partage' },
  { id: 4, author: 'noor', hue: 340, time: '19:55', body: 'Challenge : écrivez une chose pour laquelle vous avez dit non cette semaine et que vous ne regrettez pas. Je commence.', reactions: { '🔥': 18, '🤝': 9 }, comments: 22, intent: 'Challenge' },
];

const MOCK_COMMENTS = [
  { id: 1, author: 'haru', hue: 200, time: '20:18', body: 'Je crois que la pression de la fenêtre force une honnêteté qu\'on n\'a pas sur les autres réseaux. On n\'a pas le luxe de polir.' },
  { id: 2, author: 'leon', hue: 30, time: '20:21', body: 'D\'accord. Et le fait de savoir que le post va « se figer » à 21h change la nature de ce qu\'on partage.' },
  { id: 3, author: 'sara', hue: 160, time: '20:24', body: '+1. C\'est presque une forme de méditation collective.' },
];

// ─────────────────────────────────────────────────────────────
// 1. SPLASH / ONBOARDING
// ─────────────────────────────────────────────────────────────
function ScreenSplash({ secondsToOpen = 4 * 3600 + 17 * 60 + 32 }) {
  return (
    <PhoneShell>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '40px 28px 36px',
      }}>
        {/* Top — logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <PulseLogo size={22} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>Pulse</span>
        </div>

        {/* Middle — clock */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 260 }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 12 }}>
              Une heure.<br/>
              <span style={{ color: 'var(--text-muted)' }}>Une fois par jour.</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-faint)', lineHeight: 1.5 }}>
              Pulse n'existe que 60 minutes par jour. Pendant ce temps, on parle. Le reste du temps, on écoute.
            </div>
          </div>

          <PulseClock state="closed" size="lg" seconds={secondsToOpen} label="prochaine ouverture" showRings={false}/>
        </div>

        {/* Bottom — CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="primary" full size="lg">Rejoindre</Btn>
          <Btn variant="ghost" full size="md">J'ai déjà un compte</Btn>
        </div>
      </div>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. AUTH (login / register toggle)
// ─────────────────────────────────────────────────────────────
function ScreenAuth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 44,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '0 14px',
          color: 'var(--text)',
          fontSize: 14,
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border 150ms',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      />
    </label>
  );

  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 28px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <PulseLogo size={20}/>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Pulse</span>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 4,
          marginBottom: 28,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 4, bottom: 4,
            left: mode === 'login' ? 4 : '50%',
            width: 'calc(50% - 4px)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'calc(var(--r-md) - 2px)',
            transition: 'left 220ms cubic-bezier(.2,.7,.3,1)',
          }}/>
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, position: 'relative', zIndex: 1,
              background: 'transparent', border: 'none',
              padding: '8px 0',
              fontSize: 13, fontWeight: 500,
              color: mode === m ? 'var(--text)' : 'var(--text-muted)',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'color 200ms',
            }}>
              {m === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          ))}
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 6 }}>
            {mode === 'login' ? 'Bon retour.' : 'Bienvenue dans Pulse.'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
            {mode === 'login' ? 'On t\'attendait pour la prochaine fenêtre.' : '60 minutes par jour. Le reste, c\'est à toi.'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="toi@exemple.com" />
          {mode === 'register' && (
            <Field label="Pseudo" value="" onChange={() => {}} placeholder="@ton_pseudo" />
          )}
          <Field label="Mot de passe" type="password" value={pw} onChange={setPw} placeholder="••••••••" />
        </div>

        <div style={{ marginTop: 24 }}>
          <Btn variant="primary" full size="lg">
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </Btn>
        </div>

        <div style={{ flex: 1 }}/>

        {mode === 'login' && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
            Mot de passe oublié ?
          </div>
        )}
      </div>
    </PhoneShell>
  );
}

window.ScreenSplash = ScreenSplash;
window.ScreenAuth = ScreenAuth;
window.MOCK_POSTS = MOCK_POSTS;
window.MOCK_COMMENTS = MOCK_COMMENTS;
