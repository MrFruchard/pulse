# Pulse — Dictionnaire des Données

## Conventions

| Colonne | Description |
|---|---|
| **Champ** | Nom exact de la colonne en base de données |
| **Type SQL** | Type PostgreSQL utilisé |
| **Contraintes** | NOT NULL, UNIQUE, FK, DEFAULT, CHECK... |
| **Description** | Signification métier du champ |
| **Exemple** | Valeur représentative |
| **Règle métier** | Comportement applicatif associé (si applicable) |

---

## Table : `users`

> Stocke les comptes utilisateurs de la plateforme.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique de l'utilisateur | `a1b2c3d4-...` | Généré automatiquement à l'inscription |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Adresse email de connexion | `john@example.com` | Utilisé comme identifiant de connexion. Jamais retourné dans les réponses API publiques |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt du mot de passe | `$2a$12$...` | Jamais retourné dans aucune réponse API. Coût bcrypt >= 12 |
| `pseudo` | VARCHAR(50) | NOT NULL, UNIQUE | Nom public affiché sur la plateforme | `johndoe` | 3 à 50 caractères. Modifiable via PUT /api/me. Utilisé dans les URLs de profil |
| `avatar_url` | VARCHAR(500) | NULL | URL de la photo de profil | `https://cdn.../avatar.jpg` | Optionnel. NULL si non défini (avatar par défaut côté frontend) |
| `bio` | TEXT | NULL | Description courte du profil | `Développeur Go passionné` | Optionnelle. Affichée sur le profil public |
| `role` | user_role (enum) | NOT NULL, DEFAULT 'user' | Rôle RBAC de l'utilisateur | `user` | Valeurs : `user` / `moderator` / `admin`. Détermine les accès aux routes protégées |
| `streak` | INTEGER | NOT NULL, DEFAULT 0 | Nombre de sessions consécutives avec présence | `7` | Incrémenté par le cron post-session si présence enregistrée. Remis à 0 à la première session manquée |
| `status` | user_status (enum) | NOT NULL, DEFAULT 'active' | État du compte | `active` | Valeurs : `active` / `dormant` / `suspended`. `dormant` après 7 sessions manquées. `suspended` par un admin. Connexion bloquée si `suspended` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création du compte | `2025-01-15 20:00:00` | Définie à l'inscription, non modifiable |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de dernière modification du profil | `2025-03-10 14:30:00` | Mis à jour à chaque PUT /api/me |

---

## Table : `sessions`

> Représente une fenêtre temporelle d'activité. Une seule session peut être active à la fois.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique de la session | `b2c3d4e5-...` | Généré automatiquement à l'ouverture |
| `opens_at` | TIMESTAMP | NOT NULL | Heure d'ouverture de la session | `2025-03-30 20:00:00` | Définie par `SESSION_OPEN_HOUR` (variable d'environnement) |
| `closes_at` | TIMESTAMP | NOT NULL | Heure de fermeture de la session | `2025-03-30 21:00:00` | `opens_at + SESSION_DURATION_MIN` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT false | Indique si la session est actuellement ouverte | `true` | Une seule session peut avoir `is_active = true` à la fois. Basculé par le cron |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création de l'enregistrement | `2025-03-30 20:00:00` | — |

---

## Table : `posts`

