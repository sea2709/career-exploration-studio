import {createHash} from 'node:crypto'
import type {SanityClient} from '@sanity/client'
import {getDataDir} from './client'
import {
  collectRows,
  omitUndefined,
  parseNumber,
  parseOnetDate,
  parseYesNo,
  readOnetFile,
  ref,
  type Row,
} from './parse'
import {importInterests} from './interests'
import {loadExistingMap, upsertBatch, type UpsertDoc} from './upsert'

export type ImportPhase = 'references' | 'occupations' | 'details' | 'interests'

export const DEFAULT_PHASES: ImportPhase[] = ['references', 'occupations', 'details', 'interests']

export const RATING_DOMAIN_FILES: Record<
  string,
  {file: string; domain: string; hasCategory?: boolean}
> = {
  essentialSkills: {file: 'Essential Skills.txt', domain: 'essentialSkills'},
  transferableSkills: {file: 'Transferable Skills.txt', domain: 'transferableSkills'},
  knowledge: {file: 'Knowledge.txt', domain: 'knowledge'},
  abilities: {file: 'Abilities.txt', domain: 'abilities'},
  workActivities: {file: 'Work Activities.txt', domain: 'workActivities'},
  education: {file: 'Education.txt', domain: 'education', hasCategory: true},
  workContext: {file: 'Work Context.txt', domain: 'workContext', hasCategory: true},
}

/** workContext is excluded by default: it roughly doubles the size of every occupation. */
export const DEFAULT_RATING_DOMAINS = [
  'essentialSkills',
  'transferableSkills',
  'knowledge',
  'abilities',
  'workActivities',
  'education',
]

export type ImportOptions = {
  dryRun: boolean
  limit?: number
  phases: ImportPhase[]
  ratingDomains: string[]
  occupationFilter?: Set<string>
}

type IdMaps = {
  occupations: Map<string, string>
  elements: Map<string, string>
  scales: Map<string, string>
  jobZones: Map<string, string>
  ratingCategories: Map<string, string>
}

type ArrayItem = {_key: string; _type: string} & Record<string, unknown>

const DETAIL_ARRAYS = [
  'tasks',
  'jobTitles',
  'softwareSkills',
  'workStyles',
  'ratings',
  'relatedOccupations',
] as const

type DetailArray = (typeof DETAIL_ARRAYS)[number]

type OccupationDetail = {
  jobZone?: ReturnType<typeof ref>
} & Record<DetailArray, Map<string, ArrayItem>>

/** Keep each occupation patch well under Sanity's request size limits. */
const MAX_PATCH_BYTES = 2_000_000
const MAX_PATCHES_PER_TRANSACTION = 10

function log(msg: string) {
  console.log(msg)
}

function arrayKey(naturalKey: string): string {
  return createHash('sha1').update(naturalKey).digest('hex').slice(0, 12)
}

function includeOccupation(code: string, opts: ImportOptions): boolean {
  return !opts.occupationFilter || opts.occupationFilter.has(code)
}

async function forEachRow(
  dataDir: string,
  filename: string,
  limit: number | undefined,
  fn: (row: Row) => void,
) {
  let count = 0
  for await (const row of readOnetFile(dataDir, filename)) {
    fn(row)
    count++
    if (limit != null && count >= limit) break
  }
}

async function importScales(client: SanityClient | null, opts: ImportOptions, dataDir: string) {
  log('→ Scales Reference')
  const existing = await loadExistingMap(client, 'onetScale', 'scaleId, importKey', (d) =>
    String(d.importKey || d.scaleId || ''),
  )
  const rows = await collectRows(dataDir, 'Scales Reference.txt', opts.limit)
  const items: UpsertDoc[] = rows.map((row) => {
    const scaleId = row['Scale ID']
    return {
      _type: 'onetScale',
      _key: scaleId,
      doc: omitUndefined({
        importKey: scaleId,
        scaleId,
        scaleName: row['Scale Name'],
        minimum: parseNumber(row['Minimum']),
        maximum: parseNumber(row['Maximum']),
      }),
    }
  })
  const result = await upsertBatch(client, existing, items, opts.dryRun)
  log(`  created ${result.created}, updated ${result.updated}`)
  return existing
}

