import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

async function makeHousehold(name: string): Promise<{ client: SupabaseClient; householdId: string; memberId: string }> {
  const email = `${name}-${Date.now()}@example.test`
  const { data: user, error: uErr } = await admin.auth.admin.createUser({
    email, password: 'test-password-123', email_confirm: true,
  })
  if (uErr) throw uErr

  const { data: h, error: hErr } = await admin.from('households').insert({ display_name: name }).select().single()
  if (hErr) throw hErr
  await admin.from('household_members').insert({ household_id: h.id, user_id: user.user!.id })
  const { data: m } = await admin.from('members')
    .insert({ household_id: h.id, role: 'child', first_name: 'ילד', birth_year: 2019 })
    .select().single()

  const client = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({ email, password: 'test-password-123' })
  if (signInErr) throw signInErr
  if (!signIn.session) throw new Error(`sign-in for ${name} produced no session`)
  return { client, householdId: h.id, memberId: m!.id }
}

describe('household isolation', () => {
  let a: Awaited<ReturnType<typeof makeHousehold>>
  let b: Awaited<ReturnType<typeof makeHousehold>>

  beforeAll(async () => {
    a = await makeHousehold('alpha')
    b = await makeHousehold('beta')
  })

  it('a household cannot read another household row', async () => {
    const { data } = await a.client.from('households').select('id').eq('id', b.householdId)
    expect(data).toEqual([])
  })

  it('a household cannot read another household members', async () => {
    const { data } = await a.client.from('members').select('id').eq('id', b.memberId)
    expect(data).toEqual([])
  })

  it('a household cannot write a member into another household', async () => {
    const { error } = await a.client.from('members')
      .insert({ household_id: b.householdId, role: 'child', first_name: 'פולש', birth_year: 2018 })
    expect(error).not.toBeNull()
  })

  it('a signed-in household can read its own members', async () => {
    const { data } = await a.client.from('members').select('id')
    expect(data?.length).toBe(1)
  })
})
