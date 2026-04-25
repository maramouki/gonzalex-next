const { test } = require('node:test')
const assert = require('node:assert/strict')
const { parseRepeater, parseSerializedIds } = require('./migrate')

test('parseRepeater extrait les items ACF à partir du méta plat', () => {
  const metaMap = {
    items: '2',
    items_0_infotitle: 'Client',
    items_0_infodetails: 'Nike',
    items_1_infotitle: 'Date',
    items_1_infodetails: '2023',
  }
  const result = parseRepeater(metaMap, 'items', ['infotitle', 'infodetails'])
  assert.deepEqual(result, [
    { infotitle: 'Client', infodetails: 'Nike' },
    { infotitle: 'Date', infodetails: '2023' },
  ])
})

test('parseRepeater retourne [] si le champ est absent', () => {
  const result = parseRepeater({}, 'items', ['infotitle', 'infodetails'])
  assert.deepEqual(result, [])
})

test('parseSerializedIds parse un tableau PHP sérialisé d\'IDs', () => {
  const phpSerialized = 'a:2:{i:0;s:2:"42";i:1;s:2:"43";}'
  const result = parseSerializedIds(phpSerialized)
  assert.deepEqual(result, ['42', '43'])
})