async function importElements(client: SanityClient | null, opts: ImportOptions, dataDir: string) {
  log('→ Content Model Reference')
  const existing = await loadExistingMap(
    client,
    'onetContentModelElement',
    'elementId, importKey',
    (d) => String(d.importKey || d.elementId || ''),
  )
  const rows = await collectRows(dataDir, 'Content Model Reference.txt', opts.limit)
  const items: UpsertDoc[] = rows.map((row) => {
    const elementId = row['Element ID']
    return {
      _type: 'onetContentModelElement',
      _key: elementId,
      doc: omitUndefined({
        importKey: elementId,
        elementId,
        elementName: row['Element Name'],
        description: row['Description'] || undefined,
      }),
    }
  })
  const result = await upsertBatch(client, existing, items, opts.dryRun)
  log(`  created ${result.created}, updated ${result.updated}`)
  return existing
}

async function importJobZoneReference(
  client: SanityClient | null,
  opts: ImportOptions,
  dataDir: string,
) {
  log('→ Job Zone Reference')
  const existing = await loadExistingMap(client, 'onetJobZone', 'jobZone, importKey', (d) =>
    String(d.importKey || d.jobZone || ''),
  )
  const rows = await collectRows(dataDir, 'Job Zone Reference.txt', opts.limit)
  const items: UpsertDoc[] = rows.map((row) => {
    const jobZone = parseNumber(row['Job Zone'])!
    const key = String(jobZone)
    return {
      _type: 'onetJobZone',
      _key: key,
      doc: omitUndefined({
        importKey: key,
        jobZone,
        name: row['Name'],
        experience: row['Experience'] || undefined,
        education: row['Education'] || undefined,
        jobTraining: row['Job Training'] || undefined,
        examples: row['Examples'] || undefined,
        svpRange: row['SVP Range'] || undefined,
      }),
    }
  })
  const result = await upsertBatch(client, existing, items, opts.dryRun)
  log(`  created ${result.created}, updated ${result.updated}`)
  return existing
}

async function importLevelScaleAnchors(
  client: SanityClient | null,
  opts: ImportOptions,
  dataDir: string,
  maps: IdMaps,
) {
  log('→ Level Scale Anchors')
  const existing = await loadExistingMap(client, 'onetLevelScaleAnchor', 'importKey', (d) =>
    String(d.importKey || ''),
  )
  const rows = await collectRows(dataDir, 'Level Scale Anchors.txt', opts.limit)
  const items: UpsertDoc[] = []
  for (const row of rows) {
    const elementId = maps.elements.get(row['Element ID'])
    const scaleId = maps.scales.get(row['Scale ID'])
    if (!elementId || !scaleId) continue
    const anchorValue = parseNumber(row['Anchor Value'])!
    const key = `${row['Element ID']}|${row['Scale ID']}|${anchorValue}`
    items.push({
      _type: 'onetLevelScaleAnchor',
      _key: key,
      doc: omitUndefined({
        importKey: key,
        element: ref(elementId),
        scale: ref(scaleId),
        anchorValue,
        anchorDescription: row['Anchor Description'],
      }),
    })
  }
  const result = await upsertBatch(client, existing, items, opts.dryRun)
  log(`  created ${result.created}, updated ${result.updated}`)
}

async function importRatingCategories(
  client: SanityClient | null,
  opts: ImportOptions,
  dataDir: string,
  maps: IdMaps,
) {
  log('→ Education / Work Context Categories')
  const existing = await loadExistingMap(client, 'onetRatingCategory', 'importKey', (d) =>
    String(d.importKey || ''),
  )

  const files: Array<{file: string; domain: 'education' | 'workContext'}> = [
    {file: 'Education Categories.txt', domain: 'education'},
    {file: 'Work Context Categories.txt', domain: 'workContext'},
  ]

  const items: UpsertDoc[] = []
  for (const {file, domain} of files) {
    const rows = await collectRows(dataDir, file, opts.limit)
    for (const row of rows) {
      const elementId = maps.elements.get(row['Element ID'])
      const scaleId = maps.scales.get(row['Scale ID'])
      if (!elementId || !scaleId) continue
      const category = parseNumber(row['Category'])!
      const key = `${domain}|${row['Element ID']}|${row['Scale ID']}|${category}`
      items.push({
        _type: 'onetRatingCategory',
        _key: key,
        doc: omitUndefined({
          importKey: key,
          categoryDomain: domain,
          element: ref(elementId),
          scale: ref(scaleId),
          category,
          categoryDescription: row['Category Description'] || undefined,
        }),
      })
    }
  }

  const result = await upsertBatch(client, existing, items, opts.dryRun)
  log(`  created ${result.created}, updated ${result.updated}`)
  return existing
}

