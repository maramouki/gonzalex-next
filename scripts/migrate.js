'use strict'

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// ---------------------------------------------------------------------------
// Helpers (exported for tests)
// ---------------------------------------------------------------------------

/**
 * Parse an ACF repeater field from a flat meta map.
 * @param {Object} metaMap - flat key→value map of all post meta
 * @param {string} prefix  - repeater field name (e.g. 'items', 'services')
 * @param {string[]} fields - sub-field names (e.g. ['infotitle', 'infodetails'])
 * @returns {Object[]}
 */
function parseRepeater(metaMap, prefix, fields) {
  const count = parseInt(metaMap[prefix], 10)
  if (!count || isNaN(count)) return []

  const result = []
  for (let i = 0; i < count; i++) {
    const item = { _key: crypto.randomBytes(6).toString('hex') }
    for (const field of fields) {
      item[field] = metaMap[`${prefix}_${i}_${field}`] ?? ''
    }
    result.push(item)
  }
  return result
}

/**
 * Parse a PHP-serialized array of IDs (as produced by ACF gallery fields).
 * @param {string} serialized - PHP serialized string
 * @returns {string[]}
 */
function parseSerializedIds(serialized) {
  if (!serialized) return []
  try {
    const phpunserialize = require('phpunserialize')
    const parsed = phpunserialize(serialized)
    if (Array.isArray(parsed)) return parsed.map(String)
    if (parsed && typeof parsed === 'object') return Object.values(parsed).map(String)
    return []
  } catch (e) {
    return []
  }
}

/**
 * Convert plain text (with \n line breaks and possible HTML tags) to
 * Portable Text blocks.
 * @param {string} text
 * @returns {Object[]}
 */
function textToPortableText(text) {
  if (!text) return []
  // Strip HTML tags
  const plain = text.replace(/<[^>]+>/g, '')
  return plain
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({
      _type: 'block',
      _key: crypto.randomBytes(6).toString('hex'),
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: crypto.randomBytes(6).toString('hex'),
          text: line,
          marks: [],
        },
      ],
    }))
}

/**
 * Get all post meta for a given post ID as a flat key→value map.
 * When a key appears multiple times only the last value is kept
 * (ACF stores single-value metas once).
 * @param {import('mysql2/promise').Connection} db
 * @param {number} postId
 * @returns {Promise<Object>}
 */
async function getMetaMap(db, postId) {
  const [rows] = await db.execute(
    'SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?',
    [postId]
  )
  return Object.fromEntries(rows.map((r) => [r.meta_key, r.meta_value]))
}

/**
 * Upload a WordPress attachment to Sanity by its attachment post ID.
 * @param {import('@sanity/client').SanityClient} sanity
 * @param {string|number} attachmentId
 * @param {import('mysql2/promise').Connection} db
 * @returns {Promise<Object|null>} Sanity image reference object
 */
