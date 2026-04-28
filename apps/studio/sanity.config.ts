import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {ImagesIcon, UserIcon, CogIcon} from '@sanity/icons'
import {schemaTypes} from './schemas'

const PREVIEW_URL = process.env.SANITY_STUDIO_PREVIEW_URL ?? 'http://localhost:3000'

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
              .icon(ImagesIcon)
              .schemaType('projet')
              .child(S.documentTypeList('projet').title('Projets').defaultOrdering([{field: 'date', direction: 'desc'}])),
            S.divider(),
            S.listItem()
              .title('À propos')
              .icon(UserIcon)
              .schemaType('aPropos')
              .child(
                S.document().schemaType('aPropos').documentId('aPropos').title('À propos')
              ),
            S.listItem()
              .title('Paramètres du site')
              .icon(CogIcon)
              .schemaType('settings')
              .child(
                S.document().schemaType('settings').documentId('settings').title('Paramètres du site')
              ),
          ]),
    }),
    presentationTool({
      title: 'Prévisualisation',
      previewUrl: {
        origin: PREVIEW_URL,
        previewMode: {
          enable: '/api/draft',
          disable: '/api/draft?disable=true',
        },
      },
    }),
    visionTool({defaultDataset: 'production'}),
  ],
  schema: {
    types: schemaTypes,
  },
})
