import { describe, it, expect } from 'vitest'
import { buildHouseholdMonth } from './buildHouseholdMonth'
import { SYNTHETIC_YEAR as Y } from './fixtures/synthetic-year'

const children = [
  { memberId: 'c1', firstName: 'מאיה', level: 'gan' as const, weekPattern: 'five_day' as const },
  { memberId: 'c2', firstName: 'נעם', level: 'school' as const, weekPattern: 'five_day' as const },
]

describe('buildHouseholdMonth', () => {
  it('returns every day of the requested month', () => {
    const m = buildHouseholdMonth(Y, children, '2026-11')
    expect(m.days).toHaveLength(30)
    expect(m.days[0]!.date).toBe('2026-11-01')
    expect(m.days[29]!.date).toBe('2026-11-30')
  })

  it('handles a 31-day month', () => {
    expect(buildHouseholdMonth(Y, children, '2026-10').days).toHaveLength(31)
  })

  it('resolves each child independently', () => {
    const m = buildHouseholdMonth(Y, children, '2026-11')
    const nov2 = m.days.find((d) => d.date === '2026-11-02')!
    const gan = nov2.perChild.find((p) => p.memberId === 'c1')!
    const school = nov2.perChild.find((p) => p.memberId === 'c2')!
    expect(gan.status.open).toBe(true)
    expect(school.status.open).toBe(false)
  })

  it('flags a day where some but not all children are off', () => {
    const nov2 = buildHouseholdMonth(Y, children, '2026-11').days.find((d) => d.date === '2026-11-02')!
    expect(nov2.anyClosed).toBe(true)
    expect(nov2.allClosed).toBe(false)
  })

  it('flags a day where every child is off', () => {
    const oct6 = buildHouseholdMonth(Y, children, '2026-10').days.find((d) => d.date === '2026-10-06')!
    expect(oct6.allClosed).toBe(true)
  })

  it('returns an empty perChild list when the household has no children', () => {
    const m = buildHouseholdMonth(Y, [], '2026-11')
    expect(m.days[0]!.perChild).toEqual([])
    expect(m.days[0]!.anyClosed).toBe(false)
    expect(m.days[0]!.allClosed).toBe(false)
  })
})
