import { afterEach, describe, expect, it } from 'vitest'

import { STORAGE_KEY } from './constants.ts'
import { createSeedPlannerState } from './seed.ts'
import {
  loadPlannerState,
  migrateStoredPlannerState,
  savePlannerState,
} from './storage.ts'

afterEach(() => {
  window.localStorage.clear()
})

describe('planner storage', () => {
  it('loads a saved planner document from localStorage', () => {
    const state = createSeedPlannerState()
    state.needCards['card-krle-9a'] = {
      ...state.needCards['card-krle-9a'],
      placement: 'scheduled',
      rowId: 'row-1',
      timeBlockId: '13:30',
    }

    savePlannerState(state)

    expect(loadPlannerState()).toEqual(state)
  })

  it('falls back to seed data when storage is malformed', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"invalid"')

    expect(loadPlannerState()).toEqual(createSeedPlannerState())
  })

  it('rejects incompatible planner documents during migration', () => {
    const state = createSeedPlannerState()
    const migrated = migrateStoredPlannerState({
      ...state,
      needCards: {
        ...state.needCards,
        'card-matte-6a': {
          ...state.needCards['card-matte-6a'],
          sourceTeacherId: 'teacher-mangler',
        },
      },
    })

    expect(migrated).toBeNull()
  })

  it('migrates version 3 documents by inferring allocated time blocks', () => {
    const state = createSeedPlannerState()
    const { allocatedTimeBlockId: _, ...legacyScheduledCard } = state.needCards['card-matte-6a']
    const { allocatedTimeBlockId: __, ...legacyUnscheduledCard } =
      state.needCards['card-samfunn-8c']

    const migrated = migrateStoredPlannerState({
      ...state,
      version: 3,
      needCards: {
        ...state.needCards,
        'card-matte-6a': legacyScheduledCard,
        'card-samfunn-8c': legacyUnscheduledCard,
      },
    })

    expect(migrated?.needCards['card-matte-6a'].allocatedTimeBlockId).toBe('08:30')
    expect(migrated?.needCards['card-samfunn-8c'].allocatedTimeBlockId).toBe('08:30')
  })
})
