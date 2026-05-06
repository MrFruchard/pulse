# Redesign Frontend Pulse — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer entièrement la couche UI du frontend Pulse par le système de design premium dark/indigo défini dans `/design/`, sans toucher à la logique métier ni aux hooks.

**Architecture:** Les pages et hooks restent intacts. On remplace les composants UI un par un dans l'ordre : tokens → primitives → layout → métier → écrans. Chaque tâche produit un diff compilable et testable.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, package `geist`, CSS animations pures (pas de framer-motion sur PulseClock).

**Spec:** `docs/superpowers/specs/2026-05-06-redesign-frontend-design.md`

---

## Fichiers créés / modifiés

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `frontend/app/globals.css` | Modifier | Tokens CSS + keyframes animations |
| `frontend/tailwind.config.ts` | Modifier | Mapping tokens → classes Tailwind |
| `frontend/app/layout.tsx` | Modifier | Geist font + bg/color global |
| `frontend/components/ui/Avatar.tsx` | Créer | Avatar avec initiale ou image |
| `frontend/components/ui/Pill.tsx` | Créer | Badge intention/état |
| `frontend/components/ui/Button.tsx` | Modifier | 4 variants avec tokens |
| `frontend/components/ui/Input.tsx` | Modifier | Fond surface, focus accent |
| `frontend/components/ui/PulseClock.tsx` | Créer | Horloge 3 états, CSS animations |
| `frontend/components/layout/BottomNav.tsx` | Créer | Navigation mobile fixe bas |
| `frontend/components/layout/Sidebar.tsx` | Créer | Navigation desktop fixe gauche |
| `frontend/components/AppShell.tsx` | Modifier | Shell responsive (bottom nav + sidebar) |
| `frontend/components/PostCard.tsx` | Modifier | Redesign avec Avatar + Pill |
| `frontend/components/PostComposer.tsx` | Modifier | Bottom sheet mobile, panel desktop |
| `frontend/components/SplashScreen.tsx` | Modifier | PulseClock closed + CTA |
| `frontend/app/(auth)/login/page.tsx` | Modifier | Tab switcher + nouveau design |
| `frontend/app/(auth)/register/page.tsx` | Modifier | Tab switcher partagé |
| `frontend/components/NavBar.tsx` | Supprimer | Remplacé par BottomNav + Sidebar |

---

## Task 1 : Tokens CSS + Tailwind + Geist

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/app/layout.tsx`

- [ ] **Installer le package Geist**

```bash
cd frontend && npm install geist
```

- [ ] **Remplacer `frontend/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

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
  --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px; --r-full: 999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.6);
  --shadow-md: 0 8px 24px rgba(0,0,0,.4);
  --shadow-lg: 0 24px 60px rgba(0,0,0,.55);
}

