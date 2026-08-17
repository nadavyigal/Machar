import type { SchoolYear } from '../types'

export const SYNTHETIC_YEAR: SchoolYear = {
  label: 'synthetic-2026-2027',
  terms: {
    school: { start: '2026-09-01', end: '2027-06-20' },
    gan: { start: '2026-09-01', end: '2027-06-30' },
  },
  closures: [
    { key: 'sukkot', name: 'סוכות', from: '2026-10-05', to: '2026-10-12', levels: ['school', 'gan'] },
    { key: 'school-only-break', name: 'חופשה לבתי ספר בלבד', from: '2026-11-02', to: '2026-11-03', levels: ['school'] },
  ],
  shortDays: [
    { key: 'erev-sukkot', name: 'ערב סוכות', date: '2026-10-04', levels: ['school', 'gan'] },
    { key: 'gan-only-short', name: 'יום קצר בגן', date: '2026-11-10', levels: ['gan'] },
  ],
}
