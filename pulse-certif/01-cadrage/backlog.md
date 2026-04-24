# Pulse — Backlog Produit

## Méthode de priorisation

**MoSCoW** : Must Have / Should Have / Could Have / Won't Have (v1)

| Priorité | Signification |
|---|---|
| 🔴 Must Have | Indispensable — sans ça, le produit ne fonctionne pas |
| 🟠 Should Have | Important — fort impact utilisateur, prévu pour la v1 |
| 🟡 Could Have | Utile — ajouté si le temps le permet |
| ⚪ Won't Have | Hors scope v1 — identifié pour les versions futures |

---

## Récapitulatif

| Sprint | Thème | Items | Statut |
|---|---|---|---|
| Sprint 1 | Fondations — Auth + Session + Post | 12 | Terminé |
| Sprint 2 | Social — Feed + Profil + Interactions | 10 | Terminé |
| Sprint 3 | Qualité — Admin + Notifications + Streak | 13 | Terminé |

---

## Sprint 1 — Fondations

> **Objectif** : un utilisateur peut s'inscrire, se connecter, attendre la session et publier un post.

### 🔴 Must Have

| ID | Item | US | Critères d'acceptance |
|---|---|---|---|
| B-01 | Inscription avec email + pseudo + mot de passe | US-01 | Compte créé en BDD, mot de passe hashé bcrypt, JWT retourné |
| B-02 | Connexion et délivrance du JWT | US-02 | JWT stocké en httpOnly cookie, expiration 24h |
| B-03 | Déconnexion (invalidation du cookie) | US-02 | Cookie supprimé, redirection page d'accueil |
| B-04 | Middleware JWT — protection des routes | — | Toute route protégée retourne 401 sans JWT valide |
| B-05 | Cron d'ouverture automatique de session | US-04 | `is_active = true` créé à `SESSION_OPEN_HOUR` |
| B-06 | Cron de fermeture automatique de session | US-06 | `is_active = false` après `SESSION_DURATION_MIN` |
| B-07 | Endpoint GET `/api/session/current` | US-04 | Retourne `{ isActive, opensAt, closesAt }` |
| B-08 | Compte à rebours côté frontend | US-04 | Décompte en temps réel, rafraîchi chaque seconde |
| B-09 | Création d'un post avec intention déclarée | US-08 | Post inséré, intention parmi QUESTION/SHARE/PROJECT/CHALLENGE |
| B-10 | Règle 1 post par session (vérification BDD) | US-08 | 409 si l'utilisateur a déjà posté dans la session active |
| B-11 | Blocage de la création de post hors session | US-06 | 403 si `is_active = false` au moment de la requête |
| B-12 | Feed global GET `/api/posts` — tri chronologique | US-09 | Liste des posts de la session active, ordre antéchronologique |

---

## Sprint 2 — Social

> **Objectif** : les utilisateurs interagissent, suivent d'autres membres, et consultent les profils.

### 🔴 Must Have

| ID | Item | US | Critères d'acceptance |
|---|---|---|---|
| B-13 | Feed temps réel via WebSocket | US-09 | Nouveau post broadcasted à tous les connectés sans rechargement |
| B-14 | Réactions sur un post (LIKE / FIRE / INSIGHTFUL / SUPPORT) | US-10 | 201 à la création, 409 si déjà réagi (UNIQUE post_id + user_id) |
| B-15 | Commentaires sur un post | US-11 | Commentaire inséré, visible dans le détail du post |
| B-16 | Follow / Unfollow un utilisateur | US-17, US-18 | 201 à la création, 200 à la suppression, 409 si doublon, 400 si auto-follow |
| B-17 | Feed abonnements (posts des follows uniquement) | US-20 | GET `/api/posts?feed=following` retourne uniquement les posts des utilisateurs suivis |
| B-18 | Profil utilisateur public | US-23 | GET `/api/users/:pseudo` retourne profil + liste des posts |

### 🟠 Should Have

