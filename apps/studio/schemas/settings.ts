import {defineType, defineField} from 'sanity'

export const settings = defineType({
  name: 'settings',
  title: 'Paramètres',
  type: 'document',
  fields: [
    defineField({name: 'mail', title: 'Email de contact', type: 'string'}),
    defineField({name: 'textLoader', title: 'Texte du loader', type: 'string'}),
  ],
})
