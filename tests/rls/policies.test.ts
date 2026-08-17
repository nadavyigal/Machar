import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Unique per test-process run, the same way makeHousehold() below already
// disambiguates emails with Date.now(). Fixtures that hit a unique
// constraint (institutions.semel, events.external_key) are suffixed with
// this so the suite can run twice back to back without an intervening
// `pnpm supabase db reset`.
const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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

// Counter + RUN_ID keeps institutions.semel unique both within a single run
// (multiple institutions per test) and across repeated runs without a reset.
let institutionCounter = 0
async function makeInstitution(namePrefix: string): Promise<string> {
  institutionCounter += 1
  const { data, error } = await admin.from('institutions')
    .insert({ type: 'gan', name: `${namePrefix} בדיקה`, semel: `test-${RUN_ID}-${institutionCounter}` })
    .select().single()
  if (error) throw error
  return data!.id
}

async function enroll(memberId: string, institutionId: string, classRef: string | null): Promise<string> {
  const { data, error } = await admin.from('enrollments')
    .insert({ member_id: memberId, institution_id: institutionId, class_ref: classRef })
    .select().single()
  if (error) throw error
  return data!.id
}

let a: Awaited<ReturnType<typeof makeHousehold>>
let b: Awaited<ReturnType<typeof makeHousehold>>

beforeAll(async () => {
  a = await makeHousehold('alpha')
  b = await makeHousehold('beta')
})

describe('household isolation', () => {
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

describe('event scope isolation', () => {
  it('a household cannot read another household events', async () => {
    await admin.from('events').insert({
      scope: 'household', household_id: b.householdId,
      title: 'סוד', kind: 'appointment', starts_on: '2026-09-10',
    })
    const { data } = await a.client.from('events').select('id').eq('scope', 'household')
    expect(data).toEqual([])
  })

  it('every signed-in household reads national events', async () => {
    await admin.from('events').insert({
      scope: 'national', title: 'ראש השנה', kind: 'closure',
      starts_on: '2026-09-12', external_key: `test-rosh-hashana-${RUN_ID}`,
    })
    const { data } = await a.client.from('events').select('id').eq('scope', 'national')
    expect(data?.length).toBeGreaterThan(0)
  })

  it('a household cannot read class events for an institution it is not enrolled in', async () => {
    const { data: inst } = await admin.from('institutions')
      .insert({ type: 'gan', name: 'גן בדיקה', semel: `test-${RUN_ID}-9999` }).select().single()
    const { data: inserted, error: insertErr } = await admin.from('events').insert({
      scope: 'class', institution_id: inst!.id, class_ref: 'א',
      title: 'טיול', kind: 'announcement', starts_on: '2026-10-01',
    }).select().single()
    if (insertErr) throw insertErr

    // Confirm the row actually exists (via service_role, which bypasses RLS)
    // before asserting the anon client can't see it -- otherwise an empty
    // result here would be indistinguishable from "the insert never happened".
    const { data: confirmed, error: confirmErr } = await admin
      .from('events').select('id').eq('id', inserted!.id).single()
    if (confirmErr) throw confirmErr
    expect(confirmed?.id).toBe(inserted!.id)

    const { data } = await a.client.from('events').select('id').eq('scope', 'class')
    expect(data).toEqual([])
  })
})

// PostgREST reports a blocked INSERT as error 42501 (insufficient_privilege),
// because there is no row yet for RLS to filter -- the attempted row itself
// violates WITH CHECK. A cross-household UPDATE/DELETE is different: the
// USING clause simply excludes the target row from the query's working set
// before any write happens, so PostgREST executes an UPDATE/DELETE that
// matches zero rows and returns `data: [], error: null`. A blocked INSERT
// and a filtered UPDATE/DELETE are NOT the same failure shape.
// `expect(error).not.toBeNull()` copy-pasted onto these tests would pass
// even if the members/enrollments RLS policies were deleted entirely --
// the `.eq('id', ...)` filter would still only ever match the one row
// requested, so there would be nothing to null-check against. These tests
// must assert on the *returned rows* (empty array = RLS filtered the row
// out) and independently confirm via the service-role client that the
// target household's data was genuinely left untouched. Do not "simplify"
// this back to an error-based assertion.
describe('cross-household UPDATE/DELETE (RLS filters silently, does not error)', () => {
  it('a household cannot update another household member', async () => {
    const { data, error } = await a.client.from('members')
      .update({ first_name: 'נחטף' })
      .eq('id', b.memberId)
      .select()
    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: check } = await admin.from('members').select('first_name').eq('id', b.memberId).single()
    expect(check?.first_name).not.toBe('נחטף')
  })

  it('a household cannot delete another household member', async () => {
    const { data, error } = await a.client.from('members')
      .delete()
      .eq('id', b.memberId)
      .select()
    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: check } = await admin.from('members').select('id').eq('id', b.memberId).single()
    expect(check?.id).toBe(b.memberId)
  })

  it("a household cannot update another household's enrollment", async () => {
    const institutionId = await makeInstitution('בית ספר')
    const enrollmentId = await enroll(b.memberId, institutionId, 'א')

    const { data, error } = await a.client.from('enrollments')
      .update({ class_ref: 'ב' })
      .eq('id', enrollmentId)
      .select()
    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: check } = await admin.from('enrollments').select('class_ref').eq('id', enrollmentId).single()
    expect(check?.class_ref).toBe('א')
  })

  it("a household cannot delete another household's enrollment", async () => {
    const institutionId = await makeInstitution('בית ספר')
    const enrollmentId = await enroll(b.memberId, institutionId, 'א')

    const { data, error } = await a.client.from('enrollments')
      .delete()
      .eq('id', enrollmentId)
      .select()
    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: check } = await admin.from('enrollments').select('id').eq('id', enrollmentId).single()
    expect(check?.id).toBe(enrollmentId)
  })
})

