import type { DayStatus, SchoolLevel, SchoolYear, WeekPattern } from './types'

function dayOfWeek(iso: string): number {
  // ISO date strings are parsed as UTC midnight, so getUTCDay is stable
  return new Date(`${iso}T00:00:00Z`).getUTCDay() // 0 = Sunday, 6 = Saturday
}

export function resolveDay(
  year: SchoolYear,
  level: SchoolLevel,
  pattern: WeekPattern,
  // Contractually an ISO YYYY-MM-DD string produced by toIsoDate. Validated by
  // the caller (see validateSchoolYear.ts), not by this function -- resolveDay
  // does plain ISO string comparison and does not itself check calendar validity.
  date: string,
): DayStatus {
  const term = year.terms[level]
  if (date < term.start || date > term.end) {
    return { date, open: false, shortDay: false, reason: 'מחוץ לשנת הלימודים' }
  }

  const dow = dayOfWeek(date)
  if (dow === 6) return { date, open: false, shortDay: false, reason: 'שבת' }
  if (dow === 5 && pattern === 'five_day') {
    return { date, open: false, shortDay: false, reason: 'יום שישי' }
  }

  const closure = year.closures.find(
    (c) => c.levels.includes(level) && date >= c.from && date <= c.to,
  )
  if (closure) return { date, open: false, shortDay: false, reason: closure.name }

  const short = year.shortDays.find((s) => s.levels.includes(level) && s.date === date)
  if (short) return { date, open: true, shortDay: true, reason: short.name }

  return { date, open: true, shortDay: false, reason: null }
}
