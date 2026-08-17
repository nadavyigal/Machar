import { createClient } from '@supabase/supabase-js'
import { SCHOOL_YEAR_2026_2027 as Y } from '../src/lib/calendar/data/2026-2027'
import { validateSchoolYear } from '../src/lib/calendar/validateSchoolYear'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

const admin = createClient(url, key, { auth: { persistSession: false } })

const TYPES_FOR_LEVEL = {
  gan: ['gan'],
  school: ['elementary', 'middle', 'high'],
} as const

async function main() {
  const issues = validateSchoolYear(Y)
  if (issues.length > 0) {
    console.error('school year failed validation, refusing to seed:', issues)
    process.exit(1)
  }

  const rows = [
    ...Y.closures.map((c) => ({
      scope: 'national' as const,
      title: c.name,
      kind: 'closure' as const,
      starts_on: c.from,
      ends_on: c.to,
      applies_to_types: c.levels.flatMap((l) => TYPES_FOR_LEVEL[l]),
      external_key: `${Y.label}:closure:${c.key}`,
    })),
    ...Y.shortDays.map((s) => ({
      scope: 'national' as const,
      title: s.name,
      kind: 'short_day' as const,
      starts_on: s.date,
      ends_on: null,
      applies_to_types: s.levels.flatMap((l) => TYPES_FOR_LEVEL[l]),
      external_key: `${Y.label}:short:${s.key}`,
    })),
  ]

  // NOTE: cannot use admin.from('events').upsert(rows, { onConflict: 'external_key' })
  // here. The events_national_key index (supabase/migrations/0003_events.sql) is a
  // PARTIAL unique index (`where scope = 'national'`), and Postgres requires an
  // ON CONFLICT clause to restate a partial index's predicate to target it -- the
  // supabase-js upsert() has no way to express that, so PostgREST's generated
  // `ON CONFLICT (external_key) DO UPDATE` fails with 42P10 (no matching
  // constraint). Upsert manually instead: look up existing rows by external_key,
  // update matches, insert the rest. Still idempotent across repeated runs.
  const externalKeys = rows.map((r) => r.external_key)
  const { data: existing, error: selectError } = await admin
    .from('events')
    .select('id, external_key')
    .eq('scope', 'national')
    .in('external_key', externalKeys)
  if (selectError) throw selectError

  const existingByKey = new Map((existing ?? []).map((r) => [r.external_key, r.id]))
  const toInsert = rows.filter((r) => !existingByKey.has(r.external_key))
  const toUpdate = rows.filter((r) => existingByKey.has(r.external_key))

  if (toInsert.length > 0) {
    const { error } = await admin.from('events').insert(toInsert)
    if (error) throw error
  }

  for (const row of toUpdate) {
    const id = existingByKey.get(row.external_key)
    const { error } = await admin.from('events').update(row).eq('id', id)
    if (error) throw error
  }

  console.log(`upserted ${rows.length} national events for ${Y.label}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
