import type { SchoolLevel, SchoolYear, ValidationIssue } from './types'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const LEVELS: SchoolLevel[] = ['gan', 'school']

export function validateSchoolYear(year: SchoolYear): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()

  for (const level of LEVELS) {
    const t = year.terms[level]
    if (!ISO.test(t.start) || !ISO.test(t.end)) {
      issues.push({ code: 'bad_date_format', detail: `term ${level}` })
    } else if (t.end < t.start) {
      issues.push({ code: 'term_inverted', detail: `term ${level}: ${t.start} > ${t.end}` })
    }
  }

  const earliest = Math.min(...LEVELS.map((l) => Date.parse(year.terms[l].start)))
  const latest = Math.max(...LEVELS.map((l) => Date.parse(year.terms[l].end)))

  for (const c of year.closures) {
    if (seen.has(c.key)) issues.push({ code: 'duplicate_key', detail: c.key })
    seen.add(c.key)
    if (c.levels.length === 0) issues.push({ code: 'no_levels', detail: c.key })
    if (!ISO.test(c.from) || !ISO.test(c.to)) {
      issues.push({ code: 'bad_date_format', detail: c.key })
      continue
    }
    if (c.to < c.from) issues.push({ code: 'closure_inverted', detail: c.key })
    if (Date.parse(c.to) < earliest || Date.parse(c.from) > latest) {
      issues.push({ code: 'closure_out_of_term', detail: c.key })
    }
  }

  for (const s of year.shortDays) {
    if (seen.has(s.key)) issues.push({ code: 'duplicate_key', detail: s.key })
    seen.add(s.key)
    if (s.levels.length === 0) issues.push({ code: 'no_levels', detail: s.key })
    if (!ISO.test(s.date)) {
      issues.push({ code: 'bad_date_format', detail: s.key })
      continue
    }
    if (Date.parse(s.date) < earliest || Date.parse(s.date) > latest) {
      issues.push({ code: 'short_day_out_of_term', detail: s.key })
    }
  }

  return issues
}
