# Pulse — Procès-verbal de recette

> **Template à remplir en fin de projet, après exécution des scénarios de test documentés dans `../06-tests/scenarios-tests.md`.**

---

## 1. Informations générales

| Champ | Valeur |
|---|---|
| Projet | Pulse — réseau social à fenêtre temporelle |
| Version livrée | `vX.Y.Z` |
| Date de recette | AAAA-MM-JJ |
| Lieu | Zone01 Normandie / distanciel |
| Environnement testé | Production / Staging / `docker compose up` local |
| URL | `https://...` ou `http://localhost` |

## 2. Participants

| Rôle | Nom | Signature |
|---|---|---|
| Candidat / Développeur | Romain Savary | |
| Recetteur / Tuteur | [Nom] | |
| Observateur | [Nom] | |

## 3. Périmètre de la recette

Fonctionnalités validées :

- [ ] Authentification (inscription, connexion, déconnexion)
- [ ] Gestion de session temporelle (ouverture, fermeture, cron)
- [ ] Création de post (1/session, intention obligatoire)
- [ ] Feed global chronologique
- [ ] Feed des abonnements
- [ ] Réactions (LIKE, FIRE, INSIGHTFUL, SUPPORT)
- [ ] Commentaires
- [ ] Follows / abonnements
- [ ] Notifications
- [ ] Profil utilisateur (consultation, édition, suppression)
- [ ] Streak (calcul, affichage, passage en dormant)
- [ ] WebSocket temps réel
- [ ] Reports et modération
- [ ] Administration (rôles admin/moderator)

## 4. Résultats détaillés par scénario

> Référencer les identifiants de scénarios de `../06-tests/scenarios-tests.md`.

| # | Scénario | Attendu | Obtenu | Statut | Remarques |
|---|---|---|---|---|---|
| S1 | Inscription nouvel utilisateur | 201 + JWT cookie | | ☐ OK ☐ KO | |
| S2 | Connexion mauvais mdp | 401 générique | | ☐ OK ☐ KO | |
| S3 | Post hors session | 403 `SESSION_CLOSED` | | ☐ OK ☐ KO | |
| S4 | 2e post même session | 409 `ONE_POST_PER_SESSION` | | ☐ OK ☐ KO | |
| S5 | WebSocket `new_post` broadcast | Event reçu <1s | | ☐ OK ☐ KO | |
| S6 | Fermeture session auto | `session_closed` broadcast | | ☐ OK ☐ KO | |
| S7 | Suppression compte | Cascade posts/comments/reactions | | ☐ OK ☐ KO | |
| S8 | Report post | 201 + dashboard modération | | ☐ OK ☐ KO | |
| S9 | RBAC : user → admin route | 403 | | ☐ OK ☐ KO | |
| S10 | Streak après 7 sessions consécutives | streak = 7 | | ☐ OK ☐ KO | |
| ... | | | | | |

## 5. Tests techniques

| Type | Commande | Résultat |
|---|---|---|
| Tests unitaires backend | `go test ./... -v -cover` | Couverture : __% |
| Tests frontend | `npm run test` | Couverture : __% |
| Lint backend | `go vet ./...` | ☐ OK ☐ KO |
| Lint frontend | `npm run lint` | ☐ OK ☐ KO |
| Build production | `docker compose build` | ☐ OK ☐ KO |
| Health check | `curl /api/health` | ☐ OK ☐ KO |

## 6. Anomalies détectées

### Anomalies bloquantes (P0)

| ID | Description | Impact | Statut |
|---|---|---|---|
| | | | |

### Anomalies majeures (P1)

| ID | Description | Impact | Statut |
|---|---|---|---|
| | | | |

### Anomalies mineures (P2)

| ID | Description | Impact | Statut |
|---|---|---|---|
| | | | |

## 7. Points non testés / limitations connues

- [ ]
- [ ]

## 8. Décision

- ☐ **Recette prononcée sans réserve** — la livraison est conforme et peut être mise en production.
- ☐ **Recette prononcée avec réserves** — les réserves sont listées ci-dessous, un délai de correction est accordé.
- ☐ **Recette refusée** — les anomalies bloquantes empêchent la mise en production.

### Réserves (si applicable)

1.
2.

### Délai de correction accordé

Date limite : AAAA-MM-JJ

## 9. Signatures

| Rôle | Nom | Date | Signature |
|---|---|---|---|
| Candidat | Romain Savary | | |
| Recetteur | | | |

---

## Annexes

- Plan de tests détaillé : `../06-tests/scenarios-tests.md`
- Plan de sécurité : `../04-securite/plan-securisation.md`
- Plan de déploiement : `../05-deploiement/plan-deploiement.md`
