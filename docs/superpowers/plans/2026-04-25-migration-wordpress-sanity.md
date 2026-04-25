# Gonzalex Portfolio — Migration WordPress → Sanity + Next.js

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le portfolio WordPress d'Alexandre vers un monorepo Next.js 14 + Sanity Studio v3, déployé sur Vercel, design identique à l'original.

**Architecture:** Monorepo npm workspaces (`apps/web` + `apps/studio`). Next.js 14 App Router avec SSG + revalidation on-demand via webhook Sanity. Migration automatisée : export SQL depuis Hostinger → import MySQL local → script Node.js → Sanity.

**Tech Stack:** Next.js 14 (App Router), Sanity v3, TypeScript, SCSS (global), Swiper.js 11, @portabletext/react, imagesloaded, mysql2, Vercel, npm workspaces

---

## File Map

```
gonzalex-next/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx                   ← root layout (fonts, SCSS global)
│   │   │   ├── page.tsx                     ← home (/)
│   │   │   ├── projets/[slug]/page.tsx      ← détail projet
│   │   │   ├── a-propos/page.tsx            ← page à propos
│   │   │   ├── mentions-legales/page.tsx    ← mentions (statique)
│   │   │   ├── not-found.tsx               ← 404
│   │   │   └── api/revalidate/route.ts      ← webhook Sanity
│   │   ├── components/
│   │   │   ├── HomeSlider.tsx               ← Swiper (client component)
│   │   │   ├── Header.tsx                   ← header + burger menu
│   │   │   ├── Footer.tsx
│   │   │   └── PortableText.tsx             ← renderer Sanity block content
│   │   ├── lib/
│   │   │   ├── sanity.client.ts             ← client Sanity (lecture)
│   │   │   ├── queries.ts                   ← requêtes GROQ
│   │   │   └── urlFor.ts                    ← helper image Sanity
│   │   ├── styles/
│   │   │   └── main.scss                    ← import du SCSS WP porté
│   │   ├── public/fonts/                    ← fonts copiées depuis WP
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── studio/
│       ├── schemas/
│       │   ├── index.ts                     ← export all schemas
│       │   ├── projet.ts
│       │   ├── aPropos.ts
│       │   └── settings.ts
│       ├── sanity.config.ts
│       ├── sanity.cli.ts
│       └── package.json
├── scripts/
│   ├── migrate.js                           ← migration WP → Sanity
│   └── migrate.test.js                      ← tests parsing ACF
├── package.json                             ← npm workspaces root
└── .gitignore
```

---

## Task 1 : Init monorepo + repo GitHub

**Files:**
- Create: `gonzalex-next/package.json`
- Create: `gonzalex-next/.gitignore`
- Create: `gonzalex-next/.env.example`

- [ ] **Créer la structure de dossiers**

```bash
cd /Users/leoachard/Sites/portfolio_alex
mkdir -p gonzalex-next/apps/web gonzalex-next/apps/studio gonzalex-next/scripts gonzalex-next/docs/superpowers/plans
cd gonzalex-next
```

- [ ] **Créer le package.json root (npm workspaces)**

```json
{
  "name": "gonzalex-next",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev:web": "npm run dev --workspace=apps/web",
    "dev:studio": "npm run dev --workspace=apps/studio",
    "build:web": "npm run build --workspace=apps/web",
    "build:studio": "npm run build --workspace=apps/studio"
  }
}
```

- [ ] **Créer le .gitignore**

```
node_modules
.next
.env
.env.local
dist
.sanity
```

- [ ] **Créer le .env.example**

```
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# Revalidation
REVALIDATE_SECRET=

# Migration (local MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=wordpress
```

- [ ] **Init git + créer repo GitHub**

```bash
git init
git add .
git commit -m "chore: init monorepo gonzalex-next"
gh repo create gonzalex-next --public --source=. --push
```

Expected: repo créé sur GitHub, premier commit poussé.

---

## Task 2 : Init Sanity Studio + schémas

**Files:**
- Create: `apps/studio/package.json`
- Create: `apps/studio/sanity.cli.ts`
- Create: `apps/studio/sanity.config.ts`
- Create: `apps/studio/schemas/index.ts`
- Create: `apps/studio/schemas/projet.ts`
- Create: `apps/studio/schemas/aPropos.ts`
- Create: `apps/studio/schemas/settings.ts`

- [ ] **Init Sanity Studio**

```bash
cd apps/studio
npm create sanity@latest -- --project-id <à-créer-sur-sanity.io> --dataset production --template clean --typescript --no-add-project
```

> Créer d'abord un projet sur https://sanity.io/manage, puis utiliser l'ID fourni.

- [ ] **Mettre à jour apps/studio/package.json** (vérifier que ces deps sont présentes)

```json
{
  "name": "studio",
  "private": true,
  "scripts": {
    "dev": "sanity dev",
    "build": "sanity build",
    "deploy": "sanity deploy"
  },
  "dependencies": {
    "sanity": "^3.0.0",
    "@sanity/vision": "^3.0.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

- [ ] **Créer apps/studio/schemas/projet.ts**

```typescript
import { defineType, defineField } from 'sanity'

export const projet = defineType({
  name: 'projet',
  title: 'Projets',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Image principale',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bgImage',
      title: 'Image de fond (home)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'categories',
      title: 'Catégories',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'date', title: 'Date', type: 'date' }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'items',
      title: 'Informations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'infotitle', title: 'Titre info', type: 'string' },
            { name: 'infodetails', title: 'Détails info', type: 'string' },
          ],
        },
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galerie',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
  ],
  orderings: [
    {
      title: 'Date, récent',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
})
```

- [ ] **Créer apps/studio/schemas/aPropos.ts**

```typescript
import { defineType, defineField } from 'sanity'

