import {createHash} from 'node:crypto'
import type {SanityClient} from '@sanity/client'
import {collectRows, omitUndefined, parseNumber, ref} from './parse'
import {loadExistingMap, upsertBatch, type UpsertDoc} from './upsert'

/** RIASEC order; IH (high-point) values 1–6 index into this list, 0 means none. */
const CAREER_TYPES = [
  {name: 'Realistic', code: 'R', field: 'realistic'},
  {name: 'Investigative', code: 'I', field: 'investigative'},
  {name: 'Artistic', code: 'A', field: 'artistic'},
  {name: 'Social', code: 'S', field: 'social'},
  {name: 'Enterprising', code: 'E', field: 'enterprising'},
  {name: 'Conventional', code: 'C', field: 'conventional'},
] as const

const PATCHES_PER_TRANSACTION = 50

type Maps = {elements: Map<string, string>; occupations: Map<string, string>}

type InterestOptions = {dryRun: boolean; limit?: number; occupationFilter?: Set<string>}

function log(msg: string) {
  console.log(msg)
}

function arrayKey(naturalKey: string): string {
  return createHash('sha1').update(naturalKey).digest('hex').slice(0, 12)
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const row of rows) {
    const k = key(row)
    out.set(k, [...(out.get(k) ?? []), row])
  }
  return out
}

/**
 * Phase "interests": creates one onetInterest document per RIASEC type and Specific Interest
 * Area, then writes interestProfile (RIASEC scores, high-points, area scores) onto occupations.
 * Runs after occupations exist because interests reference illustrative occupations.
 */
