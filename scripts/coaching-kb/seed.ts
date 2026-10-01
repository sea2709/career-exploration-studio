#!/usr/bin/env tsx
/**
 * Create the starter `coachingGuide` documents. Guides whose title already exists are skipped,
 * so re-running never overwrites edits made in Studio. New guides are drafts at the first
 * workflow stage, so they go through counselor review before reaching the Knowledge Base.
 *
 * Usage:
 *   pnpm seed:coaching --dry-run
 *   pnpm seed:coaching
 */
import {randomUUID} from 'node:crypto'
import {getProjectDataset, getWriteClient} from '../import-onet/client'
import {COACHING_STAGES} from '../../schemaTypes/coaching/coachingWorkflow'
import {guides} from './guides'

type Span = {_type: 'span'; _key: string; text: string; marks: string[]}
type Block = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h3'
  markDefs: []
  children: Span[]
  listItem?: 'bullet'
  level?: number
}

const key = () => randomUUID().slice(0, 12)

function toSpans(text: string): Span[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => {
      const bold = part.startsWith('**') && part.endsWith('**')
      return {
        _type: 'span',
        _key: key(),
        text: bold ? part.slice(2, -2) : part,
        marks: bold ? ['strong'] : [],
      }
    })
}

function toPortableText(markdown: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of markdown.split(/\n{2,}/)) {
    for (const line of chunk.split('\n')) {
      const text = line.trim()
      if (!text) continue
      const block: Block = {_type: 'block', _key: key(), style: 'normal', markDefs: [], children: []}
      if (text.startsWith('### ')) {
        block.style = 'h3'
        block.children = toSpans(text.slice(4))
      } else if (text.startsWith('- ')) {
        block.listItem = 'bullet'
        block.level = 1
        block.children = toSpans(text.slice(2))
      } else {
        block.children = toSpans(text)
      }
      blocks.push(block)
    }
  }
  return blocks
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const client = getWriteClient()
  const {projectId, dataset} = getProjectDataset()

  const existing = new Set(
    await client.fetch<string[]>(`*[_type == "coachingGuide" && defined(title)].title`),
  )
  const missing = guides.filter((guide) => !existing.has(guide.title))

  console.log(
    `Target: ${projectId}/${dataset}. ${guides.length} starter guides, ${existing.size} guides in the dataset, ${missing.length} to create.`,
  )
  if (!missing.length || dryRun) {
    for (const guide of missing) console.log(`  would create: ${guide.title}`)
    return
  }

  const tx = client.transaction()
  for (const {body, jobZones, ...guide} of missing) {
    tx.create({
      _id: `drafts.${randomUUID()}`,
      _type: 'coachingGuide',
      status: COACHING_STAGES[0].slug,
      ...guide,
      ...(jobZones?.length ? {jobZones} : {}),
      body: toPortableText(body),
    })
  }
  await tx.commit({visibility: 'async'})

  for (const guide of missing) console.log(`  created draft: ${guide.title}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