async function importOccupations(
  client: SanityClient | null,
  opts: ImportOptions,
  dataDir: string,
) {
  log('→ Occupation Data')
  const existing = await loadExistingMap(
    client,
    'onetOccupation',
    'onetsocCode, importKey',
    (d) => String(d.importKey || d.onetsocCode || ''),
  )
  let rows = await collectRows(dataDir, 'Occupation Data.txt', opts.limit)
  if (opts.occupationFilter) {
    rows = rows.filter((r) => opts.occupationFilter!.has(r['O*NET-SOC Code']))
  }
  const items: UpsertDoc[] = rows.map((row) => {
    const onetsocCode = row['O*NET-SOC Code']
    return {
      _type: 'onetOccupation',
      _key: onetsocCode,
      doc: omitUndefined({
        importKey: onetsocCode,
        onetsocCode,
        title: row['Title'],
        description: row['Description'] || undefined,
      }),
    }
  })
  const result = await upsertBatch(client, existing, items, opts.dryRun)
  log(`  created ${result.created}, updated ${result.updated}`)
  return existing
}

function ratingFieldsFromRow(row: Row) {
  return omitUndefined({
    dataValue: parseNumber(row['Data Value']),
    n: parseNumber(row['N']),
    standardError: parseNumber(row['Standard Error']),
    lowerCiBound: parseNumber(row['Lower CI Bound']),
    upperCiBound: parseNumber(row['Upper CI Bound']),
    recommendSuppress: parseYesNo(row['Recommend Suppress']),
    notRelevant: parseYesNo(row['Not Relevant']),
    dateUpdated: parseOnetDate(row['Date']),
    domainSource: row['Domain Source'] || undefined,
  })
}

