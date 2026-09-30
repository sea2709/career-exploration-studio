#!/usr/bin/env tsx
/**
 * Import O*NET 31.0 tabular text files into Sanity.
 *
 * Usage:
 *   npm run import:onet -- --dry-run
 *   npm run import:onet -- --limit 50
 *   npm run import:onet -- --phases details
 *   npm run import:onet -- --phases interests
 *   npm run import:onet -- --occupations 15-1252.00,11-1011.00
 *   npm run import:onet -- --rating-domains essentialSkills,knowledge
 *   npm run import:onet -- --all-ratings   # includes workContext (~305k rows)
 *
 * Only reference tables and occupations become documents; per-occupation rows are
 * embedded as arrays on onetOccupation (phase "details").
 */
import {getWriteClient} from './client'
import {
  DEFAULT_PHASES,
  DEFAULT_RATING_DOMAINS,
  RATING_DOMAIN_FILES,
  runImport,
  type ImportPhase,
} from './import'

function parseArgs(argv: string[]) {
  const flags = new Map<string, string | boolean>()
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      flags.set(key, true)
    } else {
      flags.set(key, next)
      i++
    }
  }
  return flags
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))

  if (flags.has('help') || flags.has('h')) {
    console.log(`Import O*NET 31.0 into Sanity

Options:
  --dry-run                 Count creates/updates without writing
  --limit <n>               Max rows per source file (smoke test)
  --phases <list>           Comma-separated: ${DEFAULT_PHASES.join(', ')}
  --occupations <codes>     Comma-separated O*NET-SOC codes to include
  --rating-domains <list>   Default: ${DEFAULT_RATING_DOMAINS.join(', ')}
  --all-ratings             Include workContext (~305k rows, roughly doubles occupation size)
  --help                    Show this help
`)
    return
  }

  const dryRun = Boolean(flags.get('dry-run'))
  const limit = flags.has('limit') ? Number(flags.get('limit')) : undefined

  const phases = flags.has('phases')
    ? String(flags.get('phases'))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as ImportPhase[]
    : DEFAULT_PHASES

  let ratingDomains = flags.has('rating-domains')
    ? String(flags.get('rating-domains'))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [...DEFAULT_RATING_DOMAINS]

  if (flags.get('all-ratings')) {
    ratingDomains = Object.keys(RATING_DOMAIN_FILES)
  }

  const occupationFilter = flags.has('occupations')
    ? new Set(
        String(flags.get('occupations'))
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : undefined

  const client = getWriteClient()

  console.log(
    `Target: ${process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'rhq335ze'}/${process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production'}`,
  )

  await runImport(client, {
    dryRun,
    limit: Number.isFinite(limit) ? limit : undefined,
    phases,
    ratingDomains,
    occupationFilter,
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
