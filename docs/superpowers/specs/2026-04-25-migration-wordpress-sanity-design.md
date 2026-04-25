# Design — Migration WordPress → Sanity + Next.js + Vercel

**Date :** 2026-04-25  
**Projet :** Portfolio Alexandre Gonzalez  
**Statut :** Approuvé

---

## Contexte

Portfolio existant sous WordPress (Wordplate + Timber + ACF) hébergé sur Hostinger. Objectif : migrer vers une stack moderne Sanity.io (CMS) + Next.js 14 (frontend) déployée sur Vercel.

Le site est un **site vitrine** (pas de commerce), compatible avec le plan Hobby Vercel.

---

## Décisions clés

| Sujet | Décision |
|-------|----------|
| CMS | Sanity.io v3 |
| Frontend | Next.js 14 (App Router) |
| Déploiement | Vercel (plan Hobby) |
| Architecture | Monorepo 2 packages (web + studio) |
| Design | Identique au thème WordPress gonzalex |
| Repo | Nouveau repo GitHub indépendant dans `gonzalex-next/` |

---

## Structure du projet

```
portfolio_alex/              ← repo existant (WordPress, on ne touche pas)
└── gonzalex-next/           ← nouveau repo GitHub indépendant
    ├── apps/
    │   ├── web/             ← Next.js 14 (App Router)
    │   │   ├── app/         ← routes & pages
    │   │   ├── components/
    │   │   ├── lib/         ← client Sanity, helpers GROQ
    │   │   └── package.json
    │   └── studio/          ← Sanity Studio v3
    │       ├── schemas/     ← types de contenu
    │       ├── sanity.config.ts
    │       └── package.json
    ├── scripts/
    │   └── migrate.js       ← script migration WordPress → Sanity
    ├── package.json         ← workspaces root (npm workspaces)
    └── .gitignore
```

---

## Architecture de déploiement

Deux projets Vercel distincts depuis le même monorepo :

| Projet Vercel | Package | URL cible | Usage |
|---------------|---------|-----------|-------|
| gonzalex-studio | `apps/studio` | `gonzalex-studio.vercel.app` (URL Vercel par défaut) | Alexandre gère son contenu |
| gonzalex-web | `apps/web` | `gonzalex-web.vercel.app` (URL Vercel par défaut) | Site public |

**Flux de publication :**  
Alexandre publie dans le Studio → webhook Sanity → Vercel revalide les pages Next.js via `revalidatePath` (ISR on-demand).

---

## Rendu des pages Next.js

| Route | Stratégie | Source de données |
|-------|-----------|-------------------|
| `/` | SSG + revalidation on-demand | Liste des `projet` Sanity |
| `/projets/[slug]` | SSG + revalidation on-demand | Document `projet` par slug |
| `/a-propos` | SSG + revalidation on-demand | Document singleton `aPropos` |
| `/mentions-legales` | SSG statique | Contenu hardcodé |
| `404` | Statique | Composant Next.js |

---

## Schéma de données Sanity

### Type `projet` (remplace les Posts WordPress)

| Champ | Type Sanity | Correspondance ACF/WP |
|-------|------------|----------------------|
| `title` | `string` | `post_title` |
| `slug` | `slug` | `post_name` |
| `thumbnail` | `image` | `_thumbnail_id` |
| `bgImage` | `image` | `bgImage` (ACF) |
| `categories` | `array of string` | taxonomy `category` |
| `date` | `date` | `post_date` |
| `desc` | `block` (rich text) | `desc` (ACF) |
| `items[]` | `array of object` | repeater ACF `items` |
| `items[].infotitle` | `string` | `infotitle` |
| `items[].infodetails` | `string` | `infodetails` |
| `gallery[]` | `array of image` | `gallery` (ACF) |

### Type `aPropos` (singleton — page gonzalex)

| Champ | Type Sanity | Correspondance ACF |
|-------|------------|-------------------|
| `title` | `string` | `title` |
| `desc` | `block` | `desc` |
| `imgPrez` | `image` | `img__prez` |
| `serviceH2` | `string` | `service_h2` |
| `services[]` | `array of object` | repeater `services` |
| `services[].serviceTitle` | `string` | `service__title` |
| `services[].serviceDesc` | `block` | `service__desc` |
| `imgFull` | `image` | `img-full` |
| `parcoursH2` | `string` | `parcours_h2` |
| `parcours[]` | `array of object` | repeater `parcours` |
| `parcours[].date` | `string` | `date` |
| `parcours[].status` | `string` | `status` |
| `parcours[].metier` | `string` | `metier` |

### Type `settings` (singleton — options globales)

| Champ | Type Sanity | Correspondance ACF |
|-------|------------|-------------------|
| `mail` | `string` | `options.mail` |
| `textLoader` | `string` | `options.textLoader` |

---

## Stratégie de migration du contenu

Le contenu est sur Hostinger (WordPress non accessible via navigateur, accès SSH + phpMyAdmin disponible).

### Étapes

1. **Export SQL** — via SSH : `mysqldump` de la base WordPress (tables `wp_posts`, `wp_postmeta`, `wp_options`)
2. **Téléchargement des médias** — via SSH/rsync : récupération du dossier `wp-content/uploads/`
3. **Script `scripts/migrate.js`** — script Node.js qui :
   - Parse le dump SQL
   - Reconstruit les documents Sanity (`projet`, `aPropos`, `settings`)
   - Upload les images via `@sanity/client` + `@sanity/asset-utils`
   - Pousse tous les documents dans Sanity via mutations
4. **Vérification** — Alexandre ouvre le Studio et vérifie le contenu migré

---

## Plan d'implémentation (4 phases)

### Phase 1 — Scaffolding
- Initialiser le repo GitHub `gonzalex-next`
- Créer la structure monorepo (`apps/web`, `apps/studio`)
- Init Sanity Studio v3 + définir les schémas
- Init Next.js 14 App Router
- Configurer les 2 projets Vercel

### Phase 2 — Migration
- Export SQL + médias depuis Hostinger via SSH
- Écrire et exécuter `scripts/migrate.js`
- Vérification dans le Studio

### Phase 3 — Frontend
- Portage du CSS/SCSS WordPress → Next.js (CSS Modules ou SCSS global)
- Intégration des requêtes GROQ (Sanity)
- Pages : Home (Swiper), `/projets/[slug]`, `/a-propos`, `/mentions-legales`
- Animations Swiper.js
- Route API `/api/revalidate` pour le webhook Sanity

### Phase 4 — Déploiement
- Déploiement Studio sur Vercel
- Déploiement Web sur Vercel
- Pas de domaine custom — utilisation des URLs Vercel par défaut (`*.vercel.app`)
- Tests end-to-end
