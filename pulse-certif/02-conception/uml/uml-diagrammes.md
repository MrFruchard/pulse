# Pulse — Diagrammes UML

## 1. Diagramme de cas d'utilisation

### Acteurs
| Acteur | Description |
|---|---|
| Visiteur | Utilisateur non authentifié |
| Utilisateur | Compte actif authentifié |
| Modérateur | Utilisateur avec droits de modération |
| Admin | Accès complet à la configuration |

### Cas d'utilisation par acteur

**Visiteur**
- S'inscrire
- Se connecter
- Voir le compte à rebours

**Utilisateur**
- Voir le compte à rebours
- Consulter le feed (global ou abonnements)
- Créer un post (intention obligatoire)
- Réagir à un post
- Commenter un post
- Suivre / ne plus suivre un utilisateur
- Rechercher un utilisateur
- Voir un profil public
- Voir son streak
- Gérer ses notifications
- Signaler un post

**Modérateur**
- Consulter le feed
- Modérer un post signalé
- Signaler un post

**Admin**
- Modérer un post signalé
- Suspendre un compte
- Configurer la session (heure, durée)
- Consulter le feed

---

## 2. Diagramme de séquence — Authentification

```
Utilisateur -> Frontend : Saisit email + mot de passe
Frontend -> API Go : POST /api/auth/login
API Go -> PostgreSQL : SELECT * FROM users WHERE email = ?
PostgreSQL --> API Go : user ou null

[si user non trouvé]
  API Go --> Frontend : 401 Unauthorized
  Frontend --> Utilisateur : Erreur "Identifiants invalides"

[si user trouvé]
  API Go -> API Go : bcrypt.Compare(password, hash)

  [si mot de passe incorrect]
    API Go --> Frontend : 401 Unauthorized
    Frontend --> Utilisateur : Erreur "Identifiants invalides"

  [si mot de passe correct]
    [si compte suspendu]
      API Go --> Frontend : 403 Forbidden
      Frontend --> Utilisateur : Erreur "Compte suspendu"

    [si compte actif]
      API Go -> API Go : jwt.Sign(userId, role, exp 24h)
      API Go --> Frontend : 200 OK + JWT token
      Frontend -> Frontend : Stocke token dans httpOnly cookie
      Frontend --> Utilisateur : Redirige vers /dashboard
```

**Points clés à défendre au jury :**
- Hashage bcrypt (coût adaptatif, résistant aux attaques brute force)
- JWT stocké en httpOnly cookie (protection XSS)
- Expiration 24h + refresh token prévu en évolution
- Gestion explicite des statuts (suspendu vs inactif)

---

## 3. Diagramme de séquence — Création d'un post en session

```
Utilisateur -> Frontend : Ouvre l'application
Frontend -> API Go : GET /api/session/current
API Go -> PostgreSQL : SELECT * FROM sessions WHERE is_active = true
PostgreSQL --> API Go : session active ou null

[si pas de session active]
  API Go --> Frontend : Session fermée + opens_at
  Frontend --> Utilisateur : Affiche compte à rebours

[si session active]
  API Go --> Frontend : Session ouverte + session_id
  Frontend -> WebSocket Go : Connexion WebSocket
  WebSocket Go --> Frontend : Confirmation connexion
  Frontend --> Utilisateur : Affiche feed en temps réel

  Utilisateur -> Frontend : Rédige post + sélectionne intention
  Frontend -> API Go : POST /api/posts (JWT + contenu + intention)
  API Go -> API Go : Vérifie JWT valide
  API Go -> PostgreSQL : SELECT COUNT(*) FROM posts WHERE user_id=? AND session_id=?
  PostgreSQL --> API Go : count

  [si déjà un post dans cette session]
    API Go --> Frontend : 409 Conflict
    Frontend --> Utilisateur : Erreur "1 post par session"

  [si aucun post]
    API Go -> PostgreSQL : INSERT INTO posts VALUES (...)
    PostgreSQL --> API Go : Post créé
    API Go -> PostgreSQL : INSERT INTO session_attendances (si absent)
    API Go -> WebSocket Go : Broadcast nouveau post
    WebSocket Go --> Frontend : Event new_post + données
    Frontend --> Utilisateur : Post apparaît dans le feed en temps réel
```

**Points clés à défendre au jury :**
- Vérification de la session active côté serveur (pas seulement côté client)
- Limite 1 post/session vérifiée en BDD (pas en mémoire)
- WebSocket pour le temps réel — tous les connectés reçoivent le post instantanément
- session_attendances alimenté automatiquement à la création du post
