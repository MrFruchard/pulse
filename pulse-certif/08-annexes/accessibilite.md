# Pulse — Accessibilité

## Référentiel visé

**RGAA 4.1 niveau AA** (Référentiel Général d'Amélioration de l'Accessibilité), aligné sur WCAG 2.1 AA.

Pulse n'est pas un service public et n'a donc pas d'obligation légale RGAA, mais le projet vise la conformité volontaire AA comme preuve de qualité professionnelle (attendu CDA).

## Principes appliqués

| Principe WCAG | Application dans Pulse |
|---|---|
| **Perceptible** | Contrastes AA (4.5:1 texte, 3:1 UI), alternatives textuelles images, responsive, dark mode natif |
| **Utilisable** | Navigation clavier complète, focus visible, pas de piège au clavier, `prefers-reduced-motion` respecté |
| **Compréhensible** | Labels explicites, messages d'erreur parlants, langue `lang="fr"` déclarée |
| **Robuste** | HTML sémantique, ARIA utilisé avec parcimonie (compléter, pas remplacer) |

## Checklist RGAA — 13 thématiques

| # | Thématique | Statut | Notes |
|---|---|---|---|
| 1 | Images | ⚠️ À auditer | `alt` descriptifs à vérifier sur les avatars et images de posts |
| 2 | Cadres | ✅ N/A | Pas de `<iframe>` |
| 3 | Couleurs | ⚠️ À auditer | Contraste à mesurer (Lighthouse + axe) |
| 4 | Multimédia | ✅ N/A | Pas de vidéo/audio dans le MVP |
| 5 | Tableaux | ✅ N/A | Pas de tableau de données dans l'UI (uniquement doc) |
| 6 | Liens | ⚠️ À auditer | Intitulés explicites, pas de "cliquez ici" |
| 7 | Scripts | ⚠️ À auditer | Contenus dynamiques (feed live, notifications) → `aria-live` à valider |
| 8 | Éléments obligatoires | ⚠️ À auditer | `<html lang="fr">`, `<title>` par page, doctype |
| 9 | Structuration | ⚠️ À auditer | Hiérarchie `<h1>` → `<h6>`, landmarks (`<nav>`, `<main>`, `<aside>`) |
| 10 | Présentation | ⚠️ À auditer | Agrandissement 200% sans perte, pas de contenu caché uniquement au CSS |
| 11 | Formulaires | ⚠️ À auditer | `<label for>` systématique, messages d'erreur liés via `aria-describedby` |
| 12 | Navigation | ⚠️ À auditer | Skip link, fil d'ariane, plan du site |
| 13 | Consultation | ⚠️ À auditer | Pas de rafraîchissement automatique piège, `prefers-reduced-motion` |

> Statuts à mettre à jour après audit Lighthouse + axe DevTools.

## Points d'attention spécifiques à Pulse

### Animations (Framer Motion)

Le splash screen utilise une animation "battement de cœur" + ripple au tap (`components/SplashScreen.tsx`). Respecter **WCAG 2.3.3 — Animation sur interaction** :

```tsx
// Pattern à appliquer
const prefersReducedMotion = useReducedMotion();
<motion.div animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }} />
```

### Compte à rebours de session

Le countdown est **critique UX**. Règles a11y :
- Double encodage : visuel (timer) + textuel (`aria-live="polite"` pour les annonces majeures "session dans 5 min")
- Pas de `aria-live="assertive"` qui interrompt le lecteur d'écran.
- Texte alternatif : "Prochaine session dans 2 heures 15 minutes".

### Feed temps réel (WebSocket)

Arrivée d'un nouveau post pendant qu'un utilisateur navigue. Règles :
- Zone `aria-live="polite"` sur la bannière "nouveaux posts disponibles".
- Ne pas déplacer automatiquement le focus (disruptif lecteur d'écran).
- Bouton "Voir les nouveaux posts" pour laisser l'utilisateur décider du chargement.

### Intentions des posts (QUESTION / PARTAGE / PROJET / CHALLENGE)

Actuellement encodées par couleur + texte. ✅ Double encodage conforme WCAG 1.4.1 (la couleur seule ne doit pas porter l'information).

### Dark mode

Natif dans Pulse. Contrastes à mesurer sur les **deux thèmes**.

## Outils et méthode d'audit

| Outil | Type | Couverture |
|---|---|---|
| Lighthouse (Chrome DevTools) | Automatique | ~30% des critères, score global |
| axe DevTools (extension) | Automatique | ~50% des critères, détails par règle |
| WAVE (wave.webaim.org) | Automatique | Visualisation structure et erreurs |
| Navigation clavier manuelle | Manuel | Tab, Shift+Tab, Enter, Espace, Échap |
| VoiceOver (macOS) | Manuel | Test lecteur d'écran sur parcours clés |
| Agrandissement 200% | Manuel | Zoom navigateur, pas de scroll horizontal |

## Parcours à auditer en priorité

1. Inscription / connexion
2. Page d'accueil avec compte à rebours
3. Feed session active
4. Création d'un post (formulaire + intention)
5. Profil utilisateur
6. Notifications

## Plan d'action post-audit

1. Exporter les rapports Lighthouse + axe pour chaque parcours.
2. Remplir les statuts dans la checklist RGAA ci-dessus.
3. Ouvrir une issue GitHub par non-conformité bloquante.
4. Prioriser les corrections niveau A (bloquant) avant le niveau AA.
5. Documenter les non-conformités résiduelles acceptées (avec justification).
6. Refaire un audit de contrôle avant le rendu jury.

## Déclaration d'accessibilité (brouillon)

> Pulse s'engage à rendre son application accessible conformément au RGAA 4.1 niveau AA.
> Un audit de conformité a été réalisé le [DATE] par [AUTEUR].
> Le résultat : conformité partielle — X% des critères RGAA sont respectés.
> Les non-conformités identifiées font l'objet d'un plan de remédiation (cf. plan d'action).

> Déclaration complète à finaliser après audit.

## Références

- RGAA 4.1 : https://accessibilite.numerique.gouv.fr/
- WCAG 2.1 : https://www.w3.org/TR/WCAG21/
- axe DevTools : https://www.deque.com/axe/devtools/
- Maquettes à auditer : `../02-conception/maquettes/`
