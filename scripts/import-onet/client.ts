import {createClient, type SanityClient} from '@sanity/client'
import {config as loadEnv} from 'dotenv'
import {homedir} from 'node:os'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

loadEnv({path: resolve(process.cwd(), '.env')})
loadEnv({path: resolve(process.cwd(), '.env.local')})

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'rhq335ze'
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production'

function readCliAuthToken(): string | undefined {
  try {
    const configPath = resolve(homedir(), '.config/sanity/config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {authToken?: string}
    return config.authToken || undefined
  } catch {
    return undefined
  }
}

const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN || readCliAuthToken()

export function getAuthToken(): string {
  if (!token) {
    throw new Error(
      'No Sanity auth found. Run `pnpm exec sanity login`, or set SANITY_API_WRITE_TOKEN in studio/.env',
    )
  }
  return token
}

export function getProjectDataset(): {projectId: string; dataset: string} {
  return {projectId, dataset}
}

export function getWriteClient(): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    token: getAuthToken(),
    useCdn: false,
  })
}

export function getDataDir(): string {
  return (
    process.env.ONET_DATA_DIR ||
    resolve(process.cwd(), 'data/onet-31.0/db_31_0_text')
  )
}
