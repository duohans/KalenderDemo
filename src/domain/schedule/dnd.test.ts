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

    expect(createNeedCardDragItem(state.needCards['card-norsk-6a'])).toEqual({
      type: 'need-card',
      cardId: 'card-norsk-6a',
      from: {
        type: 'calendar-cell',
        rowId: 'row-1',
        timeBlockId: '09:30',
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

  it('rejects need-card drops in the wrong time column', () => {
    const state = createSeedPlannerState()
    const dragItem = createNeedCardDragItem(state.needCards['card-samfunn-8c'])

    expect(
      canDropOnTarget(state, dragItem, {
        type: 'calendar-cell',
        rowId: 'row-1',
        timeBlockId: '09:30',
      }),
    ).toBe(false)

    expect(
      resolveDrop(state, dragItem, {
        type: 'calendar-cell',
        rowId: 'row-1',
        timeBlockId: '09:30',
      }),
    ).toBeNull()
  })

  it('autoplaces need cards when dropped on an existing row header', () => {
    const state = createSeedPlannerState()

    expect(
      resolveDrop(
        state,
        createNeedCardDragItem(state.needCards['card-krle-9a']),
        { type: 'row-header', rowId: 'row-1' },
      ),
    ).toEqual({
      type: 'moveNeedCardToCell',
      cardId: 'card-krle-9a',
      rowId: 'row-1',
      timeBlockId: '13:30',
    })
  })

  it('creates a new row when a need card is dropped on the row placeholder', () => {
    const state = createSeedPlannerState()

    expect(
      resolveDrop(
        state,
        createNeedCardDragItem(state.needCards['card-samfunn-8c']),
        { type: 'new-row-placeholder' },
      ),
    ).toEqual({
      type: 'createRow',
      cardId: 'card-samfunn-8c',
    })
  })

  it('maps valid substitute drag and drop combinations directly to reducer actions', () => {
    const state = createSeedPlannerState()

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
