#!/usr/bin/env tsx
/**
 * Set up the career quiz review workflow and the starter quizzes.
 *
 * - Creates the `workflow.definition` document from
 *   schemaTypes/careerQuizzes/careerQuizWorkflow.ts if it doesn't exist yet. Pass --replace to
 *   overwrite edits made in Studio, which is also how to roll out a changed list of stages.
 * - Moves quizzes off stages the workflow no longer has, and moves assignments off roles the
 *   workflow no longer has.
 * - Creates the starter quizzes in scripts/career-quizzes/quizzes.ts as published documents at
 *   Approved, since the web app already listed them. Quizzes whose URL already exists are
 *   skipped, so re-running never overwrites edits made in Studio.
 *
 * Usage:
 *   pnpm setup:quizzes --dry-run
 *   pnpm setup:quizzes
 *   pnpm setup:quizzes --replace
 */
import {randomUUID} from 'node:crypto'
import {getProjectDataset, getWriteClient} from '../import-onet/client'
import {
  APPROVED_QUIZ_STAGE,
  CAREER_QUIZ_WORKFLOW_ID,
  careerQuizWorkflowDefinition,
  CONTENT_MANAGER_ROLE,
} from '../../schemaTypes/careerQuizzes/careerQuizWorkflow'
import {quizzes} from './quizzes'

/** Stage slugs from earlier versions of the workflow, and where those quizzes go now. */
const RENAMED_STAGES: Record<string, string> = {
  counselor_review: 'in_review',
  quiz_test: 'in_review',
  published: APPROVED_QUIZ_STAGE.slug,
}

/** Role slugs from earlier versions of the workflow, and the role that replaced them. */
const RENAMED_ROLES: Record<string, string> = {
  reviewing_counselor: CONTENT_MANAGER_ROLE.slug,
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const replace = process.argv.includes('--replace')
  const client = getWriteClient()
  const {projectId, dataset} = getProjectDataset()

  const existing = await client.fetch<string | null>(`*[_id == $id][0]._id`, {
    id: CAREER_QUIZ_WORKFLOW_ID,
  })
  const docs = await client.fetch<
    {_id: string; status?: string; url?: string; roles: string[] | null}[]
  >(
    `*[_type == "careerQuiz" && !(_id in path("versions.**"))]{_id, status, url, "roles": assignments[].assignmentType}`,
  )
  const existingUrls = new Set(docs.flatMap((doc) => (doc.url ? [doc.url] : [])))
  const missing = quizzes.filter((quiz) => !existingUrls.has(quiz.url))

  const moves = docs.flatMap((doc) => {
    const to = doc.status && RENAMED_STAGES[doc.status]
    return to ? [{id: doc._id, from: doc.status, to}] : []
  })
  const roleMoves = docs.flatMap((doc) =>
    [...new Set(doc.roles ?? [])].flatMap((from) =>
      RENAMED_ROLES[from] ? [{id: doc._id, from, to: RENAMED_ROLES[from]}] : [],
    ),
  )

  console.log(`Target: ${projectId}/${dataset}.`)
  const definitionAction = !existing ? 'create' : replace ? 'replace' : 'keep'
  console.log(`Workflow definition ${CAREER_QUIZ_WORKFLOW_ID}: ${definitionAction}.`)
  console.log(`${moves.length} quiz document(s) to move to a new stage.`)
  for (const {id, from, to} of moves) {
    console.log(`  ${dryRun ? 'would move' : 'move'} ${id}: ${from} → ${to}`)
  }
  console.log(`${roleMoves.length} assignment role(s) to rename.`)
  for (const {id, from, to} of roleMoves) {
    console.log(`  ${dryRun ? 'would rename' : 'rename'} ${id}: ${from} → ${to}`)
  }
  console.log(`${quizzes.length} starter quizzes, ${missing.length} to create.`)
  for (const quiz of missing) console.log(`  ${dryRun ? 'would create' : 'create'}: ${quiz.name}`)
  if (dryRun) return

  const tx = client.transaction()
  if (definitionAction === 'create') tx.create(careerQuizWorkflowDefinition)
  if (definitionAction === 'replace') tx.createOrReplace(careerQuizWorkflowDefinition)
  for (const {id, to} of moves) tx.patch(id, (patch) => patch.set({status: to}))
  for (const {id, from, to} of roleMoves) {
    tx.patch(id, (patch) =>
      patch.set({[`assignments[assignmentType == "${from}"].assignmentType`]: to}),
    )
  }
  for (const quiz of missing) {
    tx.create({
      _id: randomUUID(),
      _type: 'careerQuiz',
      status: APPROVED_QUIZ_STAGE.slug,
      listOrder: (quizzes.indexOf(quiz) + 1) * 10,
      ...quiz,
    })
  }
  await tx.commit({visibility: 'async'})
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
