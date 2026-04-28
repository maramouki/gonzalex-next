import {defineType, defineField} from 'sanity'
import {UserIcon, CaseIcon} from '@sanity/icons'

export const aPropos = defineType({
  name: 'aPropos',
  title: 'À propos',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Titre principal',
      type: 'string',
      description: 'Ex : Alexandre Gonzalez, Photographe Professionnel à Grenoble.',
    }),
    defineField({
      name: 'desc',
      title: 'Texte de présentation',
      type: 'array',
      description: 'Paragraphes affichés à gauche de la photo de présentation.',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'imgPrez',
      title: 'Photo de présentation',
      type: 'image',
      description: 'Portrait ou photo représentative. Format recommandé : 3:4 (portrait).',
      options: {hotspot: true},
    }),
    defineField({
      name: 'serviceH2',
      title: 'Titre de la section Services',
      type: 'string',
      description: 'Ex : Mes services.',
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      description: 'Maximum recommandé : 3 services pour garder une mise en page équilibrée.',
      of: [
        {
          type: 'object',
          icon: CaseIcon,
          preview: {
            select: {title: 'serviceTitle'},
            prepare({title}) {
              return {title: title ?? 'Service sans titre'}
            },
          },
          fields: [
            {
              name: 'serviceTitle',
              title: 'Nom du service',
              type: 'string',
              description: 'Ex : Portrait, Événement, Corporate.',
            },
            {
              name: 'serviceDesc',
              title: 'Description',
              type: 'array',
              of: [{type: 'block'}],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'imgFull',
      title: 'Image pleine largeur',
      type: 'image',
      description: 'Image décorative affichée sur toute la largeur entre les services et le parcours. Format recommandé : paysage (16:9).',
      options: {hotspot: true},
    }),
    defineField({
      name: 'parcoursH2',
      title: 'Titre de la section Parcours',
      type: 'string',
      description: 'Ex : Mon parcours.',
    }),
    defineField({
      name: 'parcours',
      title: 'Parcours',
      type: 'array',
      description: 'Affiché du plus récent au plus ancien. Glissez-déposez pour réordonner.',
      of: [
        {
          type: 'object',
          preview: {
            select: {title: 'metier', subtitle: 'date'},
          },
          fields: [
            {
              name: 'date',
              title: 'Période',
              type: 'string',
              description: 'Ex : 2022 — aujourd\'hui ou Août 2019.',
            },
            {
              name: 'status',
              title: 'Type',
              type: 'string',
              description: 'Ex : Freelance, Formation, CDI.',
            },
            {
              name: 'metier',
              title: 'Intitulé',
              type: 'string',
              description: 'Ex : Photographe professionnel.',
            },
          ],
        },
      ],
    }),
  ],
})
