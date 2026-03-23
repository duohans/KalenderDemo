import type { WeekdayId } from '../../domain/schedule/types.ts'

export type PlannerSelection =
  | {
      kind: 'need-card'
      cardId: string
    }
  | {
      kind: 'row'
      rowId: string
      dayId: WeekdayId
    }

export function isNeedCardSelection(
  selection: PlannerSelection | null,
  cardId: string,
) {
  return selection?.kind === 'need-card' && selection.cardId === cardId
}

export function isRowSelection(
  selection: PlannerSelection | null,
  rowId: string,
  dayId: WeekdayId,
) {
  return selection?.kind === 'row' && selection.rowId === rowId && selection.dayId === dayId
}
