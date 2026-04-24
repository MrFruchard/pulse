# Pulse — Plan de Déploiement

## 1. Environnements

| Environnement | Branche Git | Déclencheur | URL |
|---|---|---|---|
| Développement | `feature/*` | Manuel | localhost:3000 |
| Intégration | `develop` | Push automatique | CI uniquement |
| Production | `main` | Merge PR approuvée | pulse.app |

---

## 2. Architecture des containers Docker

```yaml
# docker-compose.yml
services:

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/ssl/certs
    depends_on:
      - frontend
      - backend

  frontend:
    image: ghcr.io/mrfruchard/pulse-frontend:latest
    environment:
      - NEXT_PUBLIC_API_URL=/api
      - NEXT_PUBLIC_WS_URL=/ws
    depends_on:
      - backend

  backend:
    image: ghcr.io/mrfruchard/pulse-backend:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_OPEN_HOUR=${SESSION_OPEN_HOUR}
      - SESSION_DURATION_MIN=${SESSION_DURATION_MIN}
    depends_on:
      - database

  database:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

volumes:
  postgres_data:

networks:
  default:
    name: pulse_network
```

### Règles de sécurité Docker
- Seul Nginx expose des ports publics (80 et 443)
- Les containers frontend, backend, database communiquent sur le réseau interne `pulse_network`
- Utilisateur non-root dans chaque container (`USER node`, `USER appuser`)
- Variables d'environnement sensibles via `.env` (jamais committées — listées dans `.gitignore`)

---

## 3. Pipeline CI/CD — GitHub Actions

### Workflow CI (push sur toutes les branches)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

jobs:
  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - run: golangci-lint run ./...

  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run lint

  test-backend:
    runs-on: ubuntu-latest
    needs: lint-backend
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: pulse_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: go test ./... -v -cover

  test-frontend:
    runs-on: ubuntu-latest
    needs: lint-frontend
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run test

  build:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: docker build -t ghcr.io/mrfruchard/pulse-backend:latest ./backend
      - run: docker build -t ghcr.io/mrfruchard/pulse-frontend:latest ./frontend
      - run: docker push ghcr.io/mrfruchard/pulse-backend:latest
      - run: docker push ghcr.io/mrfruchard/pulse-frontend:latest
```

### Workflow CD (merge sur main uniquement)

```yaml
# .github/workflows/cd.yml
name: CD

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/pulse
            docker compose pull
            docker compose up -d --remove-orphans
            docker system prune -f

      - name: Health check
        run: |
          sleep 10
          curl -f https://pulse.app/api/health || exit 1

      - name: Notify on failure
        if: failure()
        run: echo "Deploy failed — rollback needed"
```

---

## 4. Gestion des versions

### Stratégie Git Flow

| Branche | Rôle | Protection |
|---|---|---|
| `main` | Production — stable | PR obligatoire + review |
| `develop` | Intégration | Push direct interdit |
| `feature/xxx` | Développement | Libre |
| `hotfix/xxx` | Correctifs urgents | Merge direct sur main autorisé |

### Versioning des images Docker

- `latest` — image de production courante
- `sha-xxxxxxx` — image taguée par commit SHA (rollback possible)
- Commande de rollback : `docker compose pull ghcr.io/mrfruchard/pulse-backend:sha-abc123 && docker compose up -d`

---

## 5. Migrations de base de données

Les migrations sont gérées avec des fichiers SQL numérotés :

```
migrations/
├── 001_init_schema.sql
├── 002_add_reports_status.sql
├── 003_add_notification_prefs.sql
```

Au démarrage du container PostgreSQL, les fichiers dans `/docker-entrypoint-initdb.d/` sont exécutés dans l'ordre alphabétique — uniquement lors de la première initialisation.

Pour les mises à jour en production, un outil de migration (`golang-migrate`) applique les nouveaux fichiers sans réinitialiser la BDD.

---

## 6. Plan de rollback

En cas d'échec du déploiement :

1. Identifier le dernier SHA stable : `git log --oneline main`
2. Pull l'image taguée : `docker pull ghcr.io/mrfruchard/pulse-backend:sha-xxxxxxx`
3. Mettre à jour docker-compose.yml avec le tag stable
4. Relancer : `docker compose up -d`
5. Vérifier le health check : `curl https://pulse.app/api/health`

---

## 7. Variables d'environnement

| Variable | Description | Obligatoire |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | Oui |
| `JWT_SECRET` | Clé secrète pour signer les JWT | Oui |
| `SESSION_OPEN_HOUR` | Heure d'ouverture de la session (ex: 20) | Oui |
| `SESSION_DURATION_MIN` | Durée de la session en minutes (ex: 60) | Oui |
| `POSTGRES_DB` | Nom de la base de données | Oui |
| `POSTGRES_USER` | Utilisateur PostgreSQL | Oui |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | Oui |
| `VPS_HOST` | IP du serveur de production | CI/CD |
| `VPS_SSH_KEY` | Clé SSH pour le déploiement | CI/CD |
