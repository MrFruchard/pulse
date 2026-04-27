# Design — Écran d'attente Heartbeat

**Date :** 2026-04-27  
**Statut :** Approuvé

---

## Objectif

Remplacer l'écran d'attente statique (countdown + texte) par une expérience plein écran immersive évoquant les battements de cœur, avec un rythme qui accélère à mesure qu'on approche de l'heure d'ouverture de session.

---

## Contexte

- Stack : Next.js 15, Framer Motion v12 (déjà installé), TypeScript
- Fichier cible d'intégration : `frontend/app/feed/page.tsx`
- Composant existant remplacé : bloc "session inactive" avec `<Countdown />`
- Pas d'Anime.js — Framer Motion couvre tous les besoins

---

## Composant principal

**`frontend/components/HeartbeatScreen.tsx`**

Props : `opensAt: string` (ISO date de la prochaine ouverture)

---

## Formule BPM

| Temps restant | BPM |
|---------------|-----|
| > 60 min      | 40  |
| 30–60 min     | 60  |
| 10–30 min     | 80  |
| 5–10 min      | 100 |
| < 5 min       | 120 |

Recalculé toutes les 30 secondes. Interval de battement = `60000 / BPM` ms.

---

## Éléments visuels

### 1. Cercles concentriques (sonar)
- 3 cercles `div` positionnés en absolu au centre
- À chaque battement : `scale: 0.8 → 2`, `opacity: 0.6 → 0`
- Décalage de phase : 0ms, 150ms, 300ms entre chaque cercle
- Couleur : blanc avec opacité faible

### 2. Ligne ECG (SVG)
- Path SVG dessinant un signal ECG stylisé (ligne plate → spike QRS → retour)
- Animation `pathLength: 0 → 1` synchronisée sur le BPM
- Reset et re-trace à chaque battement
- Positionné en bas ou en milieu de l'écran, largeur pleine

### 3. Texte "Pulse"
- `scale: 1 → 1.06 → 1` au rythme du battement
- `transition: { duration: 0.15, ease: "easeOut" }` sur le pic, retour en `0.3s`

### 4. Countdown
- Centré au milieu de l'écran, superposé aux cercles
- Composant `<Countdown />` existant, inchangé fonctionnellement

---

## Synchronisation

Un seul `useEffect` avec `setInterval` calculé depuis le BPM courant.  
À chaque tick : incrémenter un compteur `beatCount` via `useState`.  
Les animations Framer Motion réagissent à `beatCount` via `useAnimate` ou `variants` avec `key={beatCount}` pour retriggering.

---

## Intégration dans feed/page.tsx

Remplacer :
```tsx
<div className="flex flex-col items-center justify-center py-24 text-center">
  <p className="text-gray-500 text-sm mb-8">La prochaine session commence dans</p>
  <Countdown />
</div>
```

Par :
```tsx
<HeartbeatScreen opensAt={sessionState.opensAt} />
```

---

## Définition of Done

- [ ] `HeartbeatScreen` s'affiche plein écran quand `sessionState.isActive === false`
- [ ] Les cercles sonar pulsent au bon BPM selon le temps restant
- [ ] La ligne ECG se trace et se réinitialise à chaque battement
- [ ] Le texte "Pulse" bat subtilement au même rythme
- [ ] Le BPM change automatiquement quand on franchit un seuil de temps
- [ ] Le composant se démonte proprement (cleanup interval)
- [ ] Aucune régression sur le feed actif
