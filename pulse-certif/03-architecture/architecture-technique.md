# Pulse — Architecture Technique

## Vue d'ensemble

Pulse repose sur une architecture multicouche conteneurisée avec Docker. Chaque composant est isolé dans son propre container et communique via un réseau Docker interne.

---

## Couches applicatives

### Couche présentation — Next.js 15 (TypeScript)
- App Router avec Server Side Rendering (SSR)
- Client WebSocket pour le feed en temps réel
- Gestion du JWT via httpOnly cookie
- Interface responsive (Tailwind CSS)

### Couche métier — Go (API REST + WebSocket + Cron)

**API REST** (port 8080)
- Authentification JWT (création, validation, refresh)
- CRUD posts, comments, reactions, follows
- Gestion des profils et notifications
- Endpoints admin/moderateur protégés par rôle

**WebSocket Hub**
- Connexion persistante pendant la session
- Broadcast des nouveaux posts à tous les connectés
- Broadcast des réactions en temps réel
- Déconnexion automatique à la fermeture de session

**Cron Jobs**
- Ouverture/fermeture automatique des sessions à heure fixe
- Calcul du streak quotidien (via session_attendances)
- Passage des profils en statut "dormant" (7 sessions manquées)
- Envoi des notifications de pré-session (15 min avant)

### Couche données — PostgreSQL 16
- 9 tables relationnelles avec contraintes FK
- Enums typés (role, status, intention, reaction_type...)
- Index optimisés sur les colonnes fréquemment requêtées
- Contraintes UNIQUE pour éviter les doublons métier

### Reverse Proxy — Nginx
- Routage des requêtes vers les bons containers
- Terminaison SSL/TLS (HTTPS)
- Proxy WebSocket (upgrade protocol)
- Rate limiting sur les endpoints sensibles

---

## Infrastructure Docker

```yaml
services:
  frontend:    # Next.js — port 3000
  backend:     # Go API + WS + Cron — port 8080
  database:    # PostgreSQL 16 — port 5432
  nginx:       # Reverse proxy — ports 80/443
```

Tous les containers communiquent via un réseau Docker interne `pulse_network`. Seul Nginx expose des ports publics.

---

## CI/CD — GitHub Actions

### Pipeline
1. **Lint + Test** — `golangci-lint`, `go test`, `eslint`, tests unitaires Next.js
2. **Docker Build** — build des images frontend et backend
3. **Deploy** — `docker compose pull && docker compose up -d`

### Branches
- `main` — production (déploiement automatique)
- `develop` — intégration (tests uniquement)
- `feature/*` — développement (lint uniquement)

---

## Justification des choix technologiques

| Technologie | Justification |
|---|---|
| Go | Performances élevées pour l'API et les WebSockets, typage fort, concurrence native (goroutines) |
| Next.js 15 | SSR pour le SEO et les performances, App Router pour la gestion des layouts, TypeScript natif |
| PostgreSQL | SGBD relationnel robuste, support natif des enums et jsonb, transactions ACID |
| Docker | Reproductibilité des environnements, isolation des services, déploiement simplifié |
| WebSockets | Communication bidirectionnelle temps réel indispensable pour le feed live pendant la session |
| JWT httpOnly | Authentification stateless, protection contre XSS via httpOnly cookie |
| Nginx | Reverse proxy éprouvé, gestion SSL, rate limiting intégré |
| GitHub Actions | CI/CD gratuit pour les repos publics, intégration native avec GitHub |

---

## Principes SOLID appliqués

- **Single Responsibility** : chaque handler Go gère un seul endpoint
- **Open/Closed** : les middlewares JWT/RBAC sont extensibles sans modifier les handlers
- **Dependency Inversion** : les repositories abstraient l'accès à la BDD (interface + implémentation PostgreSQL)

---

## Architecture multicouche

```
Presentation  →  Next.js (UI, routing, SSR)
Application   →  Go (business logic, validations, auth)
Données       →  PostgreSQL (persistence, contraintes)
```

Chaque couche ne connaît que la couche immédiatement inférieure — la présentation ne communique jamais directement avec la BDD.
