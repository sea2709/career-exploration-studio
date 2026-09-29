import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline'
import {join} from 'node:path'

export type Row = Record<string, string>

/** Parse O*NET tab-delimited text files (header row + tab-separated values). */
export async function* readOnetFile(dataDir: string, filename: string): AsyncGenerator<Row> {
  const path = join(dataDir, filename)
  const rl = createInterface({
    input: createReadStream(path, {encoding: 'utf8'}),
    crlfDelay: Infinity,
  })

  let headers: string[] | null = null

  for await (const line of rl) {
    if (!line.trim()) continue
    const cols = line.split('\t')
    if (!headers) {
      headers = cols.map((h) => h.replace(/^\uFEFF/, '').trim())
      continue
    }

    const row: Row = {}
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = (cols[i] ?? '').trim()
    }
    yield row
  }
}

export async function collectRows(
  dataDir: string,
  filename: string,
  limit?: number,
): Promise<Row[]> {
  const rows: Row[] = []
  for await (const row of readOnetFile(dataDir, filename)) {
    rows.push(row)
    if (limit != null && rows.length >= limit) break
  }
  return rows
}

/** Convert O*NET Date values like "08/2023" to Sanity date "2023-08-01". */
export function parseOnetDate(value: string | undefined): string | undefined {
  if (!value || value === 'n/a') return undefined
  const m = value.match(/^(\d{1,2})\/(\d{4})$/)
  if (m) {
    return `${m[2]}-${m[1].padStart(2, '0')}-01`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return undefined
}

export function parseNumber(value: string | undefined): number | undefined {
  if (value == null || value === '' || value === 'n/a') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function parseYesNo(value: string | undefined): 'Y' | 'N' | undefined {
  if (value === 'Y' || value === 'N') return value
  return undefined
}

export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as Partial<T>
}

export function ref(id: string): {_type: 'reference'; _ref: string} {
  return {_type: 'reference', _ref: id}
}
