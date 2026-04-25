import { createClient } from '@sanity/client'

export const PROJECT_ID = '17r65wio'
export const DATASET = 'production'

export const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  useCdn: true,
})
