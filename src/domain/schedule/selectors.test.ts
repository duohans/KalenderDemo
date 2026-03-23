import { describe, expect, it } from 'vitest'

import { createSeedPlannerState } from './seed.ts'
import {
  selectCellNeedCardIdMap,
  selectEffectiveAssigneeId,
  selectNeedCardDisplayModel,
  selectNeedCardConflict,
  selectPlannerSummary,
  selectRowCards,
  selectRowDisplayModel,
  selectRowTitle,
  selectSubstituteWorkloads,
  selectWeekGridViewModel,
} from './selectors.ts'

describe('schedule selectors', () => {
  const dayId = 'monday' as const

  it('derives row titles from row responsibility and source teacher count', () => {
    const state = createSeedPlannerState()

    expect(selectRowTitle(state, 'row-1', dayId)).toEqual({
      full: 'Kaspers vikartimer',
      compact: 'Kaspers vikartimer',
    })

    const teacherDrivenState = {
      ...state,
      rows: {
        ...state.rows,
        'row-1': {
          ...state.rows['row-1'],
          rowResponsibleId: null,
        },
      },
    }

    expect(selectRowTitle(teacherDrivenState, 'row-1', dayId)).toEqual({
      full: 'Camillas & Jespers timer',
      compact: 'Camillas & Jespers timer',
    })

    const threeTeacherState = {
      ...teacherDrivenState,
      needCards: {
        ...teacherDrivenState.needCards,
        'card-extra-jesper': {
          id: 'card-extra-jesper',
          title: 'Historie 7A',
          subtitle: 'Rom 202',
          sourceTeacherId: 'teacher-jesper',
          dayId,
          allocatedTimeBlockId: '08:30' as const,
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
          dayId,
          allocatedTimeBlockId: '13:30' as const,
          placement: 'scheduled' as const,
          rowId: 'row-1',
          timeBlockId: '13:30' as const,
          explicitAssigneeId: null,
          accentColor: '#cfe6ff',
        },
      },
      needCardOrder: [...teacherDrivenState.needCardOrder, 'card-extra-jesper', 'card-extra-nora'],
    }

    expect(selectRowTitle(threeTeacherState, 'row-1', dayId)).toEqual({
      full: 'Div timer',
      compact: 'Div timer',
    })
  })

  it('prefers the explicit assignee over the row assignee', () => {
    const state = createSeedPlannerState()

    expect(selectEffectiveAssigneeId(state, 'card-naturfag-7b')).toBe('sub-sara')
    expect(selectEffectiveAssigneeId(state, 'card-matte-6a')).toBe('sub-kasper')
  })

  it('builds compact row and card display models for the UI layer', () => {
    const state = createSeedPlannerState()

    expect(selectRowDisplayModel(state, 'row-1', dayId)).toMatchObject({
      rowAccent: '#ffd38b',
      secondaryLabel: '5 timer',
      title: {
        compact: 'Kaspers vikartimer',
      },
    })

    expect(selectNeedCardDisplayModel(state, 'card-naturfag-7b')).toMatchObject({
      classLabel: '7B',
      subjectLabel: 'Naturfag',
      allocatedTimeLabel: '10:30-11:30',
      teacherAccent: '#ffd8bc',
      rowAccent: '#ffd38b',
      assignmentMode: 'explicit',
      statusTone: 'explicit',
      statusLabel: 'Direkte',
      statusDetail: 'Sara Lie',
      statusAssignee: {
        id: 'sub-sara',
      },
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

  it('marks scheduled cards with a mismatched allocated time as conflicts', () => {
    const state = createSeedPlannerState()
    const invalidState = {
      ...state,
      needCards: {
        ...state.needCards,
        'card-musikk-8c': {
          ...state.needCards['card-musikk-8c'],
          placement: 'scheduled' as const,
          rowId: 'row-1',
          timeBlockId: '09:30' as const,
        },
      },
    }

    expect(selectNeedCardConflict(invalidState, 'card-musikk-8c')).toBe(true)
  })

  it('memoizes scheduled cell and row derivations for the same state object', () => {
    const state = createSeedPlannerState()

    expect(selectCellNeedCardIdMap(state, dayId)).toBe(selectCellNeedCardIdMap(state, dayId))
    expect(selectRowCards(state, 'row-1', dayId)).toBe(selectRowCards(state, 'row-1', dayId))
    expect(selectRowDisplayModel(state, 'row-1', dayId)).toBe(
      selectRowDisplayModel(state, 'row-1', dayId),
    )
    expect(selectNeedCardDisplayModel(state, 'card-naturfag-7b')).toBe(
      selectNeedCardDisplayModel(state, 'card-naturfag-7b'),
    )
  })

  it('builds planner summary metrics and orders unassigned items for the shell', () => {
    const state = createSeedPlannerState()
    const summary = selectPlannerSummary(state)

    expect(summary).toMatchObject({
      total: 12,
      scheduled: 5,
      unscheduled: 7,
      coveredCards: 6,
      coverageRate: 0.5,
      unassignedCards: 6,
      explicitOverrides: 3,
      rowAssignments: 1,
      substituteCount: 5,
    })

    expect(summary.unassignedItems.map((item) => item.title)).toEqual([
      'Engelsk 7B',
      'Samfunnsfag 8C',
      'Kroppsøving 4B',
      'Musikk 8C',
      'Mat og helse 6C',
      'KRLE 9A',
    ])
  })

  it('summarizes substitute workloads by effective coverage first', () => {
    const state = createSeedPlannerState()
    const workloads = selectSubstituteWorkloads(state)

    expect(workloads[0]).toMatchObject({
      substitute: {
        id: 'sub-kasper',
      },
      effectiveCoverageCount: 3,
      rowAssignments: 1,
      explicitOverrides: 0,
    })

    expect(workloads.map((workload) => workload.substitute.id)).toEqual([
      'sub-kasper',
      'sub-emma',
      'sub-sara',
      'sub-tarik',
      'sub-ida',
    ])
  })

  it('builds a weekday x time week grid overview', () => {
    const state = createSeedPlannerState()
    const weekGrid = selectWeekGridViewModel(state)
    const mondayMorningCell = weekGrid.rows[0].cells[0]
    const tuesdayMorningCell = weekGrid.rows[0].cells[1]

    expect(weekGrid.days.map((day) => day.id)).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
    ])
    expect(mondayMorningCell.cards.map((card) => card.cardId)).toEqual([
      'card-matte-6a',
    ])
    expect(tuesdayMorningCell.cards).toEqual([])
  })
})