async function uploadImageById(sanity, attachmentId, db) {
  if (!attachmentId) return null
  const [rows] = await db.execute(
    "SELECT meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key = '_wp_attached_file' LIMIT 1",
    [attachmentId]
  )
  if (!rows.length) {
    console.warn(`  [warn] No _wp_attached_file for attachment ID ${attachmentId}`)
    return null
  }
  const relPath = rows[0].meta_value
  const fullPath = path.join(__dirname, 'uploads', relPath)
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [warn] File not found on disk: ${fullPath}`)
    return null
  }
  const filename = path.basename(fullPath)
  console.log(`  [upload] ${filename} (attachment ${attachmentId})`)
  const asset = await sanity.assets.upload('image', fs.createReadStream(fullPath), { filename })
  return {
    _type: 'image',
    _key: crypto.randomBytes(6).toString('hex'),
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  }
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

async function main() {
  const mysql = require('mysql2/promise')
  const { createClient } = require('@sanity/client')

  // --- DB connection ---
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  console.log('[db] Connected to MySQL')

  // --- Sanity client ---
  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
  console.log('[sanity] Client ready')

  try {
    // -----------------------------------------------------------------------
    // 1. Settings
    // -----------------------------------------------------------------------
    console.log('\n[1/3] Migrating settings…')
    const [optionRows] = await db.execute(
      "SELECT option_name, option_value FROM wp_options WHERE option_name IN ('options_mail', 'options_textLoader')"
    )
    const options = Object.fromEntries(optionRows.map((r) => [r.option_name, r.option_value]))

    await sanity.createOrReplace({
      _id: 'settings',
      _type: 'settings',
      mail: options['options_mail'] ?? '',
      textLoader: options['options_textLoader'] ?? '',
    })
    console.log('  [ok] settings upserted')

    // -----------------------------------------------------------------------
    // 2. aPropos
    // -----------------------------------------------------------------------
    console.log('\n[2/3] Migrating aPropos…')
    const [aProposRows] = await db.execute(
      "SELECT ID FROM wp_posts WHERE post_type = 'page' AND post_name = 'gonzalex' AND post_status = 'publish' LIMIT 1"
    )
    if (!aProposRows.length) throw new Error('aPropos page not found (post_name=gonzalex)')
    const aProposId = aProposRows[0].ID
    console.log(`  [db] aPropos page ID: ${aProposId}`)

    const aMeta = await getMetaMap(db, aProposId)

    // Images
    const imgPrez = await uploadImageById(sanity, aMeta['img__prez'], db)
    const imgFull = await uploadImageById(sanity, aMeta['img-full'], db)

    // Services repeater — fields use double underscore in ACF keys
    const rawServices = parseRepeater(aMeta, 'services', ['service__title', 'service__desc'])
    const services = rawServices.map((s) => ({
      serviceTitle: s['service__title'] ?? '',
      serviceDesc: textToPortableText(s['service__desc']),
    }))

    // Parcours repeater
    const parcours = parseRepeater(aMeta, 'parcours', ['date', 'status', 'metier'])

    await sanity.createOrReplace({
      _id: 'aPropos',
      _type: 'aPropos',
      title: aMeta['title'] ?? '',
      desc: textToPortableText(aMeta['desc']),
      imgPrez: imgPrez,
      serviceH2: aMeta['service_h2'] ?? '',
      services,
      imgFull: imgFull,
      parcoursH2: aMeta['parcours_h2'] ?? '',
      parcours,
    })
    console.log('  [ok] aPropos upserted')

    // -----------------------------------------------------------------------
    // 3. Projects
    // -----------------------------------------------------------------------
    console.log('\n[3/3] Migrating projects…')
    const [posts] = await db.execute(
      "SELECT ID, post_name, post_date FROM wp_posts WHERE post_type = 'post' AND post_status = 'publish' ORDER BY post_date DESC"
    )
    console.log(`  [db] Found ${posts.length} projects`)

    for (const post of posts) {
      console.log(`\n  [project] ID=${post.ID} slug=${post.post_name}`)
      const meta = await getMetaMap(db, post.ID)

      // Categories (exclude Uncategorized)
      const [catRows] = await db.execute(
        `SELECT t.name, t.slug
         FROM wp_term_relationships tr
         JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
         JOIN wp_terms t ON tt.term_id = t.term_id
         WHERE tr.object_id = ?
           AND tt.taxonomy = 'category'
           AND t.slug != 'uncategorized'`,
        [post.ID]
      )
      const categories = catRows.map((c) => ({ name: c.name, slug: c.slug }))

      // Images
      const thumbnail = await uploadImageById(sanity, meta['_thumbnail_id'], db)
      const bgImage = await uploadImageById(sanity, meta['bgImage'], db)

      // Gallery
      const galleryIds = parseSerializedIds(meta['gallery'])
      const gallery = []
      for (const gid of galleryIds) {
        const img = await uploadImageById(sanity, gid, db)
        if (img) gallery.push(img)
      }

      // Items repeater
      const items = parseRepeater(meta, 'items', ['infotitle', 'infodetails'])

      // Date — take only the date part (before the space)
      const date = post.post_date ? String(post.post_date).split(' ')[0] : ''

      await sanity.createOrReplace({
        _id: `projet-${post.ID}`,
        _type: 'projet',
        slug: { _type: 'slug', current: post.post_name },
        date,
        thumbnail,
        bgImage,
        gallery,
        desc: textToPortableText(meta['desc']),
        items,
        categories,
      })
      console.log(`  [ok] projet-${post.ID} upserted`)
    }

    console.log('\n[done] Migration complete.')
  } finally {
    await db.end()
    console.log('[db] Connection closed')
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = { parseRepeater, parseSerializedIds, textToPortableText, getMetaMap }

if (require.main === module) {
  main().catch((err) => {
    console.error('[fatal]', err)
    process.exit(1)
  })
}
