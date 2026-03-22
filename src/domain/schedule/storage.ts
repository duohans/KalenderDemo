import { STORAGE_KEY } from './constants.ts'
import { plannerStateSchema } from './schema.ts'
import { createSeedPlannerState } from './seed.ts'
import type { PlannerState } from './types.ts'

export function migrateStoredPlannerState(value: unknown): PlannerState | null {
  const parsed = plannerStateSchema.safeParse(value)
  return parsed.success ? parsed.data : null
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
