# Pulse — Veille technologique

## Objectif

Maintenir une connaissance à jour de l'écosystème Go / TypeScript / web moderne pour :
1. Justifier les choix techniques de Pulse par rapport aux alternatives disponibles.
2. Anticiper les évolutions majeures (ruptures d'API, dépréciations, CVE).
3. Identifier les bonnes pratiques émergentes (sécurité, performance, accessibilité).

## Méthode

| Canal | Outil | Fréquence | Thèmes |
|---|---|---|---|
| RSS / Newsletters | Feedly | Quotidien (15 min) | Go, React, Next.js, Postgres, DevOps |
| Newsletters email | — | Hebdomadaire | GoWeekly, React Status, Node Weekly, Bytes.dev |
| Communautés | r/golang, r/nextjs, HackerNews | Quotidien (scan) | Annonces, retours d'expérience |
| Officiel | Blogs vendors | À la parution | go.dev/blog, nextjs.org/blog, vercel.com/blog, postgresql.org/about/news |
| Sécurité | OWASP, CVE feeds | Hebdomadaire | OWASP Top 10, CVE Go/Node/Postgres |
| Accessibilité | DesignCert, WCAG updates | Mensuel | RGAA, WCAG |

### Sources surveillées

**Go**
- `go.dev/blog` — annonces officielles
- `GoWeekly` (newsletter)
- `r/golang` (Reddit)
- Dave Cheney — patterns Go idiomatiques

**React / Next.js**
- `nextjs.org/blog` — releases App Router, Server Actions
- `React Status` (newsletter)
- Dan Abramov — évolutions React
- `vercel.com/blog`

**Database / Postgres**
- `postgresql.org/about/news`
- `planetscale.com/blog` — patterns SQL avancés

**DevOps / Infra**
- `Docker Blog`
- `Nginx Blog`
- `HashiCorp Blog`

**Sécurité**
- OWASP Top 10 (mise à jour 2021, veille active pour 2025)
- CVE database Go, Node, Postgres
- `cve.org` + `security.snyk.io`

### Fiche de veille (template)

```
Date          : AAAA-MM-JJ
Source        : URL
Sujet         : Titre
Résumé (3 l.) :
Impact Pulse  : ☐ Aucun ☐ Mineur ☐ Majeur (action requise)
Action        :
```

Fiches archivées dans `pulse-certif/08-annexes/fiches-veille/` (à créer au fil de l'eau).

## Comparatifs justifiant les choix techniques de Pulse

### 1. Backend — Go vs Node.js vs Rust

| Critère | Go | Node.js | Rust |
|---|---|---|---|
| Concurrence | Goroutines natives | Event loop (1 thread) | `tokio` async |
| Performance WebSocket | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Courbe d'apprentissage | Moyenne | Faible | Élevée |
| Écosystème web | Bon (Chi, Gin, Echo) | Excellent | Moyen (Axum, Actix) |
| Compilation | Binaire statique | V8 runtime | Binaire statique |
| Vitesse de dev MVP | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**Choix : Go**
Les goroutines simplifient le hub WebSocket (une goroutine par connexion) et le cron manager de session. Le binaire statique simplifie le Docker (image `scratch`). Node est écarté car l'event loop mono-thread rend le broadcast à N connexions plus fragile. Rust est écarté pour la rapidité de développement sur un MVP.

### 2. Frontend — Next.js 15 vs Remix vs Astro

| Critère | Next.js 15 (App Router) | Remix | Astro |
|---|---|---|---|
| SSR | Oui (RSC par défaut) | Oui (loaders) | Oui (islands) |
| Interactivité client | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (islands) |
| WebSocket client | Facile | Facile | Complexe |
| Écosystème | Très mature | Mature | Mature |
| Déploiement | Vercel / Docker | Vercel / Node | Statique |

**Choix : Next.js 15 App Router**
Application fortement interactive (feed temps réel, WebSocket, compte à rebours) → Astro écarté (architecture islands pensée pour du contenu statique). Next.js offre RSC pour le SEO du profil public et Client Components pour le feed temps réel, avec un écosystème très mature.

### 3. Base de données — PostgreSQL vs MongoDB

| Critère | PostgreSQL | MongoDB |
|---|---|---|
| Relations | Natif (FK, JOIN) | Références applicatives |
| Contraintes UNIQUE | Oui (ex: `UNIQUE(follower_id, following_id)`) | Index unique possible |
| Transactions ACID | Complet | Multi-doc depuis 4.0, limitée |
| JSON | `jsonb` performant | Natif |
| Maturité | 30+ ans | 15 ans |

**Choix : PostgreSQL**
Le domaine Pulse est fortement relationnel : `follows(follower, following)`, `reactions(post, user)` avec contraintes d'unicité, cascades `ON DELETE`. Les jointures entre `users`, `posts`, `sessions`, `reactions` justifient un relationnel. `jsonb` utilisé ponctuellement pour `notifications.payload`.

### 4. Authentification — JWT httpOnly vs session serveur (Redis) vs OAuth tiers

| Critère | JWT cookie httpOnly | Session serveur | OAuth (Google, etc.) |
|---|---|---|---|
| Stateless backend | Oui | Non (store Redis) | Oui |
| Révocation instantanée | Non (ou blacklist) | Oui | Oui |
| Complexité infra | Faible | Moyenne (Redis) | Moyenne |
| Protection XSS | Oui (httpOnly) | Oui (cookie session) | Oui |
| Adapté solo MVP | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**Choix : JWT cookie httpOnly**
Pas de store de session à maintenir. Cookie `HttpOnly` + `SameSite=Lax` bloque l'accès XSS et les CSRF basiques. Pour un MVP de certification, la non-révocation instantanée est acceptable (TTL court de 24h documenté). L'OAuth sera une évolution v2.

### 5. Orchestration — Docker Compose vs Kubernetes

| Critère | Docker Compose | Kubernetes |
|---|---|---|
| Complexité | Faible | Élevée |
| Coût infra | VPS simple | Cluster managé |
| Scalabilité | Verticale | Horizontale |
| Adapté MVP | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**Choix : Docker Compose**
Pulse a un seul back, un seul front, une DB. Kubernetes est surdimensionné. Migration K8s envisageable si la charge dépasse un VPS single-node.

## Synthèse des impacts de veille sur Pulse

| Découverte | Date | Impact Pulse |
|---|---|---|
| Next.js 15 stable (RSC + cache) | 2024-10 | Adopté dès le début du projet |
| Go 1.22 : amélioration `range` | 2024-02 | Utilisé dans les handlers de feed |
| OWASP Top 10 2021 toujours référence | — | Plan de sécu aligné |
| `prefers-reduced-motion` | — | Appliqué sur le splash Framer Motion |

## Références

- Plan de sécurité : `../04-securite/plan-securisation.md`
- Architecture technique : `../03-architecture/architecture-technique.md`
