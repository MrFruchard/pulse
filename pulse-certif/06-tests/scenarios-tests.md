# Pulse — Scénarios de Tests

## 1. Stratégie de tests

| Type | Outil | Couverture cible |
|---|---|---|
| Tests unitaires backend | `go test` | 80% des fonctions métier |
| Tests unitaires frontend | `Jest + React Testing Library` | Composants critiques |
| Tests fonctionnels API | `httptest` (Go) | Tous les endpoints |
| Tests de non-régression | GitHub Actions (CI) | Exécutés à chaque push |
| Tests manuels | Grille de recette | Avant chaque mise en production |

---

## 2. Tests unitaires — Backend (Go)

### Module : Authentification

| ID | Fonction testée | Entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TU-01 | `HashPassword()` | "monMotDePasse123" | Hash bcrypt non vide, != entrée | À implémenter |
| TU-02 | `HashPassword()` | Chaîne vide | Erreur retournée | À implémenter |
| TU-03 | `ComparePassword()` | Hash correct + mot de passe | true | À implémenter |
| TU-04 | `ComparePassword()` | Hash correct + mauvais mot de passe | false | À implémenter |
| TU-05 | `GenerateJWT()` | userId + role valides | Token JWT non vide | À implémenter |
| TU-06 | `ValidateJWT()` | Token valide | Claims extraits correctement | À implémenter |
| TU-07 | `ValidateJWT()` | Token expiré | Erreur "token expired" | À implémenter |
| TU-08 | `ValidateJWT()` | Token falsifié | Erreur "invalid signature" | À implémenter |

### Module : Sessions

| ID | Fonction testée | Entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TU-09 | `IsSessionActive()` | Session ouverte (now entre opens_at et closes_at) | true | À implémenter |
| TU-10 | `IsSessionActive()` | Session fermée (now > closes_at) | false | À implémenter |
| TU-11 | `IsSessionActive()` | Session pas encore ouverte | false | À implémenter |
| TU-12 | `CalculateStreak()` | 7 attendances consécutives | 7 | À implémenter |
| TU-13 | `CalculateStreak()` | 5 attendances avec 1 jour manquant | 0 (streak brisé) | À implémenter |

### Module : Posts

| ID | Fonction testée | Entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TU-14 | `ValidatePostContent()` | Contenu 500 chars | valid = true | À implémenter |
| TU-15 | `ValidatePostContent()` | Contenu 501 chars | valid = false, erreur | À implémenter |
| TU-16 | `ValidatePostContent()` | Contenu vide | valid = false, erreur | À implémenter |
| TU-17 | `HasPostedInSession()` | user_id + session_id avec post existant | true | À implémenter |
| TU-18 | `HasPostedInSession()` | user_id + session_id sans post | false | À implémenter |

---

## 3. Tests fonctionnels — API REST

### Authentification

| ID | Endpoint | Méthode | Corps | Code attendu | Réponse attendue |
|---|---|---|---|---|---|
| TF-01 | `/api/auth/register` | POST | email + pseudo + password valides | 201 | `{ user, token }` |
| TF-02 | `/api/auth/register` | POST | Email déjà existant | 409 | `{ error: "email already exists" }` |
| TF-03 | `/api/auth/register` | POST | Pseudo déjà existant | 409 | `{ error: "pseudo already exists" }` |
| TF-04 | `/api/auth/login` | POST | Credentials valides | 200 | JWT dans httpOnly cookie |
| TF-05 | `/api/auth/login` | POST | Mauvais mot de passe | 401 | Message générique |
| TF-06 | `/api/auth/login` | POST | Email inconnu | 401 | Même message générique que TF-05 |
| TF-07 | `/api/auth/login` | POST | Compte suspendu | 403 | `{ error: "account suspended" }` |
| TF-08 | `/api/auth/logout` | POST | JWT valide | 200 | Cookie supprimé |

### Sessions

| ID | Endpoint | Méthode | Auth | Code attendu | Réponse attendue |
|---|---|---|---|---|---|
| TF-09 | `/api/session/current` | GET | Non requis | 200 | `{ isActive, opensAt, closesAt }` |
| TF-10 | `/api/session/current` | GET | Non requis (session active) | 200 | `{ isActive: true, sessionId }` |
| TF-11 | `/api/admin/session` | PUT | Admin | 200 | Session mise à jour |
| TF-12 | `/api/admin/session` | PUT | User standard | 403 | Accès refusé |

