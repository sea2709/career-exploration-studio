#!/usr/bin/env tsx
/**
 * Create (or reuse) the interview coaching Knowledge Base, import the published
 * `coachingGuide` documents into it, and build it.
 *
 * The first run builds the Knowledge Base. Later runs refresh it, which re-reads the guides and
 * files issues for what changed without rewriting entries; the script prints them. Apply an issue
 * to rewrite its entry, or pass --rebuild to force a full build.
 *
 * Usage:
 *   pnpm kb:coaching
 *   pnpm kb:coaching --rebuild
 *
 * Needs SANITY_ORGANIZATION_ID, and a token (or `sanity login` user) that can create knowledge
 * bases in the organization and has the Administrator or Developer role on the project.
 */
import {createClient, type SanityClient} from '@sanity/client'
import {getAuthToken, getProjectDataset} from '../import-onet/client'

const API_VERSION = '2026-08-25'
const KNOWLEDGE_BASE = {
  title: 'Interview coaching guidance',
  description:
    'Career counselor guidance for the Mock Interview Coach: answer structure, question types, grading, feedback, and practice.',
  idEnv: 'COACHING_KB_ID',
  query: `*[_type == "coachingGuide" && !(_id in path("drafts.**"))]{title, category, jobZones, summary, "guidance": pt::text(body)}`,
}
const JOB_TIMEOUT_MS = 20 * 60 * 1000

async function waitForJob(kb: SanityClient, jobId: string) {
  const started = Date.now()
  for (;;) {
    const job = await kb.context.jobs.get({jobId})
    if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
      process.stdout.write('\n')
      return job
    }
    if (Date.now() - started > JOB_TIMEOUT_MS) {
      throw new Error(
        `Timed out waiting for job ${jobId}. Check its progress in the Sanity dashboard.`,
      )
    }
    process.stdout.write('.')
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

async function main() {
  const organizationId = process.env.SANITY_ORGANIZATION_ID
  if (!organizationId) {
    throw new Error('Set SANITY_ORGANIZATION_ID in studio/.env (see .env.example).')
  }
  const token = getAuthToken()
  const {projectId, dataset} = getProjectDataset()
  const forceRebuild = process.argv.includes('--rebuild')

  const org = createClient({
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    useProjectHostname: false,
  })

  let kbId = process.env[KNOWLEDGE_BASE.idEnv]
  if (!kbId) {
    const created = await org.context.knowledgeBases.create({
      organizationId,
      title: KNOWLEDGE_BASE.title,
      description: KNOWLEDGE_BASE.description,
    })
    kbId = created.publicId
    console.log(
      `Created knowledge base ${kbId}. Add ${KNOWLEDGE_BASE.idEnv}=${kbId} to studio/.env.`,
    )
  }

  const kb = createClient({
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    resource: {type: 'knowledge-base', id: kbId},
    context: {organizationId},
  })

  const {data: imports} = await kb.context.imports.list()
  const datasetImport = imports.find(
    (i) =>
      i.sourceKind === 'dataset' &&
      i.datasetSource?.sanityProjectId === projectId &&
      i.datasetSource?.sanityDatasetId === dataset,
  )
  if (!datasetImport) {
    await kb.context.imports.create({
      type: 'dataset',
      sanityProjectId: projectId,
      sanityDatasetId: dataset,
      query: KNOWLEDGE_BASE.query,
    })
    console.log(`Imported coaching guides from ${projectId}/${dataset}.`)
  } else if (datasetImport.datasetSource?.query !== KNOWLEDGE_BASE.query) {
    console.warn(
      `The existing dataset import (${datasetImport.id}) uses a different query. Delete it in the dashboard and re-run to import with the current query.`,
    )
  }

  try {
    await org.context.knowledgeBases.edit(kbId, {refreshEnabled: true, refreshFrequency: 'weekly'})
  } catch (error) {
    console.warn(
      `Couldn't enable weekly refresh: ${error instanceof Error ? error.message : error}`,
    )
  }

  const before = await org.context.knowledgeBases.get(kbId)
  const shouldBuild = forceRebuild || before.state === 'created'
  const {jobId} = shouldBuild ? await kb.context.build() : await kb.context.refresh()
  process.stdout.write(`${shouldBuild ? 'Building' : 'Refreshing'} (job ${jobId})`)

  const job = await waitForJob(kb, jobId)
  if (job.status !== 'succeeded') {
    throw new Error(`Job ${jobId} ${job.status}${job.error ? `: ${job.error}` : ''}`)
  }

  const after = await org.context.knowledgeBases.get(kbId)
  const openIssues = await kb.context.issues.list({status: 'open'})
  console.log(`Knowledge base ${kbId} is ${after.state}.`)
  if (after.sourceUsage) {
    console.log(`Sources: ${after.sourceUsage.used} of ${after.sourceUsage.limit}.`)
  }
  if (openIssues.length) {
    // The dashboard's Issues page can miss issues filed by a refresh, so print them here.
    console.log(`${openIssues.length} open issue(s):`)
    for (const {_id, content} of openIssues) {
      console.log(`\n- ${_id} [${content.kind}, ${content.severity}] ${content.scopePath}`)
      console.log(`  ${content.issue}`)
      console.log(`  Suggested fix: ${content.suggestedFix}`)
    }
    console.log(
      '\nApply an issue with client.context.issues.apply({issueIds}), dismiss it, or run with --rebuild.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
