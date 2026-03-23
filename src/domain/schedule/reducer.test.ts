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
      cardId: 'card-krle-9a',
      rowId: 'row-1',
      timeBlockId: '13:30',
    })

    expect(nextState.needCards['card-krle-9a']).toMatchObject({
      placement: 'scheduled',
      rowId: 'row-1',
      timeBlockId: '13:30',
    })
  })

  it('rejects moving a card into the wrong time column', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'moveNeedCardToCell',
      cardId: 'card-krle-9a',
      rowId: 'row-1',
      timeBlockId: '12:30',
    })

    expect(nextState).toBe(state)
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
      allocatedTimeBlockId: '08:30',
    })
  })

  it('moves a scheduled card between rows within its allocated time without losing source teacher or explicit assignee', () => {
    const state = plannerReducer(createSeedPlannerState(), {
      type: 'createRow',
    })
    const nextState = plannerReducer(state, {
      type: 'moveNeedCardToCell',
      cardId: 'card-norsk-6a',
      rowId: 'row-2',
      timeBlockId: '09:30',
    })

    expect(nextState.needCards['card-norsk-6a']).toMatchObject({
      sourceTeacherId: 'teacher-camilla',
      rowId: 'row-2',
      timeBlockId: '09:30',
      allocatedTimeBlockId: '09:30',
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
      allocatedTimeBlockId: '09:30',
      explicitAssigneeId: 'sub-emma',
    })
  })

  it('updates a card allocated time and keeps it scheduled when the new cell is free', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'updateNeedCardAllocatedTimeBlock',
      cardId: 'card-naturfag-7b',
      timeBlockId: '13:30',
    })

    expect(nextState.needCards['card-naturfag-7b']).toMatchObject({
      placement: 'scheduled',
      rowId: 'row-1',
      timeBlockId: '13:30',
      allocatedTimeBlockId: '13:30',
    })
  })

  it('updates a card allocated time and unschedules it when the new row cell is occupied', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'updateNeedCardAllocatedTimeBlock',
      cardId: 'card-naturfag-7b',
      timeBlockId: '09:30',
    })

    expect(nextState.needCards['card-naturfag-7b']).toMatchObject({
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
      allocatedTimeBlockId: '09:30',
    })
  })

  it('creates a new empty row and can auto-place a card into it', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'createRow',
      cardId: 'card-samfunn-8c',
    })

    expect(nextState.rowOrder).toEqual(['row-1', 'row-2'])
    expect(nextState.rows['row-2']).toMatchObject({
      order: 1,
      rowResponsibleId: null,
    })
    expect(nextState.needCards['card-samfunn-8c']).toMatchObject({
      placement: 'scheduled',
      rowId: 'row-2',
      timeBlockId: '08:30',
      allocatedTimeBlockId: '08:30',
    })
  })

  it('removes a row, unschedules its cards, and reindexes remaining rows', () => {
    const state = plannerReducer(createSeedPlannerState(), {
      type: 'createRow',
      cardId: 'card-krle-9a',
    })
    const nextState = plannerReducer(state, {
      type: 'removeRow',
      rowId: 'row-1',
    })

    expect(nextState.rowOrder).toEqual(['row-2'])
    expect(nextState.rows['row-2']).toMatchObject({
      order: 0,
      rowResponsibleId: null,
    })
    expect(nextState.rows['row-1']).toBeUndefined()
    expect(nextState.needCards['card-matte-6a']).toMatchObject({
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
    })
    expect(nextState.needCards['card-krle-9a']).toMatchObject({
      placement: 'scheduled',
      rowId: 'row-2',
      timeBlockId: '13:30',
    })
  })

  it('assigns a substitute to a row without clearing explicit card overrides', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'assignSubstituteToRow',
      rowId: 'row-1',
      substituteId: 'sub-ida',
    })

    expect(nextState.rows['row-1'].rowResponsibleId).toBe('sub-ida')
    expect(nextState.needCards['card-naturfag-7b'].explicitAssigneeId).toBe('sub-sara')
  })

  it('clears a row assignee and leaves explicit cards assigned while inherited cards become unassigned', () => {
    const state = createSeedPlannerState()
    const nextState = plannerReducer(state, {
      type: 'clearRowResponsible',
      rowId: 'row-1',
    })

    expect(nextState.rows['row-1'].rowResponsibleId).toBeNull()
    expect(selectEffectiveAssigneeId(nextState, 'card-matte-6a')).toBeNull()
    expect(selectEffectiveAssigneeId(nextState, 'card-naturfag-7b')).toBe('sub-sara')
    expect(selectNeedCardAssignmentMode(nextState, 'card-matte-6a')).toBe('unassigned')
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
