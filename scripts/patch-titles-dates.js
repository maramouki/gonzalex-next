'use strict'

const { createClient } = require('@sanity/client')

const sanity = createClient({
  projectId: '17r65wio',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const patches = [
  { id: 'projet-209', title: 'PimientaCom',          date: '2024-06-06' },
  { id: 'projet-292', title: 'William et Silco',      date: '2023-11-07' },
  { id: 'projet-244', title: 'Eva Manceau',           date: '2023-07-03' },
  { id: 'projet-73',  title: 'Arthur Lafumas',        date: '2023-04-01' },
  { id: 'projet-281', title: 'Baptême de Kezio',      date: '2022-04-17' },
  { id: 'projet-267', title: 'Alysson et Raïka',      date: '2022-02-20' },
  { id: 'projet-158', title: 'Prescyllia Verchere',   date: '2020-05-16' },
  { id: 'projet-224', title: 'Alysson et Mathis',     date: '2020-02-02' },
]

async function main() {
  // First list existing IDs
  const existing = await sanity.fetch('*[_type == "projet"]{ _id, title, slug }')
  console.log('Existing in Sanity:', existing.map(d => d._id))

  for (const p of patches) {
    try {
      // Use createOrReplace to handle both existing and missing docs
      const current = existing.find(d => d._id === p.id)
      if (current) {
        await sanity.patch(p.id).set({ title: p.title, date: p.date }).commit()
        console.log(`[patch] ${p.id} → "${p.title}" (${p.date})`)
      } else {
        console.log(`[skip] ${p.id} not found in Sanity (slug doesn't match) - needs migration re-run`)
      }
    } catch(e) {
      console.error(`[error] ${p.id}: ${e.message}`)
    }
  }
  console.log('[done]')
}

main().catch((err) => { console.error(err); process.exit(1) })