export const aPropos = defineType({
  name: 'aPropos',
  title: 'À propos',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'title', title: 'Titre', type: 'string' }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'imgPrez',
      title: 'Photo de présentation',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'serviceH2', title: 'Titre section Services', type: 'string' }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'serviceTitle', title: 'Titre', type: 'string' },
            {
              name: 'serviceDesc',
              title: 'Description',
              type: 'array',
              of: [{ type: 'block' }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'imgFull',
      title: 'Image pleine largeur',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'parcoursH2', title: 'Titre section Parcours', type: 'string' }),
    defineField({
      name: 'parcours',
      title: 'Parcours',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'date', title: 'Date', type: 'string' },
            { name: 'status', title: 'Status', type: 'string' },
            { name: 'metier', title: 'Métier', type: 'string' },
          ],
        },
      ],
    }),
  ],
})
```

- [ ] **Créer apps/studio/schemas/settings.ts**

```typescript
import { defineType, defineField } from 'sanity'

export const settings = defineType({
  name: 'settings',
  title: 'Paramètres',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({ name: 'mail', title: 'Email de contact', type: 'string' }),
    defineField({ name: 'textLoader', title: 'Texte du loader', type: 'string' }),
  ],
})
```

- [ ] **Créer apps/studio/schemas/index.ts**

```typescript
import { projet } from './projet'
import { aPropos } from './aPropos'
import { settings } from './settings'

export const schemaTypes = [projet, aPropos, settings]
```

- [ ] **Créer apps/studio/sanity.config.ts**

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'gonzalex-studio',
  title: 'Gonzalex Studio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenu')
          .items([
            S.listItem()
              .title('Projets')
              .schemaType('projet')
              .child(S.documentTypeList('projet')),
            S.listItem()
              .title('À propos')
              .schemaType('aPropos')
              .child(
                S.document().schemaType('aPropos').documentId('aPropos')
              ),
            S.listItem()
              .title('Paramètres')
              .schemaType('settings')
              .child(
                S.document().schemaType('settings').documentId('settings')
              ),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
})
```

- [ ] **Créer apps/studio/sanity.cli.ts**

```typescript
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
})
```

- [ ] **Tester le Studio en local**

```bash
cd apps/studio
npm install
npm run dev
```

Expected: Studio accessible sur http://localhost:3333 avec les 3 sections (Projets, À propos, Paramètres).

- [ ] **Commit**

```bash
git add apps/studio
git commit -m "feat: add Sanity Studio with projet/aPropos/settings schemas"
git push
```

---

## Task 3 : Init Next.js + Sanity client + GROQ queries

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/lib/sanity.client.ts`
- Create: `apps/web/lib/queries.ts`
- Create: `apps/web/lib/urlFor.ts`

- [ ] **Init Next.js**

```bash
cd /Users/leoachard/Sites/portfolio_alex/gonzalex-next/apps
npx create-next-app@latest web --typescript --no-eslint --no-tailwind --src-dir=false --app --no-import-alias
```

- [ ] **Installer les dépendances**

```bash
cd web
npm install @sanity/client next-sanity @sanity/image-url @portabletext/react swiper imagesloaded sass date-fns
npm install --save-dev @types/node
```

- [ ] **Mettre à jour apps/web/next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
}

module.exports = nextConfig
```

- [ ] **Créer apps/web/lib/sanity.client.ts**

```typescript
import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
```

- [ ] **Créer apps/web/lib/queries.ts**

```typescript
import { groq } from 'next-sanity'

export const allProjectsQuery = groq`
  *[_type == "projet"] | order(date desc) {
    _id,
    title,
    slug,
    thumbnail,
    bgImage,
    categories,
    date
  }
`

export const allSlugsQuery = groq`
  *[_type == "projet"] { "slug": slug.current }
`

export const projectBySlugQuery = groq`
  *[_type == "projet" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    thumbnail,
    bgImage,
    categories,
    date,
    desc,
    items,
    gallery
  }
`

export const allProjectsForNextQuery = groq`
  *[_type == "projet"] | order(date desc) {
    _id,
    title,
    slug,
    thumbnail
  }
`

export const aProposQuery = groq`
  *[_type == "aPropos"][0] {
    title,
    desc,
    imgPrez,
    serviceH2,
    services,
    imgFull,
    parcoursH2,
    parcours
  }
`

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    mail,
    textLoader
  }
`
```

- [ ] **Créer apps/web/lib/urlFor.ts**

```typescript
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { client } from './sanity.client'

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
```

- [ ] **Créer apps/web/.env.local** (copier depuis .env.example et remplir)

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<id-sanity>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=<token-lecture-sanity>
REVALIDATE_SECRET=<chaine-aleatoire>
```

- [ ] **Vérifier que Next.js démarre**

```bash
npm run dev
```

Expected: http://localhost:3000 répond (page Next.js par défaut).

- [ ] **Commit**

```bash
git add apps/web
git commit -m "feat: init Next.js app with Sanity client and GROQ queries"
git push
```

---

## Task 4 : SCSS global + fonts + composants layout

**Files:**
- Create: `apps/web/styles/main.scss`
- Create: `apps/web/public/fonts/` (copier depuis WP)
- Create: `apps/web/components/Header.tsx`
- Create: `apps/web/components/Footer.tsx`
- Create: `apps/web/components/PortableText.tsx`
- Create: `apps/web/app/layout.tsx`

- [ ] **Copier les fonts depuis le thème WordPress**

```bash
cp -r /Users/leoachard/Sites/portfolio_alex/app/public/themes/gonzalex/static/fonts/* \
  /Users/leoachard/Sites/portfolio_alex/gonzalex-next/apps/web/public/fonts/
```

- [ ] **Copier les fichiers SCSS depuis le thème WordPress**

```bash
mkdir -p apps/web/styles
# Copier tout le dossier scss du thème WP
cp -r /Users/leoachard/Sites/portfolio_alex/app/resources/scss/* apps/web/styles/
```

- [ ] **Créer apps/web/styles/main.scss** (adapter les imports @use vers des chemins relatifs corrects pour Next.js)

