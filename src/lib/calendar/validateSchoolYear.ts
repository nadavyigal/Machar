import type { SchoolLevel, SchoolYear, ValidationIssue } from './types'

// NOTE: this module checks dates via Date.parse (after a real-calendar-validity
// check), while resolveDay.ts compares ISO YYYY-MM-DD strings directly via plain
// string comparison. The two are NOT interchangeable once malformed input is
// possible -- Date.parse silently rolls invalid dates forward (e.g. day 31 of a
// 30-day month) or yields NaN, either of which can make an out-of-range check
// pass. isValidIsoDate() below exists to close that hole before any comparison.
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const LEVELS: SchoolLevel[] = ['gan', 'school']

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isValidIsoDate(value: string): boolean {
  const match = ISO.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12) return false
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const maxDay = month === 2 && !isLeap ? 28 : DAYS_IN_MONTH[month - 1]!
  if (day < 1 || day > maxDay) return false
  return true
}

export function validateSchoolYear(year: SchoolYear): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()

  for (const level of LEVELS) {
    const t = year.terms[level]
    if (!isValidIsoDate(t.start) || !isValidIsoDate(t.end)) {
      issues.push({ code: 'bad_date_format', detail: `term ${level}` })
    } else if (t.end < t.start) {
      issues.push({ code: 'term_inverted', detail: `term ${level}: ${t.start} > ${t.end}` })
    }
  }

  // Per-level term bounds: an entry tagged with a given level must be in-term
  // for THAT level's own bounds, not the union across gan and school. Gan and
  // school terms diverge (e.g. gan's tail runs later than school's) and that
  // divergence is exactly what this module exists to model.
  const termBounds: Record<SchoolLevel, { start: number; end: number } | null> = {
    gan: null,
    school: null,
  }
  for (const level of LEVELS) {
    const t = year.terms[level]
    if (isValidIsoDate(t.start) && isValidIsoDate(t.end)) {
      termBounds[level] = { start: Date.parse(t.start), end: Date.parse(t.end) }
    }
  }

  for (const c of year.closures) {
    if (seen.has(c.key)) issues.push({ code: 'duplicate_key', detail: c.key })
    seen.add(c.key)
    if (c.levels.length === 0) issues.push({ code: 'no_levels', detail: c.key })
    if (!isValidIsoDate(c.from) || !isValidIsoDate(c.to)) {
      issues.push({ code: 'bad_date_format', detail: c.key })
      continue
    }
    if (c.to < c.from) issues.push({ code: 'closure_inverted', detail: c.key })
    const from = Date.parse(c.from)
    const to = Date.parse(c.to)
    const outOfTerm = c.levels.some((level) => {
      const bounds = termBounds[level]
      if (!bounds) return false
      return to < bounds.start || from > bounds.end
    })
    if (outOfTerm) issues.push({ code: 'closure_out_of_term', detail: c.key })
  }

  for (const s of year.shortDays) {
    if (seen.has(s.key)) issues.push({ code: 'duplicate_key', detail: s.key })
    seen.add(s.key)
    if (s.levels.length === 0) issues.push({ code: 'no_levels', detail: s.key })
    if (!isValidIsoDate(s.date)) {
      issues.push({ code: 'bad_date_format', detail: s.key })
      continue
    }
    const date = Date.parse(s.date)
    const outOfTerm = s.levels.some((level) => {
      const bounds = termBounds[level]
      if (!bounds) return false
      return date < bounds.start || date > bounds.end
    })
    if (outOfTerm) issues.push({ code: 'short_day_out_of_term', detail: s.key })
  }

  return issues
}
