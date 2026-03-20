import { STORAGE_KEY, STORAGE_VERSION, TIME_BLOCK_ID_SET } from './constants.ts'
import { createSeedPlannerState } from './seed.ts'
import type { NeedCard, PlannerState, TimeBlockId } from './types.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isTimeBlockId(value: unknown): value is TimeBlockId {
  return typeof value === 'string' && TIME_BLOCK_ID_SET.has(value as TimeBlockId)
}

function isNeedCard(value: unknown): value is NeedCard {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.subtitle === 'string' &&
    typeof value.sourceTeacherId === 'string' &&
    (value.placement === 'scheduled' || value.placement === 'unscheduled') &&
    (typeof value.rowId === 'string' || value.rowId === null) &&
    (isTimeBlockId(value.timeBlockId) || value.timeBlockId === null) &&
    (typeof value.explicitAssigneeId === 'string' || value.explicitAssigneeId === null) &&
    typeof value.accentColor === 'string'
  )
}

function hasOrderedRecords(
  record: unknown,
  order: unknown,
  predicate?: (value: unknown) => boolean,
) {
  if (!isRecord(record) || !isStringArray(order)) {
    return false
  }

  return order.every((id) => {
    const entry = record[id]
    return predicate ? predicate(entry) : isRecord(entry)
  })
}

function isPlannerState(value: unknown): value is PlannerState {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.version !== STORAGE_VERSION ||
    !hasOrderedRecords(value.teachers, value.teacherOrder) ||
    !hasOrderedRecords(value.substitutes, value.substituteOrder) ||
    !hasOrderedRecords(value.rows, value.rowOrder) ||
    !hasOrderedRecords(value.needCards, value.needCardOrder, isNeedCard)
  ) {
    return false
  }

  const state = value as PlannerState

  return state.needCardOrder.every((cardId) => {
    const card = state.needCards[cardId]

    if (!state.teachers[card.sourceTeacherId]) {
      return false
    }

    if (card.explicitAssigneeId && !state.substitutes[card.explicitAssigneeId]) {
      return false
    }

    if (card.placement === 'unscheduled') {
      return card.rowId === null && card.timeBlockId === null
    }

    return Boolean(card.rowId && card.timeBlockId && state.rows[card.rowId])
  })
}

export function migrateStoredPlannerState(value: unknown): PlannerState | null {
  return isPlannerState(value) ? value : null
}

export function loadPlannerState() {
  if (typeof window === 'undefined') {
    return createSeedPlannerState()
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return createSeedPlannerState()
  }

  try {
    const parsed = JSON.parse(rawValue)
    return migrateStoredPlannerState(parsed) ?? createSeedPlannerState()
  } catch {
    return createSeedPlannerState()
  }
}

export function savePlannerState(state: PlannerState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
