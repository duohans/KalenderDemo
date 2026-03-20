import { describe, expect, it } from 'vitest'

import { plannerReducer } from './reducer.ts'
import { createSeedPlannerState } from './seed.ts'
import {
  selectEffectiveAssigneeId,
  selectNeedCardAssignmentMode,
} from './selectors.ts'

describe('plannerReducer', () => {
  it('schedules an unscheduled card into an empty cell', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'moveNeedCardToCell',
      cardId: 'card-samfunn-8c',
      rowId: 'row-3',
      timeBlockId: '08:30',
    })

    expect(nextState.needCards['card-samfunn-8c']).toMatchObject({
      placement: 'scheduled',
      rowId: 'row-3',
      timeBlockId: '08:30',
    })
  })

  it('rejects moving a card into an occupied cell', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'moveNeedCardToCell',
      cardId: 'card-samfunn-8c',
      rowId: 'row-1',
      timeBlockId: '08:30',
    })

    expect(nextState.needCards['card-samfunn-8c']).toMatchObject({
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
    })
  })

  it('moves a scheduled card between rows and times without losing source teacher or explicit assignee', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'moveNeedCardToCell',
      cardId: 'card-norsk-6a',
      rowId: 'row-5',
      timeBlockId: '08:30',
    })

    expect(nextState.needCards['card-norsk-6a']).toMatchObject({
      sourceTeacherId: 'teacher-camilla',
      rowId: 'row-5',
      timeBlockId: '08:30',
      explicitAssigneeId: 'sub-emma',
    })
  })

  it('moves a card back to the unscheduled area and keeps its explicit assignee', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'moveNeedCardToUnscheduled',
      cardId: 'card-norsk-6a',
    })

    expect(nextState.needCards['card-norsk-6a']).toMatchObject({
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
      explicitAssigneeId: 'sub-emma',
    })
  })

  it('assigns a substitute to a row without clearing explicit card overrides', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'assignSubstituteToRow',
      rowId: 'row-2',
      substituteId: 'sub-ida',
    })

    expect(nextState.rows['row-2'].rowResponsibleId).toBe('sub-ida')
    expect(nextState.needCards['card-naturfag-7b'].explicitAssigneeId).toBe('sub-sara')
  })

  it('clears a row assignee and leaves explicit cards assigned while inherited cards become unassigned', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'clearRowResponsible',
      rowId: 'row-2',
    })

    expect(nextState.rows['row-2'].rowResponsibleId).toBeNull()
    expect(selectEffectiveAssigneeId(nextState, 'card-engelsk-7b')).toBeNull()
    expect(selectEffectiveAssigneeId(nextState, 'card-naturfag-7b')).toBe('sub-sara')
    expect(selectNeedCardAssignmentMode(nextState, 'card-engelsk-7b')).toBe('unassigned')
    expect(selectNeedCardAssignmentMode(nextState, 'card-naturfag-7b')).toBe('explicit')
  })

  it('assigns a substitute to a scheduled or unscheduled card directly', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'assignSubstituteToNeedCard',
      cardId: 'card-samfunn-8c',
      substituteId: 'sub-kasper',
    })

    expect(nextState.needCards['card-samfunn-8c'].explicitAssigneeId).toBe('sub-kasper')
  })

  it('clears a direct assignee and falls back to the row assignee when present', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'clearNeedCardExplicitAssignee',
      cardId: 'card-naturfag-7b',
    })

    expect(nextState.needCards['card-naturfag-7b'].explicitAssigneeId).toBeNull()
    expect(selectEffectiveAssigneeId(nextState, 'card-naturfag-7b')).toBe('sub-kasper')
    expect(selectNeedCardAssignmentMode(nextState, 'card-naturfag-7b')).toBe('inherited')
  })
})
