import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createHousehold } from '../../src/lib/household/createHousehold'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

// Unique per invocation, same disambiguation pattern as createHousehold.test.ts
// and tests/rls/policies.test.ts's RUN_ID — keeps the suite idempotent across
// repeated runs without a `db reset`.
async function signedInClient() {
  const email = `hh-inv-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await admin.auth.admin.createUser({ email, password: 'test-password-123', email_confirm: true })
  const c = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data } = await c.auth.signInWithPassword({ email, password: 'test-password-123' })
  return { client: c, userId: data.user!.id }
}

describe('create_household invariants (schema-level, not just the wrapper)', () => {
  it('allows exactly one of two concurrent create_household calls for the same user to succeed', async () => {
    const { client, userId } = await signedInClient()

    const results = await Promise.allSettled([
      createHousehold(client, { displayName: 'מקבילה א', adults: [{ firstName: 'א' }], children: [] }),
      createHousehold(client, { displayName: 'מקבילה ב', adults: [{ firstName: 'ב' }], children: [] }),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)

    const { data: memberships, error } = await admin
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
    expect(error).toBeNull()
    expect(memberships).toHaveLength(1)
  })

  it('rejects the RPC directly when p_adults is empty, bypassing the Zod wrapper', async () => {
    const { client, userId } = await signedInClient()

    const { data, error } = await client.rpc('create_household', {
      p_display_name: 'ללא מבוגרים',
      p_adults: [],
      p_children: [],
    })

    expect(error).not.toBeNull()
    expect(data).toBeNull()

    const { data: memberships } = await admin
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
    expect(memberships).toEqual([])

    const { data: households } = await admin
      .from('households')
      .select('id')
      .eq('display_name', 'ללא מבוגרים')
    expect(households).toEqual([])
  })
})
