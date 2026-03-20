import type { TimeBlock, TimeBlockId } from './types.ts'

export const STORAGE_KEY = 'substitute-planner:v2'
export const STORAGE_VERSION = 3

export const TIME_BLOCKS = [
  { id: '08:30', label: '08:30-09:30', start: '08:30', end: '09:30' },
  { id: '09:30', label: '09:30-10:30', start: '09:30', end: '10:30' },
  { id: '10:30', label: '10:30-11:30', start: '10:30', end: '11:30' },
  { id: '11:30', label: '11:30-12:30', start: '11:30', end: '12:30' },
  { id: '12:30', label: '12:30-13:30', start: '12:30', end: '13:30' },
  { id: '13:30', label: '13:30-14:30', start: '13:30', end: '14:30' },
] as const satisfies readonly TimeBlock[]

export const TIME_BLOCK_ID_SET = new Set<TimeBlockId>(TIME_BLOCKS.map((block) => block.id))

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
