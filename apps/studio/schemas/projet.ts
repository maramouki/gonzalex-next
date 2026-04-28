import {defineType, defineField} from 'sanity'
import {ImagesIcon, TagIcon, CalendarIcon, InfoOutlineIcon} from '@sanity/icons'

export const projet = defineType({
  name: 'projet',
  title: 'Projets',
  type: 'document',
  icon: ImagesIcon,
  preview: {
    select: {
      title: 'title',
      subtitle: 'date',
      media: 'thumbnail',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title ?? 'Sans titre',
        subtitle: subtitle
          ? new Date(subtitle).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})
          : 'Pas de date',
        media,
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Titre du projet',
      type: 'string',
      description: 'Nom affiché sur la home et sur la page du projet.',
      validation: (r) => r.required().min(2).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'Généré automatiquement depuis le titre. Évitez de le modifier après publication.',
      options: {source: 'title', maxLength: 96},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date du projet',
      type: 'date',
      description: 'Utilisée pour trier les projets. Format : AAAA-MM-JJ.',
      options: {dateFormat: 'DD/MM/YYYY'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Catégories',
      type: 'array',
      description: 'Ex : Portrait, Événement, Corporate…',
      icon: TagIcon,
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'thumbnail',
      title: 'Image principale',
      type: 'image',
      description: 'Image affichée dans le slider de la home et sur la page projet. Format recommandé : 3:4 ou carré.',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'bgImage',
      title: 'Image de fond (home)',
      type: 'image',
      description: 'Apparaît en arrière-plan flouté sur la home quand le projet est actif. Peut être la même que l\'image principale ou une version plus large/paysage.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'desc',
      title: 'Description du projet',
      type: 'array',
      description: 'Texte affiché dans la colonne gauche de la page projet.',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'items',
      title: 'Informations techniques',
      type: 'array',
      icon: InfoOutlineIcon,
      description: 'Paires clé/valeur affichées dans l\'en-tête du projet. Ex : Appareil → Canon R5, Lieu → Grenoble.',
      of: [
        {
          type: 'object',
          preview: {
            select: {title: 'infotitle', subtitle: 'infodetails'},
          },
          fields: [
            {
              name: 'infotitle',
              title: 'Clé',
              type: 'string',
              description: 'Ex : Appareil, Lieu, Durée…',
            },
            {
              name: 'infodetails',
              title: 'Valeur',
              type: 'string',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galerie',
      type: 'array',
      description: 'Images de la galerie. Glissez-déposez pour réordonner. Les 5 premières positions correspondent aux zones de mise en page du projet.',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      options: {layout: 'grid'},
    }),
  ],
  orderings: [
    {
      title: 'Date, récent en premier',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}],
    },
    {
      title: 'Titre A→Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
})
