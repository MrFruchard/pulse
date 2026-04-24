# CLAUDE.md — Pulse

> Ce fichier est le contexte principal pour Claude Code.
> Lis-le entièrement avant d'écrire la moindre ligne de code.
> En cas de doute sur un choix technique, relis ce fichier avant de décider.

---

## Projet

**Pulse** est un réseau social à fenêtre temporelle.
Le réseau n'est accessible qu'une heure par jour, à heure fixe, pour tous les utilisateurs simultanément.
Chaque utilisateur peut publier un seul post par session, avec une intention obligatoire déclarée.
La rareté crée l'anticipation. La contrainte crée la qualité.

---

## Stack technique

```
Frontend  : Next.js 15 (App Router), TypeScript, Tailwind CSS
Backend   : Go 1.22, Chi router, sqlx, golang-jwt, gorilla/websocket
Base de données : PostgreSQL 16
Reverse proxy   : Nginx (SSL, rate limiting)
Conteneurs      : Docker + Docker Compose
CI/CD           : GitHub Actions
```

---

## Structure du projet

```
pulse/
├── CLAUDE.md
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── migrations/
│   ├── 001_init_schema.sql
│   └── 002_seed_dev.sql
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── internal/
│   │   ├── handlers/      # HTTP handlers (un fichier par domaine)
│   │   ├── middleware/    # JWT, RBAC, rate limit
│   │   ├── models/        # structs Go (User, Post, Session...)
│   │   ├── repository/    # accès BDD (interfaces + implémentations)
│   │   ├── services/      # logique métier (jwt, bcrypt, streak, session)
│   │   └── ws/            # WebSocket hub
│   └── go.mod
└── frontend/
    ├── app/
    │   ├── (auth)/        # login, register
    │   ├── (app)/         # dashboard, feed, profil
    │   └── api/           # route handlers Next.js si besoin
    ├── components/
    │   ├── ui/            # composants atomiques
    │   ├── feed/          # PostCard, FeedList, NewPostBanner
    │   ├── session/       # Countdown, SessionBar
    │   └── profile/       # ProfileHeader, StreakBadge
    ├── lib/
    │   ├── api.ts         # fetch wrapper avec auth
    │   └── ws.ts          # WebSocket client
    └── package.json
```

---

## Base de données — Schéma

Les migrations complètes sont dans `/migrations/001_init_schema.sql`.
Voici le résumé des tables et contraintes critiques :

```
users               id, email(UK), password_hash, pseudo(UK), avatar_url, bio,
                    role(user|moderator|admin), streak, status(active|dormant|suspended),
                    created_at, updated_at

sessions            id, opens_at, closes_at, is_active, created_at

posts               id, user_id(FK), session_id(FK), content, intention(QUESTION|SHARE|PROJECT|CHALLENGE),
                    image_url, is_flagged, created_at
                    CONSTRAINT : ON DELETE CASCADE

comments            id, post_id(FK), user_id(FK), content, created_at

reactions           id, post_id(FK), user_id(FK), type(LIKE|FIRE|INSIGHTFUL|SUPPORT), created_at
                    UNIQUE(post_id, user_id)

follows             id, follower_id(FK), following_id(FK), created_at
                    UNIQUE(follower_id, following_id)
                    CHECK(follower_id != following_id)

notifications       id, user_id(FK), type(SESSION_OPEN|REACTION|COMMENT|FOLLOW|REPORT),
                    payload(jsonb), is_read, created_at

reports             id, post_id(FK), reporter_id(FK), reason(SPAM|INAPPROPRIATE|HARASSMENT|OTHER),
                    status(PENDING|REVIEWED|DISMISSED), created_at

session_attendances id, user_id(FK), session_id(FK), joined_at
                    UNIQUE(user_id, session_id)
```

---

## Règles métier critiques

Ces règles sont non-négociables. Elles doivent être vérifiées côté serveur, jamais uniquement côté client.

