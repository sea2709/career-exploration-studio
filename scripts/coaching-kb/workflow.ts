#!/usr/bin/env tsx
/**
 * Set up the coaching guide review workflow and put existing guides on it.
 *
 * - Creates the `workflow.definition` document from schemaTypes/coaching/coachingWorkflow.ts if
 *   it doesn't exist yet. Pass --replace to overwrite edits made in Studio.
 * - Gives every guide without a stage one. Published guides already feed the Knowledge Base, so
 *   they start at Approved. Drafts, including unpublished edits to a published guide, start at
 *   Draft so they go through review.
 *
 * Task templates and completion gating need the comments/tasks addon dataset. If nobody has added
 * a comment or task in this Studio yet, do that once from any document before relying on them.
 *
 * Usage:
 *   pnpm workflow:coaching --dry-run
 *   pnpm workflow:coaching
 *   pnpm workflow:coaching --replace
 */
import {getProjectDataset, getWriteClient} from '../import-onet/client'
import {
  COACHING_STAGES,
  COACHING_WORKFLOW_ID,
  coachingWorkflowDefinition,
} from '../../schemaTypes/coaching/coachingWorkflow'

const FIRST_STAGE = COACHING_STAGES[0].slug
const APPROVED_STAGE = COACHING_STAGES[COACHING_STAGES.length - 1].slug

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const replace = process.argv.includes('--replace')
  const client = getWriteClient()
  const {projectId, dataset} = getProjectDataset()

  const existing = await client.fetch<string | null>(`*[_id == $id][0]._id`, {
    id: COACHING_WORKFLOW_ID,
  })
  const unstaged = await client.fetch<string[]>(
    `*[_type == "coachingGuide" && !defined(status) && !(_id in path("versions.**"))]._id`,
  )
  const stageFor = (id: string) => (id.startsWith('drafts.') ? FIRST_STAGE : APPROVED_STAGE)

  console.log(`Target: ${projectId}/${dataset}.`)
  const definitionAction = !existing ? 'create' : replace ? 'replace' : 'keep'
  console.log(`Workflow definition ${COACHING_WORKFLOW_ID}: ${definitionAction}.`)
  console.log(`${unstaged.length} guide(s) without a stage.`)
  for (const id of unstaged) console.log(`  ${dryRun ? 'would set' : 'set'} ${id} → ${stageFor(id)}`)
  if (dryRun) return

  const tx = client.transaction()
  if (definitionAction === 'create') tx.create(coachingWorkflowDefinition)
  if (definitionAction === 'replace') tx.createOrReplace(coachingWorkflowDefinition)
  for (const id of unstaged) tx.patch(id, (patch) => patch.set({status: stageFor(id)}))
  await tx.commit({visibility: 'async'})
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
