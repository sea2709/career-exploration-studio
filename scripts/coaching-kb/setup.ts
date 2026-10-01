#!/usr/bin/env tsx
/**
 * Create (or reuse) the interview coaching Knowledge Base, import the published
 * `coachingGuide` documents into it, and build it.
 *
 * The first run builds the Knowledge Base. Later runs refresh it, which re-reads the guides and
 * files change issues to review in the Sanity dashboard. Pass --rebuild to force a full build.
 *
 * Pass --staging to manage a second Knowledge Base for the workflow's Coach test stage. It also
 * imports the drafts of guides in Coach test or Approved, in place of their published versions,
 * so a local agent pointed at it shows how a guide changes grading before it's published.
 *
 * Usage:
 *   pnpm kb:coaching
 *   pnpm kb:coaching --rebuild
 *   pnpm kb:coaching --staging
 *
 * Needs SANITY_ORGANIZATION_ID, and a token (or `sanity login` user) that can create knowledge
 * bases in the organization and has the Administrator or Developer role on the project.
 */
import {createClient, type SanityClient} from '@sanity/client'
import {getAuthToken, getProjectDataset} from '../import-onet/client'
import {TESTABLE_STAGES} from '../../schemaTypes/coaching/coachingWorkflow'

const API_VERSION = '2026-08-25'
const GUIDE_PROJECTION = `{title, category, jobZones, summary, "guidance": pt::text(body)}`
const TESTABLE_DRAFT = `_type == "coachingGuide" && _id in path("drafts.**") && status in ${JSON.stringify(TESTABLE_STAGES)}`

const KNOWLEDGE_BASES = {
  production: {
    title: 'Interview coaching guidance',
    description:
      'Career counselor guidance for the Mock Interview Coach: answer structure, question types, grading, feedback, and practice.',
    idEnv: 'COACHING_KB_ID',
    query: `*[_type == "coachingGuide" && !(_id in path("drafts.**"))]${GUIDE_PROJECTION}`,
  },
  staging: {
    title: 'Interview coaching guidance (staging)',
    description:
      'Published coaching guides plus drafts in Coach test or Approved, for testing guides in the Mock Interview Coach before publishing.',
    idEnv: 'COACHING_STAGING_KB_ID',
    query: `*[(${TESTABLE_DRAFT}) || (_type == "coachingGuide" && !(_id in path("drafts.**")) && !(("drafts." + _id) in *[${TESTABLE_DRAFT}]._id))]${GUIDE_PROJECTION}`,
  },
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
      throw new Error(`Timed out waiting for job ${jobId}. Check its progress in the Sanity dashboard.`)
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
  const target = KNOWLEDGE_BASES[process.argv.includes('--staging') ? 'staging' : 'production']

  const org = createClient({apiVersion: API_VERSION, token, useCdn: false, useProjectHostname: false})

  let kbId = process.env[target.idEnv]
  if (!kbId) {
    const created = await org.context.knowledgeBases.create({
      organizationId,
      title: target.title,
      description: target.description,
    })
    kbId = created.publicId
    console.log(`Created knowledge base ${kbId}. Add ${target.idEnv}=${kbId} to studio/.env.`)
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
      query: target.query,
    })
    console.log(`Imported coaching guides from ${projectId}/${dataset}.`)
  } else if (datasetImport.datasetSource?.query !== target.query) {
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
    console.log(
      `${openIssues.length} open issue(s), such as conflicting guidance. Review them in the Sanity dashboard under Context → Knowledge Bases.`,
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
