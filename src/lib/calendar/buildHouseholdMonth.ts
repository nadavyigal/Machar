import { resolveDay } from './resolveDay'
import type { DayStatus, SchoolLevel, SchoolYear, WeekPattern } from './types'

export type ChildContext = {
  memberId: string
  firstName: string
  level: SchoolLevel
  weekPattern: WeekPattern
}

export type HouseholdDay = {
  date: string
  perChild: { memberId: string; status: DayStatus }[]
  anyClosed: boolean
  allClosed: boolean
}

export type HouseholdMonth = { month: string; days: HouseholdDay[] }

function daysInMonth(month: string): string[] {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
}

export function buildHouseholdMonth(
  year: SchoolYear,
  children: ChildContext[],
  month: string,
): HouseholdMonth {
  const days = daysInMonth(month).map((date) => {
    const perChild = children.map((c) => ({
      memberId: c.memberId,
      status: resolveDay(year, c.level, c.weekPattern, date),
    }))
    return {
      date,
      perChild,
      anyClosed: perChild.some((p) => !p.status.open),
      allClosed: perChild.length > 0 && perChild.every((p) => !p.status.open),
    }
  })
  return { month, days }
}