@keyframes pulse-open {
  0%   { transform: scale(1); }
  6%   { transform: scale(1.018); }
  12%  { transform: scale(1.002); }
  20%  { transform: scale(1.045); }
  28%  { transform: scale(1.008); }
  100% { transform: scale(1); }
}
@keyframes pulse-glow {
  0%   { filter: drop-shadow(0 0 0 transparent) brightness(1); }
  6%   { filter: drop-shadow(0 0 8px var(--accent-ring)) brightness(1.08); }
  20%  { filter: drop-shadow(0 0 22px var(--accent-ring)) brightness(1.18); }
  35%  { filter: drop-shadow(0 0 6px transparent) brightness(1.02); }
  100% { filter: drop-shadow(0 0 0 transparent) brightness(1); }
}
@keyframes pulse-urgent {
  0%   { transform: scale(1); }
  6%   { transform: scale(1.025); }
  12%  { transform: scale(1.005); }
  20%  { transform: scale(1.06); }
  28%  { transform: scale(1.012); }
  100% { transform: scale(1); }
}
@keyframes pulse-urgent-glow {
  0%   { filter: drop-shadow(0 0 0 transparent) brightness(1); }
  6%   { filter: drop-shadow(0 0 10px rgba(248,113,113,.32)) brightness(1.12); }
  20%  { filter: drop-shadow(0 0 28px rgba(248,113,113,.32)) brightness(1.25); }
  35%  { filter: drop-shadow(0 0 8px transparent) brightness(1.04); }
  100% { filter: drop-shadow(0 0 0 transparent) brightness(1); }
}
@keyframes pulse-closed {
  0%, 100% { opacity: 0.42; transform: scale(1); }
  50%      { opacity: 0.62; transform: scale(1.012); }
}
@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-ring); }
  50%      { box-shadow: 0 0 0 6px transparent; }
}
@keyframes post-enter {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
.post-enter { animation: post-enter 280ms cubic-bezier(.2,.7,.3,1) both; }
```

- [ ] **Remplacer `frontend/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        elevated: 'var(--bg-elevated)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          hover: 'var(--surface-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          subtle: 'var(--border-subtle)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
          disabled: 'var(--text-disabled)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
          soft: 'var(--accent-soft)',
          ring: 'var(--accent-ring)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
        },
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        full: 'var(--r-full)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-open': 'pulse-open 2.4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'pulse-urgent': 'pulse-urgent 1.2s ease-in-out infinite',
        'pulse-urgent-glow': 'pulse-urgent-glow 1.2s ease-in-out infinite',
        'pulse-closed': 'pulse-closed 4s ease-in-out infinite',
        'dot-pulse': 'dot-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Remplacer `frontend/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Pulse',
  description: "Un réseau social qui n'existe qu'une heure par jour.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-bg text-text min-h-screen antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
```

- [ ] **Vérifier que ça compile**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Attendu : build sans erreur TypeScript.

- [ ] **Commit**

```bash
git add frontend/app/globals.css frontend/tailwind.config.ts frontend/app/layout.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(design): tokens CSS indigo, Tailwind mapping, Geist font"
```

---

## Task 2 : Primitives UI — Avatar + Pill

**Files:**
- Create: `frontend/components/ui/Avatar.tsx`
- Create: `frontend/components/ui/Pill.tsx`

- [ ] **Créer `frontend/components/ui/Avatar.tsx`**

```typescript
interface AvatarProps {
  pseudo: string
  avatarUrl?: string | null
  size?: number
}

export function Avatar({ pseudo, avatarUrl, size = 32 }: AvatarProps) {
  const hue = pseudo.charCodeAt(0) % 360
  const fontSize = Math.round(size * 0.42)

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={pseudo}
        width={size}
        height={size}
        style={{ borderRadius: '50%', flexShrink: 0 }}
        className="border border-border-subtle object-cover"
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue}, 30%, 35%), hsl(${hue}, 25%, 22%))`,
        fontSize,
        flexShrink: 0,
      }}
      className="flex items-center justify-center font-semibold text-white/85 border border-border-subtle"
    >
      {pseudo[0].toUpperCase()}
    </div>
  )
}
```

- [ ] **Créer `frontend/components/ui/Pill.tsx`**

```typescript
import type { PostIntention } from '@/types'

type PillVariant = 'default' | 'accent' | 'danger' | 'muted' | 'violet'

interface PillProps {
  children: React.ReactNode
  variant?: PillVariant
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<PillVariant, string> = {
  default: 'bg-transparent text-text-muted border border-border',
  accent:  'bg-accent-soft text-accent-strong border border-transparent',
  danger:  'bg-danger-soft text-danger border border-transparent',
  muted:   'bg-surface-2 text-text-muted border border-transparent',
  violet:  'bg-violet-500/10 text-violet-400 border border-transparent',
}

const sizeStyles = {
  sm: 'text-[10px] py-0.5 px-1.5',
  md: 'text-[11px] py-1 px-2',
}

export function Pill({ children, variant = 'default', size = 'md', className = '' }: PillProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap
      ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  )
}

export const INTENTION_PILL: Record<PostIntention, PillVariant> = {
  QUESTION:  'accent',
  SHARE:     'muted',
  PROJECT:   'violet',
  CHALLENGE: 'danger',
}

export const INTENTION_LABEL: Record<PostIntention, string> = {
  QUESTION:  'Question',
  SHARE:     'Partage',
  PROJECT:   'Projet',
  CHALLENGE: 'Challenge',
}
```

