# Heartbeat Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'écran d'attente statique de Pulse par une expérience plein écran avec battements de cœur animés (cercles sonar + ligne ECG + titre pulsant) dont le rythme accélère à mesure qu'on approche de l'heure d'ouverture.

**Architecture:** Un composant `HeartbeatScreen` autonome reçoit `opensAt: string` et calcule le BPM courant depuis le temps restant. Il gère son propre interval de battement et déclenche les animations Framer Motion via un compteur `beatCount`. Le composant s'intègre dans `feed/page.tsx` en remplacement du bloc "session inactive" existant.

**Tech Stack:** Next.js 15, React 19, Framer Motion v12, TypeScript strict

---

## Fichiers

| Action | Chemin | Responsabilité |
|--------|--------|----------------|
| Créer | `frontend/components/HeartbeatScreen.tsx` | Composant principal — cercles sonar, ECG, titre pulsant, countdown |
| Modifier | `frontend/app/feed/page.tsx:117-122` | Remplacer le bloc "session inactive" par `<HeartbeatScreen>` |

---

### Task 1 : Hook `useBpm` — calcul du BPM depuis le temps restant

**Files:**
- Create: `frontend/hooks/useBpm.ts`

- [ ] **Step 1 : Créer le hook**

```typescript
// frontend/hooks/useBpm.ts
'use client'

import { useEffect, useState } from 'react'

export function getBpm(opensAt: string): number {
  const diffMs = new Date(opensAt).getTime() - Date.now()
  const diffMin = diffMs / 60000
  if (diffMin > 60) return 40
  if (diffMin > 30) return 60
  if (diffMin > 10) return 80
  if (diffMin > 5)  return 100
  return 120
}

export function useBpm(opensAt: string): number {
  const [bpm, setBpm] = useState(() => getBpm(opensAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(getBpm(opensAt))
    }, 30_000)
    return () => clearInterval(interval)
  }, [opensAt])

  return bpm
}
```

- [ ] **Step 2 : Vérifier que le fichier compile**

```bash
cd /Users/somaze/Documents/github/pulse/frontend && npx tsc --noEmit 2>&1 | head -20
```
Résultat attendu : aucune erreur liée à `useBpm.ts`

- [ ] **Step 3 : Commit**

```bash
git add frontend/hooks/useBpm.ts
git commit -m "feat(heartbeat): add useBpm hook with time-based BPM calculation"
```

---

### Task 2 : Composant `HeartbeatScreen` — structure de base + cercles sonar

**Files:**
- Create: `frontend/components/HeartbeatScreen.tsx`

- [ ] **Step 1 : Créer le composant avec les cercles sonar**

```typescript
// frontend/components/HeartbeatScreen.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBpm } from '@/hooks/useBpm'
import { Countdown } from '@/components/Countdown'

const RINGS = [0, 150, 300] // délais en ms entre chaque cercle

interface HeartbeatScreenProps {
  opensAt: string
}

export function HeartbeatScreen({ opensAt }: HeartbeatScreenProps) {
  const bpm = useBpm(opensAt)
  const [beatCount, setBeatCount] = useState(0)
  const intervalMs = Math.round(60_000 / bpm)

  useEffect(() => {
    const interval = setInterval(() => {
      setBeatCount(n => n + 1)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Cercles sonar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {RINGS.map((delay, i) => (
          <SonarRing key={i} beatCount={beatCount} delayMs={delay} />
        ))}
      </div>

      {/* Titre Pulse pulsant */}
      <PulseTitle beatCount={beatCount} />

      {/* Countdown centré */}
      <div className="mt-8 z-10">
        <Countdown />
      </div>

      {/* BPM debug — à retirer en prod */}
      <p className="absolute bottom-6 text-xs text-gray-700 tabular-nums">{bpm} BPM</p>
    </div>
  )
}

function SonarRing({ beatCount, delayMs }: { beatCount: number; delayMs: number }) {
  return (
    <motion.div
      key={`${beatCount}-${delayMs}`}
      className="absolute rounded-full border border-white/20"
      style={{ width: 120, height: 120 }}
      initial={{ scale: 0.8, opacity: 0.6 }}
      animate={{ scale: 3.5, opacity: 0 }}
      transition={{
        duration: 1.2,
        ease: 'easeOut',
        delay: delayMs / 1000,
      }}
    />
  )
}

function PulseTitle({ beatCount }: { beatCount: number }) {
  return (
    <motion.h1
      key={beatCount}
      className="text-7xl font-bold tracking-tight text-white z-10 select-none"
      initial={{ scale: 1.06 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      Pulse
    </motion.h1>
  )
}
```

- [ ] **Step 2 : Vérifier que le fichier compile**

```bash
cd /Users/somaze/Documents/github/pulse/frontend && npx tsc --noEmit 2>&1 | head -30
```
Résultat attendu : aucune erreur liée à `HeartbeatScreen.tsx`

- [ ] **Step 3 : Commit**

