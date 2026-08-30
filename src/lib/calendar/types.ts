export type SchoolLevel = 'gan' | 'school'
export type WeekPattern = 'five_day' | 'six_day'

export type Closure = {
  key: string
  name: string
  from: string
  to: string
  levels: SchoolLevel[]
}

export type ShortDay = {
  key: string
  name: string
  date: string
  levels: SchoolLevel[]
}

export type SchoolYear = {
  label: string
  terms: Record<SchoolLevel, { start: string; end: string }>
  closures: Closure[]
  shortDays: ShortDay[]
}

export type DayStatus = {
  date: string
  open: boolean
  shortDay: boolean
  reason: string | null
}

export type ValidationIssue = { code: string; detail: string }
