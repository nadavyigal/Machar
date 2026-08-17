import { describe, it, expect } from 'vitest'
import { validateSchoolYear } from '../validateSchoolYear'
import { SCHOOL_YEAR_2026_2027 as Y } from './2026-2027'

describe('2026-2027 school year data', () => {
  it('is internally consistent', () => {
    expect(validateSchoolYear(Y)).toEqual([])
  })

  it('has a gan year that ends no earlier than the school year', () => {
    expect(Y.terms.gan.end >= Y.terms.school.end).toBe(true)
  })

  it('covers the major holidays', () => {
    const keys = Y.closures.map((c) => c.key)
    for (const k of ['rosh_hashana', 'yom_kippur', 'sukkot', 'hanukkah', 'purim', 'pesach', 'yom_haatzmaut', 'shavuot']) {
      expect(keys).toContain(k)
    }
  })

  it('has at least one short day', () => {
    expect(Y.shortDays.length).toBeGreaterThan(0)
  })

  it('has no closure longer than 30 days', () => {
    for (const c of Y.closures) {
      const days = (Date.parse(c.to) - Date.parse(c.from)) / 86_400_000
      expect(days).toBeLessThanOrEqual(30)
    }
  })
})
