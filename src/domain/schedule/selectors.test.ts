import { describe, expect, it } from 'vitest'

import { createSeedPlannerState } from './seed.ts'
import {
  selectCellNeedCardIdMap,
  selectEffectiveAssigneeId,
  selectNeedCardDisplayModel,
  selectNeedCardConflict,
  selectRowCards,
  selectRowDisplayModel,
  selectRowTitle,
} from './selectors.ts'

describe('schedule selectors', () => {
  it('derives row titles from row responsibility and source teacher count', () => {
    const state = createSeedPlannerState()

    expect(selectRowTitle(state, 'row-1')).toEqual({
      full: 'Camillas timer',
      compact: 'Camillas timer',
    })

    expect(selectRowTitle(state, 'row-2')).toEqual({
      full: 'Kaspers vikartimer',
      compact: 'Kaspers vikartimer',
    })

    expect(selectRowTitle(state, 'row-4')).toEqual({
      full: 'Idas vikartimer',
      compact: 'Idas vikartimer',
    })

    const threeTeacherState = {
      ...state,
      needCards: {
        ...state.needCards,
        'card-extra-jesper': {
          id: 'card-extra-jesper',
          title: 'Historie 7A',
          subtitle: 'Rom 202',
          sourceTeacherId: 'teacher-jesper',
          placement: 'scheduled' as const,
          rowId: 'row-1',
          timeBlockId: '08:30' as const,
          explicitAssigneeId: null,
          accentColor: '#ffe58f',
        },
        'card-extra-nora': {
          id: 'card-extra-nora',
          title: 'Samfunn 7A',
          subtitle: 'Rom 203',
          sourceTeacherId: 'teacher-nora',
          placement: 'scheduled' as const,
          rowId: 'row-1',
          timeBlockId: '11:30' as const,
          explicitAssigneeId: null,
          accentColor: '#cfe6ff',
        },
      },
      needCardOrder: [...state.needCardOrder, 'card-extra-jesper', 'card-extra-nora'],
    }

    expect(selectRowTitle(threeTeacherState, 'row-1')).toEqual({
      full: 'Div timer',
      compact: 'Div timer',
    })
  })

  it('prefers the explicit assignee over the row assignee', () => {
    const state = createSeedPlannerState()

    expect(selectEffectiveAssigneeId(state, 'card-naturfag-7b')).toBe('sub-sara')
    expect(selectEffectiveAssigneeId(state, 'card-engelsk-7b')).toBe('sub-kasper')
  })

  it('builds compact row and card display models for the UI layer', () => {
    const state = createSeedPlannerState()

    expect(selectRowDisplayModel(state, 'row-2')).toMatchObject({
      rowAccent: '#ffd38b',
      secondaryLabel: '2 timer',
      title: {
        compact: 'Kaspers vikartimer',
      },
    })

    expect(selectNeedCardDisplayModel(state, 'card-naturfag-7b')).toMatchObject({
      classLabel: '7B',
      subjectLabel: 'Naturfag',
      teacherAccent: '#ffd8bc',
      rowAccent: '#ffd38b',
      assignmentMode: 'explicit',
      statusLabel: 'Planlagt',
    })
  })

  it('marks malformed cell collisions as conflicts', () => {
    const state = createSeedPlannerState()
    const invalidState = {
      ...state,
      needCards: {
        ...state.needCards,
        'card-samfunn-8c': {
          ...state.needCards['card-samfunn-8c'],
          placement: 'scheduled' as const,
          rowId: 'row-1',
          timeBlockId: '08:30' as const,
        },
      },
    }

    expect(selectNeedCardConflict(invalidState, 'card-samfunn-8c')).toBe(true)
    expect(selectNeedCardConflict(invalidState, 'card-matte-6a')).toBe(true)
  })

  it('memoizes scheduled cell and row derivations for the same state object', () => {
    const state = createSeedPlannerState()

    expect(selectCellNeedCardIdMap(state)).toBe(selectCellNeedCardIdMap(state))
    expect(selectRowCards(state, 'row-2')).toBe(selectRowCards(state, 'row-2'))
    expect(selectRowDisplayModel(state, 'row-2')).toBe(selectRowDisplayModel(state, 'row-2'))
    expect(selectNeedCardDisplayModel(state, 'card-naturfag-7b')).toBe(
      selectNeedCardDisplayModel(state, 'card-naturfag-7b'),
    )
  })
})