export async function importInterests(
  client: SanityClient | null,
  opts: InterestOptions,
  dataDir: string,
  maps: Maps,
) {
  log('→ Interests: reference documents')
  const existing = await loadExistingMap(client, 'onetInterest', 'importKey', (d) =>
    String(d.importKey || ''),
  )

  const elementRows = await collectRows(dataDir, 'Content Model Reference.txt')
  const elements = new Map(
    elementRows
      .filter((r) => r['Element ID'].startsWith('1.B.1.') || r['Element ID'].startsWith('1.B.3.'))
      .map((r) => [r['Element ID'], r]),
  )
  const keywords = groupBy(await collectRows(dataDir, 'Career Interest Type Keywords.txt'), (r) => r['Element ID'])
  const activities = groupBy(await collectRows(dataDir, 'Interests Illustrative Activities.txt'), (r) => r['Element ID'])
  const illustrative = groupBy(await collectRows(dataDir, 'Interests Illustrative Occupations.txt'), (r) => r['Element ID'])
  const areaToTypes = groupBy(
    await collectRows(dataDir, 'Specific Interest Areas to Career Interest Types.txt'),
    (r) => r['Specific Interest Areas Element ID'],
  )

  const baseDoc = (elementId: string, kind: 'careerType' | 'specificArea') => {
    const element = elements.get(elementId)!
    return omitUndefined({
      importKey: elementId,
      element: ref(maps.elements.get(elementId)!),
      elementId,
      name: element['Element Name'],
      kind,
      description: element['Description'] || undefined,
      activities: (activities.get(elementId) ?? []).map((r) => r['Activity']),
      illustrativeOccupations: (illustrative.get(elementId) ?? [])
        .map((r) => maps.occupations.get(r['O*NET-SOC Code']))
        .filter((id): id is string => Boolean(id))
        .map((id) => ({...ref(id), _key: arrayKey(id)})),
    })
  }

  const careerTypeIds = [...elements.values()]
    .filter((r) => CAREER_TYPES.some((t) => t.name === r['Element Name']) && maps.elements.has(r['Element ID']))
    .map((r) => r['Element ID'])
  const typeItems: UpsertDoc[] = careerTypeIds.map((elementId) => {
    const name = elements.get(elementId)!['Element Name']
    return {
      _type: 'onetInterest',
      _key: elementId,
      doc: {
        ...baseDoc(elementId, 'careerType'),
        code: CAREER_TYPES.find((t) => t.name === name)?.code,
        keywords: (keywords.get(elementId) ?? []).map((r) => ({
          _key: arrayKey(`${r['Keyword']}|${r['Keyword Type']}`),
          keyword: r['Keyword'],
          keywordType: r['Keyword Type'],
        })),
      },
    }
  })
  const typeResult = await upsertBatch(client, existing, typeItems, opts.dryRun)

  const areaIds = [...elements.keys()].filter((id) => id.startsWith('1.B.3.') && maps.elements.has(id))
  const areaItems: UpsertDoc[] = areaIds.map((elementId) => ({
    _type: 'onetInterest',
    _key: elementId,
    doc: {
      ...baseDoc(elementId, 'specificArea'),
      careerTypes: (areaToTypes.get(elementId) ?? [])
        .map((r) => existing.get(r['Career Interest Types Element ID']))
        .filter((id): id is string => Boolean(id))
        .map((id) => ({...ref(id), _key: arrayKey(id)})),
    },
  }))
  const areaResult = await upsertBatch(client, existing, areaItems, opts.dryRun)
  log(
    `  career types: created ${typeResult.created}, updated ${typeResult.updated}; ` +
      `areas: created ${areaResult.created}, updated ${areaResult.updated}`,
  )

  log('→ Interests: occupation profiles')
  const includes = (code: string) =>
    maps.occupations.has(code) && (!opts.occupationFilter || opts.occupationFilter.has(code))

  const profiles = new Map<
    string,
    {riasec: Record<string, number>; highPoints: (string | null)[]; areas: Map<string, Record<string, unknown>>}
  >()
  const profileFor = (code: string) => {
    let p = profiles.get(code)
    if (!p) {
      p = {riasec: {}, highPoints: [null, null, null], areas: new Map()}
      profiles.set(code, p)
    }
    return p
  }

  for (const row of await collectRows(dataDir, 'Career Interest Types.txt', opts.limit)) {
    const code = row['O*NET-SOC Code']
    if (!includes(code)) continue
    const value = parseNumber(row['Data Value'])
    if (value == null) continue
    const profile = profileFor(code)
    if (row['Scale ID'] === 'OI') {
      const type = CAREER_TYPES.find((t) => t.name === row['Element Name'])
      if (type) profile.riasec[type.field] = value
    } else if (row['Scale ID'] === 'IH') {
      const position = ['First', 'Second', 'Third'].findIndex((p) => row['Element Name'].startsWith(p))
      if (position >= 0) profile.highPoints[position] = CAREER_TYPES[value - 1]?.name ?? null
    }
  }

  for (const row of await collectRows(dataDir, 'Specific Interest Areas.txt', opts.limit)) {
    const code = row['O*NET-SOC Code']
    const areaId = existing.get(row['Element ID'])
    const value = parseNumber(row['Data Value'])
    if (!includes(code) || !areaId || value == null) continue
    const areas = profileFor(code).areas
    const item = areas.get(row['Element ID']) ?? {
      _key: arrayKey(row['Element ID']),
      _type: 'onetInterestAreaScore',
      area: ref(areaId),
      name: row['Element Name'],
    }
    if (row['Scale ID'] === 'OI') item.score = value
    else if (row['Scale ID'] === 'DS') item.displayRank = value
    areas.set(row['Element ID'], item)
  }

  const patches = [...profiles].map(([code, p]) => ({
    id: maps.occupations.get(code)!,
    interestProfile: {
      riasec: p.riasec,
      highPoints: p.highPoints.filter((h): h is string => Boolean(h)),
      areas: [...p.areas.values()].filter((a) => a.score != null),
    },
  }))
  log(`  ${patches.length} occupations with interest data`)
  if (opts.dryRun || !client) return

  for (let i = 0; i < patches.length; i += PATCHES_PER_TRANSACTION) {
    const tx = client.transaction()
    for (const p of patches.slice(i, i + PATCHES_PER_TRANSACTION)) {
      tx.patch(p.id, (patch) => patch.set({interestProfile: p.interestProfile}))
    }
    await tx.commit({visibility: 'async'})
    process.stdout.write(`  … ${Math.min(i + PATCHES_PER_TRANSACTION, patches.length)}/${patches.length}\r`)
  }
  process.stdout.write('\n')
}
