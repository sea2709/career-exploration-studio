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
 * Lets Sanity generate `_id` on create (per Sanity migration guidance).
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
    const creates: UpsertDoc[] = []

    for (const item of chunk) {
      const id = existing.get(item._key)
      if (id) {
        tx.patch(id, {set: item.doc})
        updated++
      } else {
        creates.push(item)
        created++
      }
    }

    for (const item of creates) {
      tx.create({_type: item._type, ...item.doc})
    }

    const result = await tx.commit({visibility: 'async'})

    if (creates.length > 0) {
      const createResults = result.results.filter((r) => r.operation === 'create')
      if (createResults.length === creates.length) {
        for (let j = 0; j < creates.length; j++) {
          existing.set(creates[j]._key, createResults[j].id)
        }
      } else {
        console.warn(
          `  warn: create result count mismatch (${createResults.length} vs ${creates.length}) for ${creates[0]?._type}`,
        )
      }
    }

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
