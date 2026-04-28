import {defineType, defineField} from 'sanity'
import {CogIcon} from '@sanity/icons'

export const settings = defineType({
  name: 'settings',
  title: 'Paramètres du site',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'mail',
      title: 'Email de contact',
      type: 'string',
      description: 'Affiché comme bouton de contact sur toutes les pages. Ex : contact@gonzalex.fr',
      validation: (r) =>
        r.custom((val) => {
          if (!val) return true
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? true : 'Format email invalide'
        }),
    }),
    defineField({
      name: 'textLoader',
      title: 'Texte du loader',
      type: 'string',
      description: 'Texte affiché sous le spinner au chargement de la home. Ex : Chargement en cours…',
    }),
  ],
})
