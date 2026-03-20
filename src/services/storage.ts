import { STORAGE_KEY } from '../domain/schedule/constants.ts'
import { plannerStateSchema } from '../domain/schedule/schema.ts'
import { createSeedPlannerState } from '../domain/schedule/seed.ts'
import type { PlannerState } from '../domain/schedule/types.ts'

export type PlannerStorage = {
  load: () => PlannerState
  save: (state: PlannerState) => void
}

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

export const localPlannerStorage: PlannerStorage = {
  load: loadPlannerState,
  save: savePlannerState,
}
