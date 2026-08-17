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
})
