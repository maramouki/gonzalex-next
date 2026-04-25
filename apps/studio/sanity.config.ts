import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'gonzalex-studio',
  title: 'Gonzalex Studio',
  projectId: '17r65wio',
  dataset: 'production',
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
  schema: {
    types: schemaTypes,
  },
})