| ID | Item | US | Critères d'acceptance |
|---|---|---|---|
| B-19 | Recherche d'utilisateur par pseudo | US-21 | GET `/api/users/search?q=xxx` retourne liste filtrée |
| B-20 | Filtre du feed par intention | US-22 | GET `/api/posts?intention=QUESTION` retourne uniquement les posts correspondants |
| B-21 | Liste abonnés / abonnements d'un profil | US-19 | GET `/api/users/:id/followers` et `/following` |
| B-22 | Modification du profil (pseudo, avatar, bio) | US-03 | PUT `/api/me` met à jour les champs, unicité du pseudo vérifiée |

---

## Sprint 3 — Qualité

> **Objectif** : modération, notifications, streak, RGPD, sécurité.

### 🔴 Must Have

| ID | Item | US | Critères d'acceptance |
|---|---|---|---|
| B-23 | RBAC — middleware de vérification des rôles | — | Routes `/api/admin/*` retournent 403 pour les users standard |
| B-24 | Signalement d'un post | US-16 | POST `/api/posts/:id/reports` insère un signalement avec reason |
| B-25 | Interface admin — gestion des signalements | US-14 | GET `/api/admin/reports` liste les PENDING, PUT met à jour le statut |
| B-26 | Suspension d'un compte (admin) | US-15 | PUT `/api/admin/users/:id/suspend` passe le statut à 'suspended', connexion bloquée |
| B-27 | Suppression de compte (RGPD) | — | DELETE `/api/me` supprime le compte et toutes les données associées (CASCADE) |

### 🟠 Should Have

| ID | Item | US | Critères d'acceptance |
|---|---|---|---|
| B-28 | Calcul du streak quotidien (cron post-session) | US-12 | `users.streak` incrémenté si présence, remis à 0 si session manquée |
| B-29 | Passage en statut "dormant" (7 sessions manquées) | US-13 | `users.status = 'dormant'` après 7 absences consécutives |
| B-30 | Notifications en base (réaction, commentaire, follow) | US-25, US-26 | Entrée insérée dans `notifications` à chaque événement concerné |
| B-31 | Configuration admin de la session (heure, durée) | US-07 | PUT `/api/admin/session` met à jour les paramètres de session |

### 🟡 Could Have

| ID | Item | US | Critères d'acceptance |
|---|---|---|---|
| B-32 | Notification push 15 min avant session | US-05, US-24 | Notification de type SESSION_OPEN insérée 15 min avant `SESSION_OPEN_HOUR` |
| B-33 | Préférences de notifications | US-27 | L'utilisateur peut activer/désactiver chaque type de notification |
| B-34 | Historique des notifications | US-28 | GET `/api/notifications` retourne toutes les notifs, marquage lu/non-lu |
| B-35 | Export des données utilisateur (RGPD portabilité) | — | GET `/api/me/export` retourne toutes les données au format JSON |

### ⚪ Won't Have (v1)

| ID | Item | Raison |
|---|---|---|
| B-36 | Messages privés entre utilisateurs | Hors concept — Pulse est un réseau public pendant la session |
| B-37 | Hashtags et topics | Complexité de modération, hors scope v1 |
| B-38 | Application mobile native | Priorité web d'abord, mobile en v2 |
| B-39 | OAuth (Google, GitHub) | Inscription email suffisante pour la v1 |
| B-40 | Système de recommandation algorithmique | Contraire aux principes fondateurs du projet |

---

## Définition of Done (DoD) globale

Pour qu'un item soit considéré **terminé** :

- [ ] Endpoint implémenté et testé (test fonctionnel avec `httptest`)
- [ ] Cas d'erreur couverts (401, 403, 409, 422...)
- [ ] Règles métier vérifiées côté serveur (jamais uniquement côté client)
- [ ] Log structuré pour les actions sensibles
- [ ] Aucune donnée sensible dans les réponses API (pas de `password_hash`)
- [ ] CI passe (lint + tests + build)