async function collectOccupationDetails(
  opts: ImportOptions,
  dataDir: string,
  maps: IdMaps,
): Promise<Map<string, OccupationDetail>> {
  const details = new Map<string, OccupationDetail>()

  const detailFor = (code: string): OccupationDetail | undefined => {
    if (!includeOccupation(code, opts) || !maps.occupations.has(code)) return undefined
    let detail = details.get(code)
    if (!detail) {
      detail = {
        tasks: new Map(),
        jobTitles: new Map(),
        softwareSkills: new Map(),
        workStyles: new Map(),
        ratings: new Map(),
        relatedOccupations: new Map(),
      }
      details.set(code, detail)
    }
    return detail
  }

  const add = (
    detail: OccupationDetail,
    array: DetailArray,
    type: string,
    naturalKey: string,
    fields: Record<string, unknown>,
  ) => {
    const _key = arrayKey(naturalKey)
    if (!detail[array].has(_key)) {
      detail[array].set(_key, {_key, _type: type, ...fields})
    }
  }

  log('→ Job Zones')
  await forEachRow(dataDir, 'Job Zones.txt', opts.limit, (row) => {
    const detail = detailFor(row['O*NET-SOC Code'])
    const zoneId = maps.jobZones.get(row['Job Zone'])
    if (detail && zoneId) detail.jobZone = ref(zoneId)
  })

  log('→ Task Statements')
  await forEachRow(dataDir, 'Task Statements.txt', opts.limit, (row) => {
    const detail = detailFor(row['O*NET-SOC Code'])
    if (!detail) return
    const taskId = parseNumber(row['Task ID'])!
    add(detail, 'tasks', 'onetTaskItem', String(taskId), {
      taskId,
      task: row['Task'],
      ...omitUndefined({
        taskType: row['Task Type'] || undefined,
        incumbentsResponding: parseNumber(row['Incumbents Responding']),
        dateUpdated: parseOnetDate(row['Date']),
        domainSource: row['Domain Source'] || undefined,
      }),
    })
  })

  log('→ Job Titles')
  await forEachRow(dataDir, 'Job Titles.txt', opts.limit, (row) => {
    const detail = detailFor(row['O*NET-SOC Code'])
    if (!detail) return
    const jobTitle = row['Job Title']
    add(detail, 'jobTitles', 'onetJobTitleItem', jobTitle, {
      jobTitle,
      ...omitUndefined({
        shortTitle: row['Short Title'] || undefined,
        sources: row['Source(s)'] || undefined,
      }),
    })
  })

  log('→ Related Occupations')
  await forEachRow(dataDir, 'Related Occupations.txt', opts.limit, (row) => {
    const detail = detailFor(row['O*NET-SOC Code'])
    const relatedCode = row['Related O*NET-SOC Code']
    const relatedId = maps.occupations.get(relatedCode)
    if (!detail || !relatedId) return
    add(detail, 'relatedOccupations', 'onetRelatedOccupationItem', relatedCode, {
      occupation: ref(relatedId),
      relatednessTier: row['Relatedness Tier'],
      relatedIndex: parseNumber(row['Index']),
    })
  })

  log('→ Software Skills')
  await forEachRow(dataDir, 'Software Skills.txt', opts.limit, (row) => {
    const detail = detailFor(row['O*NET-SOC Code'])
    const elementId = maps.elements.get(row['Element ID'])
    if (!detail || !elementId) return
    const example = row['Workplace Example']
    add(detail, 'softwareSkills', 'onetSoftwareSkillItem', `${example}|${row['Element ID']}`, {
      workplaceExample: example,
      element: ref(elementId),
      hotTechnology: parseYesNo(row['Hot Technology']) ?? 'N',
      inDemand: parseYesNo(row['In Demand']) ?? 'N',
    })
  })

  log('→ Work Styles')
  await forEachRow(dataDir, 'Work Styles.txt', opts.limit, (row) => {
    const detail = detailFor(row['O*NET-SOC Code'])
    const elementId = maps.elements.get(row['Element ID'])
    const scaleId = maps.scales.get(row['Scale ID'])
    if (!detail || !elementId || !scaleId) return
    add(detail, 'workStyles', 'onetWorkStyleItem', `${row['Element ID']}|${row['Scale ID']}`, {
      element: ref(elementId),
      scale: ref(scaleId),
      ...omitUndefined({
        dataValue: parseNumber(row['Data Value']),
        dateUpdated: parseOnetDate(row['Date']),
        domainSource: row['Domain Source'] || undefined,
      }),
    })
  })

  for (const domainKey of opts.ratingDomains) {
    const spec = RATING_DOMAIN_FILES[domainKey]
    if (!spec) {
      log(`  skip unknown rating domain: ${domainKey}`)
      continue
    }
    log(`→ Ratings: ${spec.domain} (${spec.file})`)
    await forEachRow(dataDir, spec.file, opts.limit, (row) => {
      const detail = detailFor(row['O*NET-SOC Code'])
      const elementId = maps.elements.get(row['Element ID'])
      const scaleId = maps.scales.get(row['Scale ID'])
      if (!detail || !elementId || !scaleId) return

      const category = parseNumber(row['Category'])
      let ratingCategory: ReturnType<typeof ref> | undefined
      if (spec.hasCategory && category != null) {
        const catId = maps.ratingCategories.get(
          `${spec.domain}|${row['Element ID']}|${row['Scale ID']}|${category}`,
        )
        if (catId) ratingCategory = ref(catId)
      }

      const naturalKey = [spec.domain, row['Element ID'], row['Scale ID'], category ?? ''].join('|')
      add(detail, 'ratings', 'onetRatingItem', naturalKey, {
        domain: spec.domain,
        element: ref(elementId),
        scale: ref(scaleId),
        ...omitUndefined({ratingCategory}),
        ...ratingFieldsFromRow(row),
      })
    })
  }

  return details
}

