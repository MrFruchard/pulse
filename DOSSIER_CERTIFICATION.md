# Dossier de certification — Pulse

> **Titre professionnel visé** : Concepteur Développeur d'Applications (CDA) — RNCP niveau 6 (Bac+3/4)
> **Candidat** : Romain Savary
> **École** : Zone01 Normandie
> **Projet** : Pulse — réseau social à fenêtre temporelle
> **Session jury** : _à compléter_
> **Date de rendu** : _à compléter_

---

## Sommaire

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Parcours de lecture recommandé](#2-parcours-de-lecture-recommandé)
3. [Matrice de correspondance — compétences CDA → preuves](#3-matrice-de-correspondance--compétences-cda--preuves)
4. [Index des livrables](#4-index-des-livrables)
5. [Architecture en un coup d'œil](#5-architecture-en-un-coup-dœil)
6. [Démonstration](#6-démonstration)
7. [Indicateurs qualité](#7-indicateurs-qualité)
8. [Contacts & signatures](#8-contacts--signatures)

---

## 1. Résumé exécutif

### Pitch

**Pulse** est un réseau social accessible uniquement **une heure par jour**, à heure fixe, **pour tous les utilisateurs simultanément**. Chaque utilisateur peut publier un seul post par session, avec une **intention obligatoire déclarée** (question, partage, projet, challenge). La rareté crée l'anticipation, la contrainte crée la qualité.

### Problématique

> *Comment concevoir un réseau social qui génère de l'engagement et de l'anticipation **sans recourir aux mécanismes addictifs** des plateformes existantes ?*

### Réponse technique

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind | SSR + RSC + interactivité WebSocket |
| Backend | Go 1.22, Chi, sqlx, gorilla/websocket | Goroutines pour hub temps réel + cron session |
| Base de données | PostgreSQL 16 | Relations fortes, contraintes UNIQUE, cascades |
| Infra | Docker Compose, Nginx (SSL, rate limit) | MVP single-node, portable |
| CI/CD | GitHub Actions | Lint, test, build, déploiement |

Détail des justifications : [`pulse-certif/08-annexes/veille-technologique.md`](pulse-certif/08-annexes/veille-technologique.md)

### Règles métier critiques

1. **1 post maximum par utilisateur par session** (vérifié serveur).
2. **Publication uniquement pendant une session active** (vérifié serveur).
3. **Streak de présence** calculé par cron après chaque fermeture.
4. **Statut dormant** après 7 sessions manquées consécutives.
5. **Session globale synchronisée** par cron backend à l'heure définie par l'admin.

Détail : [`CLAUDE.md`](CLAUDE.md#règles-métier-critiques) et [`pulse-certif/02-conception/dictionnaire-donnees.md`](pulse-certif/02-conception/dictionnaire-donnees.md).

### Statut projet

Voir les jalons dans [`pulse-certif/08-annexes/gestion-projet.md`](pulse-certif/08-annexes/gestion-projet.md#jalons).

---

## 2. Parcours de lecture recommandé

| Vous avez… | Lisez dans cet ordre |
|---|---|
| **15 minutes** | Ce document (sections 1, 3, 5) + lancer la démo (section 6) |
| **1 heure** | Ce document complet + [`01-cadrage/contexte-problematique.md`](pulse-certif/01-cadrage/contexte-problematique.md) + [`03-architecture/architecture-technique.md`](pulse-certif/03-architecture/architecture-technique.md) + [`04-securite/plan-securisation.md`](pulse-certif/04-securite/plan-securisation.md) |
| **Lecture intégrale** | Suivre le sommaire de la [section 4](#4-index-des-livrables) dans l'ordre numéroté des dossiers |

---

## 3. Matrice de correspondance — compétences CDA → preuves

Référentiel utilisé : titre RNCP 37873 (CDA, France Compétences).

### BC01 — Développer une application sécurisée

| Compétence | Preuves |
|---|---|
| **C1. Maquetter une application** | [`02-conception/maquettes/`](pulse-certif/02-conception/maquettes/) (4 maquettes HTML interactives : accueil, feed, création post, profil) + [`02-conception/uml/uml-diagrammes.md`](pulse-certif/02-conception/uml/uml-diagrammes.md) (cas d'usage) |
| **C2. Développer une interface utilisateur web dynamique** | `frontend/app/` (Next.js App Router, RSC + client components) · `frontend/components/` (splash animé, AppShell, feed) · `frontend/lib/api.ts` (wrapper auth) |
| **C3. Réaliser une interface avec CMS/E-commerce** | *Non applicable — projet fullstack custom sans CMS* |
| **C4. Développer le back-end d'une application web sécurisée** | `backend/cmd/main.go` · `backend/internal/handlers/` (auth, posts, sessions, users) · `backend/internal/middleware/` (JWT, RBAC) · [`04-securite/plan-securisation.md`](pulse-certif/04-securite/plan-securisation.md) |
| **C5. Élaborer des composants CMS/E-commerce** | *Non applicable* |

### BC02 — Concevoir et développer une application sécurisée organisée en couches

| Compétence | Preuves |
|---|---|
| **C6. Analyser les besoins et maquetter** | [`01-cadrage/contexte-problematique.md`](pulse-certif/01-cadrage/contexte-problematique.md) · [`01-cadrage/epics-user-stories.md`](pulse-certif/01-cadrage/epics-user-stories.md) · [`01-cadrage/backlog.md`](pulse-certif/01-cadrage/backlog.md) · maquettes HTML |
| **C7. Définir l'architecture logicielle** | [`03-architecture/architecture-technique.md`](pulse-certif/03-architecture/architecture-technique.md) (4 couches, Docker, CI/CD, justifications) · [`02-conception/uml/uml-diagrammes.md`](pulse-certif/02-conception/uml/uml-diagrammes.md) (diagrammes de séquence auth & post) |
| **C8. Concevoir et mettre en place une BDD relationnelle** | [`02-conception/mcd.md`](pulse-certif/02-conception/mcd.md) · [`02-conception/mld.md`](pulse-certif/02-conception/mld.md) · [`02-conception/mpd.sql`](pulse-certif/02-conception/mpd.sql) · [`02-conception/dictionnaire-donnees.md`](pulse-certif/02-conception/dictionnaire-donnees.md) · `migrations/001_init_schema.sql` |
| **C9. Développer des composants d'accès aux données** | `backend/internal/repository/` (interfaces + implémentations sqlx) · requêtes préparées systématiques |

### BC03 — Préparer le déploiement d'une application sécurisée

| Compétence | Preuves |
|---|---|
| **C10. Préparer et exécuter les plans de tests** | [`06-tests/scenarios-tests.md`](pulse-certif/06-tests/scenarios-tests.md) (unitaires Go, API 25 cas, non-régression, recette) · [`08-annexes/pv-recette.md`](pulse-certif/08-annexes/pv-recette.md) |
| **C11. Préparer et documenter le déploiement** | [`05-deploiement/plan-deploiement.md`](pulse-certif/05-deploiement/plan-deploiement.md) (3 envs, Git Flow, migrations, rollback) · `docker-compose.yml` · `nginx/nginx.conf` |
| **C12. Contribuer à la mise en production (DevOps)** | `.github/workflows/` (CI/CD) · [`05-deploiement/plan-deploiement.md`](pulse-certif/05-deploiement/plan-deploiement.md) · Docker multi-stage |

### Compétences transverses attendues par le jury

| Compétence | Preuves |
|---|---|
| **Gestion de projet** | [`08-annexes/gestion-projet.md`](pulse-certif/08-annexes/gestion-projet.md) (Scrum adapté, Gantt Mermaid, jalons, rituels, risques) |
| **Veille technologique** | [`08-annexes/veille-technologique.md`](pulse-certif/08-annexes/veille-technologique.md) (sources, méthode, comparatifs Go/Node, Next/Remix, Postgres/Mongo, JWT/session) |
| **Sécurité applicative** | [`04-securite/plan-securisation.md`](pulse-certif/04-securite/plan-securisation.md) (OWASP A01, A02, A03, A07, A09, matrice risques, RGPD) |
| **Accessibilité** | [`08-annexes/accessibilite.md`](pulse-certif/08-annexes/accessibilite.md) (RGAA 4.1 AA, checklist 13 thématiques, plan d'audit) |
| **Qualité & tests** | [`06-tests/scenarios-tests.md`](pulse-certif/06-tests/scenarios-tests.md) (couverture cible 80%) · CI `go test`, `npm run test` |
| **RGPD** | [`04-securite/plan-securisation.md`](pulse-certif/04-securite/plan-securisation.md#rgpd) (droits utilisateur, durée conservation, suppression cascade) |
| **Bilan & rétrospective** | [`08-annexes/bilan-retrospective.md`](pulse-certif/08-annexes/bilan-retrospective.md) |

---

## 4. Index des livrables

### 📌 Cadrage — [`pulse-certif/01-cadrage/`](pulse-certif/01-cadrage/)

- [`contexte-problematique.md`](pulse-certif/01-cadrage/contexte-problematique.md) — vision, principes fondateurs, objectifs
- [`epics-user-stories.md`](pulse-certif/01-cadrage/epics-user-stories.md) — 8 épics, 28 user stories par rôle
- [`backlog.md`](pulse-certif/01-cadrage/backlog.md) — 3 sprints, priorisation MoSCoW, DoD

### 🎨 Conception — [`pulse-certif/02-conception/`](pulse-certif/02-conception/)

- [`dictionnaire-donnees.md`](pulse-certif/02-conception/dictionnaire-donnees.md) — 9 tables, enums, contraintes métier
- [`mcd.md`](pulse-certif/02-conception/mcd.md) — modèle conceptuel (entités, cardinalités)
- [`mld.md`](pulse-certif/02-conception/mld.md) — modèle logique, index
- [`mpd.sql`](pulse-certif/02-conception/mpd.sql) — modèle physique SQL exécutable
- [`uml/uml-diagrammes.md`](pulse-certif/02-conception/uml/uml-diagrammes.md) — cas d'usage, diagrammes de séquence
- [`maquettes/`](pulse-certif/02-conception/maquettes/) — 4 maquettes HTML interactives
- [`pulse_mcd_graphique.html`](pulse-certif/pulse_mcd_graphique.html) — MCD visuel
- [`pulse_mld_graphique.html`](pulse-certif/pulse_mld_graphique.html) — MLD visuel

### 🏗️ Architecture — [`pulse-certif/03-architecture/`](pulse-certif/03-architecture/)

- [`architecture-technique.md`](pulse-certif/03-architecture/architecture-technique.md) — 4 couches, Docker, CI/CD, choix techniques

### 🔒 Sécurité — [`pulse-certif/04-securite/`](pulse-certif/04-securite/)

- [`plan-securisation.md`](pulse-certif/04-securite/plan-securisation.md) — OWASP Top 10, RGPD, infra, matrice risques

### 🚀 Déploiement — [`pulse-certif/05-deploiement/`](pulse-certif/05-deploiement/)

- [`plan-deploiement.md`](pulse-certif/05-deploiement/plan-deploiement.md) — environnements, CI/CD, migrations, rollback

### 🧪 Tests — [`pulse-certif/06-tests/`](pulse-certif/06-tests/)

- [`scenarios-tests.md`](pulse-certif/06-tests/scenarios-tests.md) — unitaires, API, non-régression, recette

### 📎 Annexes — [`pulse-certif/08-annexes/`](pulse-certif/08-annexes/)

- [`gestion-projet.md`](pulse-certif/08-annexes/gestion-projet.md) — méthode, Gantt, jalons, risques
- [`veille-technologique.md`](pulse-certif/08-annexes/veille-technologique.md) — sources, méthode, comparatifs
- [`accessibilite.md`](pulse-certif/08-annexes/accessibilite.md) — RGAA 4.1 AA
- [`pv-recette.md`](pulse-certif/08-annexes/pv-recette.md) — procès-verbal de recette
- [`bilan-retrospective.md`](pulse-certif/08-annexes/bilan-retrospective.md) — métriques, apprentissages

### 📄 Dossier final — [`pulse-certif/07-dossier-final/`](pulse-certif/07-dossier-final/)

- `pulse-dossier-complet.docx` — version bureautique compilée

### 📐 Contexte technique projet

- [`CLAUDE.md`](CLAUDE.md) — contexte technique de référence (règles métier, API, conventions, sécurité)
- [`README.md`](README.md) — démarrage rapide
- [`docker-compose.yml`](docker-compose.yml) — orchestration locale
- [`migrations/`](migrations/) — schéma SQL + seeds

---

## 5. Architecture en un coup d'œil

```
                       ┌─────────────────────────┐
                       │       Navigateur        │
                       └────────────┬────────────┘
                                    │ HTTPS
                       ┌────────────▼────────────┐
                       │   Nginx (SSL, rate lim) │
                       └──────┬──────────────┬───┘
                      /api/*  │              │  /*
                              │              │
              ┌───────────────▼─┐       ┌────▼────────┐
              │  Backend Go     │       │ Frontend    │
              │  Chi + sqlx     │       │ Next.js 15  │
              │  WebSocket hub  │       │ App Router  │
              │  Cron session   │       │             │
              └────────┬────────┘       └─────────────┘
                       │
                 ┌─────▼─────┐
                 │ Postgres  │
                 │    16     │
                 └───────────┘
```

Détails : [`pulse-certif/03-architecture/architecture-technique.md`](pulse-certif/03-architecture/architecture-technique.md)

---

## 6. Démonstration

### Lancement local

```bash
# Prérequis : Docker + Docker Compose
cp .env.example .env            # adapter les secrets
docker compose up -d            # démarrage de tous les services
docker compose exec backend go run cmd/migrate/main.go up   # migrations
```

- Frontend : http://localhost
- API : http://localhost/api/health → `{"status":"ok"}`

### Comptes de démonstration

> À créer via les seeds `migrations/002_seed_dev.sql` et documenter ici avant le jury.

| Rôle | Email | Mot de passe |
|---|---|---|
| Utilisateur | `demo@pulse.local` | _à compléter_ |
| Modérateur | `mod@pulse.local` | _à compléter_ |
| Administrateur | `admin@pulse.local` | _à compléter_ |

### Parcours de démo guidée (10 min)

1. **Accueil hors session** — compte à rebours avant la prochaine ouverture.
2. **Ouverture de session** (forcée via admin pour la démo).
3. **Création d'un post** avec intention `QUESTION`.
4. **Tentative de 2e post** → erreur 409 attendue.
5. **Réaction + commentaire** depuis un second compte.
6. **Réception temps réel** (WebSocket) du nouveau post.
7. **Fermeture de session** — broadcast `session_closed`.
8. **Profil & streak** — affichage du streak incrémenté.
9. **Modération** — signalement d'un post, traitement en tant que modérateur.
10. **Suppression de compte** — cascade propre sur posts/commentaires/réactions.

### Commandes de vérification

```bash
# Health
curl http://localhost/api/health

# Tests
docker compose exec backend go test ./... -v -cover
docker compose exec frontend npm run test

# Logs temps réel
docker compose logs -f backend
```

---

## 7. Indicateurs qualité

| Indicateur | Cible | Mesure |
|---|---|---|
| Couverture tests backend | ≥ 80% | _à mesurer avant rendu_ |
| Couverture tests frontend | ≥ 70% | _à mesurer avant rendu_ |
| Score Lighthouse Perf (prod) | ≥ 90 | _à mesurer avant rendu_ |
| Score Lighthouse A11y | ≥ 95 | _à mesurer avant rendu_ |
| Vulnérabilités critiques (`go vet`, `npm audit`) | 0 | _à vérifier avant rendu_ |
| CI verte | Oui | Badge GitHub Actions |

Méthode de mesure : [`pulse-certif/08-annexes/accessibilite.md`](pulse-certif/08-annexes/accessibilite.md#outils-et-méthode-daudit) et [`pulse-certif/06-tests/scenarios-tests.md`](pulse-certif/06-tests/scenarios-tests.md).

---

## 8. Contacts & signatures

| Rôle | Nom | Contact |
|---|---|---|
| Candidat | Romain Savary | romain.savary2@gmail.com |
| Organisme formateur | Zone01 Normandie | — |
| Tuteur / référent | _à compléter_ | — |

### Validation

| Rôle | Nom | Date | Signature |
|---|---|---|---|
| Candidat | Romain Savary | | |
| Tuteur | | | |
| Jury | | | |

---

*Document généré le 2026-04-24. Dernière mise à jour : 2026-04-24.*
