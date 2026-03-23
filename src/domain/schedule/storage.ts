import { STORAGE_KEY } from './constants.ts'
import { plannerStateSchema } from './schema.ts'
import { createSeedPlannerState } from './seed.ts'
import type { PlannerState } from './types.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function migrateStoredPlannerState(value: unknown): PlannerState | null {
  const parsed = plannerStateSchema.safeParse(value)

  if (parsed.success) {
    return parsed.data
  }

  if (!isRecord(value) || value.version !== 3 || !isRecord(value.needCards)) {
    return null
  }

  const seedState = createSeedPlannerState()
  const migratedNeedCards = Object.fromEntries(
    Object.entries(value.needCards).map(([cardId, rawCard]) => {
      if (!isRecord(rawCard)) {
        return [cardId, rawCard]
      }

      const allocatedTimeBlockId =
        typeof rawCard.timeBlockId === 'string'
          ? rawCard.timeBlockId
          : seedState.needCards[cardId]?.allocatedTimeBlockId

      return [
        cardId,
        allocatedTimeBlockId
          ? {
              ...rawCard,
              allocatedTimeBlockId,
            }
          : rawCard,
      ]
    }),
  )

  const migratedState = plannerStateSchema.safeParse({
    ...value,
    version: seedState.version,
    needCards: migratedNeedCards,
  })

  return migratedState.success ? migratedState.data : null
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