```scss
@charset "UTF-8";

@use "base";
@use "components";
@use "layout";
@use "pages";
```

> Note : les sous-dossiers `base/`, `components/`, `layout/`, `pages/` ont été copiés depuis le thème WP. Leurs `_index.scss` font les imports internes — aucune modification nécessaire si les chemins relatifs sont préservés.

- [ ] **Créer apps/web/components/PortableText.tsx**

```typescript
'use client'

import { PortableText as SanityPortableText } from '@portabletext/react'
import type { TypedObject } from '@portabletext/types'

export function PortableText({ value }: { value: TypedObject[] }) {
  return <SanityPortableText value={value} />
}
```

- [ ] **Créer apps/web/components/Header.tsx**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header id="header" className={`header${isOpen ? ' header--is-open' : ''}`}>
      <div className="header__wrapper wrap">
        {/* Burger */}
        <div className="burger" onClick={() => setIsOpen(!isOpen)}>
          {!isOpen ? (
            <svg id="burger" xmlns="http://www.w3.org/2000/svg" width="33" height="33" fill="currentColor">
              <path fillRule="evenodd" d="m3 16.078 27-.002v2l-27 .002v-2ZM3 8h14.5v2H3V8ZM15.5 23H30v2H15.5v-2Z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg id="cross" xmlns="http://www.w3.org/2000/svg" width="33" height="33" fill="currentColor">
              <path stroke="#fff" strokeLinecap="round" strokeWidth="2" d="M9.193 27.578 27.577 9.192M27.578 27.576 9.192 9.192"/>
            </svg>
          )}
        </div>

        {/* Nav menu */}
        <ul className="nav-menu">
          <li className="nav-main-item">
            <Link href="/" className="nav-main-link bouton">Projets</Link>
          </li>
          <li className="nav-main-item">
            <Link href="/a-propos" className="nav-main-link bouton">À propos</Link>
          </li>
        </ul>

        {/* Logo (SVG inline depuis le thème WP) */}
        <div className="logo">
          <Link href="/" className="header__logo">
            <svg width="184" height="70" viewBox="0 0 184 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M63.175 55H60.525L67.125 37.5H70.7L77.3 55H74.675L73.05 50.825H64.75L63.175 55ZM68.9 39.7L65.525 48.65C67.625 48.65 69.075 48.625 70.15 48.75C71.2 48.85 72.25 49.3 72.975 50.575L68.9 39.7ZM78.7217 55V37.15H81.1717V55H78.7217ZM89.4459 55.15C85.7459 55.175 82.5959 53.075 82.5959 48.75C82.5959 44.425 85.7459 42.325 89.4459 42.35C93.1209 42.375 96.0959 44.425 96.0959 48.75C96.0959 49.1 96.0959 49.125 96.0459 49.45H85.1459C85.5209 51.925 87.1959 53.175 89.4959 53.15C91.4209 53.125 92.9459 52.525 93.6459 50.675L95.8959 50.975C94.9459 54 92.3959 55.125 89.4459 55.15ZM89.4959 44.275C87.2709 44.25 84.8959 45.95 85.1459 49.45C85.5209 48.1 86.1209 47.95 87.3209 47.95H93.7709C93.4209 45.4 91.7709 44.3 89.4959 44.275ZM100.896 48.7L96.0213 42.5H99.1463L102.246 46.425C102.421 46.65 102.496 46.975 102.496 47.275H102.546C102.546 46.975 102.646 46.65 102.821 46.425L105.896 42.5H108.996L104.146 48.7L108.996 55H105.921L102.796 50.975C102.621 50.75 102.546 50.4 102.546 50.125H102.496C102.496 50.4 102.396 50.75 102.221 50.975L99.1213 55H96.0213L100.896 48.7Z" fill="currentColor"/>
              <path d="M119.938 51.925C119.238 54.025 117.013 54.975 114.863 54.975C112.413 54.975 110.013 53.725 110.013 51.45C110.013 45.95 120.013 49.125 119.938 47.025C119.863 45.125 118.638 44.4 116.263 44.4C114.338 44.4 112.813 44.875 112.538 46.85L110.388 46.55C110.713 43.525 113.588 42.4 116.263 42.425C119.288 42.45 122.288 43.575 122.288 47.325V51.875C122.288 52.525 122.513 52.675 123.038 52.675H123.613V55H122.013C120.763 55 119.938 54.125 119.938 53.025V51.925ZM112.413 51.4C112.413 52.725 113.838 53.325 115.463 53.325C117.538 53.325 119.938 52.325 119.938 50.575V48.925C117.788 50.175 112.413 48.4 112.413 51.4ZM125.008 55V42.5H127.458V45.075C127.458 45.575 127.358 46.25 127.258 46.75L127.308 46.775C127.408 46.275 127.558 45.6 127.808 45.15C128.833 43.175 130.633 42.3 132.308 42.3C135.458 42.3 136.508 45.325 136.508 48.625V55H134.058V48.625C134.058 46.25 133.183 44.75 131.483 44.75C130.208 44.75 127.458 45.65 127.458 50.325V55H125.008ZM137.895 48.75C137.895 44.425 140.12 42.375 143.845 42.35C145.495 42.325 147.57 43.125 148.72 44.325C149.12 44.725 149.395 45.45 149.57 45.975H149.62C149.445 45.425 149.295 44.7 149.295 44.125V37.5H151.745V55H149.295V53.475C149.295 52.9 149.445 52.175 149.62 51.65L149.57 51.625C149.395 52.15 149.12 52.875 148.72 53.275C147.545 54.45 145.495 55.15 143.845 55.15C140.12 55.15 137.895 53.075 137.895 48.75ZM144.645 44.375C141.595 44.4 140.345 45.8 140.345 48.75C140.345 51.7 141.62 53.05 144.645 53.05C146.87 53.05 149.295 51.45 149.295 48.75C149.295 46.05 146.87 44.35 144.645 44.375ZM153.23 45.85C153.23 43.6 154.28 42.5 156.555 42.5H161.58V44.8L157.355 44.825C155.955 44.825 155.68 44.975 155.68 46.7V55H153.23V45.85ZM168.425 55.15C164.725 55.175 161.575 53.075 161.575 48.75C161.575 44.425 164.725 42.325 168.425 42.35C172.1 42.375 175.075 44.425 175.075 48.75C175.075 49.1 175.075 49.125 175.025 49.45H164.125C164.5 51.925 166.175 53.175 168.475 53.15C170.4 53.125 171.925 52.525 172.625 50.675L174.875 50.975C173.925 54 171.375 55.125 168.425 55.15ZM168.475 44.275C166.25 44.25 163.875 45.95 164.125 49.45C164.5 48.1 165.1 47.95 166.3 47.95H172.75C172.4 45.4 170.75 44.3 168.475 44.275Z" fill="currentColor" fillOpacity="0.4"/>
              <path d="M23.7456 30.839C21.7864 31.3711 19.5855 32.2419 17.3603 32.2419C12.4987 32.2419 9.54795 28.7348 9.54795 23.8733C9.54795 18.2619 13.563 13.6181 20.2385 13.6181C22.5362 13.6181 23.673 14.0534 25.1484 14.4646L25.5112 13.8599H25.7531C25.2452 15.94 25.0517 16.8107 24.8098 18.8666H24.5437C24.9791 15.553 23.0442 14.392 20.1901 14.392C14.7239 14.392 12.6439 20.0517 12.6439 24.4054C12.6439 28.7106 14.1918 31.4679 17.578 31.4679C18.5212 31.4679 19.4645 31.226 20.3352 30.7181L21.3995 24.5989C21.6413 23.1476 21.3027 22.6155 20.3352 22.6155H19.8999L19.9483 22.3737H20.3836C21.1576 22.3737 22.5604 22.5188 23.1893 22.5188C23.8181 22.5188 25.2693 22.3737 25.9949 22.3737H26.4303L26.3819 22.6155H25.9466C24.9791 22.6155 24.447 23.1476 24.2051 24.5989L23.3586 29.4846C23.2377 30.1618 23.3344 30.6455 23.7939 30.6455L23.7456 30.839Z" fill="currentColor"/>
            </svg>
          </Link>
        </div>

        {/* Réseaux sociaux — liens à adapter selon Alexandre */}
        <ul className="nav-rs">
          <li className="nav-rs-item">
            <a className="nav-rs-link bouton" target="_blank" rel="noreferrer" href="#">LinkedIn</a>
          </li>
          <li className="nav-rs-item">
            <a className="nav-rs-link bouton" target="_blank" rel="noreferrer" href="#">Instagram</a>
          </li>
        </ul>
      </div>
    </header>
  )
}
```

> Les liens LinkedIn/Instagram sont à remplacer par les vraies URLs d'Alexandre.

- [ ] **Créer apps/web/components/Footer.tsx**

```typescript
export function Footer() {
  return (
    <footer className="footer wrap">
      <p className="caption">© Copyright by Gonzalex - 2023 |</p>
      <a className="link caption" href="/mentions-legales" rel="nofollow">
        Mentions légales
      </a>
    </footer>
  )
}
```

- [ ] **Créer apps/web/app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import '../styles/main.scss'

export const metadata: Metadata = {
  title: 'Gonzalez Alexandre',
  description: 'Portfolio de Gonzalez Alexandre',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Commit**

```bash
git add apps/web/components apps/web/styles apps/web/app/layout.tsx apps/web/public/fonts
git commit -m "feat: add global SCSS, fonts, Header and Footer components"
git push
```

---

## Task 5 : Home page + composant HomeSlider (Swiper)

**Files:**
- Create: `apps/web/components/HomeSlider.tsx`
- Create: `apps/web/app/page.tsx`

- [ ] **Créer apps/web/components/HomeSlider.tsx**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import Link from 'next/link'
import { urlFor } from '@/lib/urlFor'

type Post = {
  _id: string
  title: string
  slug: { current: string }
  thumbnail: any
  bgImage: any
  categories: string[]
  date: string
}

export function HomeSlider({ posts }: { posts: Post[] }) {
  const swiperRef = useRef<Swiper | null>(null)
  const prevRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prevRef.current || !nextRef.current) return

    swiperRef.current = new Swiper('.swiper', {
      modules: [Navigation, Pagination],
      direction: 'vertical',
      centeredSlides: true,
      slidesPerView: 1.5,
      speed: 2000,
      spaceBetween: 40,
      pagination: {
        el: '.swiper-pagination',
        dynamicBullets: true,
      },
      navigation: {
        nextEl: nextRef.current,
        prevEl: prevRef.current,
      },
      breakpoints: {
        1025: {
          direction: 'horizontal',
          slidesPerView: 1.5,
          centeredSlides: true,
          spaceBetween: 0,
          allowTouchMove: false,
        },
      },
      on: {
        afterInit(swiper) {
          const slides = swiper.slides

          function showBG(id: number) {
            const bgImages = Array.from(
              document.querySelectorAll<HTMLImageElement>('.bg-container > img')
            )
            bgImages[id]?.style.setProperty('animation', 'fadeIn 0.5s ease-out forwards')
          }

          function hideBG(id: number) {
            const bgImages = Array.from(
              document.querySelectorAll<HTMLImageElement>('.bg-container > img')
            )
            bgImages[id]?.style.setProperty('animation', 'fadeOut 0.3s ease-out forwards')
          }

          slides.forEach((slide, index) => {
            const image = slide.querySelector('img')
            if (!image) return
            image.setAttribute('data-swiper-index', String(index))
            image.addEventListener('mouseover', () => {
              if (index === swiper.activeIndex) showBG(index)
            })
            image.addEventListener('mouseout', () => {
              if (index === swiper.activeIndex) hideBG(index)
            })
          })

          if (window.innerWidth >= 1024) {
            nextRef.current?.addEventListener('mouseover', () =>
              document.querySelector('.swiper')?.classList.add('next-is-hover')
            )
            nextRef.current?.addEventListener('mouseout', () =>
              document.querySelector('.swiper')?.classList.remove('next-is-hover')
            )
            prevRef.current?.addEventListener('mouseover', () =>
              document.querySelector('.swiper')?.classList.add('prev-is-hover')
            )
            prevRef.current?.addEventListener('mouseout', () =>
              document.querySelector('.swiper')?.classList.remove('prev-is-hover')
            )
          }
        },
      },
    })

    return () => {
      swiperRef.current?.destroy(true, true)
    }
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  return (
    <>
      {/* Background images */}
      <div className="bg-container">
        {posts.map((post) => (
          <img
            key={post._id}
            data-post-id={post._id}
            src={post.bgImage ? urlFor(post.bgImage).url() : ''}
            alt=""
          />
        ))}
      </div>

      {/* Swiper */}
      <div className="swiper swiper-container wrap">
        <div className="swiper-wrapper">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/projets/${post.slug.current}`}
              data-post-id={post._id}
              className="swiper-slide thePost"
            >
              <div className="thePost__img">
                <img
                  src={post.thumbnail ? urlFor(post.thumbnail).width(800).url() : ''}
                  alt={post.title}
                />
              </div>
              <div className="thePost__content">
                <h1 className="thePost__title">{post.title}</h1>
                <p className="thePost__terms">{post.categories?.join(', ')}</p>
                <p className="thePost__date">{post.date ? formatDate(post.date) : ''}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="swiper-pagination wrap" />

        <div className="swiper-button">
          <div ref={prevRef} className="swiper-button-prev">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37 43L26 32L37 21" stroke="white" strokeWidth="4"/>
            </svg>
          </div>
          <div ref={nextRef} className="swiper-button-next">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M27 21L38 32L27 43" stroke="white" strokeWidth="4"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Créer apps/web/app/page.tsx**

