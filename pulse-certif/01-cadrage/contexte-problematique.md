# Pulse — Contexte & Problématique

## Projet
**Nom** : Pulse  
**Type** : Réseau social à fenêtre temporelle  
**Stack** : Next.js · Go · PostgreSQL · Docker · WebSockets · GitHub Actions CI/CD  

---

## Contexte

Les réseaux sociaux actuels sont conçus pour maximiser le temps passé sur la plateforme. Algorithmes de recommandation, scroll infini, notifications permanentes — chaque mécanisme vise à prolonger l'engagement au détriment de la qualité des échanges. Résultat : des utilisateurs surinformés, passifs, et de moins en moins satisfaits de leur expérience.

---

## Problématique

> **"Comment concevoir un réseau social qui génère de l'engagement et de l'anticipation sans recourir aux mécanismes addictifs des plateformes existantes ?"**

---

## Réponse apportée

Pulse est un réseau social accessible uniquement pendant une fenêtre d'une heure par jour, synchronisée pour tous les utilisateurs. La rareté crée l'anticipation. La contrainte crée la qualité.

### Principes fondateurs

| Principe | Description |
|---|---|
| 1h / jour | Fenêtre globale synchronisée pour tous les utilisateurs |
| 1 post / session | Intention obligatoire déclarée (Question / Partage / Projet / Challenge) |
| Feed chronologique | Aucun algorithme de recommandation |
| Streak de présence | Engagement mesuré par la régularité, pas par le volume |

---

## Objectifs du projet

### Fonctionnel
Développer une application web fullstack avec authentification, gestion des sessions temporelles, feed live et système de posts structurés.

### Technique
Mettre en œuvre une architecture Go + Next.js + PostgreSQL conteneurisée avec CI/CD et WebSockets pour le temps réel.

### Qualité
Respecter les bonnes pratiques de sécurité (OWASP), de conformité RGPD et de tests automatisés.