describe('household/member reassignment across the boundary', () => {
  it("a household cannot repoint its own member's household_id into another household via UPDATE", async () => {
    // Empirically (confirmed against this schema, not assumed): the USING
    // clause passes here because the row's *current* household_id is a's,
    // which is in auth_household_ids() -- the row is visible and matched.
    // WITH CHECK then evaluates the *modified* row and rejects it (the new
    // household_id is b's, not in auth_household_ids()), so this raises an
    // RLS error (42501) rather than silently filtering to zero rows, unlike
    // the cross-household UPDATE/DELETE tests above where the row was never
    // visible to begin with.
    const { data, error } = await a.client.from('members')
      .update({ household_id: b.householdId })
      .eq('id', a.memberId)
      .select()
    expect(data).toBeNull()
    expect(error).not.toBeNull()
    expect(error?.code).toBe('42501')

    const { data: check } = await admin.from('members').select('household_id').eq('id', a.memberId).single()
    expect(check?.household_id).toBe(a.householdId)

    const { data: bMembers } = await admin.from('members').select('id').eq('household_id', b.householdId)
    expect(bMembers?.map((m) => m.id)).not.toContain(a.memberId)
  })

  it('a household cannot repoint its own households row id into another household via UPDATE', async () => {
    // Same WITH-CHECK-after-USING shape as the members case above: the
    // current row (id = a's household) is visible under USING, but the
    // modified row (id = b's household) fails WITH CHECK because b's id is
    // not in auth_household_ids(). Confirmed empirically to raise 42501
    // rather than colliding on the primary key first or filtering silently.
    const { data, error } = await a.client.from('households')
      .update({ id: b.householdId })
      .eq('id', a.householdId)
      .select()
    expect(data).toBeNull()
    expect(error).not.toBeNull()
    expect(error?.code).toBe('42501')

    const { data: checkA } = await admin.from('households').select('id').eq('id', a.householdId).single()
    expect(checkA?.id).toBe(a.householdId)

    const { data: checkB } = await admin.from('households').select('id, display_name').eq('id', b.householdId).single()
    expect(checkB?.id).toBe(b.householdId)
    expect(checkB?.display_name).toBe('beta')
  })
})

describe('institution-scope and NULL class_ref isolation', () => {
  it('a household enrolled at school Y cannot read an institution-scope event at school X', async () => {
    const schoolX = await makeInstitution('בית ספר X')
    const schoolY = await makeInstitution('בית ספר Y')
    await enroll(a.memberId, schoolY, 'א')

    const { data: inserted, error: insertErr } = await admin.from('events').insert({
      scope: 'institution', institution_id: schoolX,
      title: 'הודעת בית ספר', kind: 'announcement', starts_on: '2026-11-01',
    }).select().single()
    if (insertErr) throw insertErr

    const { data: confirmed } = await admin.from('events').select('id').eq('id', inserted!.id).single()
    expect(confirmed?.id).toBe(inserted!.id)

    const { data } = await a.client.from('events').select('id').eq('id', inserted!.id)
    expect(data).toEqual([])
  })

  it('a NULL class_ref enrollment does not act as a wildcard for class events, but still sees institution events at that school', async () => {
    const schoolZ = await makeInstitution('בית ספר Z')
    // class_ref: null -- e.g. an enrollment recorded before a specific class
    // assignment is known. This must not read as "sees every class".
    await enroll(a.memberId, schoolZ, null)

    const { data: classEvent, error: classErr } = await admin.from('events').insert({
      scope: 'class', institution_id: schoolZ, class_ref: 'ג',
      title: 'מסיבת כיתה', kind: 'announcement', starts_on: '2026-11-05',
    }).select().single()
    if (classErr) throw classErr

    const { data: instEvent, error: instErr } = await admin.from('events').insert({
      scope: 'institution', institution_id: schoolZ,
      title: 'ישיבת הורים', kind: 'announcement', starts_on: '2026-11-06',
    }).select().single()
    if (instErr) throw instErr

    const { data: classConfirmed } = await admin.from('events').select('id').eq('id', classEvent!.id).single()
    expect(classConfirmed?.id).toBe(classEvent!.id)
    const { data: instConfirmed } = await admin.from('events').select('id').eq('id', instEvent!.id).single()
    expect(instConfirmed?.id).toBe(instEvent!.id)

    const { data: classRead } = await a.client.from('events').select('id').eq('id', classEvent!.id)
    expect(classRead).toEqual([])

    const { data: instRead } = await a.client.from('events').select('id').eq('id', instEvent!.id)
    expect(instRead?.length).toBe(1)
  })
})