```typescript
import { client } from '@/lib/sanity.client'
import { allProjectsQuery, settingsQuery } from '@/lib/queries'
import { HomeSlider } from '@/components/HomeSlider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const revalidate = false

export default async function HomePage() {
  const [posts, settings] = await Promise.all([
    client.fetch(allProjectsQuery),
    client.fetch(settingsQuery),
  ])

  return (
    <div className="main-layout">
      <Header />

      {/* Loader */}
      <div className="loader">
        <h2>{settings?.textLoader ?? ''}</h2>
        <div className="textLoading">
          Loading
          <div className="lds-ellipsis">
            <div /><div /><div /><div />
          </div>
        </div>
      </div>

      <main className="main-layout__main">
        <HomeSlider posts={posts ?? []} />
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Vérifier en local** — lancer `npm run dev` dans `apps/web`, ouvrir http://localhost:3000

Expected: page home avec slider Swiper, loader, header et footer.

- [ ] **Commit**

```bash
git add apps/web/components/HomeSlider.tsx apps/web/app/page.tsx
git commit -m "feat: add home page with Swiper slider"
git push
```

---

## Task 6 : Page détail projet (/projets/[slug])

**Files:**
- Create: `apps/web/app/projets/[slug]/page.tsx`

- [ ] **Créer apps/web/app/projets/[slug]/page.tsx**

```typescript
import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity.client'
import { projectBySlugQuery, allSlugsQuery, allProjectsForNextQuery, settingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/urlFor'
import { PortableText } from '@/components/PortableText'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = false

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  return slugs.map((s) => ({ slug: s.slug }))
}