async function importOccupationDetails(
  client: SanityClient | null,
  opts: ImportOptions,
  dataDir: string,
  maps: IdMaps,
) {
  const details = await collectOccupationDetails(opts, dataDir, maps)

  const codes = [...maps.occupations.keys()].filter((code) => includeOccupation(code, opts))
  log(`→ Writing embedded data to ${codes.length} occupations`)

  const patches: Array<{id: string; code: string; set: Record<string, unknown>; unset: string[]}> =
    []
  let largest = {code: '', bytes: 0}
  const totals = Object.fromEntries(DETAIL_ARRAYS.map((name) => [name, 0])) as Record<
    DetailArray,
    number
  >

  for (const code of codes) {
    const detail = details.get(code)
    const set: Record<string, unknown> = {}
    for (const name of DETAIL_ARRAYS) {
      const items = detail ? [...detail[name].values()] : []
      set[name] = items
      totals[name] += items.length
    }
    const unset: string[] = []
    if (detail?.jobZone) set.jobZone = detail.jobZone
    else unset.push('jobZone')

    const bytes = Buffer.byteLength(JSON.stringify(set))
    if (bytes > largest.bytes) largest = {code, bytes}
    if (bytes > MAX_PATCH_BYTES) {
      throw new Error(`Occupation ${code} patch is ${bytes} bytes, above ${MAX_PATCH_BYTES}`)
    }
    patches.push({id: maps.occupations.get(code)!, code, set, unset})
  }

  for (const name of DETAIL_ARRAYS) log(`  ${name}: ${totals[name]} items`)
  log(`  largest occupation payload: ${largest.code} (${Math.round(largest.bytes / 1024)} KB)`)

  if (opts.dryRun || !client) return

  let batch: typeof patches = []
  let batchBytes = 0
  let written = 0

  const flush = async () => {
    if (!batch.length) return
    const tx = client.transaction()
    for (const p of batch) {
      tx.patch(p.id, (patch) => {
        const withSet = patch.set(p.set)
        return p.unset.length ? withSet.unset(p.unset) : withSet
      })
    }
    await tx.commit({visibility: 'async'})
    written += batch.length
    process.stdout.write(`  … ${written}/${patches.length}\r`)
    batch = []
    batchBytes = 0
  }

  for (const p of patches) {
    const bytes = Buffer.byteLength(JSON.stringify(p.set))
    if (batch.length >= MAX_PATCHES_PER_TRANSACTION || batchBytes + bytes > MAX_PATCH_BYTES) {
      await flush()
    }
    batch.push(p)
    batchBytes += bytes
  }
  await flush()
  process.stdout.write('\n')
}

export async function runImport(client: SanityClient | null, opts: ImportOptions) {
  const dataDir = getDataDir()
  log(`O*NET data dir: ${dataDir}`)
  log(`Phases: ${opts.phases.join(', ')}`)
  log(`Dry run: ${opts.dryRun}`)
  if (opts.limit) log(`Row limit per file: ${opts.limit}`)
  if (opts.occupationFilter) log(`Occupation filter: ${opts.occupationFilter.size} codes`)

  const maps: IdMaps = {
    occupations: new Map(),
    elements: new Map(),
    scales: new Map(),
    jobZones: new Map(),
    ratingCategories: new Map(),
  }

  if (opts.phases.includes('references')) {
    maps.scales = await importScales(client, opts, dataDir)
    maps.elements = await importElements(client, opts, dataDir)
    maps.jobZones = await importJobZoneReference(client, opts, dataDir)
    await importLevelScaleAnchors(client, opts, dataDir, maps)
    maps.ratingCategories = await importRatingCategories(client, opts, dataDir, maps)
  } else {
    maps.scales = await loadExistingMap(client, 'onetScale', 'scaleId, importKey', (d) =>
      String(d.importKey || d.scaleId || ''),
    )
    maps.elements = await loadExistingMap(
      client,
      'onetContentModelElement',
      'elementId, importKey',
      (d) => String(d.importKey || d.elementId || ''),
    )
    maps.jobZones = await loadExistingMap(client, 'onetJobZone', 'jobZone, importKey', (d) =>
      String(d.importKey || d.jobZone || ''),
    )
    maps.ratingCategories = await loadExistingMap(
      client,
      'onetRatingCategory',
      'importKey',
      (d) => String(d.importKey || ''),
    )
  }

  if (opts.phases.includes('occupations')) {
    maps.occupations = await importOccupations(client, opts, dataDir)
  } else {
    maps.occupations = await loadExistingMap(
      client,
      'onetOccupation',
      'onetsocCode, importKey',
      (d) => String(d.importKey || d.onetsocCode || ''),
    )
  }

  if (opts.phases.includes('details')) {
    await importOccupationDetails(client, opts, dataDir, maps)
  }

  if (opts.phases.includes('interests')) {
    await importInterests(client, opts, dataDir, maps)
  }

  log('Done.')
}