### Posts

| ID | Endpoint | Méthode | Auth | Corps | Code attendu |
|---|---|---|---|---|---|
| TF-13 | `/api/posts` | POST | JWT valide (session active) | content + intention | 201 |
| TF-14 | `/api/posts` | POST | JWT valide (session fermée) | content + intention | 403 |
| TF-15 | `/api/posts` | POST | JWT valide (déjà posté) | content + intention | 409 |
| TF-16 | `/api/posts` | POST | Sans JWT | content + intention | 401 |
| TF-17 | `/api/posts` | POST | JWT valide | Contenu vide | 422 |
| TF-18 | `/api/posts` | POST | JWT valide | Sans intention | 422 |
| TF-19 | `/api/posts` | GET | JWT valide (session active) | — | 200 + liste posts |
| TF-20 | `/api/posts/:id/reactions` | POST | JWT valide | type: "LIKE" | 201 |
| TF-21 | `/api/posts/:id/reactions` | POST | JWT valide (déjà réagi) | type: "LIKE" | 409 |

### Follows

| ID | Endpoint | Méthode | Auth | Code attendu | Remarque |
|---|---|---|---|---|---|
| TF-22 | `/api/users/:id/follow` | POST | JWT valide | 201 | Follow créé |
| TF-23 | `/api/users/:id/follow` | POST | JWT valide (déjà suivi) | 409 | Doublon interdit |
| TF-24 | `/api/users/:id/follow` | POST | Se suivre soi-même | 400 | CHECK violation |
| TF-25 | `/api/users/:id/follow` | DELETE | JWT valide | 200 | Unfollow |

---

## 4. Tests de non-régression

Les tests suivants sont exécutés automatiquement à chaque push via GitHub Actions :

```
go test ./... -v -cover -race
```

Les tests critiques à maintenir en non-régression :

| ID | Scénario | Priorité |
|---|---|---|
| TNR-01 | Login valide retourne un JWT | Critique |
| TNR-02 | Post impossible hors session | Critique |
| TNR-03 | Limite 1 post par session respectée | Critique |
| TNR-04 | Accès admin refusé aux users standard | Critique |
| TNR-05 | Calcul du streak correct | Haute |
| TNR-06 | Unicité des réactions par user/post | Haute |
| TNR-07 | Suppression compte cascade | Haute |

---

## 5. Procédure de recette (tests manuels)

À exécuter avant chaque mise en production :

### Checklist recette

**Authentification**
- [ ] Inscription avec un nouvel email → compte créé, redirection dashboard
- [ ] Inscription avec email existant → message d'erreur approprié
- [ ] Connexion valide → accès au feed
- [ ] Connexion avec mauvais mot de passe → message générique (pas de distinction email/mdp)
- [ ] Déconnexion → redirection page accueil, cookie supprimé

**Session**
- [ ] Hors session : compte à rebours visible et décompte en temps réel
- [ ] Bouton "Me notifier" → notification programmée
- [ ] Ouverture session : barre verte apparaît, feed accessible
- [ ] Fermeture session : interface verrouillée, posts non acceptés

**Posts**
- [ ] Création post avec intention → apparaît dans le feed en temps réel
- [ ] Tentative de 2ème post → message "1 post par session"
- [ ] Post vide → bouton Publier désactivé
- [ ] Post sans intention → bouton Publier désactivé

**Social**
- [ ] Follow un utilisateur → apparaît dans onglet Abonnements
- [ ] Unfollow → disparaît des abonnements
- [ ] Recherche par pseudo → résultats filtrés

**Administration**
- [ ] Admin : suspension d'un compte → connexion impossible pour le compte suspendu
- [ ] Modérateur : suppression d'un post signalé → post disparu du feed
- [ ] User standard : accès /admin → 403

---

## 6. Couverture de tests cible

```
--- Coverage Report ---
handlers/auth.go        87%
handlers/posts.go       82%
handlers/session.go     90%
handlers/users.go       78%
services/jwt.go         95%
services/streak.go      88%
middleware/rbac.go      92%
-------------------------------
TOTAL                   87%
```

Seuil minimum pour valider la CI : **80% de couverture globale**
