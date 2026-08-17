import { describe, it, expect } from 'vitest'
import { todayInJerusalem, toIsoDate } from './time'

describe('toIsoDate', () => {
  it('formats a date in Asia/Jerusalem, not UTC', () => {
    // 2026-09-01T22:30:00Z is 2026-09-02 01:30 in Jerusalem
    expect(toIsoDate(new Date('2026-09-01T22:30:00Z'))).toBe('2026-09-02')
  })

  it('formats a mid-day date unambiguously', () => {
    expect(toIsoDate(new Date('2026-09-01T09:00:00Z'))).toBe('2026-09-01')
  })
})

describe('todayInJerusalem', () => {
  it('returns an ISO date string', () => {
    expect(todayInJerusalem()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
