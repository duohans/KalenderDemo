export type PlannerSelection =
  | {
      kind: 'need-card'
      cardId: string
    }
  | {
      kind: 'row'
      rowId: string
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
) {
  return selection?.kind === 'row' && selection.rowId === rowId
}
