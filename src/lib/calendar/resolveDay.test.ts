import { describe, it, expect } from 'vitest'
import { resolveDay } from './resolveDay'
import { SYNTHETIC_YEAR as Y } from './fixtures/synthetic-year'

describe('resolveDay', () => {
  it('is open on an ordinary Sunday', () => {
    // 2026-09-06 is a Sunday
    expect(resolveDay(Y, 'school', 'five_day', '2026-09-06')).toEqual({
      date: '2026-09-06', open: true, shortDay: false, reason: null,
    })
  })

  it('is closed on Saturday for every pattern', () => {
    // 2026-09-05 is a Saturday
    expect(resolveDay(Y, 'school', 'six_day', '2026-09-05').open).toBe(false)
    expect(resolveDay(Y, 'school', 'six_day', '2026-09-05').reason).toBe('שבת')
  })

  it('is closed on Friday under a five-day pattern and open under six-day', () => {
    // 2026-09-04 is a Friday
    expect(resolveDay(Y, 'school', 'five_day', '2026-09-04').open).toBe(false)
    expect(resolveDay(Y, 'school', 'six_day', '2026-09-04').open).toBe(true)
  })

  it('is closed inside a closure range, inclusive of both ends', () => {
    expect(resolveDay(Y, 'school', 'five_day', '2026-10-05').open).toBe(false)
    expect(resolveDay(Y, 'school', 'five_day', '2026-10-12').open).toBe(false)
    expect(resolveDay(Y, 'school', 'five_day', '2026-10-05').reason).toBe('סוכות')
  })

  it('applies a closure only to the levels it names', () => {
    expect(resolveDay(Y, 'school', 'five_day', '2026-11-02').open).toBe(false)
    expect(resolveDay(Y, 'gan', 'five_day', '2026-11-02').open).toBe(true)
  })

  it('marks a short day as open but short', () => {
    const d = resolveDay(Y, 'school', 'five_day', '2026-10-04')
    expect(d.open).toBe(true)
    expect(d.shortDay).toBe(true)
    expect(d.reason).toBe('ערב סוכות')
  })

  it('applies a short day only to the levels it names', () => {
    expect(resolveDay(Y, 'gan', 'five_day', '2026-11-10').shortDay).toBe(true)
    expect(resolveDay(Y, 'school', 'five_day', '2026-11-10').shortDay).toBe(false)
  })

  it('is closed before the term starts and after it ends', () => {
    expect(resolveDay(Y, 'school', 'five_day', '2026-08-31').open).toBe(false)
    expect(resolveDay(Y, 'school', 'five_day', '2027-06-22').open).toBe(false)
  })

  it('honours the gan and school term-end divergence', () => {
    // 2027-06-24 is a Thursday, after school ends but before gan ends
    expect(resolveDay(Y, 'school', 'five_day', '2027-06-24').open).toBe(false)
    expect(resolveDay(Y, 'gan', 'five_day', '2027-06-24').open).toBe(true)
  })

  it('gives closure precedence over short day when both match', () => {
    const withBoth: typeof Y = {
      ...Y,
      shortDays: [...Y.shortDays, { key: 'clash', name: 'התנגשות', date: '2026-10-06', levels: ['school'] }],
    }
    const d = resolveDay(withBoth, 'school', 'five_day', '2026-10-06')
    expect(d.open).toBe(false)
    expect(d.reason).toBe('סוכות')
  })
})
