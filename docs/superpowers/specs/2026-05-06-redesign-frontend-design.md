# Redesign Frontend Pulse — Design Spec
*2026-05-06*

## Contexte

L'app Pulse a un frontend fonctionnel mais visuellement générique (dark gris, header top, desktop-first). Un système de design complet existe dans `/design/` — tokens, composants, écrans — avec une direction premium sombre, accent indigo, mobile-first. L'objectif est de remplacer la couche UI sans toucher à la logique métier, les hooks, ni les appels API.

---

## Contraintes

- Next.js 15 App Router, TypeScript strict
- Tailwind CSS — tokens mappés comme classes utilitaires
- Logique métier et hooks inchangés (`useSession`, `useWebSocket`, `useNotifications`, etc.)
- Pages inchangées — seuls les composants sont remplacés
- Police : Geist (package `geist`)
- Pas de framer-motion sur PulseClock (CSS animations pures)
- Pas de rings sur PulseClock
- Navigation : bottom nav mobile + sidebar desktop (≥ lg)

---

## 1. Tokens & Globals

### `app/globals.css`
```css
:root {
  --bg: #0a0a0b;
  --bg-elevated: #111114;
  --surface: #15151a;
  --surface-2: #1c1c22;
  --surface-hover: #22222a;
  --border: #25252d;
  --border-strong: #34343f;
  --border-subtle: #1c1c22;
  --text: #f5f5f7;
  --text-muted: #a1a1aa;
  --text-faint: #6b6b75;
  --text-disabled: #4a4a52;
  --accent: #818cf8;
  --accent-strong: #a5adff;
  --accent-soft: rgba(129, 140, 248, 0.12);
  --accent-ring: rgba(129, 140, 248, 0.28);
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.14);
  --font-sans: 'Geist', 'Inter', -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;
  --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px; --r-full: 999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.6);
  --shadow-md: 0 8px 24px rgba(0,0,0,.4);
  --shadow-lg: 0 24px 60px rgba(0,0,0,.55);
}
```

Animations keyframes à inclure dans globals.css :
- `pulse-open` (lub-DUB 2.4s, scale 1→1.018→1.002→1.045→1)
- `pulse-urgent` (même rythme, plus rapide, scale plus prononcé)
- `pulse-closed` (respiration lente, opacity 0.42→0.62→0.42)
- `pulse-glow` / `pulse-urgent-glow` (drop-shadow + brightness)
- `post-enter` (opacity 0→1 + translateY 8px→0, 280ms)

### `tailwind.config.ts`
Mapper tous les tokens comme classes :
```ts
colors: {
  bg: 'var(--bg)',
  elevated: 'var(--bg-elevated)',
  surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', hover: 'var(--surface-hover)' },
  border: { DEFAULT: 'var(--border)', strong: 'var(--border-strong)', subtle: 'var(--border-subtle)' },
  text: { DEFAULT: 'var(--text)', muted: 'var(--text-muted)', faint: 'var(--text-faint)', disabled: 'var(--text-disabled)' },
  accent: { DEFAULT: 'var(--accent)', strong: 'var(--accent-strong)', soft: 'var(--accent-soft)', ring: 'var(--accent-ring)' },
  danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
}
borderRadius: {
  sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)', full: 'var(--r-full)'
}
fontFamily: {
  sans: ['var(--font-sans)'],
  mono: ['var(--font-mono)'],
}
```

### `app/layout.tsx`
- Charger Geist via package `geist` (`GeistSans`, `GeistMono`)
- Injecter les variables CSS : `className={GeistSans.variable}`
- Background `bg-bg`, couleur `text-text`

---

## 2. Layout Responsive

### `components/layout/AppShell.tsx`
Wrapper principal autour de toutes les pages authentifiées.

```
Mobile (< lg):
┌─────────────────┐
│    contenu      │
│    (flex-1)     │
│                 │
├─────────────────┤
│   BottomNav     │  h-16, fixed bottom
└─────────────────┘

Desktop (≥ lg):
┌──────────┬──────────────────┐
│ Sidebar  │    contenu       │
│  240px   │   max-w-xl       │
│  fixed   │   centré         │
└──────────┴──────────────────┘
```

### `components/layout/BottomNav.tsx`
- 4 items : Pulse (icon: cercles concentriques), Explore (loupe), Notifs (cloche + badge), Profil (silhouette)
- Item actif : couleur `accent`, dot animé (`dot-pulse`)
- Item inactif : `text-muted`
- Background : `bg-bg/85` + `backdrop-blur-md`
- Border top : `border-border`
- Safe area bottom (padding-bottom env(safe-area-inset-bottom))

### `components/layout/Sidebar.tsx`
- Visible uniquement `lg:block`
- Logo Pulse en haut avec `PulseLogo` SVG
- Même 4 items que BottomNav, orientés verticalement avec labels
- Item actif : bg `accent-soft`, texte `accent`
- Bouton déconnexion en bas
- Border right : `border-border`

---

## 3. Composants UI Primitifs

### `components/ui/PulseClock.tsx`

Props :
```ts
interface PulseClockProps {
  state: 'open' | 'urgent' | 'closed'
  seconds: number       // secondes restantes
  size?: 'hero' | 'lg' | 'md' | 'sm'
  label?: string
}
```

