import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export const plannerDay = new Date('2026-03-20T08:00:00')

export function formatPlannerDayLabel(date = plannerDay) {
  const label = format(date, 'EEEE d. MMMM', { locale: nb })

  return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`
}
