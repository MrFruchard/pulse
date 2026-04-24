# Pulse — Modèle Logique des Données (MLD)

## Tables relationnelles

### users
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| email | varchar(255) | UK, NOT NULL |
| password_hash | varchar(255) | NOT NULL |
| pseudo | varchar(50) | UK, NOT NULL |
| avatar_url | varchar(500) | NULL |
| bio | text | NULL |
| role | enum(user, moderator, admin) | NOT NULL, DEFAULT 'user' |
| streak | integer | NOT NULL, DEFAULT 0 |
| status | enum(active, dormant, suspended) | NOT NULL, DEFAULT 'active' |
| created_at | timestamp | NOT NULL, DEFAULT now() |
| updated_at | timestamp | NOT NULL, DEFAULT now() |

### sessions
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| opens_at | timestamp | NOT NULL |
| closes_at | timestamp | NOT NULL |
| is_active | boolean | NOT NULL, DEFAULT false |
| created_at | timestamp | NOT NULL, DEFAULT now() |

### posts
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users(id), NOT NULL |
| session_id | uuid | FK → sessions(id), NOT NULL |
| content | text | NOT NULL |
| intention | enum(QUESTION, SHARE, PROJECT, CHALLENGE) | NOT NULL |
| image_url | varchar(500) | NULL |
| is_flagged | boolean | NOT NULL, DEFAULT false |
| created_at | timestamp | NOT NULL, DEFAULT now() |

### comments
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| post_id | uuid | FK → posts(id), NOT NULL |
| user_id | uuid | FK → users(id), NOT NULL |
| content | text | NOT NULL |
| created_at | timestamp | NOT NULL, DEFAULT now() |

### reactions
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| post_id | uuid | FK → posts(id), NOT NULL |
| user_id | uuid | FK → users(id), NOT NULL |
| type | enum(LIKE, FIRE, INSIGHTFUL, SUPPORT) | NOT NULL |
| created_at | timestamp | NOT NULL, DEFAULT now() |

**Contrainte unique** : (post_id, user_id) — un utilisateur ne peut réagir qu'une fois par post

### follows
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| follower_id | uuid | FK → users(id), NOT NULL |
| following_id | uuid | FK → users(id), NOT NULL |
| created_at | timestamp | NOT NULL, DEFAULT now() |

**Contrainte unique** : (follower_id, following_id) — pas de doublon de follow

### notifications
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users(id), NOT NULL |
| type | enum(SESSION_OPEN, REACTION, COMMENT, FOLLOW, REPORT) | NOT NULL |
| payload | jsonb | NOT NULL |
| is_read | boolean | NOT NULL, DEFAULT false |
| created_at | timestamp | NOT NULL, DEFAULT now() |

### reports
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| post_id | uuid | FK → posts(id), NOT NULL |
| reporter_id | uuid | FK → users(id), NOT NULL |
| reason | enum(SPAM, INAPPROPRIATE, HARASSMENT, OTHER) | NOT NULL |
| status | enum(PENDING, REVIEWED, DISMISSED) | NOT NULL, DEFAULT 'PENDING' |
| created_at | timestamp | NOT NULL, DEFAULT now() |

### session_attendances
| Champ | Type | Contrainte |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users(id), NOT NULL |
| session_id | uuid | FK → sessions(id), NOT NULL |
| joined_at | timestamp | NOT NULL, DEFAULT now() |

**Contrainte unique** : (user_id, session_id) — une présence par session

---

## Index recommandés

| Table | Champ(s) | Raison |
|---|---|---|
| posts | user_id | Récupération des posts par utilisateur |
| posts | session_id | Récupération des posts par session |
| posts | created_at | Tri chronologique du feed |
| reactions | (post_id, user_id) | Vérification unicité + comptage |
| follows | follower_id | Liste des abonnements |
| follows | following_id | Liste des abonnés |
| notifications | (user_id, is_read) | Notifications non lues |
| session_attendances | (user_id, session_id) | Calcul du streak |