- [ ] **Commit**

```bash
git add frontend/components/ui/Avatar.tsx frontend/components/ui/Pill.tsx
git commit -m "feat(design): primitives Avatar et Pill"
```

---

## Task 3 : Primitives UI — Button + Input redesignés

**Files:**
- Modify: `frontend/components/ui/Button.tsx`
- Modify: `frontend/components/ui/Input.tsx` (ou créer si absent)

- [ ] **Remplacer `frontend/components/ui/Button.tsx`**

```typescript
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  loading?: boolean
}

const variantStyles = {
  primary:   'bg-text text-bg hover:bg-text/90',
  accent:    'bg-accent text-bg hover:bg-accent-strong',
  secondary: 'bg-surface text-text border border-border hover:border-border-strong',
  ghost:     'bg-transparent text-text-muted hover:text-text',
}

const sizeStyles = {
  sm: 'h-8  px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-5 text-[15px] rounded-lg',
}

export function Button({
  variant = 'primary', size = 'md', full, loading, children, disabled, className = '', ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors
        disabled:bg-surface disabled:text-text-disabled disabled:cursor-not-allowed disabled:border-border
        ${variantStyles[variant]} ${sizeStyles[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : children}
    </button>
  )
}
```

- [ ] **Remplacer `frontend/components/ui/Input.tsx`**

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={`h-11 bg-surface border rounded-md px-3.5 text-sm text-text
            placeholder:text-text-faint font-sans outline-none transition-colors
            focus:border-accent focus:ring-1 focus:ring-accent/30
            ${error ? 'border-danger' : 'border-border'}
            ${className}`}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
        {hint && !error && <span className="text-xs text-text-faint">{hint}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
```

- [ ] **Commit**

```bash
git add frontend/components/ui/Button.tsx frontend/components/ui/Input.tsx
git commit -m "feat(design): Button et Input avec tokens indigo"
```

---

## Task 4 : PulseClock

**Files:**
- Create: `frontend/components/ui/PulseClock.tsx`

- [ ] **Créer `frontend/components/ui/PulseClock.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'

type ClockState = 'open' | 'urgent' | 'closed'
type ClockSize = 'hero' | 'lg' | 'md' | 'sm'

interface PulseClockProps {
  state: ClockState
  seconds: number
  size?: ClockSize
  label?: string
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function toHMS(total: number) {
  const s = Math.max(0, Math.floor(total))
  return {
    h: Math.floor(s / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

const fontSizes: Record<ClockSize, string> = {
  hero: 'text-[80px]',
  lg:   'text-5xl',
  md:   'text-3xl',
  sm:   'text-base',
}

const gaps: Record<ClockSize, string> = {
  hero: 'gap-4',
  lg:   'gap-3',
  md:   'gap-2',
  sm:   'gap-1.5',
}

export function PulseClock({ state, seconds, size = 'lg', label }: PulseClockProps) {
  const [current, setCurrent] = useState(seconds)

  useEffect(() => {
    setCurrent(seconds)
    if (state === 'closed') return
    const id = setInterval(() => setCurrent(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds, state])

  const { h, m, s } = toHMS(current)

  const colorClass = state === 'closed'
    ? 'text-text-faint'
    : state === 'urgent'
    ? 'text-danger'
    : 'text-accent'

  const animClass = state === 'closed'
    ? 'animate-pulse-closed'
    : state === 'urgent'
    ? 'animate-pulse-urgent'
    : 'animate-pulse-open'

  const glowClass = state === 'urgent'
    ? 'animate-pulse-urgent-glow'
    : state === 'open'
    ? 'animate-pulse-glow'
    : ''

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex items-baseline ${gaps[size]} ${colorClass} ${animClass} ${glowClass}
          font-semibold tabular-nums tracking-tight`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        aria-label={`${h}h${pad(m)}m${pad(s)}s`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={fontSizes[size]}>{pad(h)}</span>
        <span className={`${fontSizes[size]} text-text-faint`}>:</span>
        <span className={fontSizes[size]}>{pad(m)}</span>
        <span className={`${fontSizes[size]} text-text-faint`}>:</span>
        <span className={fontSizes[size]}>{pad(s)}</span>
      </div>
      {label && (
        <span className="text-xs text-text-faint tracking-wide uppercase">{label}</span>
      )}
    </div>
  )
}
```

- [ ] **Vérifier le build**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```
Attendu : aucune erreur TypeScript.

- [ ] **Commit**

```bash
git add frontend/components/ui/PulseClock.tsx
git commit -m "feat(design): PulseClock 3 états (open/urgent/closed), CSS animations"
```

---

## Task 5 : Layout — BottomNav + Sidebar

**Files:**
- Create: `frontend/components/layout/BottomNav.tsx`
- Create: `frontend/components/layout/Sidebar.tsx`

- [ ] **Créer le dossier layout**

```bash
mkdir -p frontend/components/layout
```

- [ ] **Créer `frontend/components/layout/BottomNav.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  unreadCount?: number
}

const PulseIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.4" opacity={active ? 0.7 : 0.4} />
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" opacity={active ? 0.35 : 0.2} />
  </svg>
)
const ExploreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" strokeLinecap="round" />
  </svg>
)
const NotifIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M5 16h14l-1.5-2.5V10a5.5 5.5 0 10-11 0v3.5L5 16z" strokeLinejoin="round" />
    <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
  </svg>
)
const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="9" r="3.5" />
    <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" strokeLinecap="round" />
  </svg>
)

export function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const items = [
    { href: '/feed',          label: 'Pulse',   icon: (a: boolean) => <PulseIcon active={a} /> },
    { href: '/explore',       label: 'Explore', icon: () => <ExploreIcon /> },
    { href: '/notifications', label: 'Notifs',  icon: () => <NotifIcon />, badge: unreadCount },
    { href: '/profile',       label: 'Profil',  icon: () => <ProfileIcon /> },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden
        border-t border-border bg-bg/85 backdrop-blur-md
        flex justify-around items-center
        h-16 pb-safe"
      aria-label="Navigation principale"
    >
      {items.map(({ href, label, icon, badge }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors
              ${active ? 'text-accent' : 'text-text-muted hover:text-text'}`}
          >
            <div className="relative">
              {icon(active)}
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accent text-bg
                  text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {active && (
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1
                    rounded-full bg-accent animate-dot-pulse"
                />
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Créer `frontend/components/layout/Sidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/api'

interface SidebarProps {
  pseudo?: string
  unreadCount?: number
}

const PulseLogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill="var(--accent)" />
    <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
    <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
  </svg>
)

export function Sidebar({ pseudo, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await auth.logout().catch(() => {})
    router.push('/')
    router.refresh()
  }

  const items = [
    { href: '/feed',          label: 'Pulse',         icon: '○' },
    { href: '/explore',       label: 'Explore',       icon: '⊹' },
    { href: '/notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
    { href: pseudo ? `/profile/${pseudo}` : '/profile', label: 'Profil', icon: '◯' },
  ]

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60
      border-r border-border bg-bg z-40">
      <div className="p-6 flex items-center gap-2.5">
        <PulseLogoIcon />
        <span className="text-lg font-semibold tracking-tight">Pulse</span>
      </div>

      <nav className="flex-1 px-3 space-y-1" aria-label="Navigation">
        {items.map(({ href, label, icon, badge }) => {
          const active = pathname.startsWith(href.split('/').slice(0, 3).join('/'))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{label}</span>
              {badge && badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-accent text-bg text-[10px]
                  font-bold rounded-full flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
            text-text-muted hover:text-text hover:bg-surface transition-colors"
        >
          <span>↩</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/components/layout/
git commit -m "feat(design): BottomNav mobile + Sidebar desktop"
```

---

## Task 6 : AppShell responsive

**Files:**
- Modify: `frontend/components/AppShell.tsx`

- [ ] **Remplacer `frontend/components/AppShell.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { useNotifications } from '@/hooks/useNotifications'
import { auth } from '@/lib/api'
import type { User } from '@/types'

const AUTH_PATHS = ['/', '/login', '/register']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [me, setMe] = useState<User | null>(null)
  const { unreadCount } = useNotifications()

  const isAuthPage = AUTH_PATHS.some(p => pathname === p)
    || pathname.startsWith('/login')
    || pathname.startsWith('/register')

  useEffect(() => {
    if (isAuthPage) return
    auth.me()
      .then(data => setMe((data as { user: User }).user))
      .catch(() => {})
  }, [isAuthPage])

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar desktop */}
      <Sidebar pseudo={me?.pseudo} unreadCount={unreadCount} />

      {/* Contenu principal */}
      <main className="lg:pl-60 pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-xl mx-auto px-0 lg:px-4">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
```

- [ ] **Vérifier le build**

```bash
cd frontend && npm run build 2>&1 | grep -E "Error|error" | grep -v "node_modules" | head -10
```
Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add frontend/components/AppShell.tsx
git commit -m "feat(design): AppShell responsive — bottom nav mobile + sidebar desktop"
```

---

## Task 7 : PostCard redesignée

**Files:**
- Modify: `frontend/components/PostCard.tsx`

- [ ] **Remplacer `frontend/components/PostCard.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Pill, INTENTION_PILL, INTENTION_LABEL } from '@/components/ui/Pill'
import { CommentSection } from '@/components/CommentSection'
import type { Post, ReactionType } from '@/types'

const REACTION_LABELS: Record<ReactionType, string> = {
  LIKE: 'Aimer', FIRE: 'En feu', INSIGHTFUL: 'Pertinent', SUPPORT: 'Soutenir',
}

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'FIRE', emoji: '🔥' },
  { type: 'INSIGHTFUL', emoji: '💡' },
  { type: 'SUPPORT', emoji: '🤝' },
]

interface PostCardProps {
  post: Post
  onReact?: (postId: string, type: ReactionType) => void
}

export function PostCard({ post, onReact }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>(post.userReaction)
  const [reactions, setReactions] = useState(post.reactions)

  function handleReactionClick(type: ReactionType) {
    const isSame = userReaction === type
    if (isSame) {
      setUserReaction(undefined)
      setReactions(prev => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 0) - 1) }))
    } else {
      if (userReaction) {
        setReactions(prev => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] ?? 0) - 1) }))
      }
      setUserReaction(type)
      setReactions(prev => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }))
    }
    onReact?.(post.id, type)
  }

  const time = new Date(post.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <article className="post-enter bg-surface border border-border rounded-lg p-4
      hover:border-border-strong transition-colors">
      <div className="flex items-start gap-3">
        <Avatar pseudo={post.author.pseudo} avatarUrl={post.author.avatarUrl} size={36} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold">{post.author.pseudo}</span>
            {post.author.streak > 1 && (
              <span className="text-xs text-yellow-500">🔥 {post.author.streak}</span>
            )}
            <Pill variant={INTENTION_PILL[post.intention]} size="sm">
              {INTENTION_LABEL[post.intention]}
            </Pill>
            <span className="text-xs text-text-faint ml-auto">{time}</span>
          </div>

          {/* Contenu */}
          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </p>

          {/* Image */}
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={`Image de ${post.author.pseudo}`}
              className="w-full rounded-md max-h-72 object-cover border border-border mb-3"
            />
          )}

          {/* Réactions */}
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Réactions">
            {REACTIONS.map(({ type, emoji }) => (
              <button
                key={type}
                onClick={() => handleReactionClick(type)}
                aria-label={`${REACTION_LABELS[type]}${(reactions[type] ?? 0) > 0 ? ` (${reactions[type]})` : ''}`}
                aria-pressed={userReaction === type}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors
                  ${userReaction === type
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-faint hover:text-text-muted hover:bg-surface-2'
                  }`}
              >
                <span aria-hidden="true">{emoji}</span>
                {(reactions[type] ?? 0) > 0 && <span>{reactions[type]}</span>}
              </button>
            ))}
            <button
              onClick={() => setShowComments(v => !v)}
              aria-label={`${showComments ? 'Masquer' : 'Afficher'} les commentaires`}
              aria-expanded={showComments}
              className="ml-auto text-xs text-text-faint hover:text-text-muted transition-colors"
            >
              💬 {post.commentCount}
            </button>
          </div>

          {showComments && <CommentSection postId={post.id} />}
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/components/PostCard.tsx
git commit -m "feat(design): PostCard redesignée avec Avatar + Pill"
```

---

## Task 8 : SplashScreen

**Files:**
- Modify: `frontend/components/SplashScreen.tsx`

- [ ] **Remplacer `frontend/components/SplashScreen.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { PulseClock } from '@/components/ui/PulseClock'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'

interface SplashScreenProps {
  onDone?: () => void
  authenticated?: boolean
}

function PulseLogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="var(--accent)" />
      <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
    </svg>
  )
}

export function SplashScreen({ authenticated = false }: SplashScreenProps) {
  const { sessionState } = useSession()

  const secondsToOpen = sessionState?.opensAt
    ? Math.max(0, Math.floor((new Date(sessionState.opensAt).getTime() - Date.now()) / 1000))
    : 0

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between p-8">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mt-4">
        <PulseLogoMark />
        <span className="text-lg font-semibold tracking-tight">Pulse</span>
      </div>

      {/* Centre */}
      <div className="flex flex-col items-center gap-8 text-center max-w-xs">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight leading-snug mb-3">
            Une heure.<br />
            <span className="text-text-muted">Une fois par jour.</span>
          </h1>
          <p className="text-sm text-text-faint leading-relaxed">
            Pulse n&apos;existe que 60 minutes par jour.<br />
            Pendant ce temps, on parle.
          </p>
        </div>

        <PulseClock
          state="closed"
          seconds={secondsToOpen}
          size="lg"
          label="prochaine ouverture"
        />
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs flex flex-col gap-3 mb-4">
        {!authenticated ? (
          <>
            <Link href="/register">
              <Button variant="primary" full size="lg">Rejoindre</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" full size="md">J&apos;ai déjà un compte</Button>
            </Link>
          </>
        ) : (
          <p className="text-center text-sm text-text-faint">
            La prochaine session ouvrira bientôt.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Mettre à jour `AppShell.tsx` pour utiliser SplashScreen quand session fermée**

Dans `frontend/components/AppShell.tsx`, supprimer la logique `showSplash` (l'ancienne splash animée) — la nouvelle SplashScreen est gérée directement par la page feed via HeartbeatScreen. La logique actuelle dans AppShell avec `sessionStorage` peut rester supprimée car on n'affiche plus l'écran de splash au premier chargement.

> Note: le AppShell réécrit en Task 6 n'inclut plus de logique splash — c'est déjà fait.

- [ ] **Commit**

```bash
git add frontend/components/SplashScreen.tsx
git commit -m "feat(design): SplashScreen avec PulseClock closed"
```

---

## Task 9 : Pages Auth — Login + Register

**Files:**
- Modify: `frontend/app/(auth)/login/page.tsx`
- Modify: `frontend/app/(auth)/register/page.tsx`

- [ ] **Remplacer `frontend/app/(auth)/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function PulseLogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="var(--accent)" />
      <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.login({ email: form.email, password: form.password })
      router.push('/feed')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('suspended') ? 'Ton compte a été suspendu.' : 'Identifiants invalides.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-10">
        <PulseLogoMark />
        <span className="text-base font-semibold tracking-tight">Pulse</span>
      </div>

      {/* Tab switcher */}
      <div className="relative flex bg-surface border border-border rounded-md p-1 mb-7">
        <div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)]
          bg-surface-2 border border-border-strong rounded transition-all duration-200" />
        <Link href="/login" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text">
          Se connecter
        </Link>
        <Link href="/register" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text-muted">
          Créer un compte
        </Link>
      </div>

      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Bon retour.</h1>
        <p className="text-sm text-text-faint">On t&apos;attendait pour la prochaine fenêtre.</p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="toi@exemple.com"
          autoComplete="email"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={error || undefined}
        />
        <Button type="submit" variant="primary" full size="lg" loading={loading} className="mt-2">
          Se connecter
        </Button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <span className="text-xs text-text-faint">Mot de passe oublié ?</span>
      </div>
    </div>
  )
}
```

- [ ] **Remplacer `frontend/app/(auth)/register/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function PulseLogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="var(--accent)" />
      <circle cx="12" cy="12" r="6.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.22" />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', pseudo: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.register({ email: form.email, pseudo: form.pseudo, password: form.password })
      router.push('/feed')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('email')) setError('Cet email est déjà utilisé.')
      else if (msg.includes('pseudo')) setError('Ce pseudo est déjà pris.')
      else setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-10">
        <PulseLogoMark />
        <span className="text-base font-semibold tracking-tight">Pulse</span>
      </div>

      {/* Tab switcher */}
      <div className="relative flex bg-surface border border-border rounded-md p-1 mb-7">
        <div className="absolute top-1 bottom-1 right-1 w-[calc(50%-4px)]
          bg-surface-2 border border-border-strong rounded transition-all duration-200" />
        <Link href="/login" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text-muted">
          Se connecter
        </Link>
        <Link href="/register" className="relative z-10 flex-1 py-2 text-center text-sm font-medium text-text">
          Créer un compte
        </Link>
      </div>

      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Bienvenue dans Pulse.</h1>
        <p className="text-sm text-text-faint">60 minutes par jour. Le reste, c&apos;est à toi.</p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="toi@exemple.com"
          autoComplete="email"
          required
        />
        <Input
          label="Pseudo"
          value={form.pseudo}
          onChange={set('pseudo')}
          placeholder="@ton_pseudo"
          autoComplete="username"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          error={error || undefined}
        />
        <Button type="submit" variant="primary" full size="lg" loading={loading} className="mt-2">
          Créer mon compte
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/app/\(auth\)/login/page.tsx frontend/app/\(auth\)/register/page.tsx
git commit -m "feat(design): pages auth redesignées avec tab switcher"
```

---

## Task 10 : Nettoyage final

**Files:**
- Supprimer: `frontend/components/NavBar.tsx` (remplacé par BottomNav + Sidebar)
- Supprimer: `frontend/components/HeartbeatScreen.tsx` (remplacé par SplashScreen)
- Modifier: `frontend/app/feed/page.tsx` (retirer import NavBar, SessionBar)
- Modifier: `frontend/app/notifications/page.tsx` (retirer import NavBar)

- [ ] **Retirer NavBar des pages**

Dans `frontend/app/feed/page.tsx` : supprimer `import { NavBar }` et `<NavBar ... />` (remplacé par AppShell).

Dans `frontend/app/notifications/page.tsx` : même chose.

Dans `frontend/app/profile/[pseudo]/page.tsx` : même chose.

- [ ] **Supprimer les composants obsolètes**

```bash
rm frontend/components/NavBar.tsx
rm frontend/components/HeartbeatScreen.tsx
```

- [ ] **Remplacer HeartbeatScreen par SplashScreen dans feed**

Dans `frontend/app/feed/page.tsx`, remplacer :
```typescript
// Avant
import { HeartbeatScreen } from '@/components/HeartbeatScreen'
// ...
<HeartbeatScreen opensAt={...} />
```
par :
```typescript
import { SplashScreen } from '@/components/SplashScreen'
// ...
<SplashScreen authenticated />
```

- [ ] **Vérifier le build final**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Attendu : ✓ Compiled successfully, 0 TypeScript errors.

- [ ] **Commit final**

```bash
git add -A
git commit -m "feat(design): redesign frontend complet — tokens indigo, PulseClock, bottom nav, sidebar"
git push
```

---

## Vérification finale

- [ ] Ouvrir `http://localhost` en mobile (DevTools 375px) : bottom nav visible, tokens indigo appliqués
- [ ] Ouvrir en desktop (≥1024px) : sidebar visible à gauche, bottom nav masqué
- [ ] PulseClock : état `closed` sur splash, état `open` sur feed si session active
- [ ] Auth : tab switcher glisse correctement entre login et register
- [ ] PostCard : avatar coloré, pill intention, réactions avec aria
- [ ] Build Next.js sans erreur TypeScript
