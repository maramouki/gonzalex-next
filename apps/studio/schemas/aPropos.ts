import {defineType, defineField} from 'sanity'

export const aPropos = defineType({
  name: 'aPropos',
  title: 'À propos',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titre', type: 'string'}),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'imgPrez',
      title: 'Photo de présentation',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'serviceH2', title: 'Titre section Services', type: 'string'}),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'serviceTitle', title: 'Titre', type: 'string'},
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
      options: {hotspot: true},
    }),
    defineField({name: 'parcoursH2', title: 'Titre section Parcours', type: 'string'}),
    defineField({
      name: 'parcours',
      title: 'Parcours',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'date', title: 'Date', type: 'string'},
            {name: 'status', title: 'Status', type: 'string'},
            {name: 'metier', title: 'Métier', type: 'string'},
          ],
        },
      ],
    }),
  ],
})