export default async function ProjetPage({ params }: { params: { slug: string } }) {
  const [post, allPosts, settings] = await Promise.all([
    client.fetch(projectBySlugQuery, { slug: params.slug }),
    client.fetch(allProjectsForNextQuery),
    client.fetch(settingsQuery),
  ])

  if (!post) notFound()

  const otherPosts = allPosts.filter((p: any) => p._id !== post._id)
  const nextPost = otherPosts[0] ?? null

  return (
    <div className="main-layout">
      <Header />

      <main>
        {/* Header projet */}
        <section className="projet-header wrap">
          <h1 className="projet-header__title">{post.title}</h1>
          {post.thumbnail && (
            <div className="projet-header__img">
              <Image
                src={urlFor(post.thumbnail).width(1200).url()}
                alt={post.title}
                width={post.thumbnail.asset?.metadata?.dimensions?.width ?? 1200}
                height={post.thumbnail.asset?.metadata?.dimensions?.height ?? 800}
              />
            </div>
          )}
        </section>

        {/* Contenu principal */}
        <section className="projet-main wrap">
          <div className="projet-content">
            {post.items?.map((item: any, i: number) => (
              <div key={i} className="content__info">
                <p className="text-small">{item.infotitle}</p>
                <p className="text-small details">{item.infodetails}</p>
              </div>
            ))}
            <div className="content-desc">
              {post.desc && <PortableText value={post.desc} />}
            </div>
          </div>

          {post.gallery?.map((img: any, i: number) => (
            <div key={i} className="projet__img">
              <img src={urlFor(img).width(1400).url()} alt="" />
            </div>
          ))}
        </section>

        {/* Projet suivant */}
        {nextPost && (
          <section className="post wrap">
            <p className="more-project">Plus de projet</p>
            <article className="the-post">
              <Link href={`/projets/${nextPost.slug.current}`}>
                <div className="the-post__image">
                  {nextPost.thumbnail && (
                    <img src={urlFor(nextPost.thumbnail).width(800).url()} alt={nextPost.title} />
                  )}
                </div>
                <section className="the-post__content">
                  <h2 className="the-post__title display-xl">{nextPost.title}</h2>
                </section>
              </Link>
            </article>
          </section>
        )}

        {/* Mail */}
        <section className="mail wrap">
          <a href={`mailto:${settings?.mail}`} className="display">
            {settings?.mail}
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Vérifier** — naviguer vers un projet depuis la home

Expected: page projet avec titre, image hero, infos, description, galerie, projet suivant, email.

- [ ] **Commit**

```bash
git add apps/web/app/projets
git commit -m "feat: add project detail page"
git push
```

---

## Task 7 : Page À propos (/a-propos)

**Files:**
- Create: `apps/web/app/a-propos/page.tsx`

- [ ] **Créer apps/web/app/a-propos/page.tsx**

```typescript
import { client } from '@/lib/sanity.client'
import { aProposQuery, settingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/urlFor'
import { PortableText } from '@/components/PortableText'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Image from 'next/image'

export const revalidate = false

export default async function AProposPage() {
  const [page, settings] = await Promise.all([
    client.fetch(aProposQuery),
    client.fetch(settingsQuery),
  ])

  return (
    <div className="main-layout">
      <Header />

      <main>
        {/* Header */}
        <section className="gonzalex-header wrap">
          <div className="gonzalex-header__wrapper">
            <div className="gonzalex-header__texts">
              <h1>{page?.title}</h1>
              <div className="header-text">
                {page?.desc && <PortableText value={page.desc} />}
              </div>
            </div>
            {page?.imgPrez && (
              <div className="gonzalex-header__img">
                <Image
                  src={urlFor(page.imgPrez).width(800).url()}
                  alt={page.title ?? ''}
                  width={600}
                  height={800}
                />
              </div>
            )}
          </div>
        </section>

        {/* Services */}
        <section className="services wrap">
          <h2>{page?.serviceH2}</h2>
          <div className="les-services">
            {page?.services?.map((service: any, i: number) => (
              <div key={i} className="service">
                <p className="caption">{service.serviceTitle}</p>
                <div className="service__text">
                  {service.serviceDesc && <PortableText value={service.serviceDesc} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Image pleine largeur */}
        {page?.imgFull && (
          <section className="img-full">
            <img src={urlFor(page.imgFull).width(1920).url()} alt="" />
          </section>
        )}

        {/* Parcours */}
        <section className="parcours wrap">
          <h2>{page?.parcoursH2}</h2>
          {page?.parcours?.map((p: any, i: number) => (
            <div key={i} className="parcour">
              <p className="text-small">{p.date}</p>
              <div className="metier">
                <p className="text-small">{p.status}</p>
                <p>{p.metier}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Mail */}
        <section className="mail wrap">
          <a href={`mailto:${settings?.mail}`} className="display">
            {settings?.mail}
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add apps/web/app/a-propos
git commit -m "feat: add a-propos page"
git push
```

---

## Task 8 : Mentions légales + 404 + webhook revalidation

**Files:**
- Create: `apps/web/app/mentions-legales/page.tsx`
- Create: `apps/web/app/not-found.tsx`
- Create: `apps/web/app/api/revalidate/route.ts`

- [ ] **Créer apps/web/app/mentions-legales/page.tsx**

```typescript
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function MentionsPage() {
  return (
    <div className="main-layout">
      <Header />
      <main className="wrap" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1>Mentions légales</h1>
        <p>Contenu des mentions légales à compléter par Alexandre.</p>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Créer apps/web/app/not-found.tsx**

```typescript
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="main-layout">
      <Header />
      <main className="wrap" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1>404</h1>
        <p>Cette page n'existe pas.</p>
        <Link href="/">← Retour à l'accueil</Link>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Créer apps/web/app/api/revalidate/route.ts**

```typescript
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const body = await request.json()
  const type = body._type as string | undefined

  if (type === 'projet') {
    const slug = body.slug?.current as string | undefined
    revalidatePath('/')
    if (slug) revalidatePath(`/projets/${slug}`)
  } else if (type === 'aPropos') {
    revalidatePath('/a-propos')
  } else if (type === 'settings') {
    revalidatePath('/')
    revalidatePath('/a-propos')
  } else {
    revalidatePath('/')
  }

  return NextResponse.json({ revalidated: true, type })
}
```

- [ ] **Commit**

```bash
git add apps/web/app/mentions-legales apps/web/app/not-found.tsx apps/web/app/api
git commit -m "feat: add mentions legales, 404 and revalidation webhook"
git push
```

---

## Task 9 : Migration — Export des données Hostinger

> Cette tâche se fait manuellement avec accès SSH à Hostinger.

- [ ] **Exporter la base de données depuis Hostinger via SSH**

```bash
# Se connecter à Hostinger
ssh user@<hostinger-ssh-host>

# Exporter la base WP
mysqldump -u <db_user> -p<db_password> <db_name> \
  wp_posts wp_postmeta wp_options wp_terms wp_term_relationships wp_term_taxonomy \
  > wordpress-backup.sql

exit

# Télécharger le dump en local
scp user@<hostinger-ssh-host>:wordpress-backup.sql \
  /Users/leoachard/Sites/portfolio_alex/gonzalex-next/scripts/wordpress-backup.sql
```

- [ ] **Télécharger les médias depuis Hostinger**

```bash
rsync -avz --progress \
  user@<hostinger-ssh-host>:/path/to/wordpress/wp-content/uploads/ \
  /Users/leoachard/Sites/portfolio_alex/gonzalex-next/scripts/uploads/
```

- [ ] **Importer le dump dans le MySQL local (Docker WP existant)**

```bash
# Le MySQL local tourne sur le port 3306 (docker du projet WP)
# Créer une nouvelle base pour ne pas écraser le WP local
docker exec -i portfolio-alex-mysql mysql \
  -u root -p<mot-de-passe-dans-.env> \
  -e "CREATE DATABASE IF NOT EXISTS gonzalex_migration;"

docker exec -i portfolio-alex-mysql mysql \
  -u root -p<mot-de-passe-dans-.env> gonzalex_migration \
  < scripts/wordpress-backup.sql
```

Expected: `wordpress-backup.sql` et dossier `uploads/` présents dans `scripts/`.

---

## Task 10 : Migration — Script migrate.js

**Files:**
- Create: `scripts/migrate.js`
- Create: `scripts/migrate.test.js`
- Create: `scripts/package.json`

- [ ] **Créer scripts/package.json**

```json
{
  "name": "scripts",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "migrate": "node migrate.js",
    "test": "node --test migrate.test.js"
  },
  "dependencies": {
    "@sanity/client": "^6.0.0",
    "mysql2": "^3.0.0",
    "phpunserialize": "^1.3.0"
  }
}
```

- [ ] **Écrire le test de parsing ACF** dans `scripts/migrate.test.js`

```javascript
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { parseRepeater, parseSerializedIds } = require('./migrate')

test('parseRepeater extrait les items ACF à partir du méta plat', () => {
  const metaMap = {
    items: '2',
    items_0_infotitle: 'Client',
    items_0_infodetails: 'Nike',
    items_1_infotitle: 'Date',
    items_1_infodetails: '2023',
  }
  const result = parseRepeater(metaMap, 'items', ['infotitle', 'infodetails'])
  assert.deepEqual(result, [
    { infotitle: 'Client', infodetails: 'Nike' },
    { infotitle: 'Date', infodetails: '2023' },
  ])
})

test('parseRepeater retourne [] si le champ est absent', () => {
  const result = parseRepeater({}, 'items', ['infotitle', 'infodetails'])
  assert.deepEqual(result, [])
})

test('parseSerializedIds parse un tableau PHP sérialisé d\'IDs', () => {
  const phpSerialized = 'a:2:{i:0;s:2:"42";i:1;s:2:"43";}'
  const result = parseSerializedIds(phpSerialized)
  assert.deepEqual(result, ['42', '43'])
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
cd scripts && npm install && npm test
```

Expected: FAIL — `parseRepeater` et `parseSerializedIds` non définies.

- [ ] **Créer scripts/migrate.js**

```javascript
'use strict'

const mysql = require('mysql2/promise')
const { createClient } = require('@sanity/client')
const phpunserialize = require('phpunserialize')
const fs = require('fs')
const path = require('path')

// ─── Helpers (exportés pour les tests) ───────────────────────────────────────

function parseRepeater(metaMap, prefix, fields) {
  const count = parseInt(metaMap[prefix] ?? '0', 10)
  if (!count || isNaN(count)) return []
  const items = []
  for (let i = 0; i < count; i++) {
    const obj = {}
    for (const field of fields) {
      obj[field] = metaMap[`${prefix}_${i}_${field}`] ?? ''
    }
    items.push(obj)
  }
  return items
}

function parseSerializedIds(value) {
  if (!value || value === '') return []
  try {
    const parsed = phpunserialize(value)
    if (Array.isArray(parsed)) return parsed.map(String)
    if (typeof parsed === 'object') return Object.values(parsed).map(String)
    return []
  } catch {
    return []
  }
}

module.exports = { parseRepeater, parseSerializedIds }

// ─── Migration principale ─────────────────────────────────────────────────────

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'gonzalex_migration',
  })

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  console.log('🔌 Connected to MySQL and Sanity')

  // ── 1. Options globales (mail, textLoader) ──────────────────────────────────
  const [optionsRows] = await db.query(
    "SELECT option_name, option_value FROM wp_options WHERE option_name IN ('options_mail', 'options_textLoader')"
  )
  const optionsMap = Object.fromEntries(
    optionsRows.map((r) => [r.option_name, r.option_value])
  )

  await sanity.createOrReplace({
    _id: 'settings',
    _type: 'settings',
    mail: optionsMap['options_mail'] ?? '',
    textLoader: optionsMap['options_textLoader'] ?? '',
  })
  console.log('✅ Settings migrated')

  // ── 2. Page gonzalex (aPropos) ──────────────────────────────────────────────
  const [gonzalexRows] = await db.query(
    "SELECT ID FROM wp_posts WHERE post_type = 'page' AND post_status = 'publish' AND post_name = 'gonzalex' LIMIT 1"
  )
  if (gonzalexRows.length > 0) {
    const gonzalexId = gonzalexRows[0].ID
    const gonzalexMeta = await getMetaMap(db, gonzalexId)

    const aProposDoc = {
      _id: 'aPropos',
      _type: 'aPropos',
      title: gonzalexMeta['title'] ?? '',
      imgPrez: gonzalexMeta['img__prez']
        ? await uploadImageById(sanity, gonzalexMeta['img__prez'], db)
        : undefined,
      serviceH2: gonzalexMeta['service_h2'] ?? '',
      services: parseRepeater(gonzalexMeta, 'services', ['service__title', 'service__desc']).map((s) => ({
        serviceTitle: s['service__title'],
        serviceDesc: textToPortableText(s['service__desc']),
      })),
      imgFull: gonzalexMeta['img-full']
        ? await uploadImageById(sanity, gonzalexMeta['img-full'], db)
        : undefined,
      parcoursH2: gonzalexMeta['parcours_h2'] ?? '',
      parcours: parseRepeater(gonzalexMeta, 'parcours', ['date', 'status', 'metier']),
      desc: textToPortableText(gonzalexMeta['desc'] ?? ''),
    }

    await sanity.createOrReplace(aProposDoc)
    console.log('✅ aPropos migrated')
  }

  // ── 3. Projets (posts) ──────────────────────────────────────────────────────
  const [posts] = await db.query(
    "SELECT ID, post_title, post_name, post_date FROM wp_posts WHERE post_type = 'post' AND post_status = 'publish'"
  )

  for (const post of posts) {
    const metaMap = await getMetaMap(db, post.ID)

    const [catRows] = await db.query(
      `SELECT t.name FROM wp_terms t
       JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
       JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
       WHERE tr.object_id = ? AND tt.taxonomy = 'category' AND t.name != 'Uncategorized'`,
      [post.ID]
    )
    const categories = catRows.map((r) => r.name)

    // Upload thumbnail
    const thumbnailId = metaMap['_thumbnail_id']
    let thumbnail
    if (thumbnailId) {
      thumbnail = await uploadImageById(sanity, thumbnailId, db)
    }

    // Upload bgImage
    let bgImage
    if (metaMap['bgImage']) {
      bgImage = await uploadImageById(sanity, metaMap['bgImage'], db)
    }

    // Upload gallery
    const galleryIds = parseSerializedIds(metaMap['gallery'] ?? '')
    const gallery = []
    for (const imgId of galleryIds) {
      const img = await uploadImageById(sanity, imgId, db)
      if (img) gallery.push(img)
    }

    const doc = {
      _id: `projet-${post.ID}`,
      _type: 'projet',
      title: post.post_title,
      slug: { _type: 'slug', current: post.post_name },
      date: post.post_date?.toString().split(' ')[0] ?? undefined,
      categories,
      thumbnail,
      bgImage,
      desc: textToPortableText(metaMap['desc'] ?? ''),
      items: parseRepeater(metaMap, 'items', ['infotitle', 'infodetails']),
      gallery,
    }

    await sanity.createOrReplace(doc)
    console.log(`✅ Projet "${post.post_title}" migrated`)
  }

  await db.end()
  console.log('🎉 Migration complete')
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

async function getMetaMap(db, postId) {
  const [rows] = await db.query(
    'SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?',
    [postId]
  )
  return Object.fromEntries(rows.map((r) => [r.meta_key, r.meta_value]))
}

async function uploadImageById(sanity, attachmentId, db) {
  // Récupérer le chemin du fichier depuis wp_postmeta (_wp_attached_file)
  if (!db) return undefined
  const [rows] = await db.query(
    "SELECT meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key = '_wp_attached_file' LIMIT 1",
    [attachmentId]
  )
  if (!rows.length) return undefined

  const relPath = rows[0].meta_value
  const fullPath = path.join(__dirname, 'uploads', relPath)

  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️  Image not found locally: ${fullPath}`)
    return undefined
  }

  const asset = await sanity.assets.upload('image', fs.createReadStream(fullPath), {
    filename: path.basename(fullPath),
  })

  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}