États visuels :
- `open` : chiffres `text-accent`, animation `pulse-open` + `pulse-glow`
- `urgent` : chiffres `text-danger`, animation `pulse-urgent` + `pulse-urgent-glow` (déclenché quand `seconds < 600`)
- `closed` : chiffres `text-faint`, animation `pulse-closed`

Format : `HH:MM:SS` (tabular-nums)
Label en dessous : petit, `text-muted`, ex "prochaine ouverture dans" / "session en cours"

Pas de rings.

### `components/ui/Button.tsx`

```ts
variant: 'primary' | 'accent' | 'secondary' | 'ghost'
size: 'sm' | 'md' | 'lg'
full?: boolean
loading?: boolean
disabled?: boolean
```

- `primary` : bg `text`, color `bg` (blanc sur noir)
- `accent` : bg `accent`, color dark
- `secondary` : bg `surface`, border `border`, color `text`
- `ghost` : transparent, color `text-muted`
- Disabled : bg `surface`, color `text-disabled`, cursor-not-allowed
- Loading : spinner inline, disabled implicite

### `components/ui/Input.tsx`

```ts
label?: string
error?: string
hint?: string
```

- Background `surface`, border `border`
- Focus : border `accent`, ring `accent-ring`
- Error : border `danger`
- Label : `text-sm text-muted` au-dessus
- Error message : `text-xs text-danger` en dessous

### `components/ui/Pill.tsx`

```ts
variant: 'default' | 'accent' | 'danger' | 'muted' | 'solid'
size: 'sm' | 'md' | 'lg'
```

Intentions mappées :
- `QUESTION` → `accent`
- `SHARE` → `muted`
- `PROJECT` → variant custom violet soft
- `CHALLENGE` → `danger`

### `components/ui/Avatar.tsx`

```ts
pseudo: string
avatarUrl?: string | null
size?: number   // défaut 32
```

- Si `avatarUrl` : image ronde
- Sinon : gradient déterministe basé sur `pseudo.charCodeAt(0) % 360` pour le hue, initiale centrée
- Border subtile `border-subtle`

---

## 4. Composants Métier

### `components/PostCard.tsx`

Layout :
```
┌─────────────────────────────┐
│ [Avatar] pseudo  🔥streak   │
│          intention pill  hh:mm│
│                             │
│  Contenu du post...         │
│                             │
│  [image optionnelle]        │
│                             │
│  👍2  🔥1  💡0  🤝0   💬4  │
└─────────────────────────────┘
```

- Card : bg `surface`, border `border`, rounded `lg`
- Hover : border `border-strong`
- Animation `post-enter` à l'apparition
- Réactions : boutons avec aria-label, aria-pressed si actif
- `Pill` pour l'intention

### `components/PostComposer.tsx`

Mobile : bottom sheet (slide-up depuis le bas, overlay backdrop)
Desktop : panel dans le feed (pas de modal)

Contenu :
- Textarea autoexpandable, placeholder contextuel
- Row de Pills intentions (sélection unique)
- Row visibilité : Public / Abonnés / Sélection
- Timer PulseClock `sm` en bas à droite
- Bouton Publier (disabled si vide ou pas d'intention)

### `components/SplashScreen.tsx`

Remplace `HeartbeatScreen` :
- Fond `bg-bg`, centré vertical
- Logo + nom "Pulse" en haut
- Tagline : "Une heure. Une fois par jour." (grand, `font-semibold`)
- Sous-tagline : texte `text-faint`
- `PulseClock` état `closed`, size `lg`, label "prochaine ouverture"
- Si non connecté : boutons "Rejoindre" (primary) + "J'ai déjà un compte" (ghost)
- Si connecté + session fermée : juste le clock + message d'attente

### `components/NavBar.tsx` → supprimé
Remplacé par `BottomNav` + `Sidebar`.

---

## 5. Pages Auth

### `app/(auth)/login/page.tsx` et `register/page.tsx`

Fusionner visuellement en un seul design avec tab switcher :
- Logo Pulse en haut
- Tab switcher animé (glissière slide) : "Se connecter" / "Créer un compte"
- Titre contextuel : "Bon retour." / "Bienvenue dans Pulse."
- Sous-titre `text-faint` contextuel
- Champs `Input` (email, pseudo si register, password)
- Bouton primary full-width
- Lien secondaire (mot de passe oublié / déjà un compte)

Les deux pages restent des fichiers séparés mais partagent le même layout visuel.

---

## 6. Ordre d'implémentation

1. **Tokens** — `globals.css` + `tailwind.config.ts` + `layout.tsx` (Geist)
2. **Primitives** — `Avatar`, `Pill`, `Button`, `Input`, `PulseClock`
3. **Layout** — `BottomNav`, `Sidebar`, `AppShell`
4. **PostCard** + **PostComposer**
5. **SplashScreen**
6. **Pages auth** (login + register)
7. **Nettoyage** — supprimer `NavBar`, `HeartbeatScreen`, ancien `Countdown`

---

## Définition of Done

- [ ] Tous les tokens CSS définis et mappés dans Tailwind
- [ ] Geist chargé et appliqué globalement
- [ ] PulseClock 3 états fonctionnels (open/urgent/closed), sans rings
- [ ] AppShell responsive : bottom nav mobile, sidebar desktop
- [ ] PostCard, PostComposer redesignés
- [ ] Pages auth avec tab switcher
- [ ] SplashScreen remplace HeartbeatScreen
- [ ] Aucune régression fonctionnelle (auth, feed, reactions, follow)
- [ ] Build Next.js sans erreur TypeScript
