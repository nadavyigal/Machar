export const APP_TIME_ZONE = 'Asia/Jerusalem'

export function toIsoDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  return parts
}

export function todayInJerusalem(): string {
  return toIsoDate(new Date())
}