function textToPortableText(text) {
  if (!text) return []
  // Convertit du texte brut (ou HTML simple) en Portable Text minimal
  const paragraphs = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .filter((p) => p.trim())

  return paragraphs.map((p) => ({
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: p.trim() }],
    markDefs: [],
  }))
}
```

- [ ] **Relancer les tests pour vérifier qu'ils passent**

```bash
npm test
```

Expected: 3 tests PASS.

- [ ] **Lancer la migration** (vérifier que .env.local est chargé)

```bash
cd /Users/leoachard/Sites/portfolio_alex/gonzalex-next/scripts
npm install
# Copier les variables depuis .env.local du projet web
NEXT_PUBLIC_SANITY_PROJECT_ID=xxx NEXT_PUBLIC_SANITY_DATASET=production \
SANITY_API_TOKEN=xxx DB_USER=root DB_PASSWORD=xxx DB_NAME=gonzalex_migration \
node migrate.js
```

Expected: tous les projets, la page aPropos et les settings migrés dans Sanity. Vérifier dans le Studio.

- [ ] **Commit**

```bash
git add scripts
git commit -m "feat: add WordPress to Sanity migration script with tests"
git push
```

---

## Task 11 : Déploiement Vercel

- [ ] **Déployer le Studio sur Vercel**

```bash
cd /Users/leoachard/Sites/portfolio_alex/gonzalex-next
npx vercel --cwd apps/studio
# Suivre le wizard : nouveau projet, nom "gonzalex-studio"
# Variables d'env à ajouter dans le dashboard Vercel :
#   SANITY_STUDIO_PROJECT_ID=<id>
#   SANITY_STUDIO_DATASET=production
```

Expected: Studio accessible sur `gonzalex-studio.vercel.app`.

- [ ] **Déployer le frontend sur Vercel**

```bash
npx vercel --cwd apps/web
# Nouveau projet, nom "gonzalex-web"
# Variables d'env à ajouter dans le dashboard Vercel :
#   NEXT_PUBLIC_SANITY_PROJECT_ID=<id>
#   NEXT_PUBLIC_SANITY_DATASET=production
#   SANITY_API_TOKEN=<token-lecture>
#   REVALIDATE_SECRET=<chaine-aleatoire>
```

Expected: site accessible sur `gonzalex-web.vercel.app`.

- [ ] **Configurer le webhook Sanity → Vercel**

Dans https://sanity.io/manage → projet → API → Webhooks → Create webhook :
- Name : `Revalidate Vercel`
- URL : `https://gonzalex-web.vercel.app/api/revalidate?secret=<REVALIDATE_SECRET>`
- Trigger on : Create, Update, Delete
- Projections : `{_type, slug}`

- [ ] **Tester le webhook**

Dans le Studio, modifier le titre d'un projet et publier.
Expected: la home se met à jour sur `gonzalex-web.vercel.app` en moins de 5 secondes.

- [ ] **Commit final**

```bash
git add .
git commit -m "chore: finalize deployment configuration"
git push
```

---

## Checklist de vérification finale

- [ ] Home : slider Swiper vertical/horizontal, loader, bg images hover
- [ ] Projet : titre, image hero, infos clé-valeur, description, galerie, projet suivant, email
- [ ] À propos : titre, texte, photo, services, image pleine largeur, parcours, email
- [ ] Mentions légales : page affichée
- [ ] 404 : page affichée sur mauvaise URL
- [ ] Revalidation : modifier dans Studio → changement visible sur le site en < 5s
- [ ] Fonts : PowerGrotesk, Vegawanty, Roboto chargées
- [ ] Responsive : mobile burger menu fonctionnel
