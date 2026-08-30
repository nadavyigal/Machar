export type InstitutionType = 'gan' | 'elementary' | 'middle' | 'high'

export type InstitutionRecord = {
  semel: string
  name: string
  city: string | null
  type: InstitutionType
}

export type SkippedRow = {
  line: number
  reason: 'missing_semel' | 'missing_name' | 'unknown_type'
}

const TYPE_MAP: Record<string, InstitutionType> = {
  'גן ילדים': 'gan',
  'גן': 'gan',
  'יסודי': 'elementary',
  'חטיבת ביניים': 'middle',
  'על יסודי': 'high',
  'תיכון': 'high',
}

function splitCsvLine(line: string): string[] {
  return line.split(',').map((c) => c.trim())
}

export function parseRegistry(csv: string): { rows: InstitutionRecord[]; skipped: SkippedRow[] } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '')
  const rows: InstitutionRecord[] = []
  const skipped: SkippedRow[] = []
  if (lines.length === 0) return { rows, skipped }

  const header = splitCsvLine(lines[0]!)
  const idx = {
    semel: header.indexOf('semel'),
    name: header.indexOf('shem_mosad'),
    city: header.indexOf('shem_yishuv'),
    type: header.indexOf('sug_chinuch'),
  }
  if (idx.semel < 0 || idx.name < 0 || idx.type < 0) return { rows, skipped }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!)
    const semel = cells[idx.semel] ?? ''
    const name = cells[idx.name] ?? ''
    const rawType = cells[idx.type] ?? ''

    if (semel === '') { skipped.push({ line: i + 1, reason: 'missing_semel' }); continue }
    if (name === '') { skipped.push({ line: i + 1, reason: 'missing_name' }); continue }

    const type = TYPE_MAP[rawType]
    if (!type) { skipped.push({ line: i + 1, reason: 'unknown_type' }); continue }

    const city = idx.city >= 0 ? (cells[idx.city] ?? '') : ''
    rows.push({ semel, name, city: city === '' ? null : city, type })
  }

  return { rows, skipped }
}
