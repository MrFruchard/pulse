# Pulse — Bilan & Rétrospective

> **Template à remplir en fin de projet.**

---

## 1. Métriques projet

| Métrique | Valeur |
|---|---|
| Durée totale du projet | _ semaines |
| Nombre de sprints | _ |
| Nombre de commits | `git rev-list --count HEAD` |
| Nombre de PRs mergées | `gh pr list --state merged \| wc -l` |
| Nombre d'issues résolues | `gh issue list --state closed \| wc -l` |
| Lignes de code Go | `find backend -name '*.go' -exec cat {} + \| wc -l` |
| Lignes de code TS/TSX | `find frontend -name '*.ts' -o -name '*.tsx' \| xargs wc -l` |
| Couverture tests backend | __% |
| Couverture tests frontend | __% |
| Score Lighthouse (perf / a11y / SEO) | __ / __ / __ |

## 2. Objectifs initiaux vs atteints

| Objectif (cadrage) | Statut | Notes |
|---|---|---|
| Auth sécurisée JWT | ☐ Atteint ☐ Partiel ☐ Non |  |
| Session temporelle cron | ☐ Atteint ☐ Partiel ☐ Non |  |
| Feed temps réel WebSocket | ☐ Atteint ☐ Partiel ☐ Non |  |
| Règle 1 post/session serveur | ☐ Atteint ☐ Partiel ☐ Non |  |
| Streak & statut dormant | ☐ Atteint ☐ Partiel ☐ Non |  |
| Modération (reports, admin) | ☐ Atteint ☐ Partiel ☐ Non |  |
| Déploiement Docker + CI/CD | ☐ Atteint ☐ Partiel ☐ Non |  |
| Couverture tests ≥ 80% | ☐ Atteint ☐ Partiel ☐ Non |  |
| Conformité RGAA AA | ☐ Atteint ☐ Partiel ☐ Non |  |

## 3. Rétrospective — Keep / Stop / Start

### ✅ Keep (ce qui a bien fonctionné)

-
-
-

### ❌ Stop (ce qui n'a pas fonctionné)

-
-
-

### 🚀 Start (ce que je ferais différemment)

-
-
-

## 4. Apprentissages

### Techniques

-
-

### Méthodologiques

-
-

### Humains / soft skills

-
-

## 5. Moments clés

| Moment | Date | Description |
|---|---|---|
| Premier commit | | |
| Premier déploiement réussi | | |
| Pic de difficulté | | |
| Déblocage majeur | | |
| Démo interne | | |

## 6. Dette technique identifiée

| Zone | Description | Priorité v2 |
|---|---|---|
| | | ☐ Haute ☐ Moyenne ☐ Basse |

## 7. Roadmap v2 (si reprise)

- [ ] OAuth (Google, GitHub)
- [ ] Application mobile (React Native)
- [ ] Recherche avancée (full-text)
- [ ] Migration Kubernetes si scale
- [ ] Internationalisation (EN)
- [ ]

## 8. Bilan personnel

> À rédiger librement — 1 paragraphe sur le ressenti global, ce que ce projet apporte à la suite du parcours professionnel.

---

## Références

- Gestion de projet : `gestion-projet.md`
- PV de recette : `pv-recette.md`
- Backlog initial : `../01-cadrage/backlog.md`
