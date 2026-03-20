import { describe, expect, it } from 'vitest'

import { createSeedPlannerState } from './seed.ts'
import {
  canDropOnTarget,
  createNeedCardDragItem,
  resolveDrop,
} from './dnd.ts'

describe('planner drag and drop rules', () => {
  it('creates drag metadata that reflects a card placement', () => {
    const state = createSeedPlannerState()

    expect(createNeedCardDragItem(state.needCards['card-norsk-9a'])).toEqual({
      type: 'need-card',
      cardId: 'card-norsk-9a',
      from: { type: 'unscheduled-panel' },
    })

    expect(createNeedCardDragItem(state.needCards['card-engelsk-7b'])).toEqual({
      type: 'need-card',
      cardId: 'card-engelsk-7b',
      from: {
        type: 'calendar-cell',
        rowId: 'row-2',
        timeBlockId: '08:30',
      },
    })
  })

  it('rejects need-card drops on occupied cells', () => {
    const state = createSeedPlannerState()
    const dragItem = createNeedCardDragItem(state.needCards['card-samfunn-8c'])

    expect(
      canDropOnTarget(state, dragItem, {
        type: 'calendar-cell',
        rowId: 'row-1',
        timeBlockId: '08:30',
      }),
    ).toBe(false)
    expect(
      resolveDrop(state, dragItem, {
        type: 'calendar-cell',
        rowId: 'row-1',
        timeBlockId: '08:30',
      }),
    ).toBeNull()
  })

  it('maps valid drag and drop combinations directly to reducer actions', () => {
    const state = createSeedPlannerState()

    expect(
      resolveDrop(
        state,
        createNeedCardDragItem(state.needCards['card-samfunn-8c']),
        { type: 'calendar-cell', rowId: 'row-3', timeBlockId: '08:30' },
      ),
    ).toEqual({
      type: 'moveNeedCardToCell',
      cardId: 'card-samfunn-8c',
      rowId: 'row-3',
      timeBlockId: '08:30',
    })

    expect(
      resolveDrop(
        state,
        {
          type: 'substitute',
          substituteId: 'sub-ida',
          from: { type: 'substitute-pool' },
        },
        { type: 'need-card', cardId: 'card-samfunn-8c' },
      ),
    ).toEqual({
      type: 'assignSubstituteToNeedCard',
      cardId: 'card-samfunn-8c',
      substituteId: 'sub-ida',
    })
  })
})
