# Pulse — Modèle Conceptuel des Données (MCD)

## Entités et attributs

### USER
- id (identifiant)
- email
- pseudo
- avatar_url
- bio
- role
- streak
- status
- created_at

### SESSION
- id (identifiant)
- opens_at
- closes_at
- is_active

### POST
- id (identifiant)
- user_id (ref. USER)
- session_id (ref. SESSION)
- content
- intention (QUESTION | SHARE | PROJECT | CHALLENGE)
- image_url
- is_flagged
- created_at

### COMMENT
- id (identifiant)
- post_id (ref. POST)
- user_id (ref. USER)
- content
- created_at

### REACTION
- id (identifiant)
- post_id (ref. POST)
- user_id (ref. USER)
- type (LIKE | FIRE | INSIGHTFUL | SUPPORT)
- created_at

### FOLLOW
- id (identifiant)
- follower_id (ref. USER)
- following_id (ref. USER)
- created_at

### NOTIFICATION
- id (identifiant)
- user_id (ref. USER)
- type
- payload
- is_read
- created_at

### REPORT
- id (identifiant)
- post_id (ref. POST)
- user_id (ref. USER)
- reason
- created_at

### SESSION_ATTENDANCE
- id (identifiant)
- user_id (ref. USER)
- session_id (ref. SESSION)
- joined_at

---

## Relations

| Entité A | Cardinalité | Entité B | Libellé |
|---|---|---|---|
| USER | 1,n | POST | rédige |
| SESSION | 1,n | POST | contient |
| POST | 1,n | COMMENT | reçoit |
| USER | 1,n | COMMENT | écrit |
| POST | 1,n | REACTION | reçoit |
| USER | 1,n | REACTION | fait |
| USER | 1,n | FOLLOW | suit (follower) |
| USER | 1,n | FOLLOW | est suivi par (following) |
| USER | 1,n | NOTIFICATION | reçoit |
| POST | 1,n | REPORT | est signalé |
| USER | 1,n | REPORT | signale |
| USER | 1,n | SESSION_ATTENDANCE | assiste |
| SESSION | 1,n | SESSION_ATTENDANCE | enregistre |

---

## Notes de conception

- **FOLLOW** est une auto-relation sur USER (un utilisateur peut suivre et être suivi par d'autres utilisateurs)
- **SESSION_ATTENDANCE** est la table de jonction qui permet de calculer le streak d'un utilisateur
- **NOTIFICATION.payload** est stocké en JSON pour rester flexible selon le type de notification
- **REACTION.type** est une liste fixe (LIKE / FIRE / INSIGHTFUL / SUPPORT) pour faciliter l'agrégation
- **USER.role** : user / moderator / admin
- **USER.status** : active / dormant / suspended