```bash
git add frontend/components/HeartbeatScreen.tsx
git commit -m "feat(heartbeat): add HeartbeatScreen with sonar rings and pulsing title"
```

---

### Task 3 : Ligne ECG SVG animée

**Files:**
- Modify: `frontend/components/HeartbeatScreen.tsx` — ajouter le composant `EcgLine`

- [ ] **Step 1 : Ajouter `EcgLine` dans `HeartbeatScreen.tsx`**

Ajouter ce composant à la fin du fichier (avant le dernier `}`) :

```typescript
function EcgLine({ beatCount }: { beatCount: number }) {
  // Path ECG : ligne plate → spike QRS → descente → retour baseline
  // Viewbox 400x80, ligne horizontale à y=40
  const d = "M0,40 L120,40 L140,40 L150,10 L160,70 L170,40 L185,25 L195,40 L400,40"

  return (
    <div className="absolute bottom-24 left-0 right-0 px-8 pointer-events-none">
      <svg
        viewBox="0 0 400 80"
        className="w-full"
        style={{ overflow: 'visible' }}
      >
        <motion.path
          key={beatCount}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 0.25 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}
```

Puis dans le JSX du composant `HeartbeatScreen`, ajouter avant la balise fermante `</div>` principale :

```tsx
{/* Ligne ECG */}
<EcgLine beatCount={beatCount} />
```

- [ ] **Step 2 : Vérifier compilation**

```bash
cd /Users/somaze/Documents/github/pulse/frontend && npx tsc --noEmit 2>&1 | head -30
```
Résultat attendu : 0 erreur

- [ ] **Step 3 : Commit**

```bash
git add frontend/components/HeartbeatScreen.tsx
git commit -m "feat(heartbeat): add animated ECG SVG line synced to beat"
```

---

### Task 4 : Intégration dans `feed/page.tsx`

**Files:**
- Modify: `frontend/app/feed/page.tsx`

- [ ] **Step 1 : Ajouter l'import en haut du fichier**

Dans `frontend/app/feed/page.tsx`, ajouter dans les imports :

```typescript
import { HeartbeatScreen } from '@/components/HeartbeatScreen'
```

- [ ] **Step 2 : Remplacer le bloc "session inactive"**

Localiser ce bloc (lignes ~117-122) :

```tsx
<div className="flex flex-col items-center justify-center py-24 text-center">
  <p className="text-gray-500 text-sm mb-8">La prochaine session commence dans</p>
  <Countdown />
</div>
```

Le remplacer par :

```tsx
<HeartbeatScreen opensAt={sessionState?.opensAt ?? new Date(Date.now() + 3600_000).toISOString()} />
```

- [ ] **Step 3 : Vérifier compilation**

```bash
cd /Users/somaze/Documents/github/pulse/frontend && npx tsc --noEmit 2>&1 | head -30
```
Résultat attendu : 0 erreur

- [ ] **Step 4 : Build de vérification**

```bash
cd /Users/somaze/Documents/github/pulse/frontend && npm run build 2>&1 | tail -20
```
Résultat attendu : `✓ Compiled successfully` ou équivalent sans erreur

- [ ] **Step 5 : Commit**

```bash
git add frontend/app/feed/page.tsx
git commit -m "feat(heartbeat): integrate HeartbeatScreen into feed inactive state"
```

---

### Task 5 : Retrait du debug BPM + polish final

**Files:**
- Modify: `frontend/components/HeartbeatScreen.tsx`

- [ ] **Step 1 : Retirer la ligne debug BPM**

Dans `HeartbeatScreen.tsx`, supprimer :

```tsx
{/* BPM debug — à retirer en prod */}
<p className="absolute bottom-6 text-xs text-gray-700 tabular-nums">{bpm} BPM</p>
```

- [ ] **Step 2 : Ajouter un fond légèrement texturé pour que les cercles ressortent mieux**

Changer la classe du conteneur principal de :
```tsx
<div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center overflow-hidden">
```
en :
```tsx
<div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center overflow-hidden">
```

- [ ] **Step 3 : Vérifier compilation finale**

```bash
cd /Users/somaze/Documents/github/pulse/frontend && npx tsc --noEmit 2>&1
```
Résultat attendu : aucune sortie (0 erreur)

- [ ] **Step 4 : Commit final**

```bash
git add frontend/components/HeartbeatScreen.tsx
git commit -m "feat(heartbeat): remove debug label, polish background"
```

---

## Checklist finale

- [ ] `HeartbeatScreen` s'affiche plein écran quand `sessionState.isActive === false`
- [ ] Les 3 cercles sonar pulsent à la bonne cadence
- [ ] La ligne ECG se trace et se réinitialise à chaque battement
- [ ] Le texte "Pulse" bat subtilement au même rythme
- [ ] Le BPM change automatiquement en franchissant les seuils (40 → 60 → 80 → 100 → 120)
- [ ] L'interval est nettoyé au démontage du composant (pas de memory leak)
- [ ] Le build Next.js passe sans erreur
- [ ] Aucune régression sur le feed actif (session ouverte)