> Contient les publications des utilisateurs pendant les sessions actives.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique du post | `c3d4e5f6-...` | — |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Auteur du post | `a1b2c3d4-...` | Un utilisateur ne peut créer qu'un seul post par session. Vérifié par COUNT en BDD |
| `session_id` | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | Session dans laquelle le post a été publié | `b2c3d4e5-...` | Le post ne peut être créé que si `sessions.is_active = true` au moment de la requête |
| `content` | TEXT | NOT NULL | Contenu textuel du post | `"Quelqu'un utilise Go pour..."` | Obligatoire. Limité à 500 caractères côté applicatif. Sanitisé avant insertion |
| `intention` | post_intention (enum) | NOT NULL | Catégorie déclarée du post | `QUESTION` | Valeurs : `QUESTION` / `SHARE` / `PROJECT` / `CHALLENGE`. Déclarée obligatoirement par l'auteur |
| `image_url` | VARCHAR(500) | NULL | URL d'une image jointe au post | `https://cdn.../img.jpg` | Optionnelle |
| `is_flagged` | BOOLEAN | NOT NULL, DEFAULT false | Indique si le post a été signalé | `false` | Passé à `true` lors d'un signalement validé par un modérateur |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Horodatage de la publication | `2025-03-30 20:12:45` | Utilisé pour le tri chronologique du feed |

---

## Table : `comments`

> Commentaires rédigés par les utilisateurs sur les posts pendant la session.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique du commentaire | `d4e5f6g7-...` | — |
| `post_id` | UUID | NOT NULL, FK → posts(id) ON DELETE CASCADE | Post commenté | `c3d4e5f6-...` | Si le post est supprimé, les commentaires sont supprimés en cascade |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Auteur du commentaire | `a1b2c3d4-...` | — |
| `content` | TEXT | NOT NULL | Contenu du commentaire | `"Très bonne question !"` | Obligatoire. Sanitisé avant insertion |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Horodatage du commentaire | `2025-03-30 20:18:00` | — |

---

## Table : `reactions`

> Réactions émojis des utilisateurs sur les posts (une seule réaction par utilisateur par post).

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique de la réaction | `e5f6g7h8-...` | — |
| `post_id` | UUID | NOT NULL, FK → posts(id) ON DELETE CASCADE | Post réagi | `c3d4e5f6-...` | — |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Utilisateur ayant réagi | `a1b2c3d4-...` | — |
| `type` | reaction_type (enum) | NOT NULL | Type de réaction exprimée | `LIKE` | Valeurs : `LIKE` / `FIRE` / `INSIGHTFUL` / `SUPPORT` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Horodatage de la réaction | `2025-03-30 20:25:00` | — |
| *(contrainte)* | — | UNIQUE (post_id, user_id) | Un utilisateur ne peut réagir qu'une fois par post | — | Retourne 409 si violation |

---

## Table : `follows`

> Relations d'abonnement entre utilisateurs (graphe social orienté).

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique du follow | `f6g7h8i9-...` | — |
| `follower_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Utilisateur qui suit | `a1b2c3d4-...` | — |
| `following_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Utilisateur suivi | `z9y8x7w6-...` | — |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date du follow | `2025-03-30 20:30:00` | — |
| *(contrainte)* | — | UNIQUE (follower_id, following_id) | Pas de doublon de follow | — | Retourne 409 si déjà suivi |
| *(contrainte)* | — | CHECK (follower_id != following_id) | Interdit de se suivre soi-même | — | Retourne 400 si auto-follow |

---

## Table : `notifications`

> Notifications générées par les événements de la plateforme pour chaque utilisateur.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique de la notification | `g7h8i9j0-...` | — |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Destinataire de la notification | `a1b2c3d4-...` | — |
| `type` | notification_type (enum) | NOT NULL | Catégorie de la notification | `REACTION` | Valeurs : `SESSION_OPEN` / `REACTION` / `COMMENT` / `FOLLOW` / `REPORT` |
| `payload` | JSONB | NOT NULL, DEFAULT '{}' | Données contextuelles de la notification | `{"post_id": "...", "from": "johndoe"}` | Structuré différemment selon le type. Permet d'afficher un message contextuel sans jointure |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT false | Indique si la notification a été lue | `false` | Passé à `true` quand l'utilisateur consulte ses notifications |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Horodatage de la notification | `2025-03-30 19:45:00` | Utilisé pour trier les notifications antéchronologiquement |

### Exemples de payload par type

