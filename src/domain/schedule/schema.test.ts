import { describe, expect, it } from 'vitest'

import { createSeedPlannerState } from './seed.ts'
import { needCardSchema, plannerStateSchema, timeBlockIdSchema } from './schema.ts'

describe('planner schemas', () => {
  it('accepts the seeded planner document', () => {
    expect(plannerStateSchema.parse(createSeedPlannerState())).toBeTruthy()
  })

  it('rejects invalid time block ids', () => {
    expect(() => timeBlockIdSchema.parse('07:30')).toThrow()
  })

  it('rejects malformed unscheduled cards', () => {
    expect(() =>
      needCardSchema.parse({
        id: 'card-invalid',
        title: 'Historie 7A',
        subtitle: 'Rom 204',
        sourceTeacherId: 'teacher-camilla',
        placement: 'unscheduled',
        rowId: 'row-1',
        timeBlockId: null,
        explicitAssigneeId: null,
        accentColor: '#fff1a8',
      }),
    ).toThrow()
  })

  it('rejects planner states with missing foreign keys', () => {
    const state = createSeedPlannerState()
    const result = plannerStateSchema.safeParse({
      ...state,
      needCards: {
        ...state.needCards,
        'card-norsk-9a': {
          ...state.needCards['card-norsk-9a'],
          explicitAssigneeId: 'sub-mangler',
        },
      },
    })

    expect(result.success).toBe(false)
  })
})
