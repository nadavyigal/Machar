// Generates ios/MacharCore/Sources/MacharCore/Resources/school-year-2026-2027.json
// from src/lib/calendar/data/2026-2027.ts, so the TypeScript file stays the single
// source of truth for the calendar and the iOS bundle is never hand-edited.
//
// Run: node scripts/exportSchoolYear.mjs
import { readFile, writeFile } from 'node:fs/promises'

const SRC = new URL('../src/lib/calendar/data/2026-2027.ts', import.meta.url)
const OUT = new URL(
  '../ios/MacharCore/Sources/MacharCore/Resources/school-year-2026-2027.json',
  import.meta.url,
)

const ts = await readFile(SRC, 'utf8')
const start = ts.indexOf('{', ts.indexOf('export const SCHOOL_YEAR_2026_2027'))
if (start === -1) throw new Error('exportSchoolYear: could not find the object literal')

const literal = ts
  .slice(start)
  .replace(/^\s*\/\/.*$/gm, '') // line comments only; no block comments in this file
  .trimEnd()
  .replace(/;?\s*$/, '')

const year = new Function(`return (${literal})`)()

for (const field of ['label', 'terms', 'closures', 'shortDays']) {
  if (year[field] === undefined) throw new Error(`exportSchoolYear: missing ${field}`)
}
if (!Array.isArray(year.closures) || year.closures.length === 0) {
  throw new Error('exportSchoolYear: closures did not parse')
}

await writeFile(OUT, `${JSON.stringify(year, null, 2)}\n`, 'utf8')
console.log(
  `exportSchoolYear: wrote ${year.closures.length} closures and ${year.shortDays.length} short days`,
)
