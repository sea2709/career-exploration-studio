#!/usr/bin/env tsx
/**
 * Set up the career quiz review workflow and the starter quizzes.
 *
 * - Creates the `workflow.definition` document from
 *   schemaTypes/careerQuizzes/careerQuizWorkflow.ts if it doesn't exist yet. Pass --replace to
 *   overwrite edits made in Studio.
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
  CAREER_QUIZ_STAGES,
  CAREER_QUIZ_WORKFLOW_ID,
  careerQuizWorkflowDefinition,
} from '../../schemaTypes/careerQuizzes/careerQuizWorkflow'
import {quizzes} from './quizzes'

const APPROVED_STAGE = CAREER_QUIZ_STAGES[CAREER_QUIZ_STAGES.length - 1].slug

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const replace = process.argv.includes('--replace')
  const client = getWriteClient()
  const {projectId, dataset} = getProjectDataset()

  const existing = await client.fetch<string | null>(`*[_id == $id][0]._id`, {
    id: CAREER_QUIZ_WORKFLOW_ID,
  })
  const existingUrls = new Set(
    await client.fetch<string[]>(`*[_type == "careerQuiz" && defined(url)].url`),
  )
  const missing = quizzes.filter((quiz) => !existingUrls.has(quiz.url))

  console.log(`Target: ${projectId}/${dataset}.`)
  const definitionAction = !existing ? 'create' : replace ? 'replace' : 'keep'
  console.log(`Workflow definition ${CAREER_QUIZ_WORKFLOW_ID}: ${definitionAction}.`)
  console.log(`${quizzes.length} starter quizzes, ${missing.length} to create.`)
  for (const quiz of missing) console.log(`  ${dryRun ? 'would create' : 'create'}: ${quiz.name}`)
  if (dryRun) return

  const tx = client.transaction()
  if (definitionAction === 'create') tx.create(careerQuizWorkflowDefinition)
  if (definitionAction === 'replace') tx.createOrReplace(careerQuizWorkflowDefinition)
  for (const quiz of missing) {
    tx.create({
      _id: randomUUID(),
      _type: 'careerQuiz',
      status: APPROVED_STAGE,
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
