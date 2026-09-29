#!/usr/bin/env tsx
/**
 * Download and extract O*NET 31.0 text database into studio/data/
 */
import {createWriteStream, existsSync, mkdirSync} from 'node:fs'
import {pipeline} from 'node:stream/promises'
import {Readable} from 'node:stream'
import {resolve} from 'node:path'
import {execFileSync} from 'node:child_process'

const URL = 'https://www.onetcenter.org/dl_files/database/db_31_0_text.zip'
const DATA_ROOT = resolve(process.cwd(), 'data')
const ZIP_PATH = resolve(DATA_ROOT, 'db_31_0_text.zip')
const EXTRACT_DIR = resolve(DATA_ROOT, 'onet-31.0')

async function main() {
  mkdirSync(DATA_ROOT, {recursive: true})

  if (!existsSync(ZIP_PATH)) {
    console.log(`Downloading ${URL}`)
    const res = await fetch(URL)
    if (!res.ok || !res.body) {
      throw new Error(`Download failed: ${res.status} ${res.statusText}`)
    }
    await pipeline(Readable.fromWeb(res.body as never), createWriteStream(ZIP_PATH))
    console.log(`Saved ${ZIP_PATH}`)
  } else {
    console.log(`Using existing ${ZIP_PATH}`)
  }

  mkdirSync(EXTRACT_DIR, {recursive: true})
  console.log(`Extracting to ${EXTRACT_DIR}`)
  execFileSync('unzip', ['-o', ZIP_PATH, '-d', EXTRACT_DIR], {stdio: 'inherit'})
  console.log('Done. Data ready at data/onet-31.0/db_31_0_text/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