### Règle 1 — 1 post par session
```
SELECT COUNT(*) FROM posts
WHERE user_id = $1 AND session_id = $2
```
Si COUNT > 0 → retourner 409 Conflict.

### Règle 2 — Post uniquement pendant une session active
```
SELECT * FROM sessions
WHERE is_active = true AND NOW() BETWEEN opens_at AND closes_at
```
Si aucune session active → retourner 403 Forbidden.

### Règle 3 — Calcul du streak
Le streak s'incrémente si l'utilisateur a une `session_attendance` pour CHAQUE session des N derniers jours consécutifs.
Si une session est manquée → streak remis à 0.
Calculé par le cron job quotidien après fermeture de chaque session.

### Règle 4 — Statut dormant
Si un utilisateur manque 7 sessions consécutives → `status = 'dormant'`.
Le statut dormant n'empêche pas la connexion mais est visible sur le profil.

### Règle 5 — Session globale synchronisée
L'heure d'ouverture est configurée par l'admin via `SESSION_OPEN_HOUR` (env).
Le cron job ouvre la session à cette heure et la ferme après `SESSION_DURATION_MIN` minutes.
Un seul record `sessions` avec `is_active = true` à la fois.

---

## API — Endpoints

### Auth
```
POST /api/auth/register    body: { email, pseudo, password }      → 201 { user, token }
POST /api/auth/login       body: { email, password }              → 200 (JWT httpOnly cookie)
POST /api/auth/logout                                             → 200 (cookie supprimé)
GET  /api/auth/me          JWT requis                             → 200 { user }
```

### Session
```
GET  /api/session/current                                         → 200 { isActive, opensAt, closesAt, sessionId? }
PUT  /api/admin/session    JWT admin requis                       → 200 (mise à jour config)
```

### Posts
```
GET  /api/posts            JWT requis, query: ?feed=global|following&intention=QUESTION  → 200 { posts[] }
POST /api/posts            JWT requis, session active             → 201 { post }
GET  /api/posts/:id                                               → 200 { post }
DELETE /api/posts/:id      JWT requis (proprio ou moderator/admin) → 200
POST /api/posts/:id/reactions  JWT requis                        → 201
POST /api/posts/:id/comments   JWT requis                        → 201
POST /api/posts/:id/reports    JWT requis                        → 201
```

### Users
```
GET  /api/users/:pseudo              → 200 { user, posts[] }
POST /api/users/:id/follow    JWT    → 201
DELETE /api/users/:id/follow  JWT    → 200
GET  /api/users/search?q=xxx  JWT    → 200 { users[] }
PUT  /api/me                  JWT    → 200 (update profil)
DELETE /api/me                JWT    → 200 (suppression compte + cascade)
```

### Notifications
```
GET  /api/notifications       JWT    → 200 { notifications[] }
PUT  /api/notifications/read  JWT    → 200 (marquer tout comme lu)
```

### Admin / Modération
```
GET  /api/admin/reports       JWT moderator|admin → 200 { reports[] }
PUT  /api/admin/reports/:id   JWT moderator|admin → 200 (REVIEWED|DISMISSED)
PUT  /api/admin/users/:id/suspend  JWT admin      → 200
```

### WebSocket
```
GET  /ws    JWT requis, session active
            Events entrants  : ping
            Events sortants  : new_post, new_reaction, session_closed
```

### Health
```
GET  /api/health  → 200 { status: "ok", db: "ok", version: "1.0.0" }
```

---

## Sécurité — Contraintes absolues

Ces contraintes s'appliquent à TOUT le code généré, sans exception.

```
AUTH
- JWT signé avec JWT_SECRET (depuis env, jamais hardcodé)
- JWT stocké en httpOnly cookie (jamais localStorage)
- Expiration JWT : 24h
- Vérification du statut du compte à chaque requête authentifiée

MOT DE PASSE
- Hashage avec bcrypt, coût minimum 12
- Jamais loggé, jamais retourné dans une réponse API
- Message d'erreur login générique (pas de distinction email/mdp)

SQL
- Requêtes préparées UNIQUEMENT via sqlx ($1, $2...)
- Zéro concaténation de chaînes dans les requêtes SQL
- Validation des entrées avant toute insertion

RBAC
- Middleware vérifiant le rôle sur chaque route protégée
- Vérification propriété ressource : user_id === token.sub
- Routes admin/moderator → vérification rôle obligatoire

ENV
- Zéro secret hardcodé dans le code
- Toutes les variables sensibles depuis os.Getenv()
- .env jamais commité (.gitignore)
```

