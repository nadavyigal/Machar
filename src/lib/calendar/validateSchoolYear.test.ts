import { describe, it, expect } from 'vitest'
import { validateSchoolYear } from './validateSchoolYear'
import { SYNTHETIC_YEAR } from './fixtures/synthetic-year'

describe('validateSchoolYear', () => {
  it('accepts a well-formed year', () => {
    expect(validateSchoolYear(SYNTHETIC_YEAR)).toEqual([])
  })

  it('rejects a term that ends before it starts', () => {
    const bad = { ...SYNTHETIC_YEAR, terms: { ...SYNTHETIC_YEAR.terms, school: { start: '2027-06-20', end: '2026-09-01' } } }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('term_inverted')
  })

  it('rejects a closure whose range is inverted', () => {
    const bad = { ...SYNTHETIC_YEAR, closures: [{ key: 'x', name: 'x', from: '2026-10-12', to: '2026-10-05', levels: ['school' as const] }] }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('closure_inverted')
  })

  it('rejects a closure that falls outside every term', () => {
    const bad = { ...SYNTHETIC_YEAR, closures: [{ key: 'x', name: 'x', from: '2025-01-01', to: '2025-01-02', levels: ['school' as const] }] }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('closure_out_of_term')
  })

  it('rejects duplicate keys', () => {
    const bad = { ...SYNTHETIC_YEAR, closures: [...SYNTHETIC_YEAR.closures, SYNTHETIC_YEAR.closures[0]!] }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('duplicate_key')
  })

  it('rejects an entry with an empty level list', () => {
    const bad = { ...SYNTHETIC_YEAR, shortDays: [{ key: 'x', name: 'x', date: '2026-10-04', levels: [] }] }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('no_levels')
  })

  it('rejects a malformed date', () => {
    const bad = { ...SYNTHETIC_YEAR, shortDays: [{ key: 'x', name: 'x', date: '4/10/2026', levels: ['gan' as const] }] }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('bad_date_format')
  })

  it('rejects a school-only closure dated in the gan-only tail window (per-level term check)', () => {
    // school term ends 2027-06-20, gan term ends 2027-06-30 (see SYNTHETIC_YEAR).
    // A closure tagged school-only dated 2027-06-25 is after school's term end
    // but before gan's later end -- must be flagged against school's own bounds,
    // not the union of both levels' terms.
    const bad = {
      ...SYNTHETIC_YEAR,
      closures: [{ key: 'x', name: 'x', from: '2027-06-25', to: '2027-06-25', levels: ['school' as const] }],
    }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('closure_out_of_term')
  })

  it('accepts the same tail-window date when tagged gan-only (fix is per-level, not a global tightening)', () => {
    const ok = {
      ...SYNTHETIC_YEAR,
      closures: [{ key: 'x', name: 'x', from: '2027-06-25', to: '2027-06-25', levels: ['gan' as const] }],
    }
    expect(validateSchoolYear(ok)).toEqual([])
  })

  it('rejects a short day dated in the gan-only tail window when tagged school-only', () => {
    const bad = {
      ...SYNTHETIC_YEAR,
      shortDays: [{ key: 'x', name: 'x', date: '2027-06-25', levels: ['school' as const] }],
    }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('short_day_out_of_term')
  })

  it('accepts the same short-day tail-window date when tagged gan-only', () => {
    const ok = {
      ...SYNTHETIC_YEAR,
      shortDays: [{ key: 'x', name: 'x', date: '2027-06-25', levels: ['gan' as const] }],
    }
    expect(validateSchoolYear(ok)).toEqual([])
  })

  it('rejects a closure tagged both levels only when out of term for BOTH (in-term for one is not enough)', () => {
    // 2027-06-25 is out of school's term but in gan's term. Tagging both levels
    // means it must be in-term for both, so this should still fail for school.
    const bad = {
      ...SYNTHETIC_YEAR,
      closures: [{ key: 'x', name: 'x', from: '2027-06-25', to: '2027-06-25', levels: ['school' as const, 'gan' as const] }],
    }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('closure_out_of_term')
  })

  it('rejects a date with an out-of-range day-of-month (2026-11-31 does not exist)', () => {
    const bad = {
      ...SYNTHETIC_YEAR,
      shortDays: [{ key: 'x', name: 'x', date: '2026-11-31', levels: ['gan' as const] }],
    }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('bad_date_format')
  })

  it('rejects a date with an out-of-range month (2026-13-45)', () => {
    const bad = {
      ...SYNTHETIC_YEAR,
      shortDays: [{ key: 'x', name: 'x', date: '2026-13-45', levels: ['gan' as const] }],
    }
    expect(validateSchoolYear(bad).map((i) => i.code)).toContain('bad_date_format')
  })
})
