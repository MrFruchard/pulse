<div align="center">

# Pulse

**Un réseau social qui n'existe qu'une heure par jour.**

Pas d'algorithme. Pas de scroll infini. Juste une fenêtre d'une heure, synchronisée pour tous les utilisateurs, chaque jour.

[Concept](#-concept) · [Stack](#-stack-technique) · [Démarrage](#-démarrage-rapide) · [Architecture](#-architecture) · [📋 Dossier de certification](DOSSIER_CERTIFICATION.md)

---

![Status](https://img.shields.io/badge/status-en%20développement-yellow)
![Stack](https://img.shields.io/badge/stack-Go%20%2B%20Next.js%2015-blue)
![License](https://img.shields.io/badge/license-personnel-red)

</div>

---

## 📌 À propos

**Pulse** est un projet de fin de formation au titre **Concepteur Développeur d'Applications (CDA, RNCP niveau 6)**, développé à [Zone01 Normandie](https://zone01rouennormandie.org/).

**Candidat** : Romain Savary
**Problématique** : *Comment concevoir un réseau social qui génère de l'engagement et de l'anticipation sans recourir aux mécanismes addictifs des plateformes existantes ?*

**Réponse** : une application web fullstack où la rareté remplace l'algorithme.

---

## 📖 Dossier de certification (jury)

Le dossier complet destiné au jury se trouve dans [**`DOSSIER_CERTIFICATION.md`**](DOSSIER_CERTIFICATION.md).

Il inclut :

- Résumé exécutif et problématique
- **Matrice complète des compétences CDA → preuves** (blocs BC01, BC02, BC03)
- Parcours de lecture recommandé (15 min / 1h / intégral)
- Index de tous les livrables (cadrage, conception, architecture, sécurité, déploiement, tests, annexes)
- Schéma d'architecture
- Scénario de démonstration guidée
- Indicateurs qualité

| Section | Chemin | Contenu |
|---|---|---|
| 📌 Cadrage | [`pulse-certif/01-cadrage/`](pulse-certif/01-cadrage/) | Contexte, problématique, 8 épics, 28 user stories, backlog 3 sprints |
| 🎨 Conception | [`pulse-certif/02-conception/`](pulse-certif/02-conception/) | MCD, MLD, MPD SQL, dictionnaire de données, UML, 4 maquettes HTML |
| 🏗️ Architecture | [`pulse-certif/03-architecture/`](pulse-certif/03-architecture/) | 4 couches, Docker, CI/CD, justifications |
| 🔒 Sécurité | [`pulse-certif/04-securite/`](pulse-certif/04-securite/) | OWASP Top 10, RGPD, matrice des risques |
| 🚀 Déploiement | [`pulse-certif/05-deploiement/`](pulse-certif/05-deploiement/) | 3 environnements, GitHub Actions, migrations, rollback |
| 🧪 Tests | [`pulse-certif/06-tests/`](pulse-certif/06-tests/) | Unitaires, API (25 cas), non-régression, recette |
| 📎 Annexes | [`pulse-certif/08-annexes/`](pulse-certif/08-annexes/) | Gestion de projet, veille techno, accessibilité RGAA, PV recette, bilan |

---

## 🎯 Concept

| Règle | Description |
|---|---|
| **1h / jour** | Fenêtre globale synchronisée pour tous les utilisateurs |
| **1 post / session** | Avec une **intention obligatoire** déclarée |
| **Feed chronologique** | Aucun algorithme de recommandation |
| **Streak de présence** | Engagement mesuré par la régularité, pas le volume |

Les intentions possibles : `QUESTION` · `SHARE` · `PROJECT` · `CHALLENGE`

> La rareté crée l'anticipation. La contrainte crée la qualité.

---

## 🛠️ Stack technique

<table>
<tr>
<td valign="top">

**Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

</td>
<td valign="top">

**Backend**
- Go 1.22
- Chi router
- sqlx
- golang-jwt
- gorilla/websocket

</td>
<td valign="top">

**Infrastructure**
- PostgreSQL 16
- Nginx (SSL, rate limit)
- Docker Compose
- GitHub Actions

</td>
</tr>
</table>

Justifications détaillées des choix techniques : [`pulse-certif/08-annexes/veille-technologique.md`](pulse-certif/08-annexes/veille-technologique.md)

---

## 🚀 Démarrage rapide

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Pour le développement hors Docker : [Go 1.22+](https://go.dev/dl/) et [Node.js 20+](https://nodejs.org/)

### Installation

```bash
git clone https://github.com/MrFruchard/pulse.git
cd pulse
cp .env.example .env            # renseigner les secrets
docker compose up -d            # démarrage
```

Application disponible sur **http://localhost**.

```bash
# Migrations de la base
docker compose exec backend go run cmd/migrate/main.go up

# Health check
curl http://localhost/api/health
```

### Variables d'environnement essentielles

```env
DATABASE_URL=postgresql://pulse_user:password@database:5432/pulse
JWT_SECRET=change-me-min-32-chars
SESSION_OPEN_HOUR=20            # heure UTC d'ouverture
SESSION_DURATION_MIN=60         # durée de la session
POSTGRES_DB=pulse
POSTGRES_USER=pulse_user
POSTGRES_PASSWORD=change-me
```

Liste complète : [`.env.example`](.env.example)

---

## 🏗️ Architecture

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

Tous les services communiquent via le réseau Docker interne. Seul Nginx expose des ports publics.

Détails : [`pulse-certif/03-architecture/architecture-technique.md`](pulse-certif/03-architecture/architecture-technique.md)

---

## 💻 Développement

### Backend (Go)

```bash
cd backend
go run ./cmd/server
go test ./... -v -cover
go vet ./...
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
npm run test
npm run lint
```

### Makefile

```bash
make up       # docker compose up -d
make down     # docker compose down
make logs     # tail des logs
make test     # tests back + front
```

Voir [`Makefile`](Makefile).

---

## 📂 Structure du projet

```
pulse/
├── DOSSIER_CERTIFICATION.md   ← 📋 Point d'entrée jury
├── CLAUDE.md                  ← contexte technique de référence
├── docker-compose.yml
├── nginx/
├── migrations/
├── backend/                   ← Go 1.22
│   ├── cmd/
│   └── internal/
│       ├── handlers/
│       ├── middleware/
│       ├── models/
│       ├── repository/
│       ├── services/
│       └── ws/
├── frontend/                  ← Next.js 15
│   ├── app/
│   ├── components/
│   └── lib/
└── pulse-certif/              ← 📚 Dossier de certification
    ├── 01-cadrage/
    ├── 02-conception/
    ├── 03-architecture/
    ├── 04-securite/
    ├── 05-deploiement/
    ├── 06-tests/
    ├── 07-dossier-final/
    └── 08-annexes/
```

---

## 🔐 Règles métier critiques

Toutes vérifiées côté serveur (jamais uniquement client) :

1. **1 post maximum par utilisateur par session** (`409 Conflict` sinon)
2. **Publication uniquement pendant une session active** (`403 Forbidden` sinon)
3. **Calcul du streak** par cron quotidien après fermeture de session
4. **Statut dormant** après 7 sessions manquées consécutives
5. **Session globale synchronisée** par cron backend

Détail et implémentation : [`CLAUDE.md`](CLAUDE.md#règles-métier-critiques)

---

## 🌳 Workflow Git

| Branche | Rôle |
|---|---|
| `main` | Production — protégée, PR obligatoire |
| `develop` | Intégration continue |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections de bugs |
| `hotfix/*` | Correctifs urgents en production |

Plan de déploiement complet : [`pulse-certif/05-deploiement/plan-deploiement.md`](pulse-certif/05-deploiement/plan-deploiement.md)

---

## 👤 Auteur

**Romain Savary** — Zone01 Normandie, promotion [à compléter]
📧 romain.savary2@gmail.com

---

## 📄 Licence

Projet personnel — tous droits réservés.
