import {
  deriveRowTitle,
  getAssignmentMode,
  getEffectiveAssigneeId,
  getNeedCardById,
  getRowById,
  validateNeedCardMove,
} from '@/features/planner/domain/planner.rules'
import { seedPlannerState } from '@/features/planner/state/planner-seed'

describe('planner rules', () => {
  it('derives row titles from row assignees and source teachers', () => {
    expect(deriveRowTitle(seedPlannerState, getRowById(seedPlannerState, 'row-1')!)).toBe(
      'Camillas timer',
    )
    expect(deriveRowTitle(seedPlannerState, getRowById(seedPlannerState, 'row-2')!)).toBe(
      'Idas vikartimer',
    )
    expect(deriveRowTitle(seedPlannerState, getRowById(seedPlannerState, 'row-3')!)).toBe(
      'Jespers & Livs timer',
    )
    expect(deriveRowTitle(seedPlannerState, getRowById(seedPlannerState, 'row-4')!)).toBe(
      'Div timer',
    )
  })

  it('derives effective assignee with explicit overrides taking precedence', () => {
    const rowWithResponsible = getRowById(seedPlannerState, 'row-2')!
    const rowWithoutResponsible = getRowById(seedPlannerState, 'row-1')!
    const inheritedCard = getNeedCardById(seedPlannerState, 'need-4')!
    const explicitCard = getNeedCardById(seedPlannerState, 'need-5')!
    const unassignedCard = getNeedCardById(seedPlannerState, 'need-1')!

    expect(getEffectiveAssigneeId(inheritedCard, rowWithResponsible)).toBe('sub-ida')
    expect(getAssignmentMode(inheritedCard, rowWithResponsible)).toBe('row')

    expect(getEffectiveAssigneeId(explicitCard, rowWithResponsible)).toBe('sub-maja')
    expect(getAssignmentMode(explicitCard, rowWithResponsible)).toBe('explicit')

    expect(getEffectiveAssigneeId(unassignedCard, rowWithoutResponsible)).toBeNull()
    expect(getAssignmentMode(unassignedCard, rowWithoutResponsible)).toBe('unassigned')
  })

  it('rejects moving a card into an occupied cell and accepts an empty destination', () => {
    expect(
      validateNeedCardMove(seedPlannerState, {
        cardId: 'need-1',
        rowId: 'row-1',
        timeBlockId: 'block-2',
      }),
    ).toEqual({
      ok: false,
      reason: 'occupied-cell',
    })

    expect(
      validateNeedCardMove(seedPlannerState, {
        cardId: 'need-1',
        rowId: 'row-1',
        timeBlockId: 'block-3',
      }),
    ).toEqual({
      ok: true,
    })
  })
})
