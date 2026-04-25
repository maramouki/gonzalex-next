import {defineType, defineField} from 'sanity'

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
      options: {source: 'title'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Image principale',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'bgImage',
      title: 'Image de fond (home)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'categories',
      title: 'Catégories',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({name: 'date', title: 'Date', type: 'date'}),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'items',
      title: 'Informations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'infotitle', title: 'Titre info', type: 'string'},
            {name: 'infodetails', title: 'Détails info', type: 'string'},
          ],
        },
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galerie',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
  ],
  orderings: [
    {
      title: 'Date, récent',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}],
    },
  ],
})
