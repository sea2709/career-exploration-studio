#!/usr/bin/env tsx
/**
 * Delete the legacy one-document-per-row O*NET types. Their data now lives in
 * arrays on onetOccupation.
 *
 * Usage:
 *   pnpm cleanup:onet --dry-run
 *   pnpm cleanup:onet
 */
import {getWriteClient} from './client'

const LEGACY_TYPES = [
  'onetOccupationRating',
  'onetWorkStyleRating',
  'onetTaskStatement',
  'onetJobTitle',
  'onetRelatedOccupation',
  'onetOccupationJobZone',
  'onetSoftwareSkill',
]

const PAGE_SIZE = 2000
const DELETES_PER_TRANSACTION = 500

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const client = getWriteClient()

  let grandTotal = 0
  for (const type of LEGACY_TYPES) {
    const total = await client.fetch<number>(
      'count(*[_type == $type])',
      {type},
      {perspective: 'raw'},
    )
    grandTotal += total
    console.log(`→ ${type}: ${total}`)
    if (dryRun || total === 0) continue

    let deleted = 0
    let lastId = ''
    for (;;) {
      const ids = await client.fetch<string[]>(
        '*[_type == $type && _id > $lastId] | order(_id) [0...$pageSize]._id',
        {type, lastId, pageSize: PAGE_SIZE},
        {perspective: 'raw'},
      )
      if (!ids.length) break

      const chunks: string[][] = []
      for (let i = 0; i < ids.length; i += DELETES_PER_TRANSACTION) {
        chunks.push(ids.slice(i, i + DELETES_PER_TRANSACTION))
      }
      await Promise.all(
        chunks.map((chunk) => {
          const tx = client.transaction()
          for (const id of chunk) tx.delete(id)
          return tx.commit({visibility: 'async'})
        }),
      )

      deleted += ids.length
      lastId = ids[ids.length - 1]
      process.stdout.write(`  … ${deleted}/${total}\r`)
      if (ids.length < PAGE_SIZE) break
    }
    process.stdout.write('\n')
  }

  console.log(dryRun ? `Would delete ${grandTotal} documents` : `Deleted ${grandTotal} documents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
