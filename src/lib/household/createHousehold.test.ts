import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createHousehold } from './createHousehold'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

let institutionId: string

async function signedInClient() {
  const email = `hh-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await admin.auth.admin.createUser({ email, password: 'test-password-123', email_confirm: true })
  const c = createClient(URL, ANON, { auth: { persistSession: false } })
  await c.auth.signInWithPassword({ email, password: 'test-password-123' })
  return c
}

beforeAll(async () => {
  const { data } = await admin.from('institutions')
    .upsert({ semel: 'hh-inst-1', type: 'gan', name: 'גן בדיקה', city: 'רעננה', is_verified: true }, { onConflict: 'semel' })
    .select().single()
  institutionId = data!.id
})

describe('createHousehold', () => {
  it('creates household, members and enrollments atomically', async () => {
    const c = await signedInClient()
    const { householdId } = await createHousehold(c, {
      displayName: 'משפחת בדיקה',
      adults: [{ firstName: 'נדב' }],
      children: [{ firstName: 'מאיה', birthYear: 2019, institutionId, classRef: 'א' }],
    })
    expect(householdId).toMatch(/^[0-9a-f-]{36}$/)

    const { data: members } = await c.from('members').select('role, first_name')
    expect(members).toHaveLength(2)

    const { data: enrollments } = await c.from('enrollments').select('class_ref')
    expect(enrollments).toHaveLength(1)
    expect(enrollments![0]!.class_ref).toBe('א')
  })

  it('rejects a second household for the same user', async () => {
    const c = await signedInClient()
    await createHousehold(c, { displayName: 'ראשונה', adults: [{ firstName: 'א' }], children: [] })
    await expect(
      createHousehold(c, { displayName: 'שנייה', adults: [{ firstName: 'ב' }], children: [] }),
    ).rejects.toThrow(/already belongs/)
  })

  it('rolls back entirely when a child references a missing institution', async () => {
    const c = await signedInClient()
    await expect(
      createHousehold(c, {
        displayName: 'נכשלת',
        adults: [{ firstName: 'א' }],
        children: [{ firstName: 'ב', birthYear: 2019, institutionId: '00000000-0000-0000-0000-000000000000', classRef: null }],
      }),
    ).rejects.toThrow()

    const { data: members } = await c.from('members').select('id')
    expect(members).toEqual([])
  })
})

// create_household is `security definer` and directly callable by any
// authenticated client via `.rpc()` -- the Zod schema in createHousehold.ts
// is a convenience guard, not the security boundary. These tests call the
// RPC directly (bypassing createHousehold()/Zod) to exercise that boundary.
// See migration 0009_household_payload_validation.sql.
const FORBIDDEN_LEAK = /relation|column|members|enrollments|households/i

describe('create_household RPC payload validation (security boundary)', () => {
  it('rejects a wrong-shaped adult without leaking internal schema details', async () => {
    const c = await signedInClient()
    const { data, error } = await c.rpc('create_household', {
      p_display_name: 'שגוי',
      p_adults: [{ notFirstName: 'x' }],
      p_children: [],
    })
    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(error!.message).not.toMatch(FORBIDDEN_LEAK)

    const { data: members } = await c.from('members').select('id')
    expect(members).toEqual([])
  })

  it('rejects a child missing birthYear without leaking internal schema details', async () => {
    const c = await signedInClient()
    const { data, error } = await c.rpc('create_household', {
      p_display_name: 'שגוי',
      p_adults: [{ firstName: 'א' }],
      p_children: [{ firstName: 'ב', institutionId, classRef: null }],
    })
    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(error!.message).not.toMatch(FORBIDDEN_LEAK)

    const { data: members } = await c.from('members').select('id')
    expect(members).toEqual([])
  })

  it('rejects a child with a non-uuid institutionId without leaking internal schema details', async () => {
    const c = await signedInClient()
    const { data, error } = await c.rpc('create_household', {
      p_display_name: 'שגוי',
      p_adults: [{ firstName: 'א' }],
      p_children: [{ firstName: 'ב', birthYear: 2019, institutionId: 'not-a-uuid', classRef: null }],
    })
    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(error!.message).not.toMatch(FORBIDDEN_LEAK)

    const { data: members } = await c.from('members').select('id')
    expect(members).toEqual([])
  })

  it('rejects a child with a non-integer birthYear without leaking internal schema details', async () => {
    const c = await signedInClient()
    const { data, error } = await c.rpc('create_household', {
      p_display_name: 'שגוי',
      p_adults: [{ firstName: 'א' }],
      p_children: [{ firstName: 'ב', birthYear: 2019.5, institutionId, classRef: null }],
    })
    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(error!.message).not.toMatch(FORBIDDEN_LEAK)

    const { data: members } = await c.from('members').select('id')
    expect(members).toEqual([])
  })

  it('still succeeds for a well-shaped payload called directly through rpc', async () => {
    const c = await signedInClient()
    const { data, error } = await c.rpc('create_household', {
      p_display_name: 'תקין',
      p_adults: [{ firstName: 'א' }],
      p_children: [{ firstName: 'ב', birthYear: 2019, institutionId, classRef: null }],
    })
    expect(error).toBeNull()
    expect(data).toMatch(/^[0-9a-f-]{36}$/)
  })
})
