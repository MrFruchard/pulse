# Pulse

> Un réseau social qui n'existe qu'une heure par jour.

Pulse est une plateforme conçue contre les mécanismes addictifs des réseaux sociaux classiques. Pas d'algorithme, pas de scroll infini — une fenêtre d'une heure, synchronisée pour tous les utilisateurs, chaque jour.

---

## Concept

| Règle | Description |
|---|---|
| **1h / jour** | Fenêtre globale synchronisée pour tous |
| **1 post / session** | Intention obligatoire déclarée |
| **Feed chronologique** | Aucun algorithme de recommandation |
| **Streak de présence** | Engagement mesuré par la régularité |

Les intentions possibles : `QUESTION` · `SHARE` · `PROJECT` · `CHALLENGE`

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS |
| Backend | Go 1.22 · Chi · sqlx · gorilla/websocket |
| Base de données | PostgreSQL 16 |
| Temps réel | WebSocket |
| Reverse proxy | Nginx |
| Conteneurisation | Docker · Docker Compose |
| CI/CD | GitHub Actions |

---

## Lancement local

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- [Go 1.22+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)

### Installation

```bash
git clone https://github.com/MrFruchard/pulse.git
cd pulse
cp .env.example .env
# Remplir les variables dans .env
docker compose up -d
```

L'application est accessible sur `http://localhost`.

### Variables d'environnement

Copier `.env.example` en `.env` et renseigner :

```env
DATABASE_URL=postgresql://pulse_user:password@database:5432/pulse
JWT_SECRET=your-secret-key-min-32-chars
SESSION_OPEN_HOUR=20
SESSION_DURATION_MIN=60
POSTGRES_DB=pulse
POSTGRES_USER=pulse_user
POSTGRES_PASSWORD=your-db-password
```

---

## Architecture

```
Utilisateur
    │
    ▼
 Nginx (80/443)
    ├── /        → Frontend Next.js (3000)
    ├── /api/*   → Backend Go (8080)
    └── /ws      → WebSocket Go (8080)
                      │
                      ▼
                 PostgreSQL (5432)
```

Tous les services communiquent via le réseau Docker interne `pulse_network`. Seul Nginx expose des ports publics.

---

## Développement

### Backend (Go)

```bash
cd backend
go run ./cmd/server
```

Tests :

```bash
go test ./... -v -cover
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

## Branches

| Branche | Rôle |
|---|---|
| `main` | Production — PR obligatoire |
| `develop` | Intégration |
| `feature/*` | Développement |
| `hotfix/*` | Correctifs urgents |

---

## Licence

Projet personnel — tous droits réservés.
