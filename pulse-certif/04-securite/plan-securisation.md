# Pulse — Plan de sécurisation

## 1. Identification des failles potentielles (OWASP Top 10)

### A01 — Broken Access Control
**Risque** : un utilisateur accède à des ressources ou actions qui ne lui sont pas autorisées.

Exemples concrets sur Pulse :
- Un utilisateur accède à l'interface d'administration
- Un utilisateur supprime le post d'un autre utilisateur
- Un utilisateur non authentifié accède au feed

**Mesures appliquées** :
- Middleware JWT sur toutes les routes protégées
- RBAC (Role-Based Access Control) : chaque endpoint vérifie le rôle (user / moderator / admin)
- Vérification de la propriété de la ressource avant modification (user_id === token.sub)
- Routes admin/moderateur inaccessibles sans le rôle correspondant

---

### A02 — Cryptographic Failures
**Risque** : exposition de données sensibles (mots de passe, tokens).

**Mesures appliquées** :
- Hashage des mots de passe avec bcrypt (coût adaptatif, résistant brute force)
- JWT stocké en httpOnly cookie (inaccessible au JavaScript — protection XSS)
- HTTPS obligatoire en production (Nginx avec certificat TLS)
- Aucun mot de passe ou donnée sensible en clair en BDD ou dans les logs

---

### A03 — Injection (SQL, XSS)
**Risque** : injection de code malveillant via les entrées utilisateur.

**Injection SQL** :
- Utilisation de requêtes préparées avec `sqlx` (Go) — aucune concaténation de chaînes SQL
- Paramètres liés (`$1`, `$2`...) systématiquement

**XSS (Cross-Site Scripting)** :
- Échappement automatique des données côté Next.js (React encode le HTML par défaut)
- Validation et sanitisation côté API Go avant insertion en BDD
- Content-Security-Policy (CSP) dans les headers Nginx

---

### A07 — Authentication Failures
**Risque** : attaques brute force, vol de session, authentification contournée.

**Mesures appliquées** :
- Rate limiting sur `POST /api/auth/login` : 5 tentatives / 15 min par IP (Nginx)
- Expiration du JWT à 24h
- Vérification du statut du compte à chaque authentification (suspendu → 403)
- Pas de message d'erreur différencié (email inconnu vs mot de passe incorrect → même message générique)

---

### A09 — Security Logging Failures
**Risque** : absence de traces des événements de sécurité, impossible de détecter une attaque.

**Mesures appliquées** :
- Logs structurés avec `slog` (Go) : timestamp, niveau, action, user_id, IP
- Logs des actions sensibles : connexion, déconnexion, tentatives échouées, actions admin
- Alertes sur erreurs 5xx (monitoring à prévoir en production)

---

## 2. Conformité RGPD

### Données personnelles collectées

| Donnée | Finalité | Durée de conservation |
|---|---|---|
| Email | Authentification | Durée du compte |
| Pseudo | Identification publique | Durée du compte |
| Avatar | Personnalisation | Durée du compte |
| Bio | Présentation publique | Durée du compte |
| Posts | Participation au réseau | Durée du compte |
| Streak / présence | Engagement | Durée du compte |
| Logs de connexion | Sécurité | 90 jours |

### Droits des utilisateurs implémentés

**Droit d'accès** : endpoint `GET /api/me` retournant toutes les données de l'utilisateur

**Droit de rectification** : endpoint `PUT /api/me` permettant la modification du profil

**Droit à l'effacement** : endpoint `DELETE /api/me` supprimant le compte et toutes les données associées (CASCADE ON DELETE en BDD)

**Droit à la portabilité** : endpoint `GET /api/me/export` retournant les données au format JSON

### Mesures techniques RGPD

- Aucune donnée sensible transmise dans les URLs (pas d'email ou ID dans les query params)
- Logs anonymisés après 90 jours
- Consentement explicite lors de l'inscription (cases à cocher)
- Politique de confidentialité accessible depuis l'application
- Aucun partage de données avec des tiers

---

## 3. Sécurité de l'infrastructure

### Docker
- Images officielles uniquement (node:alpine, golang:alpine, postgres:16-alpine)
- Utilisateur non-root dans chaque container
- Variables d'environnement sensibles via `.env` (non commitées — `.gitignore`)
- Réseau Docker interne : seul Nginx expose des ports publics

### Nginx
- HTTPS avec certificat TLS (Let's Encrypt)
- Headers de sécurité : HSTS, X-Frame-Options, X-Content-Type-Options, CSP
- Rate limiting sur les endpoints sensibles
- Masquage des versions des serveurs

### GitHub Actions (CI/CD)
- Secrets stockés dans GitHub Secrets (jamais en clair dans le code)
- Scan de vulnérabilités des dépendances (Dependabot)
- Tests de sécurité automatisés avant déploiement

---

## 4. Matrice des risques

| Risque | Probabilité | Impact | Niveau | Mesure |
|---|---|---|---|---|
| Injection SQL | Faible | Critique | Élevé | Requêtes préparées |
| Vol de JWT | Moyenne | Élevé | Élevé | httpOnly cookie + expiration 24h |
| Brute force login | Élevée | Moyen | Élevé | Rate limiting + message générique |
| XSS | Faible | Moyen | Moyen | Échappement React + CSP |
| Accès non autorisé | Moyenne | Élevé | Élevé | RBAC + vérification propriété |
| Fuite de données BDD | Faible | Critique | Élevé | Requêtes préparées + accès réseau interne |
| DDoS | Faible | Élevé | Moyen | Rate limiting Nginx |

---

## 5. Points à défendre au jury

- **Pourquoi bcrypt et pas SHA-256 ?** bcrypt est adaptatif (coût configurable), résistant aux GPU/ASIC. SHA-256 est une fonction de hachage rapide, non adaptée aux mots de passe.
- **Pourquoi httpOnly cookie et pas localStorage ?** localStorage est accessible via JavaScript → vulnérable XSS. httpOnly cookie est inaccessible au JS.
- **Pourquoi des requêtes préparées ?** Séparation code/données — le driver SQL traite les paramètres comme des valeurs, jamais comme du code exécutable.
- **RGPD et CASCADE DELETE** : quand un utilisateur supprime son compte, toutes ses données liées sont supprimées automatiquement en BDD grâce aux contraintes `ON DELETE CASCADE`.
