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
    state.needCards['card-samfunn-8c'] = {
      ...state.needCards['card-samfunn-8c'],
      placement: 'scheduled',
      rowId: 'row-3',
      timeBlockId: '08:30',
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
})