---

## Conventions de code

### Go (backend)
```go
// Nommage
- Handlers : PostHandler, GetFeedHandler (verbe + domaine + Handler)
- Services : JWTService, StreakService
- Repository : UserRepository, PostRepository (interfaces)

// Gestion d'erreurs
- Toujours retourner error comme dernier paramètre
- Jamais ignorer une erreur avec _
- Logs avec slog (structured logging)

// Réponses HTTP
- Succès : JSON avec champ "data"
- Erreur  : JSON avec champ "error" et "code"
// Exemple : { "error": "session not active", "code": "SESSION_CLOSED" }
```

### TypeScript (frontend)
```typescript
// Composants : PascalCase (PostCard, SessionBar)
// Hooks : camelCase avec use (useSession, useFeed)
// Utils : camelCase (formatRelativeTime, truncateContent)
// Toujours typer les props avec interface, jamais any
// Fetch via lib/api.ts — jamais de fetch() direct dans les composants
```

---

## Variables d'environnement

Voir `.env.example` pour la liste complète. Variables obligatoires au démarrage :

```
DATABASE_URL          postgresql://user:pass@database:5432/pulse
JWT_SECRET            chaîne aléatoire >= 32 chars
SESSION_OPEN_HOUR     20        (heure UTC d'ouverture)
SESSION_DURATION_MIN  60        (durée en minutes)
POSTGRES_DB           pulse
POSTGRES_USER         pulse_user
POSTGRES_PASSWORD     (secret)
```

---

## Cron Jobs (backend)

Deux jobs critiques à implémenter dans `cmd/main.go` au démarrage :

```
1. SessionManager  — s'exécute toutes les minutes
   - Vérifie si une session doit être ouverte (heure == SESSION_OPEN_HOUR)
   - Vérifie si la session active doit être fermée (now > closes_at)
   - À la fermeture : broadcast WebSocket "session_closed" à tous les connectés
   - À la fermeture : déclenche le calcul des streaks

2. StreakCalculator — s'exécute après chaque fermeture de session
   - Pour chaque user : vérifie session_attendances des 7 derniers jours
   - Met à jour users.streak
   - Passe users.status à 'dormant' si streak == 0 et 7 sessions manquées
```

---

## WebSocket Hub

Le hub gère toutes les connexions actives pendant une session.

```go
// Événements à broadcaster
type WSEvent struct {
    Type    string      `json:"type"`    // "new_post" | "new_reaction" | "session_closed"
    Payload interface{} `json:"payload"`
}

// Connexion : vérification JWT obligatoire à l'upgrade HTTP→WS
// Déconnexion automatique à la fermeture de session (broadcast session_closed)
```

---

## Commandes utiles

```bash
# Démarrage local
docker compose up -d

# Migrations
docker compose exec backend go run cmd/migrate/main.go up

# Tests backend
docker compose exec backend go test ./... -v -cover

# Tests frontend
docker compose exec frontend npm run test

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Health check
curl http://localhost/api/health
```

---

## Définition of Done — Globale

Avant de considérer une feature terminée :

- [ ] Les tests unitaires passent (`go test ./...`)
- [ ] Les règles métier critiques sont vérifiées côté serveur
- [ ] Aucun secret hardcodé dans le code
- [ ] Les erreurs sont toutes gérées explicitement (pas de `_`)
- [ ] Les routes protégées ont leur middleware JWT/RBAC
- [ ] Le code compile sans warning
- [ ] Les logs sont structurés (slog, pas fmt.Println)
