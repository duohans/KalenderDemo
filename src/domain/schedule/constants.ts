import type { TimeBlock, TimeBlockId, WeekdayId } from './types.ts'

export const STORAGE_KEY = 'substitute-planner:v2'
export const STORAGE_VERSION = 5

export const TIME_BLOCKS = [
  { id: '08:30', label: '08:30-09:30', start: '08:30', end: '09:30' },
  { id: '09:30', label: '09:30-10:30', start: '09:30', end: '10:30' },
  { id: '10:30', label: '10:30-11:30', start: '10:30', end: '11:30' },
  { id: '11:30', label: '11:30-12:30', start: '11:30', end: '12:30' },
  { id: '12:30', label: '12:30-13:30', start: '12:30', end: '13:30' },
  { id: '13:30', label: '13:30-14:30', start: '13:30', end: '14:30' },
] as const satisfies readonly TimeBlock[]

export const TIME_BLOCK_ID_SET = new Set<TimeBlockId>(TIME_BLOCKS.map((block) => block.id))

export const WEEKDAYS = [
  { id: 'monday', shortLabel: 'Man', label: 'Mandag' },
  { id: 'tuesday', shortLabel: 'Tir', label: 'Tirsdag' },
  { id: 'wednesday', shortLabel: 'Ons', label: 'Onsdag' },
  { id: 'thursday', shortLabel: 'Tor', label: 'Torsdag' },
  { id: 'friday', shortLabel: 'Fre', label: 'Fredag' },
] as const satisfies readonly {
  id: WeekdayId
  shortLabel: string
  label: string
}[]

export const WEEKDAY_ORDER = WEEKDAYS.reduce<Record<WeekdayId, number>>(
  (accumulator, day, index) => {
    accumulator[day.id] = index
    return accumulator
  },
  {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
  },
)

export const TIME_BLOCK_ORDER = TIME_BLOCKS.reduce<Record<TimeBlockId, number>>(
  (accumulator, block, index) => {
    accumulator[block.id] = index
    return accumulator
  },
  {
    '08:30': 0,
    '09:30': 1,
    '10:30': 2,
    '11:30': 3,
    '12:30': 4,
    '13:30': 5,
  },
)