| Type | Payload JSON |
|---|---|
| `SESSION_OPEN` | `{ "opens_at": "2025-03-30T20:00:00Z" }` |
| `REACTION` | `{ "post_id": "...", "from_pseudo": "johndoe", "reaction": "FIRE" }` |
| `COMMENT` | `{ "post_id": "...", "from_pseudo": "janedoe", "preview": "Très bonne..." }` |
| `FOLLOW` | `{ "from_pseudo": "johndoe", "from_id": "..." }` |
| `REPORT` | `{ "post_id": "...", "status": "REVIEWED" }` |

---

## Table : `reports`

> Signalements de posts soumis par les utilisateurs, traités par les modérateurs.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique du signalement | `h8i9j0k1-...` | — |
| `post_id` | UUID | NOT NULL, FK → posts(id) ON DELETE CASCADE | Post signalé | `c3d4e5f6-...` | Si le post est supprimé, les signalements le sont aussi |
| `reporter_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Utilisateur ayant signalé | `a1b2c3d4-...` | — |
| `reason` | report_reason (enum) | NOT NULL | Motif du signalement | `HARASSMENT` | Valeurs : `SPAM` / `INAPPROPRIATE` / `HARASSMENT` / `OTHER` |
| `status` | report_status (enum) | NOT NULL, DEFAULT 'PENDING' | État de traitement du signalement | `PENDING` | Valeurs : `PENDING` / `REVIEWED` / `DISMISSED`. Mis à jour par un modérateur ou admin via PUT /api/admin/reports/:id |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date du signalement | `2025-03-30 20:40:00` | — |

---

## Table : `session_attendances`

> Enregistre la présence d'un utilisateur à une session. Utilisée pour le calcul du streak.

| Champ | Type SQL | Contraintes | Description | Exemple | Règle métier |
|---|---|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identifiant unique de la présence | `i9j0k1l2-...` | — |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Utilisateur présent | `a1b2c3d4-...` | — |
| `session_id` | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | Session concernée | `b2c3d4e5-...` | — |
| `joined_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Horodatage de la première action en session | `2025-03-30 20:05:00` | Créé automatiquement lors du premier post de l'utilisateur dans la session (INSERT INTO session_attendances ON CONFLICT DO NOTHING) |
| *(contrainte)* | — | UNIQUE (user_id, session_id) | Une présence par utilisateur par session | — | Garantit qu'un utilisateur ne peut être compté deux fois dans la même session |

---

## Récapitulatif des types énumérés (enums PostgreSQL)

| Enum | Valeurs |
|---|---|
| `user_role` | `user`, `moderator`, `admin` |
| `user_status` | `active`, `dormant`, `suspended` |
| `post_intention` | `QUESTION`, `SHARE`, `PROJECT`, `CHALLENGE` |
| `reaction_type` | `LIKE`, `FIRE`, `INSIGHTFUL`, `SUPPORT` |
| `notification_type` | `SESSION_OPEN`, `REACTION`, `COMMENT`, `FOLLOW`, `REPORT` |
| `report_reason` | `SPAM`, `INAPPROPRIATE`, `HARASSMENT`, `OTHER` |
| `report_status` | `PENDING`, `REVIEWED`, `DISMISSED` |

---

## Récapitulatif des contraintes métier critiques

| Contrainte | Table | Implémentation |
|---|---|---|
| 1 post par session par utilisateur | `posts` | COUNT query côté API avant INSERT |
| Post uniquement en session active | `posts` | Vérification `is_active = true` côté API |
| 1 réaction par utilisateur par post | `reactions` | UNIQUE (post_id, user_id) |
| Pas de double follow | `follows` | UNIQUE (follower_id, following_id) |
| Pas d'auto-follow | `follows` | CHECK (follower_id != following_id) |
| 1 présence par session | `session_attendances` | UNIQUE (user_id, session_id) |
| 1 session active à la fois | `sessions` | Logique applicative dans le cron |
| Suppression en cascade | Toutes | ON DELETE CASCADE sur toutes les FK |
