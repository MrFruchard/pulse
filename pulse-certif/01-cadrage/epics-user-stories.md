# Pulse — Epics & User Stories

## Récapitulatif

| Métrique | Valeur |
|---|---|
| Epics | 8 |
| User Stories | 28 |
| Rôles | visiteur, user, moderator, admin |

---

## Epic 1 — Authentification & profil utilisateur

| ID | User Story |
|---|---|
| US-01 | En tant que visiteur, je veux créer un compte avec email + mot de passe afin d'accéder à Pulse |
| US-02 | En tant qu'utilisateur, je veux me connecter et recevoir un JWT afin d'accéder aux fonctionnalités protégées |
| US-03 | En tant qu'utilisateur, je veux modifier mon pseudo, avatar et bio afin de personnaliser mon profil |

---

## Epic 2 — Gestion de la fenêtre temporelle (Session)

| ID | User Story |
|---|---|
| US-04 | En tant qu'utilisateur, je veux voir un compte à rebours avant l'ouverture de la session afin d'anticiper la fenêtre |
| US-05 | En tant qu'utilisateur, je veux être notifié 15 minutes avant l'ouverture afin de ne pas rater la session |
| US-06 | En tant qu'utilisateur, je veux que l'interface se verrouille à la fermeture de la session afin de respecter la contrainte temporelle |
| US-07 | En tant qu'admin, je veux configurer l'heure d'ouverture et la durée de la session afin de gérer le planning global |

---

## Epic 3 — Posts & interactions

| ID | User Story |
|---|---|
| US-08 | En tant qu'utilisateur, je veux créer un post avec une intention déclarée (Question / Partage / Projet / Challenge) afin de structurer mon contenu |
| US-09 | En tant qu'utilisateur, je veux voir le feed en temps réel pendant la session afin de suivre les nouveaux posts sans recharger la page |
| US-10 | En tant qu'utilisateur, je veux réagir à un post pendant la session afin d'interagir avec la communauté |
| US-11 | En tant qu'utilisateur, je veux commenter un post afin d'engager une conversation pendant la fenêtre |

---

## Epic 4 — Streak & engagement

| ID | User Story |
|---|---|
| US-12 | En tant qu'utilisateur, je veux voir mon streak de présence afin de suivre ma régularité sur la plateforme |
| US-13 | En tant qu'utilisateur, je veux que mon profil passe en "dormant" après 7 sessions manquées afin de ressentir l'impact de mon absence |

---

## Epic 5 — Administration & modération

| ID | User Story |
|---|---|
| US-14 | En tant qu'admin/moderator, je veux supprimer un post signalé afin de modérer le contenu de la plateforme |
| US-15 | En tant qu'admin, je veux suspendre un compte utilisateur afin de gérer les comportements abusifs |
| US-16 | En tant qu'utilisateur, je veux signaler un post inapproprié afin de contribuer à la modération communautaire |

---

## Epic 6 — Social — Follow & découverte

| ID | User Story |
|---|---|
| US-17 | En tant qu'utilisateur, je veux suivre un autre utilisateur afin de voir ses posts en priorité dans mon feed |
| US-18 | En tant qu'utilisateur, je veux ne plus suivre un utilisateur afin de gérer mon cercle social |
| US-19 | En tant qu'utilisateur, je veux voir la liste de mes abonnés et abonnements afin de gérer mon réseau |
| US-20 | En tant qu'utilisateur, je veux avoir deux modes de feed (global / abonnements) afin de choisir mon niveau de découverte |

---

## Epic 7 — Recherche & exploration

| ID | User Story |
|---|---|
| US-21 | En tant qu'utilisateur, je veux rechercher un utilisateur par pseudo afin de trouver et suivre des personnes |
| US-22 | En tant qu'utilisateur, je veux filtrer le feed par type d'intention (Question / Partage / Projet / Challenge) afin de trouver le contenu qui m'intéresse |
| US-23 | En tant qu'utilisateur, je veux consulter le profil public d'un utilisateur et voir ses posts passés afin de mieux le connaître |

---

## Epic 8 — Notifications

| ID | User Story |
|---|---|
| US-24 | En tant qu'utilisateur, je veux recevoir une notification 15 min avant l'ouverture de la session afin d'être prêt |
| US-25 | En tant qu'utilisateur, je veux être notifié quand quelqu'un réagit ou commente mon post afin de suivre mes interactions |
| US-26 | En tant qu'utilisateur, je veux être notifié quand quelqu'un me suit afin de savoir qui s'intéresse à mon profil |
| US-27 | En tant qu'utilisateur, je veux gérer mes préférences de notifications afin de contrôler ce que je reçois |
| US-28 | En tant qu'utilisateur, je veux voir toutes mes notifications regroupées afin d'avoir un historique clair |
