import {randomUUID} from 'node:crypto'
import type {SanityClient} from '@sanity/client'

const BATCH_SIZE = 80

export type UpsertDoc = {
  _type: string
  /** Natural key for in-memory idempotency maps (also stored as importKey on the doc). */
  _key: string
  doc: Record<string, unknown>
}

/**
 * Idempotent create-or-patch using an in-memory map of existing natural-key → _id.
 * New documents get a random `_id` assigned here: transaction results are not returned in
 * mutation order, so mapping server-generated ids back to keys by index scrambles references.
 */
export async function upsertBatch(
  client: SanityClient | null,
  existing: Map<string, string>,
  items: UpsertDoc[],
  dryRun: boolean,
): Promise<{created: number; updated: number}> {
  let created = 0
  let updated = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE)
    if (dryRun || !client) {
      for (const item of chunk) {
        if (existing.has(item._key)) updated++
        else {
          created++
          // Simulate ID so later phases in the same dry-run can resolve refs.
          existing.set(item._key, `dryrun.${item._type}.${item._key}`)
        }
      }
      continue
    }

    const tx = client.transaction()
    const creates = new Map<string, string>()

    for (const item of chunk) {
      const id = existing.get(item._key)
      if (id) {
        tx.patch(id, {set: item.doc})
        updated++
      } else {
        const newId = randomUUID()
        tx.create({_id: newId, _type: item._type, ...item.doc})
        creates.set(item._key, newId)
        created++
      }
    }

    await tx.commit({visibility: 'async'})

    for (const [key, id] of creates) existing.set(key, id)

    process.stdout.write(`  … ${Math.min(i + chunk.length, items.length)}/${items.length}\r`)
  }

  if (items.length && !dryRun) process.stdout.write('\n')
  return {created, updated}
}

export async function loadExistingMap(
  client: SanityClient | null,
  type: string,
  projection: string,
  keyFn: (doc: Record<string, unknown>) => string | null,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (!client) return map

  const pageSize = 1000
  let lastId = ''

  for (;;) {
    const query = lastId
      ? `*[_type == $type && _id > $lastId] | order(_id) [0...$pageSize]{_id, ${projection}}`
      : `*[_type == $type] | order(_id) [0...$pageSize]{_id, ${projection}}`

    const docs = await client.fetch<Array<Record<string, unknown> & {_id: string}>>(query, {
      type,
      lastId,
      pageSize,
    })

    if (!docs.length) break

    for (const doc of docs) {
      const key = keyFn(doc)
      if (key) map.set(key, doc._id)
    }

    lastId = docs[docs.length - 1]._id
    if (docs.length < pageSize) break
  }

  return map
}
